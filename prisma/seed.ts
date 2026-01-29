import { PrismaClient } from '@prisma/client';
import { JOB_TYPES, JOB_STATUS } from '../src/types';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting database seed...');

  // Create default jobs
  const jobs = [
    {
      name: 'Data Feed - Yahoo Finance',
      type: JOB_TYPES.DATA_FEED,
      status: JOB_STATUS.IDLE,
      schedule: '0 23 * * *', // 11 PM UTC = 6 AM Bangkok (next day)
      enabled: true,
      settings: {
        symbols: ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA', 'META', 'NVDA'],
        initialLoad: false,
      },
    },
    {
      name: 'Stock Screening - Minervini',
      type: JOB_TYPES.SCREENING,
      status: JOB_STATUS.IDLE,
      schedule: '30 23 * * *', // 11:30 PM UTC = 6:30 AM Bangkok
      enabled: true,
      settings: {},
    },
    {
      name: 'ML Signal Generation',
      type: JOB_TYPES.ML_SIGNALS,
      status: JOB_STATUS.IDLE,
      schedule: '0 0 * * *', // 12 AM UTC = 7 AM Bangkok
      enabled: true,
      settings: {},
    },
  ];

  for (const job of jobs) {
    await prisma.job.upsert({
      where: { name: job.name },
      update: job,
      create: job,
    });
  }

  console.log('Jobs created successfully');

  // Create admin user (password: admin123 - change in production!)
  await prisma.user.upsert({
    where: { email: 'admin@tradingweb.com' },
    update: {},
    create: {
      email: 'admin@tradingweb.com',
      password: '$2a$10$8Z1.YYJZ.JZ.JZ.JZ.JZ.JeOJZ.JZ.JZ.JZ.JZ.JZ.JZ.JZ.JZ', // bcrypt hash of 'admin123'
      name: 'Admin User',
      role: 'admin',
    },
  });

  console.log('Admin user created (email: admin@tradingweb.com, password: admin123)');

  console.log('Seed completed!');
}

main()
  .catch((e) => {
    console.error('Error during seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
