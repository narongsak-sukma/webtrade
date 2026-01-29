import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const symbol = searchParams.get('symbol');
    const signalType = searchParams.get('type'); // 'buy', 'sell', 'hold'
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const skip = (page - 1) * limit;

    let whereClause: any = {};

    if (symbol) {
      whereClause.symbol = symbol.toUpperCase();
    }

    if (signalType) {
      const signalMap: Record<string, number> = {
        buy: 1,
        hold: 0,
        sell: -1,
      };
      whereClause.signal = signalMap[signalType];
    }

    // Date range filtering
    if (startDate || endDate) {
      whereClause.date = {};
      if (startDate) {
        whereClause.date.gte = new Date(startDate);
      }
      if (endDate) {
        whereClause.date.lte = new Date(endDate);
      }
    }

    // Get total count for pagination
    const total = await prisma.signal.count({ where: whereClause });

    // Fetch signals with pagination
    const signals = await prisma.signal.findMany({
      where: whereClause,
      include: {
        stock: {
          select: {
            name: true,
            sector: true,
          },
        },
      },
      orderBy: { date: 'desc' },
      take: limit,
      skip,
    });

    return NextResponse.json({
      signals,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching signals:', error);
    return NextResponse.json(
      { error: 'Failed to fetch signals' },
      { status: 500 }
    );
  }
}
