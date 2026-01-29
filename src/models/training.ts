/**
 * Training Pipeline - Data preparation and model training orchestration
 *
 * This module handles fetching historical data, generating labels,
 * and preparing training datasets for the ML model.
 */

import { prisma } from '@/lib/prisma';
import { TrainingData, FeatureValues } from '@/types/agent-contracts';

export interface TrainingConfig {
  lookAheadDays: number; // Days to look ahead for label generation
  buyThreshold: number; // Minimum return for buy label (e.g., 0.05 = 5%)
  sellThreshold: number; // Maximum return for sell label (e.g., -0.03 = -3%)
  minDataPoints: number; // Minimum historical data required
  trainTestSplit: number; // Training data ratio (e.g., 0.8 = 80%)
}

export const DEFAULT_TRAINING_CONFIG: TrainingConfig = {
  lookAheadDays: 10, // Look ahead 10 trading days
  buyThreshold: 0.05, // 5% gain
  sellThreshold: -0.03, // 3% loss
  minDataPoints: 252, // ~1 year of trading days
  trainTestSplit: 0.8,
};

export class TrainingPipeline {
  /**
   * Fetch historical data and prepare training dataset
   */
  async prepareTrainingData(config: TrainingConfig = DEFAULT_TRAINING_CONFIG): Promise<{
    trainingData: TrainingData[];
    testData: TrainingData[];
    stats: DatasetStats;
  }> {
    console.log('[TrainingPipeline] Starting data preparation...');

    // Get stocks that have enough historical data
    const stocks = await this.getStocksWithSufficientData(config.minDataPoints);

    console.log(`[TrainingPipeline] Found ${stocks.length} stocks with sufficient data`);

    const allData: TrainingData[] = [];

    // Process each stock
    for (const symbol of stocks) {
      try {
        const stockData = await this.processStock(symbol, config);
        allData.push(...stockData);
      } catch (error) {
        console.error(`[TrainingPipeline] Error processing ${symbol}:`, error);
      }
    }

    console.log(`[TrainingPipeline] Generated ${allData.length} training samples`);

    // Shuffle and split data
    const shuffled = this.shuffleArray(allData);
    const splitIdx = Math.floor(shuffled.length * config.trainTestSplit);

    const trainingData = shuffled.slice(0, splitIdx);
    const testData = shuffled.slice(splitIdx);

    // Calculate statistics
    const stats = this.calculateStats(trainingData, testData);

    console.log('[TrainingPipeline] Data preparation complete:', stats);

    return { trainingData, testData, stats };
  }

  /**
   * Get stocks with sufficient historical data
   */
  private async getStocksWithSufficientData(minPoints: number): Promise<string[]> {
    const result = await prisma.$queryRaw<Array<{ symbol: string; count: bigint }>>`
      SELECT symbol, COUNT(*) as count
      FROM stock_prices
      GROUP BY symbol
      HAVING COUNT(*) >= ${minPoints}
      ORDER BY count DESC
    `;

    return result.map((r) => r.symbol);
  }

  /**
   * Process a single stock to generate training samples
   */
  private async processStock(symbol: string, config: TrainingConfig): Promise<TrainingData[]> {
    // Fetch historical price data
    const prices = await prisma.stockPrice.findMany({
      where: { symbol },
      orderBy: { date: 'asc' },
    });

    if (prices.length < config.minDataPoints) {
      return [];
    }

    const samples: TrainingData[] = [];

    // Generate samples using sliding window
    // Skip last lookAheadDays since we can't calculate future returns for them
    for (let i = 200; i < prices.length - config.lookAheadDays; i++) {
      const window = prices.slice(0, i + 1);
      const currentPrice = Number(prices[i].close);

      // Calculate features
      const features = await this.calculateFeatures(window);

      if (!features) {
        continue;
      }

      // Calculate future return
      const futurePrice = Number(prices[i + config.lookAheadDays].close);
      const futureReturn = (futurePrice - currentPrice) / currentPrice;

      // Generate label
      let target: number;
      if (futureReturn > config.buyThreshold) {
        target = 1; // buy
      } else if (futureReturn < config.sellThreshold) {
        target = -1; // sell
      } else {
        target = 0; // hold
      }

      samples.push({
        symbol,
        date: prices[i].date,
        features,
        target,
        futureReturn,
      });
    }

    return samples;
  }

  /**
   * Calculate technical features for a price window
   */
  private async calculateFeatures(prices: Array<{ close: any; volume: bigint }>): Promise<FeatureValues | null> {
    if (prices.length < 200) {
      return null;
    }

    const closes = prices.map((p) => Number(p.close));
    const volumes = prices.map((p) => BigInt(p.volume));

    // Calculate all features
    const ma20 = this.calculateSMA(closes, 20);
    const ma50 = this.calculateSMA(closes, 50);
    const rsi = this.calculateRSI(closes, 14);
    const macd = this.calculateMACD(closes);
    const bollinger = this.calculateBollingerBands(closes, 20, 2);
    const obv = this.calculateOBV(closes, volumes);
    const ichimoku = this.calculateIchimoku(closes);

    if (!ma20 || !ma50 || !rsi || !macd || !bollinger || !ichimoku) {
      return null;
    }

    return {
      ma20Ma50: ma20 / ma50,
      rsi,
      macd: macd.macd,
      macdSignal: macd.macdSignal,
      macdHistogram: macd.macdHistogram,
      bollingerUpper: bollinger.upper,
      bollingerMiddle: bollinger.middle,
      bollingerLower: bollinger.lower,
      obv: Number(obv),
      ichimokuTenkan: ichimoku.tenkan,
      ichimokuKijun: ichimoku.kijun,
      ichimokuSenkouA: ichimoku.senkouA,
      ichimokuSenkouB: ichimoku.senkouB,
    };
  }

