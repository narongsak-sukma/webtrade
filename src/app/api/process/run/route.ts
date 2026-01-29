/**
 * POST /api/process/run
 *
 * Execute a data processing script (screening, ML signals, etc.)
 * Runs in background and returns immediately
 */

import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import { prisma } from '@/lib/prisma';

const execAsync = promisify(exec);

const PROCESS_SCRIPTS: Record<string, { script: string; description: string; type: string }> = {
  'screening-us': {
    script: 'npx tsx scripts/run-screening.ts',
    description: 'US Stock Screening',
    type: 'screening',
  },
  'screening-th': {
    script: 'npx tsx scripts/run-screening-th.ts',
    description: 'TH Stock Screening',
    type: 'screening',
  },
  'ml-signals-us': {
    script: 'npx tsx scripts/generate-ml-signals.ts',
    description: 'US ML Signals',
    type: 'ml_signals',
  },
  'ml-signals-th': {
    script: 'npx tsx scripts/generate-ml-signals-th.ts',
    description: 'TH ML Signals',
    type: 'ml_signals',
  },
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { process } = body;

    if (!process) {
      return NextResponse.json(
        { success: false, error: 'Process name is required' },
        { status: 400 }
      );
    }

    const processConfig = PROCESS_SCRIPTS[process];
    if (!processConfig) {
      return NextResponse.json(
        { success: false, error: `Unknown process: ${process}` },
        { status: 400 }
      );
    }

    // Check if process is already running
    const existingJob = await prisma.job.findUnique({
      where: { name: process },
    });

    if (existingJob?.status === 'running') {
      return NextResponse.json(
        { success: false, error: 'Process is already running' },
        { status: 400 }
      );
    }

    // Create or update job record
    const job = await prisma.job.upsert({
      where: { name: process },
      update: {
        status: 'running',
        lastRun: new Date(),
      },
      create: {
        name: process,
        type: processConfig.type,
        status: 'running',
        lastRun: new Date(),
        enabled: true,
      },
    });

    // Create job log
    await prisma.jobLog.create({
      data: {
        jobId: job.id,
        status: 'started',
        message: `Starting ${processConfig.description}`,
      },
    });

    console.log(`\n${'='.repeat(60)}`);
    console.log(`🚀 Starting process: ${processConfig.description}`);
    console.log(`📅 Time: ${new Date().toISOString()}`);
    console.log(`${'='.repeat(60)}\n`);

    // Execute the script asynchronously (don't wait for completion)
    const startTime = Date.now();
    execAsync(processConfig.script, {
      cwd: process.cwd(),
      env: {
        ...process.env,
        NODE_ENV: process.env.NODE_ENV || 'development',
      },
    })
      .then(async ({ stdout }) => {
        const duration = Math.floor((Date.now() - startTime) / 1000);

        console.log(`\n✅ Process completed successfully: ${processConfig.description}`);
        console.log(`⏱️  Duration: ${duration}s`);
        console.log(`\n${stdout}\n`);

        // Update job status
        await prisma.job.update({
          where: { name: process },
          data: {
            status: 'idle',
            lastDuration: duration,
            runCount: { increment: 1 },
          },
        });

        // Create completion log
        await prisma.jobLog.create({
          data: {
            jobId: job.id,
            status: 'completed',
            message: `Completed in ${duration}s`,
            duration,
            completedAt: new Date(),
          },
        });
      })
      .catch(async (error) => {
        const duration = Math.floor((Date.now() - startTime) / 1000);

        console.error(`\n❌ Process failed: ${processConfig.description}`);
        console.error(`Error: ${error.message}`);
        if (error.stdout) console.error(`\nOutput:\n${error.stdout}`);
        if (error.stderr) console.error(`\nErrors:\n${error.stderr}`);

        // Update job status to error
        await prisma.job.update({
          where: { name: process },
          data: {
            status: 'error',
            lastError: error.message,
            lastDuration: duration,
          },
        });

        // Create error log
        await prisma.jobLog.create({
          data: {
            jobId: job.id,
            status: 'failed',
            message: error.message,
            error: error.stderr || error.stdout || error.message,
            duration,
            completedAt: new Date(),
          },
        });
      });

    return NextResponse.json({
      success: true,
      message: `${processConfig.description} started successfully. Check console for progress.`,
      process,
    });
  } catch (error) {
    console.error('Process run error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to run process',
      },
      { status: 500 }
    );
  }
}
