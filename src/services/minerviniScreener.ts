import { prisma } from '@/lib/prisma';
import { ScreenedStockData } from '@/types';
import { TechnicalIndicators } from './technicalIndicators';

export class MinerviniScreenerService {
  /**
   * Calculate Simple Moving Average
   */
  private calculateSMA(prices: number[], period: number): number | null {
    if (prices.length < period) return null;
    const slice = prices.slice(-period);
    const sum = slice.reduce((a, b) => a + b, 0);
    return sum / period;
  }

  /**
   * Get closing prices for a symbol
   */
  private async getPrices(symbol: string, days: number = 252): Promise<number[]> {
    const prices = await prisma.stockPrice.findMany({
      where: { symbol },
      orderBy: { date: 'asc' },
      take: -days,
      select: { close: true },
    });

    return prices.map(p => Number(p.close));
  }

  /**
   * Get 52-week high and low
   */
  private async get52WeekHighLow(symbol: string): Promise<{ high: number; low: number } | null> {
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

    const prices = await prisma.stockPrice.findMany({
      where: {
        symbol,
        date: { gte: oneYearAgo },
      },
      orderBy: { date: 'asc' },
      select: { high: true, low: true },
    });

    if (prices.length === 0) return null;

    const high = Math.max(...prices.map(p => Number(p.high)));
    const low = Math.min(...prices.map(p => Number(p.low)));

    return { high, low };
  }

  /**
   * Check if 200-day MA is trending up (over the last month)
   */
  private isMa200TrendingUp(prices: number[]): boolean {
    if (prices.length < 230) return false; // Need at least 200 + 30 days

    const currentMa200 = this.calculateSMA(prices, 200);
    const ma200ThirtyDaysAgo = this.calculateSMA(prices.slice(0, -30), 200);

    if (!currentMa200 || !ma200ThirtyDaysAgo) return false;

    return currentMa200 > ma200ThirtyDaysAgo;
  }

  /**
   * Calculate relative strength vs SPY (SP500 ETF)
   */
  private async calculateRelativeStrength(symbol: string): Promise<number | null> {
    const spyPrices = await prisma.stockPrice.findMany({
      where: { symbol: 'SPY' },
      orderBy: { date: 'desc' },
      take: 60, // 3 months approximately
      select: { close: true },
    });

    const stockPrices = await prisma.stockPrice.findMany({
      where: { symbol },
      orderBy: { date: 'desc' },
      take: 60,
      select: { close: true },
    });

    if (spyPrices.length < 2 || stockPrices.length < 2) return null;

    const spyReturn = (Number(spyPrices[0].close) / Number(spyPrices[spyPrices.length - 1].close)) - 1;
    const stockReturn = (Number(stockPrices[0].close) / Number(stockPrices[stockPrices.length - 1].close)) - 1;

    return stockReturn - spyReturn;
  }

