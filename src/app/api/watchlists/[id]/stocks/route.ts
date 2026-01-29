import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';

// POST /api/watchlists/[id]/stocks - Add stock to watchlist
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { symbol } = body;

    if (!symbol) {
      return NextResponse.json(
        { error: 'Symbol is required' },
        { status: 400 }
      );
    }

    // Verify watchlist belongs to user
    const watchlist = await prisma.watchlist.findFirst({
      where: {
        id: params.id,
        userId: session.user.id,
      },
    });

    if (!watchlist) {
      return NextResponse.json(
        { error: 'Watchlist not found' },
        { status: 404 }
      );
    }

    // Check if stock exists, if not create it
    let stock = await prisma.stock.findUnique({
      where: { symbol },
    });

    if (!stock) {
      // Fetch stock info from Yahoo Finance
      try {
        const yahooFinance = require('yahoo-finance2').default;
        const result = await yahooFinance.quote(symbol);

        stock = await prisma.stock.create({
          data: {
            symbol,
            name: result.quoteSourceName || symbol,
            exchange: result.exchangeName || 'UNKNOWN',
          },
        });
      } catch (error) {
        return NextResponse.json(
          { error: 'Stock not found or invalid symbol' },
          { status: 404 }
        );
      }
    }

    // Check if stock is already in watchlist
    const existing = await prisma.watchlistStock.findFirst({
      where: {
        watchlistId: params.id,
        symbol,
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: 'Stock already in watchlist' },
        { status: 409 }
      );
    }

    // Add stock to watchlist
    const watchlistStock = await prisma.watchlistStock.create({
      data: {
        watchlistId: params.id,
        symbol,
        addedAt: new Date(),
      },
    });

    return NextResponse.json(watchlistStock, { status: 201 });
  } catch (error) {
    console.error('Error adding stock to watchlist:', error);
    return NextResponse.json(
      { error: 'Failed to add stock to watchlist' },
      { status: 500 }
    );
  }
}

// DELETE /api/watchlists/[id]/stocks - Remove stock from watchlist
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const symbol = searchParams.get('symbol');

    if (!symbol) {
      return NextResponse.json(
        { error: 'Symbol is required' },
        { status: 400 }
      );
    }

    // Verify watchlist belongs to user
    const watchlist = await prisma.watchlist.findFirst({
      where: {
        id: params.id,
        userId: session.user.id,
      },
    });

    if (!watchlist) {
      return NextResponse.json(
        { error: 'Watchlist not found' },
        { status: 404 }
      );
    }

    // Remove stock from watchlist
    await prisma.watchlistStock.deleteMany({
      where: {
        watchlistId: params.id,
        symbol,
      },
    });

    return NextResponse.json({ message: 'Stock removed from watchlist' });
  } catch (error) {
    console.error('Error removing stock from watchlist:', error);
    return NextResponse.json(
      { error: 'Failed to remove stock from watchlist' },
      { status: 500 }
    );
  }
}
