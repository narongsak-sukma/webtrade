/**
 * Market Regime Detection Service
 *
 * Detects market conditions (bull/bear/volatile) and adjusts trading signals
 * Uses multiple indicators to determine market state
 *
 * @version 1.0.0
 */

import { prisma } from '@/lib/prisma';

export type MarketState = 'BULL' | 'BEAR' | 'SIDEWAYS' | 'VOLATILE';
export type VolatilityRegime = 'LOW' | 'MEDIUM' | 'HIGH';

export interface MarketRegime {
  state: MarketState;
  volatility: VolatilityRegime;
  trendStrength: number; // 0-100
  confidence: number; // 0-1
  indicators: {
    sp500Trend: number; // % change over 200 days
    vixLevel: number; // VIX index value
    advDeclRatio: number; // Advance/Decline ratio
    newHighsLows: number; // New highs - new lows
    marketBreadth: number; // % stocks above MA200
  };
  lastUpdated: Date;
  recommendations: {
    positionSizing: string; // 'aggressive', 'normal', 'conservative'
    riskAdjustment: number; // Multiplier for position sizes (0.5-1.5)
    allowNewPositions: boolean;
    preferredStrategies: string[];
  };
}

export interface MarketRegimeInput {
  sp500Symbol?: string; // Default: ^GSPC
  lookbackDays?: number; // Default: 200
}

export class MarketRegimeService {
  private readonly DEFAULT_SP500 = '^GSPC';
  private readonly DEFAULT_LOOKBACK = 200;
  private regimeCache: MarketRegime | null = null;
  private cacheExpiry: Date | null = null;
  private readonly CACHE_TTL = 60 * 60 * 1000; // 1 hour

  /**
   * Detect current market regime
   */
  async detectMarketRegime(input: MarketRegimeInput = {}): Promise<MarketRegime> {
    const sp500Symbol = input.sp500Symbol || this.DEFAULT_SP500;
    const lookbackDays = input.lookbackDays || this.DEFAULT_LOOKBACK;

    // Check cache
    if (this.regimeCache && this.cacheExpiry && new Date() < this.cacheExpiry) {
      console.log('📊 Using cached market regime');
      return this.regimeCache;
    }

    console.log(`\n📊 Detecting market regime for ${sp500Symbol}...`);

    // Fetch S&P 500 data
    const prices = await prisma.stockPrice.findMany({
      where: {
        symbol: sp500Symbol,
        date: {
          gte: new Date(Date.now() - lookbackDays * 24 * 60 * 60 * 1000),
        },
      },
      orderBy: { date: 'desc' },
      take: lookbackDays,
    });

    if (prices.length < 50) {
      throw new Error(`Insufficient data for regime detection: ${prices.length} days`);
    }

    console.log(`✓ Loaded ${prices.length} days of S&P 500 data`);

    // Calculate indicators
    const indicators = await this.calculateIndicators(prices);

    // Determine market state
    const state = this.determineMarketState(indicators);

    // Determine volatility regime
    const volatility = this.determineVolatilityRegime(indicators);

    // Calculate trend strength
    const trendStrength = this.calculateTrendStrength(indicators);

    // Calculate confidence
    const confidence = this.calculateConfidence(indicators, state);

    // Generate recommendations
    const recommendations = this.generateRecommendations(state, volatility, indicators);

    const regime: MarketRegime = {
      state,
      volatility,
      trendStrength,
      confidence,
      indicators,
      lastUpdated: new Date(),
      recommendations,
    };

    // Cache result
    this.regimeCache = regime;
    this.cacheExpiry = new Date(Date.now() + this.CACHE_TTL);

    this.logRegime(regime);

    return regime;
  }

