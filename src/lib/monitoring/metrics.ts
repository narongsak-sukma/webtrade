import { prisma } from '@/lib/prisma';
import os from 'os';
import { exec } from 'child_process';
import { promisify } from 'util';
import type {
  AppMetrics,
  ServerMetrics,
  DatabaseMetrics,
  JobMetrics,
  APIMetrics,
} from '@/types/agent-contracts';

const execAsync = promisify(exec);

/**
 * Metrics Collection System
 * Collects and stores system metrics
 */
class MetricsCollector {
  private cachedMetrics: AppMetrics | null = null;
  private cacheExpiry: number = 0;
  private readonly CACHE_DURATION = 60000; // 60 seconds
  private collectionInterval: NodeJS.Timeout | null = null;

  // In-memory metrics for API tracking
  private apiRequests: Map<string, number[]> = new Map(); // endpoint -> latencies
  private apiErrors: number = 0;
  private apiTotalRequests: number = 0;

  /**
   * Start metrics collection
   */
  start(): void {
    if (this.collectionInterval) {
      return; // Already running
    }

    // Collect metrics every 60 seconds
    this.collectionInterval = setInterval(async () => {
      try {
        await this.collectAndStoreMetrics();
      } catch (error) {
        console.error('Failed to collect metrics:', error);
      }
    }, this.CACHE_DURATION);

    console.log('Metrics collection started');
  }

  /**
   * Stop metrics collection
   */
  stop(): void {
    if (this.collectionInterval) {
      clearInterval(this.collectionInterval);
      this.collectionInterval = null;
      console.log('Metrics collection stopped');
    }
  }

  /**
   * Get current metrics (cached)
   */
  async getMetrics(): Promise<AppMetrics> {
    const now = Date.now();

    // Return cached metrics if still valid
    if (this.cachedMetrics && now < this.cacheExpiry) {
      return this.cachedMetrics;
    }

    // Collect fresh metrics
    const metrics = await this.collectMetrics();
    this.cachedMetrics = metrics;
    this.cacheExpiry = now + this.CACHE_DURATION;

    return metrics;
  }

  /**
   * Collect all metrics
   */
  private async collectMetrics(): Promise<AppMetrics> {
    const timestamp = new Date();

    // Collect all metric types in parallel
    const [server, database, jobs, api] = await Promise.all([
      this.collectServerMetrics(),
      this.collectDatabaseMetrics(),
      this.collectJobMetrics(),
      this.collectAPIMetrics(),
    ]);

    return {
      timestamp,
      server,
      database,
      jobs,
      api,
    };
  }

  /**
   * Collect server metrics
   */
  private async collectServerMetrics(): Promise<ServerMetrics> {
    const cpus = os.cpus();
    const cpuCount = cpus.length;

    // Calculate CPU usage
    const cpuUsage = await this.getCPUUsage();

    // Memory usage
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const usedMem = totalMem - freeMem;
    const memoryUsage = usedMem / totalMem;

    // Disk usage (simplified - in production use proper disk usage check)
    const diskUsage = 0.45; // Placeholder

    // System uptime
    const uptime = Math.floor(os.uptime());

    return {
      cpuUsage,
      memoryUsage,
      diskUsage,
      uptime,
    };
  }

  /**
   * Get CPU usage percentage
   */
  private async getCPUUsage(): Promise<number> {
    return new Promise((resolve) => {
      const cpus = os.cpus();
      let totalIdle = 0;
      let totalTick = 0;

      cpus.forEach((cpu) => {
        for (const type in cpu.times) {
          totalTick += cpu.times[type as keyof typeof cpu.times];
        }
        totalIdle += cpu.times.idle;
      });

      const idle = totalIdle / cpus.length;
      const total = totalTick / cpus.length;
      const usage = 1 - idle / total;

      resolve(usage);
    });
  }

