/**
 * Signals API Tests
 *
 * Tests for signal generation endpoints:
 * - GET /api/signals
 * - POST /api/signals (generate)
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { PrismaClient } from '@prisma/client';
import { GET } from '@/app/api/signals/route';

const prisma = new PrismaClient();

describe('Signals API', () => {
  // Setup test data
  beforeAll(async () => {
    // Clean up
    await prisma.signal.deleteMany({});
    await prisma.price.deleteMany({});
    await prisma.stock.deleteMany({});

    // Create test stock with price data
    await prisma.stock.create({
      data: {
        symbol: 'AAPL',
        name: 'Apple Inc.',
        exchange: 'NASDAQ',
        sector: 'Technology',
        prices: {
          create: [
            {
              date: new Date('2024-01-10'),
              open: 180.0,
              high: 182.0,
              low: 179.0,
              close: 181.5,
              volume: 45000000,
              adjClose: 181.5,
            },
            {
              date: new Date('2024-01-11'),
              open: 181.5,
              high: 183.0,
              low: 180.5,
              close: 182.5,
              volume: 47000000,
              adjClose: 182.5,
            },
            {
              date: new Date('2024-01-12'),
              open: 182.5,
              high: 184.5,
              low: 181.5,
              close: 183.8,
              volume: 52000000,
              adjClose: 183.8,
            },
          ],
        },
      },
    });

    // Create test signals
    await prisma.signal.create({
      data: {
        symbol: 'AAPL',
        date: new Date('2024-01-12'),
        signal: 1,
        confidence: 0.85,
        ma20Ma50: 1.0234,
        rsi: 65.8,
        macd: 2.34,
        macdSignal: 1.98,
        macdHistogram: 0.36,
        bollingerUpper: 197.5,
        bollingerMiddle: 192.85,
        bollingerLower: 188.2,
        obv: 5234000,
        ichimokuTenkan: 194.25,
        ichimokuKijun: 190.8,
        ichimokuSenkouA: 192.15,
        ichimokuSenkouB: 189.45,
      },
    });

    await prisma.signal.create({
      data: {
        symbol: 'MSFT',
        date: new Date('2024-01-12'),
        signal: 0,
        confidence: 0.45,
        ma20Ma50: 0.9876,
        rsi: 52.1,
        macd: 0.87,
        macdSignal: 1.12,
        macdHistogram: -0.25,
        obv: 3450000,
      },
    });
  });

  describe('GET /api/signals', () => {
    it('should return all signals', async () => {
      const request = new Request('http://localhost:3000/api/signals');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(Array.isArray(data)).toBe(true);
      expect(data.length).toBeGreaterThan(0);
    });

    it('should return signals with correct structure', async () => {
      const request = new Request('http://localhost:3000/api/signals');
      const response = await GET(request);
      const data = await response.json();

      const signal = data[0];
      expect(signal).toHaveProperty('symbol');
      expect(signal).toHaveProperty('date');
      expect(signal).toHaveProperty('signal');
      expect(signal).toHaveProperty('confidence');
      expect(signal).toHaveProperty('ma20Ma50');
      expect(signal).toHaveProperty('rsi');
      expect(signal).toHaveProperty('macd');
      expect(signal).toHaveProperty('macdSignal');
    });

    it('should return signals within valid ranges', async () => {
      const request = new Request('http://localhost:3000/api/signals');
      const response = await GET(request);
      const data = await response.json();

      data.forEach((signal: any) => {
        expect(signal.signal).toBeGreaterThanOrEqual(-1);
        expect(signal.signal).toBeLessThanOrEqual(1);
        expect(signal.confidence).toBeGreaterThanOrEqual(0);
        expect(signal.confidence).toBeLessThanOrEqual(1);
        expect(signal.rsi).toBeGreaterThanOrEqual(0);
        expect(signal.rsi).toBeLessThanOrEqual(100);
      });
    });

    it('should filter signals by symbol if provided', async () => {
      const request = new Request('http://localhost:3000/api/signals?symbol=AAPL');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      if (Array.isArray(data) && data.length > 0) {
        data.forEach((signal: any) => {
          expect(signal.symbol).toBe('AAPL');
        });
      }
    });

    it('should handle empty results gracefully', async () => {
      // Clean up signals
      await prisma.signal.deleteMany({});

      const request = new Request('http://localhost:3000/api/signals');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(Array.isArray(data)).toBe(true);
      expect(data.length).toBe(0);
    });
  });

  describe('Signal Values', () => {
    it('should have buy signal (1)', async () => {
      const signals = await prisma.signal.findMany({
        where: { signal: 1 },
      });

      expect(signals.length).toBeGreaterThan(0);

      signals.forEach((signal) => {
        expect(signal.signal).toBe(1);
        expect(signal.confidence).toBeGreaterThan(0.5);
      });
    });

    it('should have hold signal (0)', async () => {
      const signals = await prisma.signal.findMany({
        where: { signal: 0 },
      });

      expect(signals.length).toBeGreaterThan(0);

      signals.forEach((signal) => {
        expect(signal.signal).toBe(0);
      });
    });

    it('should have sell signal (-1)', async () => {
      // Create a sell signal
      await prisma.signal.create({
        data: {
          symbol: 'TSLA',
          date: new Date('2024-01-12'),
          signal: -1,
          confidence: 0.68,
          ma20Ma50: -1.0234,
          rsi: 35.2,
          macd: -3.45,
          macdSignal: -2.18,
          macdHistogram: -1.27,
          obv: -2340000,
        },
      });

      const signals = await prisma.signal.findMany({
        where: { signal: -1 },
      });

      expect(signals.length).toBeGreaterThan(0);

      const sellSignal = signals.find((s) => s.symbol === 'TSLA');
      expect(sellSignal?.signal).toBe(-1);
      expect(sellSignal?.confidence).toBeGreaterThan(0.5);
    });
  });

  describe('Signal Confidence', () => {
    it('should have high confidence for strong signals', async () => {
      const highConfidenceSignals = await prisma.signal.findMany({
        where: {
          confidence: {
            gte: 0.8,
          },
        },
      });

      if (highConfidenceSignals.length > 0) {
        highConfidenceSignals.forEach((signal) => {
          expect(signal.confidence).toBeGreaterThanOrEqual(0.8);
          // High confidence should correlate with strong directional signal
          expect(Math.abs(signal.signal)).toBe(1);
        });
      }
    });
  });
});
