/**
 * GET /api/stock/[symbol]/prices
 *
 * Fetch historical price data for a stock with moving averages
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: { symbol: string } }
) {
  try {
    const { symbol } = params;
    const searchParams = request.nextUrl.searchParams;
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    if (!startDate || !endDate) {
      return NextResponse.json(
        { error: 'startDate and endDate are required' },
        { status: 400 }
      );
    }

    // Fetch price data
    const prices = await prisma.stockPrice.findMany({
      where: {
        symbol: symbol.toUpperCase(),
        date: {
          gte: new Date(startDate),
          lte: new Date(endDate),
        },
      },
      orderBy: {
        date: 'asc',
      },
      take: 500, // Limit to prevent overwhelming the chart
    });

    if (prices.length === 0) {
      return NextResponse.json([]);
    }

    // Calculate moving averages
    const calculateMA = (data: typeof prices, period: number) => {
      return data.map((price, index) => {
        if (index < period - 1) return null;
        const slice = data.slice(index - period + 1, index + 1);
        const sum = slice.reduce((acc, p) => acc + parseFloat(p.close.toString()), 0);
        return sum / period;
      });
    };

    const ma20 = calculateMA(prices, 20);
    const ma50 = calculateMA(prices, 50);
    const ma150 = calculateMA(prices, 150);
    const ma200 = calculateMA(prices, 200);

    // Combine data
    const result = prices.map((price, index) => ({
      date: price.date,
      open: parseFloat(price.open.toString()),
      high: parseFloat(price.high.toString()),
      low: parseFloat(price.low.toString()),
      close: parseFloat(price.close.toString()),
      volume: parseInt(price.volume.toString()),
      ma20: ma20[index],
      ma50: ma50[index],
      ma150: ma150[index],
      ma200: ma200[index],
    }));

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching price data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch price data' },
      { status: 500 }
    );
  }
}
