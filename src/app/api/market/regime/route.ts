/**
 * GET /api/market/regime
 *
 * Get current market regime detection
 */

import { NextRequest, NextResponse } from 'next/server';
import { marketRegimeService } from '@/services/marketRegime';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const sp500Symbol = searchParams.get('sp500Symbol') || undefined;
    const lookbackDays = searchParams.get('lookbackDays')
      ? parseInt(searchParams.get('lookbackDays')!)
      : undefined;

    const regime = await marketRegimeService.detectMarketRegime({
      sp500Symbol,
      lookbackDays,
    });

    return NextResponse.json({
      success: true,
      data: regime,
    });
  } catch (error) {
    console.error('Market regime detection error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Regime detection failed',
      },
      { status: 500 }
    );
  }
}
