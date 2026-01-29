import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';

export async function GET() {
  try {
    const session = await auth();

    // Check if user is admin (you can implement proper role-based access)
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Fetch all jobs with their latest execution status
    const jobs = await prisma.job.findMany({
      orderBy: { createdAt: 'asc' },
      include: {
        _count: {
          select: {
            logs: true,
          },
        },
      },
    });

    // Fetch recent job logs (last 50)
    const recentLogs = await prisma.jobLog.findMany({
      orderBy: { startedAt: 'desc' },
      take: 50,
      include: {
        job: {
          select: {
            name: true,
            type: true,
          },
        },
      },
    });

    // Fetch recent alerts/errors from logs
    const recentErrors = await prisma.jobLog.findMany({
      where: {
        status: 'failed',
      },
      orderBy: { startedAt: 'desc' },
      take: 10,
      include: {
        job: {
          select: {
            name: true,
            type: true,
          },
        },
      },
    });

    // Calculate system stats
    const totalJobs = jobs.length;
    const enabledJobs = jobs.filter(j => j.enabled).length;
    const runningJobs = jobs.filter(j => j.status === 'running').length;
    const failedJobs = jobs.filter(j => j.status === 'error').length;

    // Get job execution stats
    const jobStats = await prisma.jobLog.groupBy({
      by: ['status'],
      _count: {
        status: true,
      },
    });

    const stats = {
      total: 0,
      completed: 0,
      failed: 0,
      started: 0,
    };

    jobStats.forEach(stat => {
      stats[stat.status as keyof typeof stats] = stat._count.status;
      stats.total += stat._count.status;
    });

    return NextResponse.json({
      jobs,
      recentLogs,
      recentErrors,
      summary: {
        totalJobs,
        enabledJobs,
        runningJobs,
        failedJobs,
        totalExecutions: stats.total,
        successfulExecutions: stats.completed,
        failedExecutions: stats.failed,
      },
    });
  } catch (error) {
    console.error('Error fetching monitoring data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch monitoring data' },
      { status: 500 }
    );
  }
}
