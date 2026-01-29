/**
 * Technical Indicators Service
 * Calculates all technical analysis indicators for explainable filtering
 */

import { prisma } from '@/lib/prisma';

interface PriceData {
  close: number;
  high?: number;
  low?: number;
  volume?: number;
}

export class TechnicalIndicators {
  /**
   * Calculate RSI (Relative Strength Index)
   * Formula: 100 - (100 / (1 + RS))
   * where RS = Average Gain / Average Loss over 14 periods
   */
  static calculateRSI(prices: number[], period: number = 14): number | null {
    if (prices.length < period + 1) return null;

    const gains: number[] = [];
    const losses: number[] = [];

    for (let i = 1; i < prices.length; i++) {
      const change = prices[i] - prices[i - 1];
      gains.push(change > 0 ? change : 0);
      losses.push(change < 0 ? Math.abs(change) : 0);
    }

    const avgGain = gains.slice(-period).reduce((a, b) => a + b, 0) / period;
    const avgLoss = losses.slice(-period).reduce((a, b) => a + b, 0) / period;

    if (avgLoss === 0) return 100;

    const rs = avgGain / avgLoss;
    const rsi = 100 - (100 / (1 + rs));

    return rsi;
  }

  /**
   * Check if RSI is in sweet spot (30-70)
   * Below 30 = oversold (good for buying)
   * Above 70 = overbought (avoid)
   */
  static isRSIInRange(rsi: number, min: number = 30, max: number = 70): boolean {
    return rsi >= min && rsi <= max;
  }

  /**
   * Calculate Average Volume over N periods
   */
  static calculateAverageVolume(volumes: bigint[], period: number = 50): number | null {
    if (volumes.length < period) return null;

    const sum = volumes.slice(-period).reduce((a, b) => a + b, 0n);
    return Number(sum / BigInt(period));
  }

  /**
   * Check if volume is above average (bullish confirmation)
   */
  static isVolumeAboveAvg(currentVolume: bigint, avgVolume: number): boolean {
    return Number(currentVolume) > avgVolume;
  }

  /**
   * Calculate EMA (Exponential Moving Average)
   * Used for MACD calculation
   */
  static calculateEMA(prices: number[], period: number): number | null {
    if (prices.length < period) return null;

    const multiplier = 2 / (period + 1);
    let ema = prices.slice(0, period).reduce((a, b) => a + b, 0) / period; // Start with SMA

    for (let i = period; i < prices.length; i++) {
      ema = (prices[i] - ema) * multiplier + ema;
    }

    return ema;
  }

  /**
   * Calculate MACD (Moving Average Convergence Divergence)
   * MACD Line = 12-day EMA - 26-day EMA
   * Signal Line = 9-day EMA of MACD
   */
  static calculateMACD(prices: number[]): {
    macd: number | null;
    macdSignal: number | null;
    macdBullish: boolean;
  } {
    const ema12 = this.calculateEMA(prices, 12);
    const ema26 = this.calculateEMA(prices, 26);

    if (!ema12 || !ema26) {
      return { macd: null, macdSignal: null, macdBullish: false };
    }

    const macd = ema12 - ema26;

    // For signal line, we'd need historical MACD values
    // Simplified: use current MACD as signal
    const macdSignal = macd;

    // MACD bullish when MACD line > signal line
    const macdBullish = macd > 0;

    return { macd, macdSignal, macdBullish };
  }

  /**
   * Calculate ADX (Average Directional Index)
   * Measures trend strength regardless of direction
   * ADX > 25 = strong trend
   * ADX < 20 = weak trend (avoid)
   */
  static calculateADX(
    highs: number[],
    lows: number[],
    closes: number[],
    period: number = 14
  ): number | null {
    if (highs.length < period + 1 || lows.length < period + 1 || closes.length < period + 1) {
      return null;
    }

    const tr: number[] = [];
    const plusDM: number[] = [];
    const minusDM: number[] = [];

    for (let i = 1; i < closes.length; i++) {
      const high = highs[i];
      const low = lows[i];
      const prevClose = closes[i - 1];
      const prevHigh = highs[i - 1];
      const prevLow = lows[i - 1];

      // True Range
      const trValue = Math.max(
        high - low,
        Math.abs(high - prevClose),
        Math.abs(low - prevClose)
      );
      tr.push(trValue);

      // Directional Movement
      const upMove = high - prevHigh;
      const downMove = prevLow - low;

      if (upMove > downMove && upMove > 0) {
        plusDM.push(upMove);
      } else {
        plusDM.push(0);
      }

      if (downMove > upMove && downMove > 0) {
        minusDM.push(downMove);
      } else {
        minusDM.push(0);
      }
    }

    // Calculate smoothed averages
    const atr = this.calculateEMA(tr, period);
    const plusDI = this.calculateEMA(plusDM, period);
    const minusDI = this.calculateEMA(minusDM, period);

    if (!atr || atr === 0 || plusDI === null || minusDI === null) return null;

    const dx = (Math.abs(plusDI - minusDI) / (plusDI + minusDI)) * 100;
    const adx = dx; // Simplified ADX

    return adx;
  }

  /**
   * Check if ADX indicates strong trend
   */
  static isADXStrong(adx: number, threshold: number = 25): boolean {
    return adx >= threshold;
  }

  /**
   * Calculate Bollinger Bands
   * Middle Band = 20-day SMA
   * Upper Band = Middle Band + (2 * 20-day standard deviation)
   * Lower Band = Middle Band - (2 * 20-day standard deviation)
   */
  static calculateBollingerBands(
    prices: number[],
    period: number = 20,
    stdDevMultiplier: number = 2
  ): {
    upper: number | null;
    middle: number | null;
    lower: number | null;
  } {
    if (prices.length < period) {
      return { upper: null, middle: null, lower: null };
    }

    const slice = prices.slice(-period);
    const middle = slice.reduce((a, b) => a + b, 0) / period;

    const variance = slice.reduce((sum, price) => sum + Math.pow(price - middle, 2), 0) / period;
    const stdDev = Math.sqrt(variance);

    const upper = middle + (stdDevMultiplier * stdDev);
    const lower = middle - (stdDevMultiplier * stdDev);

    return { upper, middle, lower };
  }

  /**
   * Check if price is in middle 50% of Bollinger Bands
   * Avoid stocks at extreme upper (overbought) or lower (oversold) bands
   */
  static isPriceInBBRange(price: number, upper: number, lower: number): boolean {
    const range = upper - lower;
    const middle50Start = lower + (range * 0.25);
    const middle50End = upper - (range * 0.25);

    return price >= middle50Start && price <= middle50End;
  }

  /**
   * Get all technical data for a symbol
   */
  static async getTechnicalData(symbol: string, days: number = 252): Promise<{
    prices: number[];
    highs: number[];
    lows: number[];
    volumes: bigint[];
  }> {
    const data = await prisma.stockPrice.findMany({
      where: { symbol },
      orderBy: { date: 'asc' },
      take: -days,
      select: {
        close: true,
        high: true,
        low: true,
        volume: true,
      },
    });

    return {
      prices: data.map(d => Number(d.close)),
      highs: data.map(d => Number(d.high)),
      lows: data.map(d => Number(d.low)),
      volumes: data.map(d => d.volume),
    };
  }
}
