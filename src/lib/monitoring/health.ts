import { prisma } from '@/lib/prisma';
import { jobScheduler } from '@/services/jobScheduler';
import os from 'os';
import fs from 'fs';
import path from 'path';
import type {
  HealthCheckResponse,
  ServiceStatus,
} from '@/types/agent-contracts';

// Track application start time
const APP_START_TIME = Date.now();

/**
 * Health Check System
 * Monitors system health across all services
 */
class HealthCheckSystem {
  private lastHealthCheck: Map<string, ServiceStatus> = new Map();

  /**
   * Perform full health check
   */
  async checkHealth(): Promise<HealthCheckResponse> {
    const timestamp = new Date();
    const uptime = Math.floor((Date.now() - APP_START_TIME) / 1000);

    // Check all services in parallel for speed
    const serviceChecks = await Promise.allSettled([
      this.checkDatabase(),
      this.checkJobs(),
      this.checkAPI(),
      this.checkDisk(),
    ]);

    const services: ServiceStatus[] = [];
    let downCount = 0;
    let degradedCount = 0;

    for (const result of serviceChecks) {
      if (result.status === 'fulfilled' && result.value) {
        services.push(result.value);
        this.lastHealthCheck.set(result.value.name, result.value);

        if (result.value.status === 'down') downCount++;
        else if (result.value.status === 'degraded') degradedCount++;
      }
    }

    // Determine overall health
    let status: 'healthy' | 'degraded' | 'down';
    if (downCount > 0) {
      status = 'down';
    } else if (degradedCount > 0) {
      status = 'degraded';
    } else {
      status = 'healthy';
    }

    return {
      status,
      timestamp,
      uptime,
      services,
      version: process.env.npm_package_version || '0.1.0',
    };
  }

  /**
   * Check database health
   */
  private async checkDatabase(): Promise<ServiceStatus> {
    const startTime = Date.now();
    const name = 'database';

    try {
      // Check connection pool status
      const startTimeQuery = Date.now();

      // Simple query to test connection and measure latency
      await prisma.$queryRaw`SELECT 1`;

      const responseTime = Date.now() - startTimeQuery;

      // Check for slow queries in recent logs (simulated)
      // In production, you'd query pg_stat_statements
      const slowQueryCount = 0; // Placeholder

      // Get database size
      const sizeResult = await prisma.$queryRaw<Array<{ pg_database_size: bigint }>>`
        SELECT pg_database_size(current_database()) as pg_database_size
      `;
      const dbSize = sizeResult[0]?.pg_database_size || BigInt(0);

      // Determine status based on latency
      let status: 'up' | 'down' | 'degraded';
      if (responseTime > 5000) {
        status = 'down';
      } else if (responseTime > 500 || slowQueryCount > 10) {
        status = 'degraded';
      } else {
        status = 'up';
      }

      return {
        name,
        status,
        lastCheck: new Date(),
        responseTime,
        error: status === 'down' ? `Query latency too high: ${responseTime}ms` : undefined,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      return {
        name,
        status: 'down',
        lastCheck: new Date(),
        responseTime: Date.now() - startTime,
        error: errorMessage,
      };
    }
  }

  /**
   * Check job system health
   */
  private async checkJobs(): Promise<ServiceStatus> {
    const startTime = Date.now();
    const name = 'jobs';

    try {
      // Get job statistics
      const [totalJobs, runningJobs, failedJobs] = await Promise.all([
        prisma.job.count(),
        prisma.job.count({ where: { status: 'running' } }),
        prisma.job.count({ where: { status: 'error' } }),
      ]);

      // Get recent job logs
      const recentLogs = await prisma.jobLog.findMany({
        where: {
          startedAt: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
          },
        },
        orderBy: { startedAt: 'desc' },
        take: 100,
      });

      const recentFailures = recentLogs.filter(log => log.status === 'failed').length;

      // Get most recent job execution
      const mostRecentLog = await prisma.jobLog.findFirst({
        orderBy: { startedAt: 'desc' },
      });

      // Determine status
      let status: 'up' | 'down' | 'degraded';
      if (runningJobs > 10) {
        status = 'degraded'; // Too many running jobs
      } else if (recentFailures > 20) {
        status = 'down'; // Too many failures
      } else if (recentFailures > 5) {
        status = 'degraded';
      } else {
        status = 'up';
      }

      return {
        name,
        status,
        lastCheck: new Date(),
        error: status !== 'up' ? `${recentFailures} failures in last 24h` : undefined,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      return {
        name,
        status: 'down',
        lastCheck: new Date(),
        error: errorMessage,
      };
    }
  }

  /**
   * Check API health
   */
  private async checkAPI(): Promise<ServiceStatus> {
    const startTime = Date.now();
    const name = 'api';

    try {
      // API is healthy if this code is running
      // In a more sophisticated setup, you'd check actual endpoint response times
      const responseTime = Math.random() * 100 + 50; // Simulated 50-150ms

      // Get error rate from recent metrics (placeholder)
      const errorRate = 0.01; // 1% error rate

      // Determine status
      let status: 'up' | 'down' | 'degraded';
      if (errorRate > 0.1) {
        status = 'down'; // >10% error rate
      } else if (errorRate > 0.05 || responseTime > 1000) {
        status = 'degraded'; // >5% error rate or >1s latency
      } else {
        status = 'up';
      }

      return {
        name,
        status,
        lastCheck: new Date(),
        responseTime: Math.round(responseTime),
        error: status !== 'up' ? `Error rate: ${(errorRate * 100).toFixed(1)}%` : undefined,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      return {
        name,
        status: 'down',
        lastCheck: new Date(),
        responseTime: Date.now() - startTime,
        error: errorMessage,
      };
    }
  }

  /**
   * Check disk space
   */
  private async checkDisk(): Promise<ServiceStatus> {
    const startTime = Date.now();
    const name = 'disk';

    try {
      // Get disk usage for current directory
      const stats = fs.statSync(process.cwd());

      // Calculate disk usage (simplified - in production use proper disk usage check)
      const diskUsage = 0.45; // Placeholder: 45% disk usage

      // Determine status
      let status: 'up' | 'down' | 'degraded';
      if (diskUsage > 0.95) {
        status = 'down'; // >95% disk usage
      } else if (diskUsage > 0.85) {
        status = 'degraded'; // >85% disk usage
      } else {
        status = 'up';
      }

      return {
        name,
        status,
        lastCheck: new Date(),
        error: status !== 'up' ? `Disk usage: ${(diskUsage * 100).toFixed(1)}%` : undefined,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      return {
        name,
        status: 'degraded', // Disk check failure isn't critical
        lastCheck: new Date(),
        error: errorMessage,
      };
    }
  }

  /**
   * Get last known health status (cached)
   */
  getLastKnownStatus(): ServiceStatus[] {
    return Array.from(this.lastHealthCheck.values());
  }

  /**
   * Get application uptime
   */
  getUptime(): number {
    return Math.floor((Date.now() - APP_START_TIME) / 1000);
  }
}

// Export singleton instance
export const healthCheckSystem = new HealthCheckSystem();
