/**
 * GET /api/process/status
 *
 * Get status of all data processing scripts
 * Returns last run times and whether they can be executed today
 */

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Get job status for each process
    const jobs = await prisma.job.findMany({
      where: {
        name: {
          in: ['screening-us', 'screening-th', 'ml-signals-us', 'ml-signals-th'],
        },
      },
    });

    const jobMap = new Map(jobs.map((job) => [job.name, job]));

    // Helper to check if job was run today
    const wasRunToday = (jobName: string): boolean => {
      const job = jobMap.get(jobName);
      if (!job || !job.lastRun) return false;
      const lastRunDate = new Date(job.lastRun);
      return lastRunDate >= today;
    };

    // Helper to get last run date
    const getLastRun = (jobName: string): Date | null => {
      const job = jobMap.get(jobName);
      return job?.lastRun ? new Date(job.lastRun) : null;
    };

    // Check screening status
    const usScreeningToday = wasRunToday('screening-us');
    const thScreeningToday = wasRunToday('screening-th');
    const usMLToday = wasRunToday('ml-signals-us');
    const thMLToday = wasRunToday('ml-signals-th');

    // Determine if processes can run
    const screeningUSCanRun = !usScreeningToday;
    const screeningTHCanRun = !thScreeningToday;
    const mlUSCanRun = usScreeningToday && !usMLToday;
    const mlTHCanRun = thScreeningToday && !thMLToday;

    return NextResponse.json({
      'screening-us': {
        lastRun: getLastRun('screening-us'),
        canRun: screeningUSCanRun,
        status: usScreeningToday ? 'completed_today' : 'ready',
        isRunning: jobMap.get('screening-us')?.status === 'running',
      },
      'screening-th': {
        lastRun: getLastRun('screening-th'),
        canRun: screeningTHCanRun,
        status: thScreeningToday ? 'completed_today' : 'ready',
        isRunning: jobMap.get('screening-th')?.status === 'running',
      },
      'ml-signals-us': {
        lastRun: getLastRun('ml-signals-us'),
        canRun: mlUSCanRun,
        requires: 'screening-us',
        status: usMLToday
          ? 'completed_today'
          : !usScreeningToday
          ? 'waiting_for_screening'
          : 'ready',
        isRunning: jobMap.get('ml-signals-us')?.status === 'running',
      },
      'ml-signals-th': {
        lastRun: getLastRun('ml-signals-th'),
        canRun: mlTHCanRun,
        requires: 'screening-th',
        status: thMLToday
          ? 'completed_today'
          : !thScreeningToday
          ? 'waiting_for_screening'
          : 'ready',
        isRunning: jobMap.get('ml-signals-th')?.status === 'running',
      },
    });
  } catch (error) {
    console.error('Process status error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get process status',
      },
      { status: 500 }
    );
  }
}
