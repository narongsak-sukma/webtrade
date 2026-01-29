import cron from 'node-cron';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { yahooFinanceService, SP500_SYMBOLS } from './yahooFinance';
import { JOB_TYPES, JOB_STATUS } from '@/types';
import { minerviniScreenerService } from './minerviniScreener';
import { mlSignalService } from './mlSignals';

class JobScheduler {
  private scheduledTasks: Map<string, cron.ScheduledTask> = new Map();

  constructor() {
    this.initializeJobs();
  }

  private async initializeJobs(): Promise<void> {
    logger.info('Job scheduler initializing...');

    // Load jobs from database
    const jobs = await prisma.job.findMany({
      where: { enabled: true },
    });

    for (const job of jobs) {
      if (job.schedule) {
        this.scheduleJob(job.id, job.schedule);
      }
    }

    logger.info(`Initialized ${jobs.length} jobs`);
  }

  scheduleJob(jobId: string, schedule: string): void {
    // Remove existing task if any
    this.cancelScheduledJob(jobId);

    // Validate cron expression
    if (!cron.validate(schedule)) {
      throw new Error(`Invalid cron expression: ${schedule}`);
    }

    // Create new scheduled task
    const task = cron.schedule(schedule, async () => {
      await this.executeJob(jobId);
    }, {
      scheduled: false, // Don't start immediately
    });

    this.scheduledTasks.set(jobId, task);
    task.start();

    logger.info(`Scheduled job ${jobId} with cron: ${schedule}`);
  }

  cancelScheduledJob(jobId: string): void {
    const task = this.scheduledTasks.get(jobId);
    if (task) {
      task.stop();
      this.scheduledTasks.delete(jobId);
      logger.info(`Cancelled scheduled job ${jobId}`);
    }
  }

  async executeJob(jobId: string): Promise<void> {
    const job = await prisma.job.findUnique({
      where: { id: jobId },
    });

    if (!job || !job.enabled || job.status === JOB_STATUS.STOPPED) {
      logger.info(`Job ${jobId} is disabled or stopped, skipping`);
      return;
    }

    if (job.status === JOB_STATUS.RUNNING) {
      logger.info(`Job ${jobId} is already running, skipping`);
      return;
    }

    logger.info(`Executing job: ${job.name} (${job.type})`);

    const startTime = Date.now();
    let logId: string | null = null;

    try {
      // Update job status to running
      await prisma.job.update({
        where: { id: jobId },
        data: { status: JOB_STATUS.RUNNING },
      });

      // Create job log
      const log = await prisma.jobLog.create({
        data: {
          jobId,
          status: 'started',
          message: `Job started: ${job.name}`,
        },
      });
      logId = log.id;

      // Execute job based on type
      switch (job.type) {
        case JOB_TYPES.DATA_FEED:
          await this.executeDataFeedJob();
          break;
        case JOB_TYPES.SCREENING:
          await this.executeScreeningJob();
          break;
        case JOB_TYPES.ML_SIGNALS:
          await this.executeMLSignalsJob();
          break;
        default:
          throw new Error(`Unknown job type: ${job.type}`);
      }

      // Calculate duration
      const duration = Math.floor((Date.now() - startTime) / 1000);

      // Update job as completed
      await prisma.job.update({
        where: { id: jobId },
        data: {
          status: JOB_STATUS.IDLE,
          lastRun: new Date(),
          runCount: { increment: 1 },
          lastDuration: duration,
          lastError: null,
        },
      });

      // Update job log
      if (logId) {
        await prisma.jobLog.update({
          where: { id: logId },
          data: {
            status: 'completed',
            message: `Job completed successfully in ${duration}s`,
            duration,
            completedAt: new Date(),
          },
        });
      }

      logger.info(`Job ${job.name} completed successfully in ${duration}s`);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error(`Job ${job.name} failed:`, { error: errorMessage });

      // Update job as error
      await prisma.job.update({
        where: { id: jobId },
        data: {
          status: JOB_STATUS.ERROR,
          lastError: errorMessage,
        },
      });

      // Update job log
      if (logId) {
        await prisma.jobLog.update({
          where: { id: logId },
          data: {
            status: 'failed',
            error: errorMessage,
            completedAt: new Date(),
          },
        });
      }
    }
  }

  private async executeDataFeedJob(): Promise<void> {
    logger.info('Executing data feed job...');

    // Update stock list first
    await yahooFinanceService.updateStockList(SP500_SYMBOLS);

    // Fetch price data (incremental)
    const result = await yahooFinanceService.fetchDataFeed(SP500_SYMBOLS, false);

    logger.info(`Data feed job completed: ${result.updated} records updated`);
    if (result.errors.length > 0) {
      logger.error(`Errors: ${result.errors.join(', ')}`);
    }
  }

  private async executeScreeningJob(): Promise<void> {
    logger.info('Executing screening job...');

    const result = await minerviniScreenerService.screenAllStocks();

    logger.info(`Screening job completed: ${result.screened} stocks passed, ${result.failed} failed`);
  }

  private async executeMLSignalsJob(): Promise<void> {
    logger.info('Executing ML signals job...');

    const result = await mlSignalService.generateSignalsForAll();

    logger.info(`ML signals job completed: ${result.generated} signals generated`);
  }

  async startJob(jobId: string): Promise<void> {
    const job = await prisma.job.findUnique({
      where: { id: jobId },
    });

    if (!job) {
      throw new Error(`Job not found: ${jobId}`);
    }

    // Enable job and set status to idle
    await prisma.job.update({
      where: { id: jobId },
      data: {
        enabled: true,
        status: JOB_STATUS.IDLE,
      },
    });

    // Start the scheduled task if not already running
    if (job.schedule && !this.scheduledTasks.has(jobId)) {
      this.scheduleJob(jobId, job.schedule);
    }

    // Execute immediately
    await this.executeJob(jobId);
  }

  async stopJob(jobId: string): Promise<void> {
    await prisma.job.update({
      where: { id: jobId },
      data: {
        enabled: false,
        status: JOB_STATUS.STOPPED,
      },
    });

    // Cancel scheduled job
    this.cancelScheduledJob(jobId);
  }

  async updateJobSchedule(jobId: string, schedule: string): Promise<void> {
    const job = await prisma.job.update({
      where: { id: jobId },
      data: { schedule },
    });

    if (job.schedule) {
      this.scheduleJob(jobId, job.schedule);
    }
  }

  getScheduledJobs(): string[] {
    return Array.from(this.scheduledTasks.keys());
  }

  isJobRunning(jobId: string): boolean {
    return this.scheduledTasks.has(jobId);
  }
}

// Export singleton instance
export const jobScheduler = new JobScheduler();
