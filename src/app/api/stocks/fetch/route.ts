/**
 * POST /api/stocks/fetch
 *
 * Fetch latest data from Yahoo Finance for all stocks
 */

import { NextRequest, NextResponse } from 'next/server';
import { yahooFinanceService } from '@/services/yahooFinance';

export async function POST(request: NextRequest) {
  try {
    console.log('\n📥 Fetching data from Yahoo Finance...');

    const result = await yahooFinanceService.fetchDataFeed([], false);

    if (result.errors.length > 0) {
      console.warn(`⚠️  Completed with ${result.errors.length} errors`);
    }

    console.log(`✅ Data fetch complete: ${result.updated} records updated`);

    return NextResponse.json({
      success: true,
      updated: result.updated,
      errors: result.errors.length,
      message: `Updated ${result.updated} stock price records`,
    });
  } catch (error) {
    console.error('Fetch error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch data',
      },
      { status: 500 }
    );
  }
}
