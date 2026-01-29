/**
 * GET /api/screening/results
 *
 * Get all screening results with stock details
 * Now returns 14 explainable filters (8 original Minervini + 6 new technical filters)
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const market = searchParams.get('market'); // 'US', 'TH', or undefined for all

    // Build where clause for market filter
    const whereClause: any = {};

    // If market specified, filter by it
    if (market && market !== 'all') {
      whereClause.stock = {
        market: market.toUpperCase(),
      };
    }

    // Get the latest screening date
    const latestResult = await prisma.screenedStock.findFirst({
      where: whereClause,
      orderBy: { date: 'desc' },
      select: { date: true },
    });

    if (!latestResult) {
      return NextResponse.json([]);
    }

    // Get all stocks screened on the latest date
    const latestDate = latestResult.date;
    latestDate.setHours(0, 0, 0, 0);
    const endOfDay = new Date(latestDate);
    endOfDay.setHours(23, 59, 59, 999);

    whereClause.date = {
      gte: latestDate,
      lte: endOfDay,
    };

    const screenedStocks = await prisma.screenedStock.findMany({
      where: whereClause,
      include: {
        stock: {
          select: {
            name: true,
            market: true,
            currency: true,
          },
        },
      },
      orderBy: {
        passedCriteria: 'desc',
      },
    });

    const results = screenedStocks.map(stock => ({
      symbol: stock.symbol,
      name: stock.stock?.name || null,
      market: stock.stock?.market || 'US',
      currency: stock.stock?.currency || 'USD',
      date: stock.date,
      price: stock.price,
      ma50: stock.ma50,
      ma150: stock.ma150,
      ma200: stock.ma200,

      // Original Minervini Criteria 1-8
      priceAboveMa150: stock.priceAboveMa150 ?? false,
      ma150AboveMa200: stock.ma150AboveMa200 ?? false,
      ma200TrendingUp: stock.ma200TrendingUp ?? false,
      ma50AboveMa150: stock.ma50AboveMa150 ?? false,
      priceAboveMa50: stock.priceAboveMa50 ?? false,
      priceAbove52WeekLow: stock.priceAbove52WeekLow ?? false,
      priceNear52WeekHigh: stock.priceNear52WeekHigh ?? false,
      relativeStrengthPositive: stock.relativeStrengthPositive ?? false,

      // Explainable Filters 9-14
      rsi: stock.rsi ? Number(stock.rsi) : null,
      rsiInRange: stock.rsiInRange ?? false,
      volume: stock.volume ? Number(stock.volume) : null,
      volumeAvg50: stock.volumeAvg50 ? Number(stock.volumeAvg50) : null,
      volumeAboveAvg: stock.volumeAboveAvg ?? false,
      macd: stock.macd ? Number(stock.macd) : null,
      macdSignal: stock.macdSignal ? Number(stock.macdSignal) : null,
      macdBullish: stock.macdBullish ?? false,
      adx: stock.adx ? Number(stock.adx) : null,
      adxStrong: stock.adxStrong ?? false,
      ma20: stock.ma20 ? Number(stock.ma20) : null,
      priceAboveMa20: stock.priceAboveMa20 ?? false,
      bollingerUpper: stock.bollingerUpper ? Number(stock.bollingerUpper) : null,
      bollingerMiddle: stock.bollingerMiddle ? Number(stock.bollingerMiddle) : null,
      bollingerLower: stock.bollingerLower ? Number(stock.bollingerLower) : null,
      priceInBBRange: stock.priceInBBRange ?? false,

      // Metadata
      week52Low: stock.week52Low ? Number(stock.week52Low) : null,
      week52High: stock.week52High ? Number(stock.week52High) : null,
      relativeStrength: stock.relativeStrength ? Number(stock.relativeStrength) : null,
      passedCriteria: stock.passedCriteria,
      totalCriteria: stock.totalCriteria ?? 14,
    }));

    return NextResponse.json(results);
  } catch (error) {
    console.error('Screening results error:', error);
    return NextResponse.json([], { status: 200 });
  }
}

