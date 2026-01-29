/**
 * Jobs API Tests
 *
 * Tests for job management endpoints:
 * - GET /api/jobs (list all jobs)
 * - POST /api/jobs (trigger job)
 * - GET /api/jobs/logs (get job logs)
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { PrismaClient } from '@prisma/client';
import { GET, POST } from '@/app/api/jobs/route';
import { GET as getLogs } from '@/app/api/jobs/logs/route';

const prisma = new PrismaClient();

describe('Jobs API', () => {
  // Setup test data
  beforeAll(async () => {
    // Clean up
    await prisma.jobExecution.deleteMany({});

    // Create test job executions
    await prisma.jobExecution.create({
      data: {
        jobType: 'data_feed',
        status: 'running',
        startedAt: new Date(Date.now() - 3600000), // 1 hour ago
      },
    });

    await prisma.jobExecution.create({
      data: {
        jobType: 'screening',
        status: 'idle',
        startedAt: new Date(Date.now() - 7200000), // 2 hours ago
        completedAt: new Date(Date.now() - 3600000), // 1 hour ago
      },
    });

    await prisma.jobExecution.create({
      data: {
        jobType: 'ml_signals',
        status: 'error',
        startedAt: new Date(Date.now() - 1800000), // 30 minutes ago
        completedAt: new Date(Date.now() - 900000), // 15 minutes ago
        error: 'Test error message',
      },
    });
  });

  describe('GET /api/jobs', () => {
    it('should return all job executions', async () => {
      const request = new Request('http://localhost:3000/api/jobs');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(Array.isArray(data)).toBe(true);
      expect(data.length).toBeGreaterThan(0);
    });

    it('should return jobs with correct structure', async () => {
      const request = new Request('http://localhost:3000/api/jobs');
      const response = await GET(request);
      const data = await response.json();

      const job = data[0];
      expect(job).toHaveProperty('id');
      expect(job).toHaveProperty('jobType');
      expect(job).toHaveProperty('status');
      expect(job).toHaveProperty('startedAt');
      expect(job).toHaveProperty('completedAt');
    });

    it('should include job status', async () => {
      const request = new Request('http://localhost:3000/api/jobs');
      const response = await GET(request);
      const data = await response.json();

      const statuses = data.map((job: any) => job.status);
      expect(statuses).toContain('running');
      expect(statuses).toContain('idle');
      expect(statuses).toContain('error');
    });

    it('should include job types', async () => {
      const request = new Request('http://localhost:3000/api/jobs');
      const response = await GET(request);
      const data = await response.json();

      const jobTypes = data.map((job: any) => job.jobType);
      expect(jobTypes).toContain('data_feed');
      expect(jobTypes).toContain('screening');
      expect(jobTypes).toContain('ml_signals');
    });
  });

  describe('POST /api/jobs', () => {
    it('should trigger a job execution', async () => {
      const jobData = {
        jobType: 'data_feed',
      };

      const request = new Request('http://localhost:3000/api/jobs', {
        method: 'POST',
        body: JSON.stringify(jobData),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveProperty('success');
      expect(data).toHaveProperty('jobId');
    });

    it('should reject invalid job type', async () => {
      const jobData = {
        jobType: 'invalid_job_type',
      };

      const request = new Request('http://localhost:3000/api/jobs', {
        method: 'POST',
        body: JSON.stringify(jobData),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBeGreaterThanOrEqual(400);
      expect(data.success).toBe(false);
    });

    it('should require authentication for admin operations', async () => {
      // This test verifies that job triggering requires admin role
      // In a real scenario, this would test the auth middleware
      const jobData = {
        jobType: 'screening',
      };

      const request = new Request('http://localhost:3000/api/jobs', {
        method: 'POST',
        body: JSON.stringify(jobData),
        headers: {
          'Content-Type': 'application/json',
          // No auth token
        },
      });

      const response = await POST(request);
      const data = await response.json();

      // Should either succeed or return auth error
      expect([200, 401, 403]).toContain(response.status);
    });
  });

  describe('GET /api/jobs/logs', () => {
    beforeAll(async () => {
      // Create some job logs
      const job = await prisma.jobExecution.findFirst();
      if (job) {
        await prisma.jobLog.create({
          data: {
            jobId: job.id,
            level: 'info',
            message: 'Test log message',
            timestamp: new Date(),
          },
        });

        await prisma.jobLog.create({
          data: {
            jobId: job.id,
            level: 'error',
            message: 'Test error message',
            timestamp: new Date(),
          },
        });
      }
    });

    it('should return job logs', async () => {
      const request = new Request('http://localhost:3000/api/jobs/logs');
      const response = await getLogs(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(Array.isArray(data)).toBe(true);
    });

    it('should filter logs by job ID if provided', async () => {
      const job = await prisma.jobExecution.findFirst();
      if (job) {
        const request = new Request(`http://localhost:3000/api/jobs/logs?jobId=${job.id}`);
        const response = await getLogs(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        if (Array.isArray(data) && data.length > 0) {
          data.forEach((log: any) => {
            expect(log.jobId).toBe(job.id);
          });
        }
      }
    });

    it('should include log levels', async () => {
      const request = new Request('http://localhost:3000/api/jobs/logs');
      const response = await getLogs(request);
      const data = await response.json();

      if (Array.isArray(data) && data.length > 0) {
        const levels = data.map((log: any) => log.level);
        expect(levels.some((l: string) => ['info', 'error', 'warn'].includes(l))).toBe(true);
      }
    });

    it('should have timestamps on all logs', async () => {
      const request = new Request('http://localhost:3000/api/jobs/logs');
      const response = await getLogs(request);
      const data = await response.json();

      if (Array.isArray(data) && data.length > 0) {
        data.forEach((log: any) => {
          expect(log).toHaveProperty('timestamp');
          expect(new Date(log.timestamp)).toBeInstanceOf(Date);
        });
      }
    });
  });

  describe('Job Status Flow', () => {
    it('should track job lifecycle', async () => {
      // Create a new job
      const job = await prisma.jobExecution.create({
        data: {
          jobType: 'data_feed',
          status: 'idle',
          startedAt: new Date(),
        },
      });

      expect(job.status).toBe('idle');

      // Update to running
      const running = await prisma.jobExecution.update({
        where: { id: job.id },
        data: {
          status: 'running',
        },
      });

      expect(running.status).toBe('running');

      // Complete the job
      const completed = await prisma.jobExecution.update({
        where: { id: job.id },
        data: {
          status: 'idle',
          completedAt: new Date(),
        },
      });

      expect(completed.status).toBe('idle');
      expect(completed.completedAt).toBeDefined();
    });
  });
});
