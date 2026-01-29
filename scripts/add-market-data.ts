/**
 * Add Market Index Data
 *
 * Adds S&P 500 index data for market regime detection
 *
 * Usage:
 *   npx tsx scripts/add-market-data.ts
 */

import { prisma } from '../src/lib/prisma';
import { YahooFinanceService } from '../src/services/yahooFinance';

const MARKET_INDICES = [
  { symbol: '^GSPC', name: 'S&P 500' },
  { symbol: '^DJI', name: 'Dow Jones' },
  { symbol: '^IXIC', name: 'NASDAQ' },
  { symbol: '^VIX', name: 'VIX' },
];

async function addMarketIndexData() {
  console.log('\n' + '='.repeat(70));
  console.log('📊 ADDING MARKET INDEX DATA');
  console.log('='.repeat(70) + '\n');

  const yahooService = new YahooFinanceService();

  // Add index metadata
  console.log('📝 Adding market index metadata...');

  for (const index of MARKET_INDICES) {
    try {
      await prisma.stock.upsert({
        where: { symbol: index.symbol },
        update: { name: index.name },
        create: {
          symbol: index.symbol,
          name: index.name,
          exchange: 'INDEX',
          sector: 'Market Index',
        },
      });

      console.log(`  ✅ ${index.symbol} - ${index.name}`);
    } catch (error) {
      console.error(`  ❌ Error adding ${index.symbol}: ${error}`);
    }
  }

  // Fetch historical data with delays
  console.log('\n📥 Fetching historical data (with 2s delays)...');

  const symbols = MARKET_INDICES.map(idx => idx.symbol);
  const result = await yahooService.fetchDataFeed(symbols, true);

  console.log('\n✅ Market index data added:');
  console.log(`  Updated: ${result.updated} records`);
  console.log(`  Errors: ${result.errors.length}`);

  if (result.errors.length > 0) {
    console.log('\n⚠️  Errors:');
    result.errors.forEach(err => console.log(`  ${err}`));
  }

  console.log('\n' + '='.repeat(70));
  console.log('✅ MARKET DATA ADDITION COMPLETE');
  console.log('='.repeat(70) + '\n');
}

// Run
addMarketIndexData().catch(console.error);
