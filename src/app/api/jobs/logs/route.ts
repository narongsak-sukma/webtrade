import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const jobId = searchParams.get('jobId');
    const limit = parseInt(searchParams.get('limit') || '50');

    let whereClause: any = {};
    if (jobId) {
      whereClause.jobId = jobId;
    }

    const logs = await prisma.jobLog.findMany({
      where: whereClause,
      orderBy: { startedAt: 'desc' },
      take: limit,
    });

    return NextResponse.json(logs);
  } catch (error) {
    console.error('Error fetching job logs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch job logs' },
      { status: 500 }
    );
  }
}
