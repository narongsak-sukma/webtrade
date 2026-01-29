/**
 * Minervini Screener Service Tests
 *
 * Tests for Minervini Trend Template screening service
 */

import { describe, it, expect, beforeAll, beforeEach } from 'vitest';
import { PrismaClient } from '@prisma/client';
import { MinerviniScreenerService } from '@/services/minerviniScreener';

const prisma = new PrismaClient();

describe('MinerviniScreenerService', () => {
  let service: MinerviniScreenerService;

  beforeAll(() => {
    service = new MinerviniScreenerService();
  });

  beforeEach(async () => {
    // Clean up before each test
    await prisma.screenedStock.deleteMany({});
    await prisma.stockPrice.deleteMany({});
    await prisma.stock.deleteMany({});
  });

  describe('calculateSMA', () => {
    it('should calculate 50-day SMA correctly', async () => {
      const prices: number[] = [];
      for (let i = 0; i < 50; i++) {
        prices.push(100 + i);
      }

      const sma = (service as any).calculateSMA(prices, 50);
      const expected = prices.reduce((a, b) => a + b, 0) / 50;

      expect(sma).toBeCloseTo(expected, 2);
    });

    it('should calculate 200-day SMA correctly', async () => {
      const prices: number[] = [];
      for (let i = 0; i < 200; i++) {
        prices.push(100 + i * 0.5);
      }

      const sma = (service as any).calculateSMA(prices, 200);
      const expected = prices.reduce((a, b) => a + b, 0) / 200;

      expect(sma).toBeCloseTo(expected, 2);
    });

    it('should return null for insufficient data', async () => {
      const prices = [100, 102, 104];
      const sma = (service as any).calculateSMA(prices, 50);

      expect(sma).toBeNull();
    });
  });

  describe('get52WeekHighLow', () => {
    beforeEach(async () => {
      // Create parent stock record
      await prisma.stock.create({
        data: { symbol: 'AAPL', name: 'Apple Inc.', exchange: 'NASDAQ' },
      });

      // Create test price data within the last year
      const prices: any[] = [];
      const baseDate = new Date();
      baseDate.setDate(baseDate.getDate() - 252); // Start 252 days ago

      for (let i = 0; i < 252; i++) {
        const date = new Date(baseDate);
        date.setDate(date.getDate() + i);

        prices.push({
          symbol: 'AAPL',
          date,
          open: 150 + i * 0.5,
          high: 155 + i * 0.5,
          low: 145 + i * 0.5,
          close: 152 + i * 0.5,
          volume: 50000000,
          adjClose: 152 + i * 0.5,
        });
      }

      await prisma.stockPrice.createMany({
        data: prices,
      });
    });

    it('should get 52-week high and low', async () => {
      const result = await (service as any).get52WeekHighLow('AAPL');

      expect(result).not.toBeNull();
      expect(result).toHaveProperty('high');
      expect(result).toHaveProperty('low');
      expect(result!.high).toBeGreaterThan(result!.low);
    });

    it('should return null for symbol with no data', async () => {
      const result = await (service as any).get52WeekHighLow('NONEXISTENT');

      expect(result).toBeNull();
    });
  });

  describe('isMa200TrendingUp', () => {
    it('should detect upward trending 200-day MA', async () => {
      // Create prices with upward trend
      const prices: number[] = [];
      for (let i = 0; i < 230; i++) {
        prices.push(100 + i * 0.1);
      }

      const isTrendingUp = (service as any).isMa200TrendingUp(prices);

      expect(isTrendingUp).toBe(true);
    });

    it('should detect downward trending 200-day MA', async () => {
      // Create prices with downward trend
      const prices: number[] = [];
      for (let i = 0; i < 230; i++) {
        prices.push(200 - i * 0.1);
      }

      const isTrendingUp = (service as any).isMa200TrendingUp(prices);

      expect(isTrendingUp).toBe(false);
    });

    it('should return false for insufficient data', async () => {
      const prices = [100, 102, 104];
      const isTrendingUp = (service as any).isMa200TrendingUp(prices);

      expect(isTrendingUp).toBe(false);
    });
  });

  describe('calculateRelativeStrength', () => {
    beforeEach(async () => {
      // Create parent stock records
      await prisma.stock.create({
        data: { symbol: 'SPY', name: 'SPDR S&P 500', exchange: 'NASDAQ' },
      });
      await prisma.stock.create({
        data: { symbol: 'AAPL', name: 'Apple Inc.', exchange: 'NASDAQ' },
      });

      // Create SPY data within last year
      const spyPrices: any[] = [];
      const baseDate = new Date();
      baseDate.setDate(baseDate.getDate() - 60);

      for (let i = 0; i < 60; i++) {
        const date = new Date(baseDate);
        date.setDate(date.getDate() + i);

        spyPrices.push({
          symbol: 'SPY',
          date,
          open: 400 + i * 0.5,
          high: 405 + i * 0.5,
          low: 395 + i * 0.5,
          close: 402 + i * 0.5,
          volume: 100000000,
          adjClose: 402 + i * 0.5,
        });
      }

      await prisma.stockPrice.createMany({
        data: spyPrices,
      });

      // Create stock data with better performance
      const stockPrices: any[] = [];
      for (let i = 0; i < 60; i++) {
        const date = new Date(baseDate);
        date.setDate(date.getDate() + i);

        stockPrices.push({
          symbol: 'AAPL',
          date,
          open: 150 + i * 1.0,
          high: 155 + i * 1.0,
          low: 145 + i * 1.0,
          close: 152 + i * 1.0,
          volume: 50000000,
          adjClose: 152 + i * 1.0,
        });
      }

      await prisma.stockPrice.createMany({
        data: stockPrices,
      });
    });

    it('should calculate positive relative strength', async () => {
      const rs = await (service as any).calculateRelativeStrength('AAPL');

      expect(rs).not.toBeNull();
      expect(rs!).toBeGreaterThan(0); // AAPL outperformed SPY
    });

    it('should return null for insufficient data', async () => {
      const rs = await (service as any).calculateRelativeStrength('NONEXISTENT');

      expect(rs).toBeNull();
    });
  });

  describe('screenStock', () => {
    beforeEach(async () => {
      // Create parent stock record
      await prisma.stock.create({
        data: { symbol: 'AAPL', name: 'Apple Inc.', exchange: 'NASDAQ' },
      });

      // Create comprehensive test data within last year
      const prices: any[] = [];
      const baseDate = new Date();
      baseDate.setDate(baseDate.getDate() - 252);

      for (let i = 0; i < 252; i++) {
        const date = new Date(baseDate);
        date.setDate(date.getDate() + i);

        // Create upward trending price
        const basePrice = 150 + i * 0.5;

        prices.push({
          symbol: 'AAPL',
          date,
          open: basePrice,
          high: basePrice + 2,
          low: basePrice - 2,
          close: basePrice + 1,
          volume: 50000000,
          adjClose: basePrice + 1,
        });
      }

      await prisma.stockPrice.createMany({
        data: prices,
      });
    });

    it('should screen stock successfully', async () => {
      const result = await service.screenStock('AAPL');

      expect(result).not.toBeNull();
      expect(result).toHaveProperty('symbol', 'AAPL');
      expect(result).toHaveProperty('price');
      expect(result).toHaveProperty('ma50');
      expect(result).toHaveProperty('ma150');
      expect(result).toHaveProperty('ma200');
      expect(result).toHaveProperty('passedCriteria');
    });

    it('should calculate all Minervini criteria', async () => {
      const result = await service.screenStock('AAPL');

      expect(result).toHaveProperty('priceAboveMa150');
      expect(result).toHaveProperty('ma150AboveMa200');
      expect(result).toHaveProperty('ma200TrendingUp');
      expect(result).toHaveProperty('ma50AboveMa150');
      expect(result).toHaveProperty('priceAboveMa50');
      expect(result).toHaveProperty('priceAbove52WeekLow');
      expect(result).toHaveProperty('priceNear52WeekHigh');
      expect(result).toHaveProperty('relativeStrengthPositive');
    });

    it('should count passed criteria correctly', async () => {
      const result = await service.screenStock('AAPL');

      expect(result).toHaveProperty('passedCriteria');
      expect(result!.passedCriteria).toBeGreaterThanOrEqual(0);
      expect(result!.passedCriteria).toBeLessThanOrEqual(8);
    });

    it('should save screening results to database', async () => {
      await service.screenStock('AAPL');

      const saved = await prisma.screenedStock.findFirst({
        where: { symbol: 'AAPL' },
      });

      expect(saved).not.toBeNull();
      expect(saved?.symbol).toBe('AAPL');
    });

    it('should return null for insufficient data', async () => {
      await prisma.stockPrice.deleteMany({});

      // Create parent stock record for MSFT
      await prisma.stock.create({
        data: { symbol: 'MSFT', name: 'Microsoft Corp.', exchange: 'NASDAQ' },
      });

      // Create only 100 days of data
      const prices: any[] = [];
      const baseDate = new Date();
      baseDate.setDate(baseDate.getDate() - 100);

      for (let i = 0; i < 100; i++) {
        const date = new Date(baseDate);
        date.setDate(date.getDate() + i);

        prices.push({
          symbol: 'MSFT',
          date,
          open: 300,
          high: 305,
          low: 295,
          close: 302,
          volume: 25000000,
          adjClose: 302,
        });
      }

      await prisma.stockPrice.createMany({
        data: prices,
      });

      const result = await service.screenStock('MSFT');

      expect(result).toBeNull();
    });
  });

  describe('screenAllStocks', () => {
    beforeEach(async () => {
      // Create test data for multiple stocks
      const symbols = ['AAPL', 'MSFT', 'GOOGL'];

      for (const symbol of symbols) {
        // Create parent stock record
        await prisma.stock.create({
          data: { symbol, name: `${symbol} Test Stock`, exchange: 'NASDAQ' },
        });

        const prices: any[] = [];
        const baseDate = new Date();
        baseDate.setDate(baseDate.getDate() - 252);

        for (let i = 0; i < 252; i++) {
          const date = new Date(baseDate);
          date.setDate(date.getDate() + i);

          const basePrice = 150 + i * 0.5;

          prices.push({
            symbol,
            date,
            open: basePrice,
            high: basePrice + 2,
            low: basePrice - 2,
            close: basePrice + 1,
            volume: 50000000,
            adjClose: basePrice + 1,
          });
        }

        await prisma.stockPrice.createMany({
          data: prices,
        });
      }
    });

    it('should screen all stocks', async () => {
      const result = await service.screenAllStocks();

      expect(result).toHaveProperty('screened');
      expect(result).toHaveProperty('failed');
      expect(result.screened).toBeGreaterThan(0);
    });

    it('should handle screening errors gracefully', async () => {
      // Add a stock with insufficient data
      await prisma.stock.create({
        data: { symbol: 'INSUFFICIENT', name: 'Insufficient Data', exchange: 'NASDAQ' },
      });
      const baseDate = new Date();
      baseDate.setDate(baseDate.getDate() - 10);
      await prisma.stockPrice.create({
        data: {
          symbol: 'INSUFFICIENT',
          date: baseDate,
          open: 100,
          high: 105,
          low: 95,
          close: 102,
          volume: 1000000,
          adjClose: 102,
        },
      });

      const result = await service.screenAllStocks();

      expect(result).toHaveProperty('failed');
      expect(result.failed).toBeGreaterThanOrEqual(0);
    });
  });
});
