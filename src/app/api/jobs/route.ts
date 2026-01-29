import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { jobScheduler } from '@/services/jobScheduler';
import { JOB_TYPES } from '@/types';

export async function GET() {
  try {
    const jobs = await prisma.job.findMany({
      orderBy: { createdAt: 'asc' },
    });

    return NextResponse.json(jobs);
  } catch (error) {
    console.error('Error fetching jobs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch jobs' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, jobId, schedule } = body;

    if (action === 'start') {
      await jobScheduler.startJob(jobId);
      return NextResponse.json({ message: 'Job started' });
    }

    if (action === 'stop') {
      await jobScheduler.stopJob(jobId);
      return NextResponse.json({ message: 'Job stopped' });
    }

    if (action === 'update-schedule') {
      if (!schedule) {
        return NextResponse.json(
          { error: 'Schedule is required' },
          { status: 400 }
        );
      }
      await jobScheduler.updateJobSchedule(jobId, schedule);
      return NextResponse.json({ message: 'Schedule updated' });
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Error managing job:', error);
    return NextResponse.json(
      { error: 'Failed to manage job' },
      { status: 500 }
    );
  }
}
