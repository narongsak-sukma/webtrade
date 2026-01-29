/**
 * Generate Synthetic Price Data for Thai Stocks (SET100)
 *
 * Creates realistic historical price data for testing and development.
 * Thai stocks are priced in THB (฿) with realistic ranges.
 *
 * Usage:
 *   npx tsx scripts/generate-synthetic-th.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function generateSyntheticData() {
  console.log('🌏 Generating Synthetic Historical Data for SET100 Stocks (Thailand)\n');
  console.log('=' .repeat(60));

  // Get all Thai stocks
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

  console.log(`\n📊 Found ${stocks.length} SET100 stocks`);
  console.log(`📅 Generating 2 years of daily data (~500 trading days)`);
  console.log(`💱 Currency: THB (฿)\n`);

  const daysToGenerate = 500;
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - daysToGenerate);

  let totalPricesGenerated = 0;

  for (let i = 0; i < stocks.length; i++) {
    const { symbol, name } = stocks[i];

    console.log(`[${i + 1}/${stocks.length}] ${symbol} - ${name}`);

    // Thai stock price ranges (realistic for SET)
    // Banking stocks: ฿50-200
    // Energy stocks: ฿30-150
    // Telecom stocks: ฿20-100
    // Retail stocks: ฿20-80
    // Property stocks: ฿5-50

    const sectors: Record<string, { min: number; max: number }> = {
      'Financials': { min: 50, max: 200 },
      'Energy': { min: 30, max: 150 },
      'Technology': { min: 20, max: 100 },
      'Telecommunications': { min: 20, max: 100 },
      'Consumer Staples': { min: 20, max: 80 },
      'Consumer Discretionary': { min: 20, max: 80 },
      'Real Estate': { min: 5, max: 50 },
      'Healthcare': { min: 30, max: 150 },
      'Industrials': { min: 10, max: 100 },
      'Utilities': { min: 20, max: 80 },
      'Materials': { min: 10, max: 80 },
    };

    // Get stock's sector for price range
    const stockData = await prisma.stock.findUnique({
      where: { symbol },
      select: { sector: true },
    });

    const priceRange = stockData?.sector && sectors[stockData.sector]
      ? sectors[stockData.sector]
      : { min: 10, max: 100 };

    let basePrice = priceRange.min + Math.random() * (priceRange.max - priceRange.min);

    // Generate daily prices
    const prices = [];
    const trend = (Math.random() - 0.5) * 0.08; // Daily trend (-4% to +4%)
    const volatility = 0.015; // 1.5% daily volatility

    for (let d = 0; d < daysToGenerate; d++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + d);

      // Skip weekends
      const dayOfWeek = date.getDay();
      if (dayOfWeek === 0 || dayOfWeek === 6) {
        continue;
      }

      // Simulate price movement with trend and volatility
      const dailyChange = trend + (Math.random() - 0.5) * volatility * 2;
      basePrice = basePrice * (1 + dailyChange);

      // Ensure price stays within bounds
      if (basePrice < priceRange.min) basePrice = priceRange.min * 1.01;
      if (basePrice > priceRange.max * 3) basePrice = priceRange.max * 3;

      const open = basePrice + (Math.random() - 0.5) * basePrice * 0.01;
      const close = basePrice + (Math.random() - 0.5) * basePrice * 0.01;
      const high = Math.max(open, close) * (1 + Math.random() * 0.01);
      const low = Math.min(open, close) * (1 - Math.random() * 0.008);

      // Thai stock volumes (typically in millions)
      const baseVolume = Math.floor(Math.random() * 50000000) + 5000000;

      prices.push({
        symbol,
        date,
        open: Number(open.toFixed(2)),
        high: Number(high.toFixed(2)),
        low: Number(low.toFixed(2)),
        close: Number(close.toFixed(2)),
        adjClose: Number(close.toFixed(2)),
        volume: BigInt(baseVolume),
      });
    }

    // Batch insert
    await prisma.stockPrice.createMany({
      data: prices,
      skipDuplicates: true,
    });

    const latestPrice = prices[prices.length - 1].close;
    console.log(`  ✅ Generated ${prices.length} days | Latest: ฿${latestPrice.toFixed(2)}\n`);

    totalPricesGenerated += prices.length;
  }

  console.log('=' .repeat(60));
  console.log('✅ Synthetic Data Generation Complete!\n');
  console.log(`📊 Statistics:`);
  console.log(`   Stocks: ${stocks.length}`);
  console.log(`   Prices Generated: ${totalPricesGenerated}`);
  console.log(`   Duration: ${daysToGenerate} days`);
  console.log(`\n💡 Next steps:`);
  console.log(`   1. Run: npx tsx scripts/run-screening-th.ts`);
  console.log(`   2. View Thai stocks at: http://localhost:3030/screening?market=TH\n`);
}

generateSyntheticData()
  .catch((error) => {
    console.error('❌ Error:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
