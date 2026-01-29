import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: Request,
  { params }: { params: { symbol: string } }
) {
  try {
    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get('days') || '30');

    const stock = await prisma.stock.findUnique({
      where: { symbol: params.symbol.toUpperCase() },
    });

    if (!stock) {
      return NextResponse.json({ error: 'Stock not found' }, { status: 404 });
    }

    const prices = await prisma.stockPrice.findMany({
      where: { symbol: params.symbol.toUpperCase() },
      orderBy: { date: 'desc' },
      take: days,
    });

    const signals = await prisma.signal.findMany({
      where: { symbol: params.symbol.toUpperCase() },
      orderBy: { date: 'desc' },
      take: 10,
    });

    return NextResponse.json({
      stock,
      prices,
      signals,
    });
  } catch (error) {
    console.error(`Error fetching stock ${params.symbol}:`, error);
    return NextResponse.json(
      { error: 'Failed to fetch stock data' },
      { status: 500 }
    );
  }
}
