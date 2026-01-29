/**
 * GET /api/signals/latest
 *
 * Get latest ML signals with stock details
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const signals = await prisma.signal.findMany({
      where: {
        date: { gte: today },
      },
      include: {
        stock: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        confidence: 'desc',
      },
    });

    const results = signals.map(signal => ({
      symbol: signal.symbol,
      name: signal.stock?.name || null,
      date: signal.date,
      signal: signal.signal,
      confidence: signal.confidence,
      price: signal.price,
      rsi: signal.rsi,
      macd: signal.macd,
      bollingerUpper: signal.bollingerUpper,
      bollingerMiddle: signal.bollingerMiddle,
      bollingerLower: signal.bollingerLower,
      ma20Ma50: signal.ma20Ma50 ?? false,
    }));

    return NextResponse.json(results);
  } catch (error) {
    console.error('Signals error:', error);
    return NextResponse.json([], { status: 200 });
  }
}