  /**
   * Collect database metrics
   */
  private async collectDatabaseMetrics(): Promise<DatabaseMetrics> {
    try {
      // Get connection count
      const connectionResult = await prisma.$queryRaw<Array<{ count: bigint }>>`
        SELECT count(*) as count
        FROM pg_stat_activity
        WHERE state = 'active'
      `;
      const connectionCount = Number(connectionResult[0]?.count || 0);

      // Measure query latency
      const queryStart = Date.now();
      await prisma.$queryRaw`SELECT 1`;
      const queryLatency = Date.now() - queryStart;

      // Get slow query count (placeholder - would need pg_stat_statements)
      const slowQueries = 0;

      // Get database size
      const sizeResult = await prisma.$queryRaw<Array<{ pg_database_size: bigint }>>`
        SELECT pg_database_size(current_database()) as pg_database_size
      `;
      const databaseSize = sizeResult[0]?.pg_database_size || BigInt(0);

      return {
        connectionCount,
        queryLatency,
        slowQueries,
        databaseSize: Number(databaseSize),
      };
    } catch (error) {
      console.error('Failed to collect database metrics:', error);
      return {
        connectionCount: 0,
        queryLatency: 0,
        slowQueries: 0,
        databaseSize: 0,
      };
    }
  }

  /**
   * Collect job metrics
   */
  private async collectJobMetrics(): Promise<JobMetrics> {
    try {
      // Get job counts
      const [totalJobs, runningJobs] = await Promise.all([
        prisma.job.count(),
        prisma.job.count({ where: { status: 'running' } }),
      ]);

      // Get failed jobs in last 24 hours
      const failedJobs = await prisma.jobLog.count({
        where: {
          status: 'failed',
          startedAt: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
          },
        },
      });

      // Get average execution time
      const avgResult = await prisma.jobLog.aggregate({
        where: {
          duration: { not: null },
          startedAt: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
          },
        },
        _avg: {
          duration: true,
        },
      });
      const avgExecutionTime = Math.round((avgResult._avg.duration || 0) * 1000);

      // Get last run time
      const lastLog = await prisma.jobLog.findFirst({
        orderBy: { startedAt: 'desc' },
      });
      const lastRun = lastLog?.startedAt || new Date();

