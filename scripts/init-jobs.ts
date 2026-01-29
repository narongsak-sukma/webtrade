/**
 * Initialize Jobs in Database
 *
 * Creates job records for tracking process executions
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function initJobs() {
  try {
    console.log('🔧 Initializing jobs in database...\n');

    const jobs = [
      {
        name: 'screening-us',
        type: 'screening',
        schedule: '0 6 * * 1-5', // 6 AM on weekdays
        enabled: true,
        settings: {
          market: 'US',
          description: 'US Stock Screening',
        },
      },
      {
        name: 'screening-th',
        type: 'screening',
        schedule: '0 6 * * 1-5', // 6 AM on weekdays
        enabled: true,
        settings: {
          market: 'TH',
          description: 'TH Stock Screening',
        },
      },
      {
        name: 'ml-signals-us',
        type: 'ml_signals',
        schedule: '0 7 * * 1-5', // 7 AM on weekdays
        enabled: true,
        settings: {
          market: 'US',
          description: 'US ML Signals',
        },
      },
      {
        name: 'ml-signals-th',
        type: 'ml_signals',
        schedule: '0 7 * * 1-5', // 7 AM on weekdays
        enabled: true,
        settings: {
          market: 'TH',
          description: 'TH ML Signals',
        },
      },
    ];

    for (const job of jobs) {
      const existing = await prisma.job.findUnique({
        where: { name: job.name },
      });

      if (existing) {
        console.log(`✅ Job already exists: ${job.name}`);
      } else {
        await prisma.job.create({
          data: job,
        });
        console.log(`✅ Created job: ${job.name}`);
      }
    }

    console.log('\n✅ Jobs initialized successfully!\n');
  } catch (error) {
    console.error('\n❌ Error initializing jobs:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

initJobs();