  /**
   * Screen a single stock using Minervini Trend Template + Explainable Filters
   * Now uses 14 total filters (8 original + 6 new explainable filters)
   */
  async screenStock(symbol: string): Promise<ScreenedStockData | null> {
    // Get price data
    const techData = await TechnicalIndicators.getTechnicalData(symbol, 252);
    const prices = techData.prices;

    if (prices.length < 200) {
      console.log(`Insufficient data for ${symbol}: ${prices.length} days`);
      return null;
    }

    const currentPrice = prices[prices.length - 1];
    const ma50 = this.calculateSMA(prices, 50);
    const ma150 = this.calculateSMA(prices, 150);
    const ma200 = this.calculateSMA(prices, 200);
    const ma20 = this.calculateSMA(prices, 20);

    if (!ma50 || !ma150 || !ma200) {
      console.log(`Cannot calculate MAs for ${symbol}`);
      return null;
    }

    // Get 52-week high/low
    const week52 = await this.get52WeekHighLow(symbol);

    if (!week52) {
      console.log(`Cannot get 52-week data for ${symbol}`);
      return null;
    }

    // ============================================
    // ORIGINAL MINERVINI CRITERIA 1-8
    // ============================================

    // 1. Current price > 150-day MA
    const priceAboveMa150 = currentPrice > ma150;

    // 2. 150-day MA > 200-day MA
    const ma150AboveMa200 = ma150 > ma200;

    // 3. 200-day MA trending up for at least 1 month
    const ma200TrendingUp = this.isMa200TrendingUp(prices);

    // 4. 50-day MA > 150-day MA > 200-day MA
    const ma50AboveMa150 = ma50 > ma150 && ma150 > ma200;

    // 5. Current price > 50-day MA
    const priceAboveMa50 = currentPrice > ma50;

    // 6. Current price at least 30% above 52-week low
    const priceAbove52WeekLow = currentPrice >= (week52.low * 1.3);

    // 7. Current price within 25% of 52-week high
    const priceNear52WeekHigh = currentPrice >= (week52.high * 0.75);

    // 8. Relative strength positive
    const relativeStrength = await this.calculateRelativeStrength(symbol);
    const relativeStrengthPositive = relativeStrength !== null && relativeStrength > 0;

    // ============================================
    // EXPLAINABLE FILTERS 9-14
    // ============================================

    // 9. RSI in sweet spot (30-70)
    const rsi = TechnicalIndicators.calculateRSI(prices);
    const rsiInRange = rsi !== null && TechnicalIndicators.isRSIInRange(rsi);

    // 10. Volume confirmation (above 50-day average)
    const currentVolume = techData.volumes[techData.volumes.length - 1];
    const volumeAvg50 = TechnicalIndicators.calculateAverageVolume(techData.volumes, 50);
    const volumeAboveAvg = volumeAvg50 !== null && TechnicalIndicators.isVolumeAboveAvg(currentVolume, volumeAvg50);

    // 11. MACD bullish
    const { macd, macdSignal, macdBullish } = TechnicalIndicators.calculateMACD(prices);

    // 12. ADX strong trend (> 25)
    const adx = TechnicalIndicators.calculateADX(techData.highs, techData.lows, prices);
    const adxStrong = adx !== null && TechnicalIndicators.isADXStrong(adx);

    // 13. Short-term trend (price > 20-day MA)
    const priceAboveMa20 = ma20 !== null && currentPrice > ma20;

    // 14. Bollinger Band position (price in middle 50%)
    const { upper: bbUpper, middle: bbMiddle, lower: bbLower } = TechnicalIndicators.calculateBollingerBands(prices);
    const priceInBBRange = bbUpper !== null && bbLower !== null && TechnicalIndicators.isPriceInBBRange(currentPrice, bbUpper, bbLower);

    // ============================================
    // COUNT PASSED CRITERIA (out of 14)
    // ============================================
    const criteriaChecks = [
      priceAboveMa150,
      ma150AboveMa200,
      ma200TrendingUp,
      ma50AboveMa150,
      priceAboveMa50,
      priceAbove52WeekLow,
      priceNear52WeekHigh,
      relativeStrengthPositive,
      rsiInRange,
      volumeAboveAvg,
      macdBullish,
      adxStrong,
      priceAboveMa20,
      priceInBBRange,
    ];

    const passedCriteria = criteriaChecks.filter(Boolean).length;
    const totalCriteria = 14;

    const result: ScreenedStockData = {
      symbol,
      date: new Date(),
      price: currentPrice,
      ma50,
      ma150,
      ma200,

      // Original Minervini Criteria 1-8
      priceAboveMa150,
      ma150AboveMa200,
      ma200TrendingUp,
      ma50AboveMa150,
      priceAboveMa50,
      priceAbove52WeekLow,
      priceNear52WeekHigh,
      relativeStrengthPositive,

      // Explainable Filters 9-14
      rsi,
      rsiInRange,
      volume: currentVolume ? Number(currentVolume) : undefined,
      volumeAvg50,
      volumeAboveAvg,
      macd,
      macdSignal,
      macdBullish,
      adx,
      adxStrong,
      ma20,
      priceAboveMa20,
      bollingerUpper: bbUpper,
      bollingerMiddle: bbMiddle,
      bollingerLower: bbLower,
      priceInBBRange,

      // Additional metadata
      week52Low: week52.low,
      week52High: week52.high,
      relativeStrength,
      passedCriteria,
      totalCriteria,
    };

    // Save to database
    await prisma.screenedStock.upsert({
      where: {
        symbol_date: {
          symbol,
          date: result.date,
        },
      },
      update: { ...result },
      create: { ...result },
    });

    return result;
  }

  /**
   * Screen all stocks in the database
   */
  async screenAllStocks(): Promise<{ screened: number; failed: number }> {
    const stocks = await prisma.stock.findMany({
      select: { symbol: true },
    });

    let screened = 0;
    let failed = 0;

    for (const stock of stocks) {
      try {
        const result = await this.screenStock(stock.symbol);
        if (result && result.passedCriteria >= 6) {
          screened++;
        }
      } catch (error) {
        console.error(`Failed to screen ${stock.symbol}:`, error);
        failed++;
      }
    }

    return { screened, failed };
  }
}

export const minerviniScreenerService = new MinerviniScreenerService();