      return {
        totalJobs,
        runningJobs,
        failedJobs,
        avgExecutionTime,
        lastRun,
      };
    } catch (error) {
      console.error('Failed to collect job metrics:', error);
      return {
        totalJobs: 0,
        runningJobs: 0,
        failedJobs: 0,
        avgExecutionTime: 0,
        lastRun: new Date(),
      };
    }
  }

  /**
   * Collect API metrics
   */
  private async collectAPIMetrics(): Promise<APIMetrics> {
    try {
      // Calculate metrics from in-memory tracking
      const allLatencies = Array.from(this.apiRequests.values()).flat();
      const avgLatency = allLatencies.length > 0
        ? Math.round(allLatencies.reduce((a, b) => a + b, 0) / allLatencies.length)
        : 0;

      const errorRate = this.apiTotalRequests > 0
        ? this.apiErrors / this.apiTotalRequests
        : 0;

      // Active connections (simplified)
      const activeConnections = this.apiTotalRequests;

      // Requests per second (over last minute)
      const requestsPerSecond = this.apiTotalRequests / 60;

      // Reset counters after collecting
      this.resetAPIMetrics();

      return {
        requestsPerSecond,
        avgLatency,
        errorRate,
        activeConnections,
      };
    } catch (error) {
      console.error('Failed to collect API metrics:', error);
      return {
        requestsPerSecond: 0,
        avgLatency: 0,
        errorRate: 0,
        activeConnections: 0,
      };
    }
  }

  /**
   * Track API request
   */
  trackAPIRequest(endpoint: string, latency: number, isError: boolean = false): void {
    if (!this.apiRequests.has(endpoint)) {
      this.apiRequests.set(endpoint, []);
    }

    const latencies = this.apiRequests.get(endpoint)!;
    latencies.push(latency);

    // Keep only last 100 requests per endpoint
    if (latencies.length > 100) {
      latencies.shift();
    }

    this.apiTotalRequests++;
    if (isError) {
      this.apiErrors++;
    }
  }

  /**
   * Reset API metrics counters
   */
  private resetAPIMetrics(): void {
    this.apiRequests.clear();
    this.apiErrors = 0;
    this.apiTotalRequests = 0;
  }

  /**
   * Collect and store metrics in database
   */
  private async collectAndStoreMetrics(): Promise<void> {
    try {
      const metrics = await this.collectMetrics();

      // Store metric snapshot
      await prisma.metricSnapshot.create({
        data: {
          timestamp: metrics.timestamp,
          // Server metrics
          cpuUsage: metrics.server.cpuUsage,
          memoryUsage: metrics.server.memoryUsage,
          diskUsage: metrics.server.diskUsage,
          uptime: BigInt(metrics.server.uptime),
          // Database metrics
          dbConnections: metrics.database.connectionCount,
          queryLatency: metrics.database.queryLatency,
          slowQueries: metrics.database.slowQueries,
          databaseSize: BigInt(metrics.database.databaseSize),
          // Job metrics
          totalJobs: metrics.jobs.totalJobs,
          runningJobs: metrics.jobs.runningJobs,
          failedJobs: metrics.jobs.failedJobs,
          avgJobDuration: Math.round(metrics.jobs.avgExecutionTime / 1000), // Convert to seconds
          // API metrics
          apiRps: metrics.api.requestsPerSecond,
          apiLatency: metrics.api.avgLatency,
          errorRate: metrics.api.errorRate,
        },
      });

      // Clean old metric snapshots (retain for 30 days)
      const retentionDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      await prisma.metricSnapshot.deleteMany({
        where: {
          timestamp: {
            lt: retentionDate,
          },
        },
      });

      console.log('Metrics collected and stored successfully');
    } catch (error) {
      console.error('Failed to store metrics:', error);
    }
  }

  /**
   * Get historical metrics
   */
  async getHistoricalMetrics(hours: number = 24): Promise<AppMetrics[]> {
    try {
      const startTime = new Date(Date.now() - hours * 60 * 60 * 1000);

      const snapshots = await prisma.metricSnapshot.findMany({
        where: {
          timestamp: {
            gte: startTime,
          },
        },
        orderBy: {
          timestamp: 'asc',
        },
        take: 100, // Limit to 100 data points
      });

      return snapshots.map((snapshot) => ({
        timestamp: snapshot.timestamp,
        server: {
          cpuUsage: Number(snapshot.cpuUsage),
          memoryUsage: Number(snapshot.memoryUsage),
          diskUsage: Number(snapshot.diskUsage),
          uptime: Number(snapshot.uptime),
        },
        database: {
          connectionCount: snapshot.dbConnections,
          queryLatency: snapshot.queryLatency,
          slowQueries: snapshot.slowQueries,
          databaseSize: Number(snapshot.databaseSize),
        },
        jobs: {
          totalJobs: snapshot.totalJobs,
          runningJobs: snapshot.runningJobs,
          failedJobs: snapshot.failedJobs,
          avgExecutionTime: snapshot.avgJobDuration ? snapshot.avgJobDuration * 1000 : 0,
          lastRun: snapshot.timestamp,
        },
        api: {
          requestsPerSecond: Number(snapshot.apiRps),
          avgLatency: snapshot.apiLatency,
          errorRate: Number(snapshot.errorRate),
          activeConnections: 0,
        },
      }));
    } catch (error) {
      console.error('Failed to fetch historical metrics:', error);
      return [];
    }
  }
}

// Export singleton instance
export const metricsCollector = new MetricsCollector();

// Auto-start metrics collection in production
if (process.env.NODE_ENV === 'production' || process.env.MONITORING_ENABLED === 'true') {
  metricsCollector.start();
}