  /**
   * Calculate market indicators
   */
  private async calculateIndicators(prices: any[]) {
    const recent = prices.slice(0, 20); // Last 20 days
    const lookback = prices; // Full lookback period

    // S&P 500 trend (200-day)
    const sp500Trend = ((prices[0].close - prices[prices.length - 1].close) / prices[prices.length - 1].close) * 100;

    // VIX (use 20-day volatility as proxy)
    const returns = [];
    for (let i = 0; i < Math.min(prices.length - 1, 20); i++) {
      returns.push((prices[i].close - prices[i + 1].close) / prices[i + 1].close);
    }
    const volatility = this.calculateStdDev(returns) * Math.sqrt(252) * 100;
    const vixLevel = volatility; // Use historical vol as VIX proxy

    // Advance/Decline ratio (proxy: % of stocks up today vs down)
    const advDeclRatio = await this.calculateAdvDeclRatio(recent[0].date);

    // New Highs - New Lows (proxy: stocks at 52-week highs vs lows)
    const newHighsLows = await this.calculateNewHighsLows(recent[0].date);

    // Market Breadth (% of stocks above MA200)
    const marketBreadth = await this.calculateMarketBreadth();

    return {
      sp500Trend,
      vixLevel,
      advDeclRatio,
      newHighsLows,
      marketBreadth,
    };
  }

  /**
   * Determine market state (BULL/BEAR/SIDEWAYS/VOLATILE)
   */
  private determineMarketState(indicators: any): MarketState {
    const { sp500Trend, vixLevel, advDeclRatio, newHighsLows, marketBreadth } = indicators;

    // Priority checks
    if (vixLevel > 30) {
      return 'VOLATILE'; // Very high volatility overrides everything
    }

    if (sp500Trend > 10 && advDeclRatio > 1.5 && marketBreadth > 0.6) {
      return 'BULL'; // Strong uptrend
    }

    if (sp500Trend < -10 && advDeclRatio < 0.7 && marketBreadth < 0.3) {
      return 'BEAR'; // Strong downtrend
    }

    if (Math.abs(sp500Trend) < 5 && marketBreadth > 0.4 && marketBreadth < 0.6) {
      return 'SIDEWAYS'; // No clear trend
    }

    // Default based on trend
    return sp500Trend > 0 ? 'BULL' : 'BEAR';
  }

  /**
   * Determine volatility regime
   */
  private determineVolatilityRegime(indicators: any): VolatilityRegime {
    const { vixLevel } = indicators;

    if (vixLevel < 15) return 'LOW';
    if (vixLevel < 25) return 'MEDIUM';
    return 'HIGH';
  }

  /**
   * Calculate trend strength (0-100)
   */
  private calculateTrendStrength(indicators: any): number {
    const { sp500Trend, marketBreadth, advDeclRatio } = indicators;

    // Combine multiple factors
    const trendScore = Math.min(Math.abs(sp500Trend) * 2, 50); // Max 50 points
    const breadthScore = (marketBreadth - 0.5) * 100; // -50 to +50
    const advDeclScore = (advDeclRatio - 1) * 25; // -25 to +25

    const strength = 50 + trendScore + (breadthScore * 0.3) + (advDeclScore * 0.2);

    return Math.max(0, Math.min(100, strength));
  }

  /**
   * Calculate confidence in regime assessment (0-1)
   */
  private calculateConfidence(indicators: any, state: MarketState): number {
    const { sp500Trend, vixLevel, advDeclRatio, marketBreadth } = indicators;

    let confidence = 0.5; // Base confidence

    // Strong trend increases confidence
    if (Math.abs(sp500Trend) > 15) confidence += 0.2;
    else if (Math.abs(sp500Trend) > 10) confidence += 0.1;

    // Extreme volatility increases confidence
    if (vixLevel > 30 || vixLevel < 12) confidence += 0.15;

    // Strong breadth increases confidence
    if (marketBreadth > 0.7 || marketBreadth < 0.3) confidence += 0.1;

    // Strong A/D ratio increases confidence
    if (advDeclRatio > 2 || advDeclRatio < 0.5) confidence += 0.1;

    // State-specific adjustments
    if (state === 'VOLATILE' && vixLevel > 30) confidence += 0.15;

    return Math.min(0.95, confidence);
  }

