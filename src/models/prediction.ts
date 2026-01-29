/**
 * Prediction Interface - Generate ML predictions for stocks
 *
 * This module provides a high-level interface for generating predictions
 * using the trained ML model.
 */

import { stockClassifier } from './StockClassifier';
import { prisma } from '@/lib/prisma';
import { FeatureValues, ModelPrediction } from '@/types/agent-contracts';

export class PredictionService {
  private initialized = false;

  /**
   * Initialize the prediction service
   * Loads the trained model from disk
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    try {
      const path = await import('path');
      const modelPath = path.join(process.cwd(), 'public', 'models', 'stock-classifier.joblib');

      await stockClassifier.load(modelPath);
      this.initialized = true;
      console.log('[PredictionService] Initialized successfully');
    } catch (error) {
      console.error('[PredictionService] Initialization failed:', error);
      throw new Error('Failed to initialize prediction service. Model may not be trained yet.');
    }
  }

  /**
   * Generate prediction for a single stock
   */
  async predict(symbol: string): Promise<ModelPrediction | null> {
    if (!this.initialized) {
      await this.initialize();
    }

    try {
      // Fetch recent price data
      const prices = await prisma.stockPrice.findMany({
        where: { symbol },
        orderBy: { date: 'asc' },
        take: -300, // ~1.5 years
      });

      if (prices.length < 200) {
        console.log(`[PredictionService] Insufficient data for ${symbol}: ${prices.length} days`);
        return null;
      }

      // Calculate features
      const features = await this.calculateFeatures(prices);

      if (!features) {
        console.log(`[PredictionService] Cannot calculate features for ${symbol}`);
        return null;
      }

      // Generate prediction
      const prediction = await stockClassifier.predict(symbol, features);

      console.log(`[PredictionService] Generated prediction for ${symbol}:`, prediction.signal, prediction.confidence);

      return prediction;
    } catch (error) {
      console.error(`[PredictionService] Prediction failed for ${symbol}:`, error);
      return null;
    }
  }

  /**
   * Generate predictions for multiple stocks
   */
  async predictBatch(symbols: string[]): Promise<Map<string, ModelPrediction>> {
    const results = new Map<string, ModelPrediction>();

    for (const symbol of symbols) {
      try {
        const prediction = await this.predict(symbol);
        if (prediction) {
          results.set(symbol, prediction);
        }
      } catch (error) {
        console.error(`[PredictionService] Batch prediction failed for ${symbol}:`, error);
      }
    }

    return results;
  }

  /**
   * Generate predictions for ELITE stocks only (13+/14 filters)
   * This is the focused approach - only analyze the best setups
   */
  async predictEliteStocks(): Promise<{ generated: number; symbols: string[] }> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Get elite stocks (13+/14)
    const eliteStocks = await prisma.screenedStock.findMany({
      where: {
        date: { gte: today },
        passedCriteria: { gte: 13 },
      },
      select: { symbol: true },
      orderBy: { passedCriteria: 'desc' },
    });

    console.log(`[PredictionService] 🌟 Generating ML predictions for ${eliteStocks.length} ELITE stocks (13+/14)`);

    let generated = 0;
    const symbols: string[] = [];

    for (const stock of eliteStocks) {
      try {
        const prediction = await this.predict(stock.symbol);

        if (prediction) {
          // Save prediction to database
          await this.savePrediction(prediction);
          generated++;
          symbols.push(stock.symbol);
          console.log(`  [${generated}/${eliteStocks.length}] ${stock.symbol}: ${prediction.signal.toUpperCase()} (${(prediction.confidence * 100).toFixed(0)}% confidence)`);
        }
      } catch (error) {
        console.error(`[PredictionService] Failed to predict ${stock.symbol}:`, error);
      }
    }

    console.log(`[PredictionService] ✅ Generated ${generated} ML predictions for ELITE stocks`);

