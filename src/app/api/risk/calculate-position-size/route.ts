/**
 * POST /api/risk/calculate-position-size
 *
 * Calculate optimal position size based on account balance and risk parameters
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { riskManagementService } from '@/services/riskManagement';

const positionSizingSchema = z.object({
  accountBalance: z.number().positive('Account balance must be positive'),
  riskPerTrade: z.number().min(0.01).max(0.10).default(0.02), // 1-10% risk, default 2%
  entryPrice: z.number().positive('Entry price must be positive'),
  stopLossPrice: z.number().positive('Stop loss price').optional(),
  stopLossPercent: z.number().min(0.01).max(0.20).default(0.05), // 1-20% stop
  riskRewardRatio: z.number().min(1).max(10).default(3), // 1:1 to 10:1
  method: z.enum(['fixed', 'kelly']).default('fixed'),
  // Kelly criterion params
  winRate: z.number().min(0).max(1).optional(),
  avgWin: z.number().positive().optional(),
  avgLoss: z.number().positive().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validationResult = positionSizingSchema.safeParse(body);

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

    let result;

    if (data.method === 'kelly' && data.winRate && data.avgWin && data.avgLoss) {
      // Kelly Criterion
      result = riskManagementService.calculateKellyPosition({
        accountBalance: data.accountBalance,
        entryPrice: data.entryPrice,
        winRate: data.winRate,
        avgWin: data.avgWin,
        avgLoss: data.avgLoss,
      });
    } else {
      // Fixed Fractional (default)
      result = riskManagementService.calculateFixedFractionalPosition({
        accountBalance: data.accountBalance,
        riskPerTrade: data.riskPerTrade,
        entryPrice: data.entryPrice,
        stopLossPrice: data.stopLossPrice,
        stopLossPercent: data.stopLossPercent,
        riskRewardRatio: data.riskRewardRatio,
      });
    }

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Position sizing error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to calculate position size',
      },
      { status: 500 }
    );
  }
}