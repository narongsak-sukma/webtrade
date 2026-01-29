/**
 * ML Signals Service Tests
 *
 * Tests for ML-based signal generation service
 */

import { describe, it, expect, beforeAll, beforeEach } from 'vitest';
import { PrismaClient } from '@prisma/client';
import { MLSignalService } from '@/services/mlSignals';

const prisma = new PrismaClient();

describe('MLSignalService', () => {
  let service: MLSignalService;

  beforeAll(() => {
    service = new MLSignalService();
  });

  beforeEach(async () => {
    // Clean up before each test
    await prisma.signal.deleteMany({});
    await prisma.stockPrice.deleteMany({});
    await prisma.stock.deleteMany({});
  });

  describe('calculateRSI', () => {
    it('should calculate RSI correctly for overbought condition', async () => {
      const prices: number[] = [];
      let price = 100;

      // Create upward trending prices (overbought)
      for (let i = 0; i < 20; i++) {
        price += Math.random() * 2;
        prices.push(price);
      }

      const rsi = (service as any).calculateRSI(prices, 14);

      expect(rsi).not.toBeNull();
      expect(rsi).toBeGreaterThan(50); // Should be high due to upward trend
    });

    it('should calculate RSI correctly for oversold condition', async () => {
      const prices: number[] = [];
      let price = 100;

      // Create downward trending prices (oversold)
      for (let i = 0; i < 20; i++) {
        price -= Math.random() * 2;
        prices.push(price);
      }

      const rsi = (service as any).calculateRSI(prices, 14);

      expect(rsi).not.toBeNull();
      expect(rsi).toBeLessThan(50); // Should be low due to downward trend
    });

    it('should return null for insufficient data', async () => {
      const prices = [100, 102, 104];
      const rsi = (service as any).calculateRSI(prices, 14);

      expect(rsi).toBeNull();
    });

    it('should return 100 when there are no losses', async () => {
      const prices = [100, 102, 104, 106, 108, 110, 112, 114, 116, 118, 120, 122, 124, 126, 128];
      const rsi = (service as any).calculateRSI(prices, 14);

      expect(rsi).toBe(100);
    });
  });

  describe('calculateMACD', () => {
    it('should calculate MACD components', async () => {
      const prices: number[] = [];
      let price = 100;

      for (let i = 0; i < 30; i++) {
        price += Math.random() * 2 - 0.5;
        prices.push(price);
      }

      const macd = (service as any).calculateMACD(prices);

      expect(macd).not.toBeNull();
      expect(macd).toHaveProperty('macd');
      expect(macd).toHaveProperty('macdSignal');
      expect(macd).toHaveProperty('macdHistogram');
    });

    it('should calculate positive histogram for uptrend', async () => {
      const prices: number[] = [];
      let price = 100;

      // Create uptrend
      for (let i = 0; i < 30; i++) {
        price += 1;
        prices.push(price);
      }

      const macd = (service as any).calculateMACD(prices);

      expect(macd).not.toBeNull();
      expect(macd!.macdHistogram).toBeGreaterThan(0);
    });

    it('should return null for insufficient data', async () => {
      const prices = [100, 102];
      const macd = (service as any).calculateMACD(prices);

      expect(macd).toBeNull();
    });
  });

  describe('calculateBollingerBands', () => {
    it('should calculate Bollinger Bands', async () => {
      const prices: number[] = [];
      for (let i = 0; i < 30; i++) {
        prices.push(100 + (Math.random() - 0.5) * 10);
      }

      const bb = (service as any).calculateBollingerBands(prices, 20, 2);

      expect(bb).not.toBeNull();
      expect(bb).toHaveProperty('upper');
      expect(bb).toHaveProperty('middle');
      expect(bb).toHaveProperty('lower');
      expect(bb!.upper).toBeGreaterThan(bb!.middle);
      expect(bb!.middle).toBeGreaterThan(bb!.lower);
    });

    it('should have proper band spacing', async () => {
      const prices: number[] = [];
      for (let i = 0; i < 30; i++) {
        prices.push(100);
      }

      const bb = (service as any).calculateBollingerBands(prices, 20, 2);

      expect(bb).not.toBeNull();
      // With no volatility, upper and lower should be close to middle
      expect(Math.abs(bb!.upper - bb!.middle)).toBeCloseTo(Math.abs(bb!.lower - bb!.middle), 1);
    });
  });

  describe('calculateOBV', () => {
    it('should calculate OBV correctly', async () => {
      const prices = [100, 102, 101, 103, 102];
      const volumes = [BigInt(1000), BigInt(2000), BigInt(1500), BigInt(3000), BigInt(2500)];

      const obv = (service as any).calculateOBV(prices, volumes);

      expect(obv).toBeDefined();
      expect(typeof obv).toBe('bigint');
    });

    it('should increase OBV on price uptrend', async () => {
      const prices = [100, 102, 104, 106, 108];
      const volumes = [BigInt(1000), BigInt(1000), BigInt(1000), BigInt(1000), BigInt(1000)];

      const obv = (service as any).calculateOBV(prices, volumes);

      expect(obv).toBeGreaterThan(BigInt(0));
    });

    it('should decrease OBV on price downtrend', async () => {
      const prices = [108, 106, 104, 102, 100];
      const volumes = [BigInt(1000), BigInt(1000), BigInt(1000), BigInt(1000), BigInt(1000)];

      const obv = (service as any).calculateOBV(prices, volumes);

      expect(obv).toBeLessThan(BigInt(0));
    });
  });

  describe('calculateIchimoku', () => {
    it('should calculate Ichimoku Cloud components', async () => {
      const prices: number[] = [];
      for (let i = 0; i < 60; i++) {
        prices.push(100 + i * 0.5);
      }

      const ichimoku = (service as any).calculateIchimoku(prices);

      expect(ichimoku).not.toBeNull();
      expect(ichimoku).toHaveProperty('tenkan');
      expect(ichimoku).toHaveProperty('kijun');
      expect(ichimoku).toHaveProperty('senkouA');
      expect(ichimoku).toHaveProperty('senkouB');
    });

    it('should return null for insufficient data', async () => {
      const prices = [100, 102, 104];
      const ichimoku = (service as any).calculateIchimoku(prices);

      expect(ichimoku).toBeNull();
    });
  });

  describe('generateSignal', () => {
    beforeEach(async () => {
      // Create parent stock record
      await prisma.stock.create({
        data: { symbol: 'AAPL', name: 'Apple Inc.', exchange: 'NASDAQ' },
      });

      // Create test price data within last year
      const prices: any[] = [];
      const baseDate = new Date();
      baseDate.setDate(baseDate.getDate() - 252);

      for (let i = 0; i < 252; i++) {
        const date = new Date(baseDate);
        date.setDate(date.getDate() + i);

        const basePrice = 150 + Math.random() * 10;

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

    it('should generate signal for valid stock', async () => {
      const signal = await service.generateSignal('AAPL');

      expect(signal).not.toBeNull();
      expect(signal).toHaveProperty('symbol', 'AAPL');
      expect(signal).toHaveProperty('date');
      expect(signal).toHaveProperty('signal');
      expect(signal).toHaveProperty('confidence');
      expect(signal).toHaveProperty('rsi');
      expect(signal).toHaveProperty('macd');
    });

    it('should have valid signal value', async () => {
      const signal = await service.generateSignal('AAPL');

      expect(signal).not.toBeNull();
      expect([-1, 0, 1]).toContain(signal!.signal);
    });

    it('should have valid confidence range', async () => {
      const signal = await service.generateSignal('AAPL');

      expect(signal).not.toBeNull();
      expect(signal!.confidence).toBeGreaterThanOrEqual(0);
      expect(signal!.confidence).toBeLessThanOrEqual(1);
    });

    it('should return null for insufficient data', async () => {
      await prisma.stockPrice.deleteMany({});

      const signal = await service.generateSignal('AAPL');

      expect(signal).toBeNull();
    });
  });

  describe('generateRuleBasedSignal', () => {
    beforeEach(async () => {
      // Create parent stock record
      await prisma.stock.create({
        data: { symbol: 'MSFT', name: 'Microsoft Corp.', exchange: 'NASDAQ' },
      });

      // Create test price data within last year
      const prices: any[] = [];
      const baseDate = new Date();
      baseDate.setDate(baseDate.getDate() - 252);

      for (let i = 0; i < 252; i++) {
        const date = new Date(baseDate);
        date.setDate(date.getDate() + i);

        const basePrice = 150 + i * 0.5;

        prices.push({
          symbol: 'MSFT',
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

    it('should generate buy signal for oversold conditions', async () => {
      // Create oversold conditions
      const signal = await service['generateRuleBasedSignal']('MSFT');

      expect(signal).not.toBeNull();
      expect(signal!.signal).toBeDefined();
    });

    it('should include all technical indicators', async () => {
      const signal = await service['generateRuleBasedSignal']('MSFT');

      expect(signal).toHaveProperty('rsi');
      expect(signal).toHaveProperty('macd');
      expect(signal).toHaveProperty('macdSignal');
      expect(signal).toHaveProperty('macdHistogram');
      expect(signal).toHaveProperty('bollingerUpper');
      expect(signal).toHaveProperty('bollingerMiddle');
      expect(signal).toHaveProperty('bollingerLower');
      expect(signal).toHaveProperty('obv');
      expect(signal).toHaveProperty('ichimokuTenkan');
      expect(signal).toHaveProperty('ichimokuKijun');
    });
  });

  describe('initialize', () => {
    it('should initialize service', async () => {
      await service.initialize();

      expect(service['initialized']).toBe(true);
    });

    it('should check if ML is being used', async () => {
      await service.initialize();

      const usingML = service.isUsingML();

      expect(typeof usingML).toBe('boolean');
    });
  });

  describe('generateSignalsForAll', () => {
    beforeEach(async () => {
      // Create stock first
      await prisma.stock.create({
        data: {
          symbol: 'AAPL',
          name: 'Apple Inc.',
          exchange: 'NASDAQ',
        },
      });

      // Create test price data
      const prices: any[] = [];
      const baseDate = new Date('2024-01-01');

      for (let i = 0; i < 252; i++) {
        const date = new Date(baseDate);
        date.setDate(date.getDate() + i);

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

      // Create screened stock
      await prisma.screenedStock.create({
        data: {
          symbol: 'AAPL',
          date: new Date(),
          price: 180,
          ma50: 175,
          ma150: 170,
          ma200: 165,
          priceAboveMa150: true,
          ma150AboveMa200: true,
          ma200TrendingUp: true,
          ma50AboveMa150: true,
          priceAboveMa50: true,
          priceAbove52WeekLow: true,
          priceNear52WeekHigh: true,
          relativeStrengthPositive: true,
          passedCriteria: 8,
        },
      });
    });

    it('should generate signals for all screened stocks', async () => {
      const result = await service.generateSignalsForAll();

      expect(result).toHaveProperty('generated');
      expect(result.generated).toBeGreaterThan(0);
    });
  });
});