    return { generated, symbols };
  }

  /**
   * Generate predictions for all screened stocks
   */
  async predictScreenedStocks(): Promise<{ generated: number }> {
    // Get stocks that passed Minervini screening
    const screenedStocks = await prisma.screenedStock.findMany({
      where: {
        date: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
        },
        passedCriteria: { gte: 6 },
      },
      select: { symbol: true },
    });

    console.log(`[PredictionService] Generating predictions for ${screenedStocks.length} screened stocks`);

    let generated = 0;

    for (const stock of screenedStocks) {
      try {
        const prediction = await this.predict(stock.symbol);

        if (prediction) {
          // Save prediction to database
          await this.savePrediction(prediction);
          generated++;
        }
      } catch (error) {
        console.error(`[PredictionService] Failed to predict ${stock.symbol}:`, error);
      }
    }

    console.log(`[PredictionService] Generated ${generated} predictions`);

    return { generated };
  }

  /**
   * Save prediction to database
   */
  private async savePrediction(prediction: ModelPrediction): Promise<void> {
    const signalValue = prediction.signal === 'buy' ? 1 : prediction.signal === 'sell' ? -1 : 0;

    await prisma.signal.upsert({
      where: {
        symbol_date: {
          symbol: prediction.symbol,
          date: prediction.date,
        },
      },
      update: {
        signal: signalValue,
        confidence: prediction.confidence,
        ma20Ma50: prediction.features.ma20Ma50,
        rsi: prediction.features.rsi,
        macd: prediction.features.macd,
        macdSignal: prediction.features.macdSignal,
        macdHistogram: prediction.features.macdHistogram,
        bollingerUpper: prediction.features.bollingerUpper,
        bollingerMiddle: prediction.features.bollingerMiddle,
        bollingerLower: prediction.features.bollingerLower,
        obv: BigInt(prediction.features.obv),
        ichimokuTenkan: prediction.features.ichimokuTenkan,
        ichimokuKijun: prediction.features.ichimokuKijun,
        ichimokuSenkouA: prediction.features.ichimokuSenkouA,
        ichimokuSenkouB: prediction.features.ichimokuSenkouB,
      },
      create: {
        symbol: prediction.symbol,
        date: prediction.date,
        signal: signalValue,
        confidence: prediction.confidence,
        ma20Ma50: prediction.features.ma20Ma50,
        rsi: prediction.features.rsi,
        macd: prediction.features.macd,
        macdSignal: prediction.features.macdSignal,
        macdHistogram: prediction.features.macdHistogram,
        bollingerUpper: prediction.features.bollingerUpper,
        bollingerMiddle: prediction.features.bollingerMiddle,
        bollingerLower: prediction.features.bollingerLower,
        obv: BigInt(prediction.features.obv),
        ichimokuTenkan: prediction.features.ichimokuTenkan,
        ichimokuKijun: prediction.features.ichimokuKijun,
        ichimokuSenkouA: prediction.features.ichimokuSenkouA,
        ichimokuSenkouB: prediction.features.ichimokuSenkouB,
      },
    });
  }

  // ============================================================================
  // Feature Calculation
  // ============================================================================

  /**
   * Calculate technical features from price data
   */
  private async calculateFeatures(prices: Array<{ close: bigint; volume: bigint }>): Promise<FeatureValues | null> {
    if (prices.length < 200) {
      return null;
    }

    const closes = prices.map((p) => Number(p.close));
    const volumes = prices.map((p) => BigInt(p.volume));

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
      obv,
      ichimokuTenkan: ichimoku.tenkan,
      ichimokuKijun: ichimoku.kijun,
      ichimokuSenkouA: ichimoku.senkouA,
      ichimokuSenkouB: ichimoku.senkouB,
    };
  }

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
    const macdSignal = macd * 0.9;
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

  /**
   * Check if service is initialized
   */
  isReady(): boolean {
    return this.initialized;
  }
}

export const predictionService = new PredictionService();
