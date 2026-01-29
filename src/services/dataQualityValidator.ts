/**
 * Data Quality Validator Service
 *
 * Validates stock price data integrity and quality
 */

import { prisma } from '@/lib/prisma';
import { PriceData } from '@/types';

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  summary: ValidationSummary;
}

export interface ValidationError {
  type: 'missing_field' | 'invalid_value' | 'anomaly' | 'duplicate';
  field: string;
  symbol?: string;
  date?: Date;
  message: string;
  severity: 'critical' | 'error';
}

export interface ValidationWarning {
  type: 'stale_data' | 'missing_recent' | 'unusual_volume' | 'gap';
  field: string;
  symbol?: string;
  message: string;
}

export interface ValidationSummary {
  totalRecords: number;
  validRecords: number;
  invalidRecords: number;
  criticalErrors: number;
  warnings: number;
}

class DataQualityValidator {
  /**
   * Validate a single price data record
   */
  validatePriceData(data: PriceData): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    // Check required fields
    if (!data.symbol) {
      errors.push({
        type: 'missing_field',
        field: 'symbol',
        message: 'Symbol is required',
        severity: 'critical',
      });
    }

    if (!data.date) {
      errors.push({
        type: 'missing_field',
        field: 'date',
        symbol: data.symbol,
        message: 'Date is required',
        severity: 'critical',
      });
    }

    // Check price values
    if (data.open === undefined || data.open === null) {
      errors.push({
        type: 'missing_field',
        field: 'open',
        symbol: data.symbol,
        date: data.date,
        message: 'Open price is missing',
        severity: 'critical',
      });
    } else if (data.open <= 0) {
      errors.push({
        type: 'invalid_value',
        field: 'open',
        symbol: data.symbol,
        date: data.date,
        message: `Open price must be positive, got ${data.open}`,
        severity: 'error',
      });
    }

    if (data.high === undefined || data.high === null) {
      errors.push({
        type: 'missing_field',
        field: 'high',
        symbol: data.symbol,
        date: data.date,
        message: 'High price is missing',
        severity: 'critical',
      });
    } else if (data.high <= 0) {
      errors.push({
        type: 'invalid_value',
        field: 'high',
        symbol: data.symbol,
        date: data.date,
        message: `High price must be positive, got ${data.high}`,
        severity: 'error',
      });
    }

    if (data.low === undefined || data.low === null) {
      errors.push({
        type: 'missing_field',
        field: 'low',
        symbol: data.symbol,
        date: data.date,
        message: 'Low price is missing',
        severity: 'critical',
      });
    } else if (data.low <= 0) {
      errors.push({
        type: 'invalid_value',
        field: 'low',
        symbol: data.symbol,
        date: data.date,
        message: `Low price must be positive, got ${data.low}`,
        severity: 'error',
      });
    }

    if (data.close === undefined || data.close === null) {
      errors.push({
        type: 'missing_field',
        field: 'close',
        symbol: data.symbol,
        date: data.date,
        message: 'Close price is missing',
        severity: 'critical',
      });
    } else if (data.close <= 0) {
      errors.push({
        type: 'invalid_value',
        field: 'close',
        symbol: data.symbol,
        date: data.date,
        message: `Close price must be positive, got ${data.close}`,
        severity: 'error',
      });
    }

    if (data.volume === undefined || data.volume === null) {
      errors.push({
        type: 'missing_field',
        field: 'volume',
        symbol: data.symbol,
        date: data.date,
        message: 'Volume is missing',
        severity: 'error',
      });
    } else if (data.volume < 0) {
      errors.push({
        type: 'invalid_value',
        field: 'volume',
        symbol: data.symbol,
        date: data.date,
        message: `Volume cannot be negative, got ${data.volume}`,
        severity: 'error',
      });
    }

    // Check price relationships (if all prices are present)
    if (data.open && data.high && data.low && data.close) {
      // High should be >= all other prices
      if (data.high < data.open || data.high < data.close || data.high < data.low) {
        errors.push({
          type: 'invalid_value',
          field: 'high',
          symbol: data.symbol,
          date: data.date,
          message: `High (${data.high}) should be >= open (${data.open}), close (${data.close}), and low (${data.low})`,
          severity: 'error',
        });
      }

      // Low should be <= all other prices
      if (data.low > data.open || data.low > data.close || data.low > data.high) {
        errors.push({
          type: 'invalid_value',
          field: 'low',
          symbol: data.symbol,
          date: data.date,
          message: `Low (${data.low}) should be <= open (${data.open}), close (${data.close}), and high (${data.high})`,
          severity: 'error',
        });
      }

      // Check for anomalies (>50% daily change)
      const percentChange = ((data.close - data.open) / data.open) * 100;
      if (Math.abs(percentChange) > 50) {
        errors.push({
          type: 'anomaly',
          field: 'close',
          symbol: data.symbol,
          date: data.date,
          message: `Unusual price movement: ${percentChange.toFixed(2)}% change from open to close`,
          severity: 'error',
        });
      }
    }

