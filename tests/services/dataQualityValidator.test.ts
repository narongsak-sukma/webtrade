/**
 * Data Quality Validator Tests
 *
 * Tests for data quality validation service
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { dataQualityValidator } from '@/services/dataQualityValidator';
import { PriceData } from '@/types';

describe('DataQualityValidator', () => {
  describe('validatePriceData', () => {
    it('should validate correct price data', () => {
      const validData: PriceData = {
        symbol: 'AAPL',
        date: new Date('2024-01-01'),
        open: 150.0,
        high: 155.0,
        low: 149.0,
        close: 152.0,
        volume: 50000000,
        adjClose: 152.0,
      };

      const result = dataQualityValidator.validatePriceData(validData);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.summary.validRecords).toBe(1);
      expect(result.summary.invalidRecords).toBe(0);
    });

    it('should detect missing required fields', () => {
      const invalidData: PriceData = {
        symbol: 'AAPL',
        date: new Date('2024-01-01'),
        open: 150.0,
        high: 155.0,
        low: 149.0,
        close: 152.0,
        volume: 50000000,
        adjClose: 152.0,
      };

      // Test missing symbol
      const { symbol, ...dataWithoutSymbol } = invalidData;
      const result1 = dataQualityValidator.validatePriceData(dataWithoutSymbol);

      expect(result1.valid).toBe(false);
      expect(result1.errors.some(e => e.field === 'symbol')).toBe(true);

      // Test missing date
      const { date, ...dataWithoutDate } = invalidData;
      const result2 = dataQualityValidator.validatePriceData(dataWithoutDate);

      expect(result2.valid).toBe(false);
      expect(result2.errors.some(e => e.field === 'date')).toBe(true);
    });

    it('should detect negative prices', () => {
      const negativePriceData: PriceData = {
        symbol: 'AAPL',
        date: new Date('2024-01-01'),
        open: -150.0,
        high: 155.0,
        low: 149.0,
        close: 152.0,
        volume: 50000000,
        adjClose: 152.0,
      };

      const result = dataQualityValidator.validatePriceData(negativePriceData);

      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.field === 'open' && e.type === 'invalid_value')).toBe(true);
    });

    it('should detect price relationship errors', () => {
      // High < Low (invalid)
      const invalidRelationData: PriceData = {
        symbol: 'AAPL',
        date: new Date('2024-01-01'),
        open: 150.0,
        high: 149.0,
        low: 155.0,
        close: 152.0,
        volume: 50000000,
        adjClose: 152.0,
      };

      const result = dataQualityValidator.validatePriceData(invalidRelationData);

      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.field === 'high' || e.field === 'low')).toBe(true);
    });

    it('should detect price anomalies (>50% change)', () => {
      const anomalyData: PriceData = {
        symbol: 'AAPL',
        date: new Date('2024-01-01'),
        open: 100.0,
        high: 160.0,
        low: 100.0,
        close: 160.0,
        volume: 50000000,
        adjClose: 160.0,
      };

      const result = dataQualityValidator.validatePriceData(anomalyData);

      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.type === 'anomaly')).toBe(true);
    });

    it('should detect negative volume', () => {
      const negativeVolumeData: PriceData = {
        symbol: 'AAPL',
        date: new Date('2024-01-01'),
        open: 150.0,
        high: 155.0,
        low: 149.0,
        close: 152.0,
        volume: -1000,
        adjClose: 152.0,
      };

      const result = dataQualityValidator.validatePriceData(negativeVolumeData);

      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.field === 'volume')).toBe(true);
    });
  });

  describe('validateBatch', () => {
    it('should validate multiple records', () => {
      const batchData: PriceData[] = [
        {
          symbol: 'AAPL',
          date: new Date('2024-01-01'),
          open: 150.0,
          high: 155.0,
          low: 149.0,
          close: 152.0,
          volume: 50000000,
          adjClose: 152.0,
        },
        {
          symbol: 'MSFT',
          date: new Date('2024-01-01'),
          open: 300.0,
          high: 305.0,
          low: 299.0,
          close: 302.0,
          volume: 25000000,
          adjClose: 302.0,
        },
      ];

      const result = dataQualityValidator.validateBatch(batchData);

      expect(result.valid).toBe(true);
      expect(result.summary.totalRecords).toBe(2);
      expect(result.summary.validRecords).toBe(2);
      expect(result.summary.invalidRecords).toBe(0);
    });

    it('should handle mix of valid and invalid records', () => {
      const batchData: PriceData[] = [
        {
          symbol: 'AAPL',
          date: new Date('2024-01-01'),
          open: 150.0,
          high: 155.0,
          low: 149.0,
          close: 152.0,
          volume: 50000000,
          adjClose: 152.0,
        },
        {
          symbol: 'INVALID',
          date: new Date('2024-01-01'),
          open: -100.0, // Invalid: negative price
          high: 155.0,
          low: 149.0,
          close: 152.0,
          volume: 50000000,
          adjClose: 152.0,
        },
      ];

      const result = dataQualityValidator.validateBatch(batchData);

      expect(result.valid).toBe(false);
      expect(result.summary.totalRecords).toBe(2);
      expect(result.summary.validRecords).toBe(1);
      expect(result.summary.invalidRecords).toBe(1);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });
});
