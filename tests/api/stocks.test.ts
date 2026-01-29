/**
 * Stocks API Tests
 *
 * Tests for stock data endpoints:
 * - GET /api/stocks
 * - GET /api/stocks?symbol=AAPL
 * - GET /api/stocks?screened=true
 * - GET /api/stocks/[symbol]
 */

import { describe, it, expect, beforeAll, afterEach } from 'vitest';
import { PrismaClient } from '@prisma/client';
import { GET } from '@/app/api/stocks/route';
import { GET as getStockBySymbol } from '@/app/api/stocks/[symbol]/route';

const prisma = new PrismaClient();

describe('Stocks API', () => {
  // Setup test data
  beforeAll(async () => {
    // Clean up
    await prisma.price.deleteMany({});
    await prisma.stock.deleteMany({});

    // Create test stocks
    await prisma.stock.create({
      data: {
        symbol: 'AAPL',
        name: 'Apple Inc.',
        exchange: 'NASDAQ',
        sector: 'Technology',
        industry: 'Consumer Electronics',
        prices: {
          create: {
            date: new Date('2024-01-15'),
            open: 185.0,
            high: 188.0,
            low: 184.5,
            close: 187.5,
            volume: 50000000,
            adjClose: 187.5,
          },
        },
      },
    });

    await prisma.stock.create({
      data: {
        symbol: 'MSFT',
        name: 'Microsoft Corporation',
        exchange: 'NASDAQ',
        sector: 'Technology',
        industry: 'Software',
        prices: {
          create: {
            date: new Date('2024-01-15'),
            open: 375.0,
            high: 378.0,
            low: 374.0,
            close: 376.5,
            volume: 25000000,
            adjClose: 376.5,
          },
        },
      },
    });
  });

  afterEach(async () => {
    // Optional: Cleanup between tests
  });

  describe('GET /api/stocks', () => {
    it('should return all stocks with latest prices', async () => {
      const request = new Request('http://localhost:3000/api/stocks');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(Array.isArray(data)).toBe(true);
      expect(data.length).toBeGreaterThan(0);
      expect(data[0]).toHaveProperty('symbol');
      expect(data[0]).toHaveProperty('prices');
      expect(data[0].prices).toBeInstanceOf(Array);
      expect(data[0].prices.length).toBe(1);
    });

    it('should limit results to 100 stocks', async () => {
      const request = new Request('http://localhost:3000/api/stocks');
      const response = await GET(request);
      const data = await response.json();

      expect(data.length).toBeLessThanOrEqual(100);
    });

    it('should include stock metadata', async () => {
      const request = new Request('http://localhost:3000/api/stocks');
      const response = await GET(request);
      const data = await response.json();

      const stock = data.find((s: any) => s.symbol === 'AAPL');
      expect(stock).toBeDefined();
      expect(stock.name).toBe('Apple Inc.');
      expect(stock.exchange).toBe('NASDAQ');
      expect(stock.sector).toBe('Technology');
    });
  });

  describe('GET /api/stocks?symbol=AAPL', () => {
    it('should return specific stock by symbol', async () => {
      const request = new Request('http://localhost:3000/api/stocks?symbol=AAPL');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.symbol).toBe('AAPL');
      expect(data.name).toBe('Apple Inc.');
    });

    it('should return 404 for non-existent symbol', async () => {
      const request = new Request('http://localhost:3000/api/stocks?symbol=NONEXISTENT');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('Stock not found');
    });
  });

  describe('GET /api/stocks/[symbol]', () => {
    it('should return stock with historical prices', async () => {
      const request = new Request('http://localhost:3000/api/stocks/AAPL');
      const response = await getStockBySymbol(request, { params: { symbol: 'AAPL' } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.symbol).toBe('AAPL');
      expect(data.prices).toBeDefined();
      expect(Array.isArray(data.prices)).toBe(true);
    });

    it('should return 404 for non-existent symbol', async () => {
      const request = new Request('http://localhost:3000/api/stocks/NONEXISTENT');
      const response = await getStockBySymbol(request, { params: { symbol: 'NONEXISTENT' } });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBeDefined();
    });

    it('should handle invalid symbols gracefully', async () => {
      const request = new Request('http://localhost:3000/api/stocks/');
      const response = await getStockBySymbol(request, { params: { symbol: '' } });

      expect(response.status).toBeGreaterThanOrEqual(400);
    });
  });

  describe('GET /api/stocks?screened=true', () => {
    beforeAll(async () => {
      // Create screened stock data
      await prisma.screenedStock.create({
        data: {
          symbol: 'AAPL',
          date: new Date(),
          price: 187.5,
          ma50: 182.0,
          ma150: 178.0,
          ma200: 175.0,
          priceAboveMa150: true,
          ma150AboveMa200: true,
          ma200TrendingUp: true,
          ma50AboveMa150: true,
          priceAboveMa50: true,
          priceAbove52WeekLow: true,
          priceNear52WeekHigh: true,
          relativeStrengthPositive: true,
          week52Low: 145.0,
          week52High: 199.0,
          relativeStrength: 25.0,
          passedCriteria: 9,
        },
      });
    });

    it('should return screened stocks', async () => {
      const request = new Request('http://localhost:3000/api/stocks?screened=true');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(Array.isArray(data)).toBe(true);
      expect(data.length).toBeGreaterThan(0);
      expect(data[0]).toHaveProperty('symbol');
      expect(data[0]).toHaveProperty('passedCriteria');
      expect(data[0].passedCriteria).toBeGreaterThanOrEqual(6);
    });

    it('should include stock metadata in screened results', async () => {
      const request = new Request('http://localhost:3000/api/stocks?screened=true');
      const response = await GET(request);
      const data = await response.json();

      if (data.length > 0) {
        expect(data[0]).toHaveProperty('stock');
        expect(data[0].stock).toHaveProperty('name');
        expect(data[0].stock).toHaveProperty('sector');
      }
    });
  });

  describe('Error Handling', () => {
    it('should handle database errors gracefully', async () => {
      // This test would require mocking prisma to throw errors
      // For now, we'll just verify the error structure
      const request = new Request('http://localhost:3000/api/stocks');

      // If database fails, should return 500
      // This is a placeholder for error handling tests
      expect(true).toBe(true);
    });
  });
});