  /**
   * Generate trading recommendations based on regime
   */
  private generateRecommendations(state: MarketState, volatility: VolatilityRegime, indicators: any) {
    let positionSizing: 'aggressive' | 'normal' | 'conservative' = 'normal';
    let riskAdjustment = 1.0;
    let allowNewPositions = true;
    let preferredStrategies: string[] = [];

    // Adjust based on market state
    switch (state) {
      case 'BULL':
        positionSizing = 'normal';
        riskAdjustment = 1.0;
        preferredStrategies = ['momentum', 'growth', 'breakout'];
        break;

      case 'BEAR':
        positionSizing = 'conservative';
        riskAdjustment = 0.5;
        preferredStrategies = ['defensive', 'value', 'short'];
        break;

      case 'SIDEWAYS':
        positionSizing = 'normal';
        riskAdjustment = 0.75;
        preferredStrategies = ['mean-reversion', 'range-trading'];
        break;

      case 'VOLATILE':
        positionSizing = 'conservative';
        riskAdjustment = 0.4;
        allowNewPositions = false;
        preferredStrategies = ['cash', 'volatility-trading'];
        break;
    }

    // Further adjust based on volatility
    if (volatility === 'HIGH') {
      riskAdjustment *= 0.7;
      if (state !== 'VOLATILE') {
        positionSizing = 'conservative';
      }
    } else if (volatility === 'LOW' && state === 'BULL') {
      riskAdjustment *= 1.2;
      positionSizing = 'aggressive';
    }

    return {
      positionSizing,
      riskAdjustment,
      allowNewPositions,
      preferredStrategies,
    };
  }

  /**
   * Calculate Advance/Decline ratio (simplified)
   */
  private async calculateAdvDeclRatio(date: Date): Promise<number> {
    try {
      // Get all stocks with price data for this date
      const stocks = await prisma.stockPrice.findMany({
        where: { date },
        select: { symbol: true, close: true },
        take: 100,
      });

      if (stocks.length < 2) return 1.0;

      // Calculate A/D ratio based on price change from previous day
      let advancing = 0;
      let declining = 0;

      for (const stock of stocks) {
        const prevPrice = await prisma.stockPrice.findFirst({
          where: {
            symbol: stock.symbol,
            date: { lt: date },
          },
          orderBy: { date: 'desc' },
        });

        if (prevPrice) {
          if (stock.close > prevPrice.close) advancing++;
          else if (stock.close < prevPrice.close) declining++;
        }
      }

      return declining > 0 ? advancing / declining : advancing;
    } catch (error) {
      console.error('Error calculating A/D ratio:', error);
      return 1.0; // Neutral
    }
  }

  /**
   * Calculate New Highs - New Lows (simplified)
   */
  private async calculateNewHighsLows(date: Date): Promise<number> {
    try {
      const lookback = 252; // 52 weeks
      const cutoffDate = new Date(date.getTime() - lookback * 24 * 60 * 60 * 1000);

      const stocks = await prisma.stockPrice.findMany({
        where: { date },
        select: { symbol: true, close: true, high: true },
        take: 100,
      });

      let newHighs = 0;
      let newLows = 0;

      for (const stock of stocks) {
        const historicalPrices = await prisma.stockPrice.findMany({
          where: {
            symbol: stock.symbol,
            date: { gte: cutoffDate, lt: date },
          },
          select: { high: true, low: true },
        });

        if (historicalPrices.length > 0) {
          const periodHigh = Math.max(...historicalPrices.map(p => p.high));
          const periodLow = Math.min(...historicalPrices.map(p => p.low));

          if (stock.high > periodHigh) newHighs++;
          if (stock.low < periodLow) newLows++;
        }
      }

      return newHighs - newLows;
    } catch (error) {
      console.error('Error calculating new highs/lows:', error);
      return 0;
    }
  }

