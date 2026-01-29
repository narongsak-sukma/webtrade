/**
 * GET /api/dashboard/stats
 *
 * Get pipeline statistics for dashboard
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    // Get total stocks
    const totalStocks = await prisma.stock.count();

    // Get screened stocks (today's screening)
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const screenedStocks = await prisma.screenedStock.count({
      where: {
        date: { gte: today },
      },
    });

    // Get qualified stocks (passed 6+ criteria)
    const qualifiedStocks = await prisma.screenedStock.count({
      where: {
        date: { gte: today },
        passedCriteria: { gte: 6 },
      },
    });

    // Get today's signals
    const signals = await prisma.signal.findMany({
      where: {
        date: { gte: today },
      },
      select: { signal: true },
    });

    const signalsCount = signals.length;
    const buySignals = signals.filter(s => s.signal === 1).length;
    const sellSignals = signals.filter(s => s.signal === -1).length;
    const holdSignals = signals.filter(s => s.signal === 0).length;

    return NextResponse.json({
      totalStocks,
      screenedStocks,
      qualifiedStocks,
      signalsCount,
      buySignals,
      sellSignals,
      holdSignals,
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    return NextResponse.json(
      {
        totalStocks: 0,
        screenedStocks: 0,
        qualifiedStocks: 0,
        signalsCount: 0,
        buySignals: 0,
        sellSignals: 0,
        holdSignals: 0,
      },
      { status: 200 } // Always return data to prevent UI errors
    );
  }
}
