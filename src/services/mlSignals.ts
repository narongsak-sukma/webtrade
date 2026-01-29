/**
 * ML Signals Service - Generate Trading Signals using ML Model
 *
 * This service has been upgraded from rule-based signals to ML-based predictions.
 * It uses the trained RandomForest classifier for intelligent buy/hold/sell signals.
 *
 * @version 2.0.0 - ML-Powered
 */

import { prisma } from '@/lib/prisma';
import { SignalData } from '@/types';
import { predictionService } from '@/models/prediction';

export class MLSignalService {
  private useML = true;
  private initialized = false;

  /**
   * Initialize the ML signal service
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    try {
      await predictionService.initialize();
      this.useML = true;
      this.initialized = true;
      console.log('[MLSignalService] Initialized with ML model');
    } catch (error) {
      console.warn('[MLSignalService] ML model not available, using rule-based fallback');
      this.useML = false;
      this.initialized = true;
    }
  }

  /**
   * Calculate RSI (Relative Strength Index)
   * Used for rule-based fallback
   */
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
    return 100 - (100 / (1 + rs));
  }

  /**
   * Calculate MACD (Moving Average Convergence Divergence)
   */
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

  /**
   * Calculate EMA (Exponential Moving Average)
   */
  private calculateEMA(prices: number[], period: number): number | null {
    if (prices.length < period) return null;

    const k = 2 / (period + 1);
    let ema = prices.slice(0, period).reduce((a, b) => a + b, 0) / period;

    for (let i = period; i < prices.length; i++) {
      ema = prices[i] * k + ema * (1 - k);
    }

    return ema;
  }

  /**
   * Calculate Bollinger Bands
   */
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
      upper: middle + (stdDev * std),
      middle,
      lower: middle - (stdDev * std),
    };
  }

  /**
   * Calculate OBV (On-Balance Volume)
   */
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

  /**
   * Calculate Ichimoku Cloud components (simplified)
   */
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
   * Generate signal for a single stock using ML model
   */
  async generateSignal(symbol: string): Promise<SignalData | null> {
    // Ensure service is initialized
    if (!this.initialized) {
      await this.initialize();
    }

    // Try ML model first
    if (this.useML) {
      try {
        const prediction = await predictionService.predict(symbol);

        if (prediction) {
          // Convert ModelPrediction to SignalData
          const signalValue = prediction.signal === 'buy' ? 1 : prediction.signal === 'sell' ? -1 : 0;

          const result: SignalData = {
            symbol,
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
            obv: prediction.features.obv,
            ichimokuTenkan: prediction.features.ichimokuTenkan,
            ichimokuKijun: prediction.features.ichimokuKijun,
            ichimokuSenkouA: prediction.features.ichimokuSenkouA,
            ichimokuSenkouB: prediction.features.ichimokuSenkouB,
          };

          console.log(`[MLSignalService] Generated ML signal for ${symbol}: ${prediction.signal} (${(prediction.confidence * 100).toFixed(0)}%)`);

          return result;
        }
      } catch (error) {
        console.error(`[MLSignalService] ML prediction failed for ${symbol}, falling back to rules:`, error);
      }
    }

    // Fallback to rule-based signals
    return this.generateRuleBasedSignal(symbol);
  }

  /**
   * Generate rule-based signal (fallback)
   */
  private async generateRuleBasedSignal(symbol: string): Promise<SignalData | null> {
    const data = await prisma.stockPrice.findMany({
      where: { symbol },
      orderBy: { date: 'asc' },
      take: -300,
    });

    if (data.length < 200) {
      console.log(`[MLSignalService] Insufficient data for ${symbol}: ${data.length} days`);
      return null;
    }

    const prices = data.map(d => Number(d.close));
    const volumes = data.map(d => BigInt(d.volume));

    // Calculate features
    const ma20 = this.calculateSMA(prices, 20);
    const ma50 = this.calculateSMA(prices, 50);
    const rsi = this.calculateRSI(prices, 14);
    const macd = this.calculateMACD(prices);
    const bollinger = this.calculateBollingerBands(prices, 20, 2);
    const obv = this.calculateOBV(prices, volumes);
    const ichimoku = this.calculateIchimoku(prices);

    if (!ma20 || !ma50 || !rsi || !macd || !bollinger || !ichimoku) {
      console.log(`[MLSignalService] Cannot calculate all features for ${symbol}`);
      return null;
    }

    const ma20Ma50 = ma20 / ma50;

    // Rule-based signal generation
    let signal = 0;
    let confidence = 0.5;

    const currentPrice = prices[prices.length - 1];

    // Buy signals
    let buyScore = 0;
    if (rsi < 30) buyScore++;
    if (macd.macdHistogram > 0) buyScore++;
    if (currentPrice < bollinger.lower) buyScore++;
    if (ma20 > ma50) buyScore++;

    // Sell signals
    let sellScore = 0;
    if (rsi > 70) sellScore++;
    if (macd.macdHistogram < 0) sellScore++;
    if (currentPrice > bollinger.upper) sellScore++;
    if (ma20 < ma50) sellScore++;

    if (buyScore >= 3) {
      signal = 1;
      confidence = 0.6 + (buyScore - 3) * 0.1;
    } else if (sellScore >= 3) {
      signal = -1;
      confidence = 0.6 + (sellScore - 3) * 0.1;
    }

    confidence = Math.min(confidence, 0.9);

    const result: SignalData = {
      symbol,
      date: new Date(),
      signal,
      confidence,
      ma20Ma50,
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

    console.log(`[MLSignalService] Generated rule-based signal for ${symbol}: ${signal === 1 ? 'buy' : signal === -1 ? 'sell' : 'hold'} (${(confidence * 100).toFixed(0)}%)`);

    return result;
  }

  private calculateSMA(prices: number[], period: number): number | null {
    if (prices.length < period) return null;
    const slice = prices.slice(-period);
    return slice.reduce((a, b) => a + b, 0) / period;
  }

  /**
   * Generate signals for ELITE stocks only (13+/14 criteria)
   * This is the focused approach - only analyze the best setups
   */
  async generateSignalsForElite(): Promise<{ generated: number; symbols: string[] }> {
    // Initialize if needed
    if (!this.initialized) {
      await this.initialize();
    }

    console.log('[MLSignalService] 🌟 Generating ML signals for ELITE stocks (13+/14) only...');

    // Use ML-based prediction for elite stocks
    if (this.useML) {
      console.log('[MLSignalService] Using ML model for ELITE stock predictions');
      const result = await predictionService.predictEliteStocks();
      return result;
    }

    // Fall back to rule-based (shouldn't happen normally)
    console.log('[MLSignalService] ML model not available, no signals generated');
    return { generated: 0, symbols: [] };
  }

  /**
   * Generate signals for all screened stocks
   */
  async generateSignalsForAll(): Promise<{ generated: number }> {
    // Initialize if needed
    if (!this.initialized) {
      await this.initialize();
    }

    // Use ML-based prediction if available
    if (this.useML) {
      console.log('[MLSignalService] Using ML model for batch prediction');
      return await predictionService.predictScreenedStocks();
    }

    // Fall back to rule-based for all stocks
    console.log('[MLSignalService] Using rule-based signals for batch prediction');

    const screenedStocks = await prisma.screenedStock.findMany({
      where: {
        date: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
        },
        passedCriteria: { gte: 6 },
      },
      select: { symbol: true },
    });

    let generated = 0;

    for (const stock of screenedStocks) {
      try {
        const signal = await this.generateRuleBasedSignal(stock.symbol);
        if (signal) {
          // Save to database
          await prisma.signal.upsert({
            where: {
              symbol_date: {
                symbol: signal.symbol,
                date: signal.date,
              },
            },
            update: { ...signal },
            create: { ...signal },
          });
          generated++;
        }
      } catch (error) {
        console.error(`[MLSignalService] Failed to generate signal for ${stock.symbol}:`, error);
      }
    }

    return { generated };
  }

  /**
   * Check if ML model is being used
   */
  isUsingML(): boolean {
    return this.useML;
  }
}

export const mlSignalService = new MLSignalService();