  /**
   * Calculate Market Breadth (% stocks above MA200)
   */
  private async calculateMarketBreadth(): Promise<number> {
    try {
      const stocks = await prisma.stock.findMany({
        select: { symbol: true },
        take: 100,
      });

      let aboveMA200 = 0;

      for (const stock of stocks) {
        const latestPrice = await prisma.stockPrice.findFirst({
          where: { symbol: stock.symbol },
          orderBy: { date: 'desc' },
        });

        if (!latestPrice) continue;

        // Calculate MA200
        const ma200Prices = await prisma.stockPrice.findMany({
          where: {
            symbol: stock.symbol,
            date: { lte: latestPrice.date },
          },
          orderBy: { date: 'desc' },
          take: 200,
          select: { close: true },
        });

        if (ma200Prices.length >= 200) {
          const ma200 = ma200Prices.reduce((sum, p) => sum + p.close, 0) / ma200Prices.length;
          if (latestPrice.close > ma200) aboveMA200++;
        }
      }

      return aboveMA200 / stocks.length;
    } catch (error) {
      console.error('Error calculating market breadth:', error);
      return 0.5; // Neutral
    }
  }

  /**
   * Calculate standard deviation
   */
  private calculateStdDev(values: number[]): number {
    if (values.length === 0) return 0;
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const squaredDiffs = values.map(v => Math.pow(v - mean, 2));
    return Math.sqrt(squaredDiffs.reduce((a, b) => a + b, 0) / values.length);
  }

  /**
   * Log regime information
   */
  private logRegime(regime: MarketRegime) {
    console.log('\n📊 MARKET REGIME DETECTED:');
    console.log('─'.repeat(70));
    console.log(`  State: ${regime.state}`);
    console.log(`  Volatility: ${regime.volatility}`);
    console.log(`  Trend Strength: ${regime.trendStrength.toFixed(1)}/100`);
    console.log(`  Confidence: ${(regime.confidence * 100).toFixed(1)}%`);
    console.log('\n📈 Indicators:');
    console.log(`  S&P 500 Trend: ${regime.indicators.sp500Trend.toFixed(2)}%`);
    console.log(`  VIX Level: ${regime.indicators.vixLevel.toFixed(2)}`);
    console.log(`  A/D Ratio: ${regime.indicators.advDeclRatio.toFixed(2)}`);
    console.log(`  New Highs-Lows: ${regime.indicators.newHighsLows}`);
    console.log(`  Market Breadth: ${(regime.indicators.marketBreadth * 100).toFixed(1)}%`);
    console.log('\n💡 Recommendations:');
    console.log(`  Position Sizing: ${regime.recommendations.positionSizing}`);
    console.log(`  Risk Adjustment: ${(regime.recommendations.riskAdjustment * 100).toFixed(0)}% of normal`);
    console.log(`  Allow New Positions: ${regime.recommendations.allowNewPositions ? '✅' : '❌'}`);
    console.log(`  Preferred Strategies: ${regime.recommendations.preferredStrategies.join(', ')}`);
    console.log('─'.repeat(70) + '\n');
  }

  /**
   * Adjust signal based on market regime
   */
  adjustSignalForRegime(
    originalSignal: number, // -1, 0, 1
    regime: MarketRegime
  ): number {
    // If volatile market and recommending no new positions
    if (!regime.recommendations.allowNewPositions) {
      return 0; // Force HOLD
    }

    // In bear market, downgrade BUY signals to HOLD
    if (regime.state === 'BEAR' && originalSignal === 1) {
      return 0; // Convert BUY to HOLD
    }

    // In bull market, upgrade HOLD to BUY if strong trend
    if (regime.state === 'BULL' && originalSignal === 0 && regime.trendStrength > 70) {
      return 1; // Convert HOLD to BUY
    }

    return originalSignal;
  }

  /**
   * Adjust position size based on regime
   */
  adjustPositionSizeForRegime(
    basePositionSize: number,
    regime: MarketRegime
  ): number {
    return basePositionSize * regime.recommendations.riskAdjustment;
  }

  /**
   * Check if market conditions are favorable for trading
   */
  isFavorableMarket(regime?: MarketRegime): boolean {
    if (!regime) {
      return true; // Default to favorable if no regime data
    }

    // Unfavorable if volatile or bear with low confidence
    if (regime.state === 'VOLATILE') return false;
    if (regime.state === 'BEAR' && regime.confidence < 0.6) return false;

    return true;
  }
}

export const marketRegimeService = new MarketRegimeService();