  // ============================================================================
  // Technical Indicator Calculations
  // ============================================================================

  private calculateSMA(prices: number[], period: number): number | null {
    if (prices.length < period) return null;
    const slice = prices.slice(-period);
    return slice.reduce((a, b) => a + b, 0) / period;
  }

  private calculateEMA(prices: number[], period: number): number | null {
    if (prices.length < period) return null;

    const k = 2 / (period + 1);
    let ema = prices.slice(0, period).reduce((a, b) => a + b, 0) / period;

    for (let i = period; i < prices.length; i++) {
      ema = prices[i] * k + ema * (1 - k);
    }

    return ema;
  }

  private calculateRSI(prices: number[], period: number = 14): number | null {
    if (prices.length < period + 1) return null;

    let gains = 0;
    let losses = 0;

    for (let i = prices.length - period; i < prices.length; i++) {
      const change = prices[i] - prices[i - 1];
      if (change > 0) {
        gains += change;
      } else {
        losses -= change;
      }
    }

    const avgGain = gains / period;
    const avgLoss = losses / period;

    if (avgLoss === 0) return 100;

    const rs = avgGain / avgLoss;
    return 100 - 100 / (1 + rs);
  }

  private calculateMACD(prices: number[]): {
    macd: number;
    macdSignal: number;
    macdHistogram: number;
  } | null {
    const ema12 = this.calculateEMA(prices, 12);
    const ema26 = this.calculateEMA(prices, 26);

    if (!ema12 || !ema26) return null;

    const macd = ema12 - ema26;
    const macdSignal = macd * 0.9; // Simplified
    const macdHistogram = macd - macdSignal;

    return { macd, macdSignal, macdHistogram };
  }

  private calculateBollingerBands(prices: number[], period: number = 20, stdDev: number = 2): {
    upper: number;
    middle: number;
    lower: number;
  } | null {
    if (prices.length < period) return null;

    const slice = prices.slice(-period);
    const middle = slice.reduce((a, b) => a + b, 0) / period;

    const variance = slice.reduce((sum, price) => sum + Math.pow(price - middle, 2), 0) / period;
    const std = Math.sqrt(variance);

    return {
      upper: middle + stdDev * std,
      middle,
      lower: middle - stdDev * std,
    };
  }

  private calculateOBV(prices: number[], volumes: bigint[]): bigint {
    let obv = BigInt(0);

    for (let i = 1; i < prices.length; i++) {
      if (prices[i] > prices[i - 1]) {
        obv += volumes[i];
      } else if (prices[i] < prices[i - 1]) {
        obv -= volumes[i];
      }
    }

    return obv;
  }

  private calculateIchimoku(prices: number[]): {
    tenkan: number;
    kijun: number;
    senkouA: number;
    senkouB: number;
  } | null {
    if (prices.length < 52) return null;

    const slice9 = prices.slice(-9);
    const slice26 = prices.slice(-26);
    const slice52 = prices.slice(-52);

    const tenkan = (Math.max(...slice9) + Math.min(...slice9)) / 2;
    const kijun = (Math.max(...slice26) + Math.min(...slice26)) / 2;
    const senkouA = (tenkan + kijun) / 2;
    const senkouB = (Math.max(...slice52) + Math.min(...slice52)) / 2;

    return { tenkan, kijun, senkouA, senkouB };
  }

  // ============================================================================
  // Utility Methods
  // ============================================================================

  private shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  private calculateStats(trainingData: TrainingData[], testData: TrainingData[]): DatasetStats {
    const trainLabels = trainingData.map((d) => d.target);
    const testLabels = testData.map((d) => d.target);

    const countLabels = (labels: number[]) => ({
      buy: labels.filter((l) => l === 1).length,
      hold: labels.filter((l) => l === 0).length,
      sell: labels.filter((l) => l === -1).length,
    });

    return {
      totalSamples: trainingData.length + testData.length,
      trainingSamples: trainingData.length,
      testSamples: testData.length,
      trainingDistribution: countLabels(trainLabels),
      testDistribution: countLabels(testLabels),
      symbols: [...new Set(trainingData.map((d) => d.symbol))],
    };
  }
}

export interface DatasetStats {
  totalSamples: number;
  trainingSamples: number;
  testSamples: number;
  trainingDistribution: {
    buy: number;
    hold: number;
    sell: number;
  };
  testDistribution: {
    buy: number;
    hold: number;
    sell: number;
  };
  symbols: string[];
}

export const trainingPipeline = new TrainingPipeline();
