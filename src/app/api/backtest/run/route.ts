/**
 * POST /api/backtest/run
 *
 * Run backtest with realistic costs and performance metrics
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { backtestingEngine, BacktestConfig } from '@/services/backtesting';

const backtestSchema = z.object({
  symbol: z.string(),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  initialCapital: z.number().positive().default(100000),
  commission: z.number().min(0).default(5),
  slippage: z.number().min(0).max(0.05).default(0.001),
  positionSizePercent: z.number().min(0.01).max(1).default(0.95),
  maxPositions: z.number().int().min(1).max(10).default(1),
  stopLossPercent: z.number().min(0.01).max(0.20).default(0.05),
  takeProfitPercent: z.number().min(0.01).max(1).default(0.15),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validationResult = backtestSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: validationResult.error.errors.map((e) => e.message).join('. '),
        },
        { status: 400 }
      );
    }

    const data = validationResult.data;

    const config: BacktestConfig = {
      symbol: data.symbol,
      startDate: new Date(data.startDate),
      endDate: new Date(data.endDate),
      initialCapital: data.initialCapital,
      commission: data.commission,
      slippage: data.slippage,
      positionSizePercent: data.positionSizePercent,
      maxPositions: data.maxPositions,
      stopLossPercent: data.stopLossPercent,
      takeProfitPercent: data.takeProfitPercent,
      useWalkForward: false,
    };

    const result = await backtestingEngine.runBacktest(config);

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Backtesting error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Backtesting failed',
      },
      { status: 500 }
    );
  }
}
