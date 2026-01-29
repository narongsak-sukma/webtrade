import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';

// GET /api/watchlists/[id] - Get specific watchlist
export async function GET(
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

    const watchlist = await prisma.watchlist.findFirst({
      where: {
        id: params.id,
        userId: session.user.id,
      },
      include: {
        stocks: {
          include: {
            stock: {
              select: {
                symbol: true,
                name: true,
                exchange: true,
              },
            },
            latestPrice: {
              select: {
                close: true,
                date: true,
              },
              orderBy: { date: 'desc' },
              take: 1,
            },
          },
          orderBy: {
            stock: {
              symbol: 'asc',
            },
          },
        },
      },
    });

    if (!watchlist) {
      return NextResponse.json(
        { error: 'Watchlist not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(watchlist);
  } catch (error) {
    console.error('Error fetching watchlist:', error);
    return NextResponse.json(
      { error: 'Failed to fetch watchlist' },
      { status: 500 }
    );
  }
}

// PUT /api/watchlists/[id] - Update watchlist
export async function PUT(
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
    const { name, description } = body;

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

    const updated = await prisma.watchlist.update({
      where: { id: params.id },
      data: {
        ...(name && { name }),
        ...(description !== undefined && { description }),
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error updating watchlist:', error);
    return NextResponse.json(
      { error: 'Failed to update watchlist' },
      { status: 500 }
    );
  }
}

// DELETE /api/watchlists/[id] - Delete watchlist
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

    // Delete the watchlist (cascade will delete watchlist stocks)
    await prisma.watchlist.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ message: 'Watchlist deleted' });
  } catch (error) {
    console.error('Error deleting watchlist:', error);
    return NextResponse.json(
      { error: 'Failed to delete watchlist' },
      { status: 500 }
    );
  }
}
