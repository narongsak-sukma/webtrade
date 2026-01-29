import yahooFinance from 'yahoo-finance2';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { ExternalServiceError } from '@/lib/errors';
import { PriceData } from '@/types';
import { dataQualityValidator } from './dataQualityValidator';

// SP500 Stock symbols (subset - you can expand this)
export const SP500_SYMBOLS = [
  'AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA', 'META', 'NVDA', 'BRK-B', 'LLY', 'AVGO',
  'JPM', 'V', 'JNJ', 'WMT', 'PG', 'XOM', 'MA', 'HD', 'CVX', 'MRK',
  'ABBV', 'PEP', 'BAC', 'KO', 'COST', 'TMO', 'MCD', 'CSCO', 'ABT', 'CRM',
  'LIN', 'ACN', 'ADBE', 'NFLX', 'AMD', 'CMCSA', 'ORCL', 'WFC', 'PM', 'UPS',
  'SAP', 'HON', 'QCOM', 'NKE', 'TXN', 'UNH', 'IBM', 'INTC', 'LOW', 'GE'
];

export class YahooFinanceService {
  private readonly RATE_LIMIT_DELAY = 2000; // 2 seconds between requests (increased from 1s to avoid blocking)
  private lastRequestTime = 0;

  private async rateLimitDelay(): Promise<void> {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;

    if (timeSinceLastRequest < this.RATE_LIMIT_DELAY) {
      const delay = this.RATE_LIMIT_DELAY - timeSinceLastRequest;
      console.log(`⏳ Rate limiting: waiting ${delay}ms before next Yahoo Finance request...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }

    this.lastRequestTime = Date.now();
  }

  async fetchStockInfo(symbol: string): Promise<{
    symbol: string;
    name: string;
    exchange: string;
    sector?: string;
    industry?: string;
    marketCap?: number;
  }> {
    await this.rateLimitDelay();

    try {
      const result = await yahooFinance.quote(symbol);

      return {
        symbol: result.symbol,
        name: result.longName || result.shortName || symbol,
        exchange: result.fullExchangeName || 'NASDAQ',
        sector: result.sector,
        industry: result.industry,
        marketCap: result.marketCap,
      };
    } catch (error) {
      logger.error(`Error fetching stock info for ${symbol}`, error);
      throw new ExternalServiceError('Yahoo Finance', `Failed to fetch info for ${symbol}`);
    }
  }

  async fetchHistoricalData(
    symbol: string,
    startDate: Date,
    endDate: Date
  ): Promise<PriceData[]> {
    await this.rateLimitDelay();

    try {
      const result = await yahooFinance.historical(symbol, {
        period1: startDate,
        period2: endDate,
        interval: '1d',
      });

      return result.map((bar: any) => ({
        symbol,
        date: new Date(bar.date),
        open: bar.open,
        high: bar.high,
        low: bar.low,
        close: bar.close,
        volume: bar.volume,
        adjClose: bar.adjClose || bar.close,
      }));
    } catch (error) {
      console.error(`Error fetching historical data for ${symbol}:`, error);
      throw error;
    }
  }

  async getLatestDateInDB(symbol: string): Promise<Date | null> {
    const latestPrice = await prisma.stockPrice.findFirst({
      where: { symbol },
      orderBy: { date: 'desc' },
      select: { date: true },
    });

    return latestPrice?.date || null;
  }

  async savePriceData(priceData: PriceData[]): Promise<void> {
    if (priceData.length === 0) return;

    // Validate data before saving
    const validation = dataQualityValidator.validateBatch(priceData);

    // Log validation warnings
    if (validation.warnings.length > 0) {
      validation.warnings.forEach(warning => {
        logger.warn(`Data quality warning: ${warning.message}`, {
          symbol: warning.symbol,
          field: warning.field,
        });
      });
    }

    // Filter out invalid records with critical errors
    const criticalErrors = validation.errors.filter(e => e.severity === 'critical');
    if (criticalErrors.length > 0) {
      logger.error(`Data validation failed with ${criticalErrors.length} critical errors`, {
        errors: criticalErrors.map(e => e.message),
      });

      // Only save records that don't have critical errors
      const validRecords = priceData.filter(data => {
        return !criticalErrors.some(error =>
          error.symbol === data.symbol && error.date?.getTime() === data.date.getTime()
        );
      });

      logger.info(`Filtered out ${criticalErrors.length} invalid records, saving ${validRecords.length} valid records`);

      if (validRecords.length === 0) {
        throw new ExternalServiceError('No valid records to save after validation');
      }

      priceData = validRecords;
    }

    // Batch upsert
    await Promise.all(
      priceData.map(data =>
        prisma.stockPrice.upsert({
          where: {
            symbol_date: {
              symbol: data.symbol,
              date: data.date,
            },
          },
          update: {
            open: data.open,
            high: data.high,
            low: data.low,
            close: data.close,
            volume: data.volume,
            adjClose: data.adjClose,
          },
          create: {
            symbol: data.symbol,
            date: data.date,
            open: data.open,
            high: data.high,
            low: data.low,
            close: data.close,
            volume: data.volume,
            adjClose: data.adjClose,
          },
        })
      )
    );

    logger.info(`Successfully saved ${priceData.length} price records`);
  }

  async fetchAndSaveInitialData(symbol: string, years: number = 3): Promise<number> {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setFullYear(endDate.getFullYear() - years);

    logger.info(`Fetching ${years} years of data for ${symbol}`, { symbol, years, startDate, endDate });

    const priceData = await this.fetchHistoricalData(symbol, startDate, endDate);
    await this.savePriceData(priceData);

    logger.info(`Saved ${priceData.length} price records for ${symbol}`, { symbol, count: priceData.length });
    return priceData.length;
  }

  async fetchAndSaveIncrementalData(symbol: string): Promise<number> {
    const latestDate = await this.getLatestDateInDB(symbol);

    if (!latestDate) {
      console.log(`No existing data for ${symbol}, fetching initial 3 years`);
      return this.fetchAndSaveInitialData(symbol, 3);
    }

    // Start from the day after the latest date
    const startDate = new Date(latestDate);
    startDate.setDate(startDate.getDate() + 1);
    const endDate = new Date();

    // If startDate is in the future or today, no new data needed
    if (startDate >= endDate) {
      console.log(`No new data needed for ${symbol}`);
      return 0;
    }

    console.log(`Fetching incremental data for ${symbol} from ${startDate.toISOString()} to ${endDate.toISOString()}`);

    const priceData = await this.fetchHistoricalData(symbol, startDate, endDate);
    await this.savePriceData(priceData);

    console.log(`Saved ${priceData.length} new price records for ${symbol}`);
    return priceData.length;
  }

  async updateStockList(symbols: string[]): Promise<void> {
    console.log(`\n📈 Updating stock list for ${symbols.length} symbols`);
    console.log(`⏱️  Processing ONE BY ONE with ${this.RATE_LIMIT_DELAY}ms delay\n`);

    for (let i = 0; i < symbols.length; i++) {
      const symbol = symbols[i];
      console.log(`[${i + 1}/${symbols.length}] Fetching info for ${symbol}...`);

      try {
        const stockInfo = await this.fetchStockInfo(symbol); // This includes 2s delay

        await prisma.stock.upsert({
          where: { symbol },
          update: {
            name: stockInfo.name,
            exchange: stockInfo.exchange,
            sector: stockInfo.sector,
            industry: stockInfo.industry,
            marketCap: stockInfo.marketCap ? BigInt(stockInfo.marketCap) : null,
          },
          create: {
            symbol: stockInfo.symbol,
            name: stockInfo.name,
            exchange: stockInfo.exchange,
            sector: stockInfo.sector,
            industry: stockInfo.industry,
            marketCap: stockInfo.marketCap ? BigInt(stockInfo.marketCap) : null,
          },
        });

        console.log(`✅ ${symbol}: ${stockInfo.name} (${stockInfo.exchange})`);

        // Wait before next ticker
        if (i < symbols.length - 1) {
          console.log(`⏳  Waiting before next ticker...\n`);
        }
      } catch (error) {
        console.error(`❌ Failed to update ${symbol}:`, error);
      }
    }

    console.log(`\n✅ Stock list update complete!\n`);
  }

  async fetchDataFeed(symbols: string[], isInitial: boolean = false): Promise<{
    updated: number;
    errors: string[];
  }> {
    const errors: string[] = [];
    let totalUpdated = 0;

    console.log(`\n📊 Starting data feed for ${symbols.length} symbols`);
    console.log(`⏱️  Will process ONE BY ONE with ${this.RATE_LIMIT_DELAY}ms delay between each\n`);

    for (let i = 0; i < symbols.length; i++) {
      const symbol = symbols[i];
      console.log(`\n[${i + 1}/${symbols.length}] Processing ${symbol}...`);

      try {
        if (isInitial) {
          const count = await this.fetchAndSaveInitialData(symbol);
          totalUpdated += count;
          console.log(`✅ ${symbol}: Saved ${count} records`);
        } else {
          const count = await this.fetchAndSaveIncrementalData(symbol);
          totalUpdated += count;
          console.log(`✅ ${symbol}: Updated ${count} new records`);
        }

        // Add extra delay between stocks (except for the last one)
        if (i < symbols.length - 1) {
          console.log(`⏳  Waiting ${this.RATE_LIMIT_DELAY}ms before next ticker...\n`);
        }
      } catch (error) {
        const errorMsg = `Failed to fetch data for ${symbol}: ${error}`;
        console.error(`❌ ${errorMsg}`);
        errors.push(errorMsg);
      }
    }

    console.log(`\n✅ Data feed complete! Total records: ${totalUpdated}, Errors: ${errors.length}\n`);
    return { updated: totalUpdated, errors };
  }
}

export const yahooFinanceService = new YahooFinanceService();
