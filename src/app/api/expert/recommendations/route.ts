/**
 * GET /api/expert/recommendations
 *
 * Get daily top stock picks from expert advisory board
 * Only recommends top 5 stocks per day
 */

import { NextRequest, NextResponse } from 'next/server';
import { getDailyTopPicks } from '@/services/expertAdvisory';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '5', 10);

    const recommendations = await getDailyTopPicks(limit);

    return NextResponse.json(recommendations);
  } catch (error) {
    console.error('Expert recommendations error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get expert recommendations',
      },
      { status: 500 }
    );
  }
}