    const criticalErrors = errors.filter(e => e.severity === 'critical').length;

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      summary: {
        totalRecords: 1,
        validRecords: errors.length === 0 ? 1 : 0,
        invalidRecords: errors.length > 0 ? 1 : 0,
        criticalErrors,
        warnings: warnings.length,
      },
    };
  }

  /**
   * Validate batch of price data records
   */
  validateBatch(data: PriceData[]): ValidationResult {
    const allErrors: ValidationError[] = [];
    const allWarnings: ValidationWarning[] = [];
    let validCount = 0;

    for (const record of data) {
      const result = this.validatePriceData(record);
      allErrors.push(...result.errors);
      allWarnings.push(...result.warnings);
      if (result.valid) validCount++;
    }

    const criticalErrors = allErrors.filter(e => e.severity === 'critical').length;

    return {
      valid: allErrors.length === 0,
      errors: allErrors,
      warnings: allWarnings,
      summary: {
        totalRecords: data.length,
        validRecords: validCount,
        invalidRecords: data.length - validCount,
        criticalErrors,
        warnings: allWarnings.length,
      },
    };
  }

  /**
   * Validate data for a specific symbol in the database
   */
  async validateSymbolData(symbol: string, days: number = 30): Promise<ValidationResult> {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const prices = await prisma.stockPrice.findMany({
      where: {
        symbol,
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: { date: 'asc' },
    });

    if (prices.length === 0) {
      return {
        valid: false,
        errors: [{
          type: 'missing_field',
          field: 'data',
          symbol,
          message: `No price data found for ${symbol} in the last ${days} days`,
          severity: 'critical',
        }],
        warnings: [],
        summary: {
          totalRecords: 0,
          validRecords: 0,
          invalidRecords: 0,
          criticalErrors: 1,
          warnings: 0,
        },
      };
    }

    // Check for data gaps
    const warnings: ValidationWarning[] = [];
    for (let i = 1; i < prices.length; i++) {
      const prevDate = prices[i - 1].date;
      const currDate = prices[i].date;
      const diffDays = Math.floor((currDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24));

      if (diffDays > 7) {
        warnings.push({
          type: 'gap',
          field: 'date',
          symbol,
          message: `Data gap: ${diffDays} days between ${prevDate.toISOString().split('T')[0]} and ${currDate.toISOString().split('T')[0]}`,
        });
      }
    }

    // Check for stale data
    const latestDate = prices[prices.length - 1].date;
    const daysSinceLatest = Math.floor((new Date().getTime() - latestDate.getTime()) / (1000 * 60 * 60 * 24));

    if (daysSinceLatest > 7) {
      warnings.push({
        type: 'stale_data',
        field: 'date',
        symbol,
        message: `Data is stale: Latest data is ${daysSinceLatest} days old`,
      });
    }

    return {
      valid: warnings.length === 0,
      errors: [],
      warnings,
      summary: {
        totalRecords: prices.length,
        validRecords: prices.length,
        invalidRecords: 0,
        criticalErrors: 0,
        warnings: warnings.length,
      },
    };
  }

  /**
   * Check for duplicate records
   */
  async checkDuplicates(symbol: string, startDate: Date, endDate: Date): Promise<ValidationError[]> {
    const duplicates: ValidationError[] = [];

    const prices = await prisma.stockPrice.findMany({
      where: {
        symbol,
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: { date: 'asc' },
    });

    // Group by date and check for duplicates
    const dateMap = new Map<string, number>();

    for (const price of prices) {
      const dateStr = price.date.toISOString().split('T')[0];
      const count = dateMap.get(dateStr) || 0;
      dateMap.set(dateStr, count + 1);

      if (count === 1) {
        // Found second record for this date
        duplicates.push({
          type: 'duplicate',
          field: 'date',
          symbol,
          date: price.date,
          message: `Duplicate record found for ${symbol} on ${dateStr}`,
          severity: 'error',
        });
      }
    }

    return duplicates;
  }
}

export const dataQualityValidator = new DataQualityValidator();
