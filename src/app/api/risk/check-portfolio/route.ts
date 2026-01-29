/**
 * POST /api/risk/check-portfolio
 *
 * Check portfolio risk metrics and ensure safe exposure levels
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { riskManagementService } from '@/services/riskManagement';

const portfolioRiskSchema = z.object({
  positions: z.array(
    z.object({
      symbol: z.string(),
      entryPrice: z.number().positive(),
      currentPrice: z.number().positive(),
      shares: z.number().int().positive(),
      stopLoss: z.number().positive(),
    })
  ),
  accountBalance: z.number().positive(),
  maxPortfolioHeat: z.number().min(0.05).max(0.50).default(0.20), // 5-50%, default 20%
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validationResult = portfolioRiskSchema.safeParse(body);

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

    const result = riskManagementService.calculatePortfolioRisk({
      positions: data.positions,
      accountBalance: data.accountBalance,
      maxPortfolioHeat: data.maxPortfolioHeat,
    });

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Portfolio risk check error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to check portfolio risk',
      },
      { status: 500 }
    );
  }
}
