import { beforeAll, afterEach, afterAll } from 'vitest';
import { PrismaClient } from '@prisma/client';

// Mock environment variables for testing
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = process.env.DATABASE_URL || 'postgresql://test:test@localhost:5432/tradingweb_test';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret-key-for-testing-only';
process.env.NEXT_PUBLIC_APP_URL = 'http://localhost:3000';

// Setup test database
beforeAll(async () => {
  // Initialize Prisma client for tests
  const prisma = new PrismaClient();

  // Clean up test data before running tests
  // Wrapped in try-catch to handle test environment gracefully
  try {
    await prisma.signal.deleteMany({});
    await prisma.stockPrice.deleteMany({});
    await prisma.stock.deleteMany({});
    await prisma.jobLog.deleteMany({});
    await prisma.user.deleteMany({});
  } catch (error) {
    // Ignore cleanup errors in test environment
    // Tests will handle their own data setup
    console.log('Note: Test cleanup skipped - tests will create their own data');
  }

  await prisma.$disconnect();
});

// Cleanup after each test
afterEach(async () => {
  // Optional: Clean up between tests if needed
});

// Cleanup after all tests
afterAll(async () => {
  const prisma = new PrismaClient();
  await prisma.$disconnect();
});

// Global test utilities
global.testUtils = {
  // Helper to create test user
  createTestUser: async (userData: any) => {
    // Implementation in actual test file
    return userData;
  },

  // Helper to create test stock
  createTestStock: async (stockData: any) => {
    return stockData;
  },

  // Helper to generate mock price data
  generateMockPriceData: (symbol: string, days: number = 30) => {
    const data = [];
    const basePrice = 100;
    const now = new Date();

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);

      const randomChange = (Math.random() - 0.5) * 4;
      const open = basePrice + randomChange;
      const close = open + (Math.random() - 0.5) * 2;
      const high = Math.max(open, close) + Math.random() * 1;
      const low = Math.min(open, close) - Math.random() * 1;
      const volume = Math.floor(Math.random() * 1000000) + 100000;

      data.push({
        date,
        open: Number(open.toFixed(2)),
        high: Number(high.toFixed(2)),
        low: Number(low.toFixed(2)),
        close: Number(close.toFixed(2)),
        volume,
      });
    }

    return data;
  },
};

declare global {
  var testUtils: {
    createTestUser: (userData: any) => Promise<any>;
    createTestStock: (stockData: any) => Promise<any>;
    generateMockPriceData: (symbol: string, days?: number) => any[];
  };
}
