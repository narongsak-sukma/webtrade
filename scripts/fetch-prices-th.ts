/**
 * Fetch Historical Prices for SET100 Stocks (Thailand)
 *
 * This script fetches historical OHLCV data for all Thai stocks
 * from Yahoo Finance using .BK suffix (Bangkok).
 *
 * Usage:
 *   npx tsx scripts/fetch-prices-th.ts
 */

import { PrismaClient } from '@prisma/client';
import yahooFinance from 'yahoo-finance2';

const prisma = new PrismaClient();

// Suppress deprecation notice
yahooFinance.suppressNotices(['ripHistorical']);

/**
 * Fetch historical prices for a single stock with rate limiting
 */
async function fetchHistoricalPrices(symbol: string, startDate: Date): Promise<void> {
  try {
    console.log(`  📈 Fetching ${symbol}...`);

    const result = await yahooFinance.chart(symbol, {
      period1: startDate.toISOString().split('T')[0],
      interval: '1d',
    });

    if (!result || !result.quotes || result.quotes.length === 0) {
      console.log(`    ⚠️  No data found for ${symbol}`);
      return;
    }

    // Prepare price data for bulk insert
    const priceData = result.quotes.map((quote: any) => ({
      symbol,
      date: new Date(quote.date),
      open: parseFloat(quote.open),
      high: parseFloat(quote.high),
      low: parseFloat(quote.low),
      close: parseFloat(quote.close),
      adjClose: parseFloat(quote.close), // Use close for adjClose
      volume: BigInt(quote.volume),
    }));

    // Bulk insert (skip duplicates)
    await prisma.stockPrice.createMany({
      data: priceData,
      skipDuplicates: true,
    });

    console.log(`    ✅ ${priceData.length} days fetched`);
  } catch (error) {
    console.error(`    ❌ Error fetching ${symbol}:`, error instanceof Error ? error.message : error);
  }
}

/**
 * Main function to fetch all SET100 prices
 */
async function main() {
  console.log('🌏 Fetching Historical Prices for SET100 Stocks (Thailand)\n');
  console.log('=' .repeat(60));

  try {
    // Get all Thai stocks from database
    const stocks = await prisma.stock.findMany({
      where: { market: 'TH' },
      select: { symbol: true, name: true },
      orderBy: { symbol: 'asc' },
    });

    if (stocks.length === 0) {
      console.error('❌ No Thai stocks found in database!');
      console.log('💡 Run: npx tsx scripts/seed-set100.ts first');
      process.exit(1);
    }

    console.log(`\n📊 Found ${stocks.length} SET100 stocks\n`);

    // Set start date (2 years of historical data)
    const startDate = new Date();
    startDate.setFullYear(startDate.getFullYear() - 2);

    console.log(`📅 Start Date: ${startDate.toISOString().split('T')[0]}`);
    console.log(`📅 End Date: ${new Date().toISOString().split('T')[0]}`);
    console.log(`📈 Duration: 2 years`);
    console.log(`⏱️  Rate limit: 1 request/second\n`);

    // Fetch prices for each stock with rate limiting
    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < stocks.length; i++) {
      const stock = stocks[i];

      console.log(`[${i + 1}/${stocks.length}] ${stock.symbol} - ${stock.name}`);

      await fetchHistoricalPrices(stock.symbol, startDate);

      // Rate limiting: 1 second delay between requests
      if (i < stocks.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('✅ Price fetching complete!');
    console.log(`\n💡 Next steps:`);
    console.log(`   1. Run: npx tsx scripts/run-screening-th.ts`);
    console.log(`   2. View Thai stocks at: http://localhost:3030/screening?market=TH`);
    console.log(`   3. Compare US vs TH: http://localhost:3030/screening\n`);

  } catch (error) {
    console.error('\n❌ Error:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
