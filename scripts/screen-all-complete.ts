import { prisma } from '../src/lib/prisma';

async function screenAllStocks() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  console.log('📊 Running full screening on ALL stocks in database...\n');
  console.log(`📅 Target date: ${today.toISOString().split('T')[0]}\n`);

  // Get all stocks
  const stocks = await prisma.stock.findMany({
    select: { symbol: true },
    orderBy: { symbol: 'asc' }
  });

  console.log(`Found ${stocks.length} stocks in database`);

  // Check which stocks already have today's screening data
  const existingScreenings = await prisma.screenedStock.findMany({
    where: {
      date: { gte: today, lt: tomorrow }
    },
    select: { symbol: true }
  });

  const processedSymbols = new Set(existingScreenings.map(s => s.symbol));
  console.log(`Already screened today: ${processedSymbols.size} stocks`);
  console.log(`Remaining to screen: ${stocks.length - processedSymbols.size} stocks\n`);

  if (processedSymbols.size >= stocks.length) {
    const qualified10 = existingScreenings.length;
    const qualified12 = await prisma.screenedStock.count({
      where: {
        date: { gte: today, lt: tomorrow },
        passedCriteria: { gte: 12 }
      }
    });

    console.log('✅ All stocks already screened for today!');
    console.log('📊 14-Filter Summary:');
    console.log(`   Total Screened: ${existingScreenings.length}`);
    console.log(`   Qualified (10+/14): ${qualified10}`);
    console.log(`   Excellent (12+/14): ${qualified12}`);
    await prisma.$disconnect();
    return;
  }

  // Filter out already processed stocks
  const stocksToScreen = stocks.filter(s => !processedSymbols.has(s.symbol));
  console.log(`Will screen ${stocksToScreen.length} stocks...\n`);

  const { minerviniScreenerService } = await import('../src/services/minerviniScreener');
  const service = minerviniScreenerService;

  let processed = 0;
  let qualified = 0;
  let failed = 0;
  let skipped = 0;

  // Process in batches of 50
  const batchSize = 50;

  for (let i = 0; i < stocksToScreen.length; i += batchSize) {
    const batch = stocksToScreen.slice(i, i + batchSize);
    const batchNum = Math.floor(i / batchSize) + 1;
    const totalBatches = Math.ceil(stocksToScreen.length / batchSize);

    console.log(`\n📦 Batch ${batchNum}/${totalBatches} (stocks ${i + 1}-${Math.min(i + batchSize, stocksToScreen.length)} of ${stocksToScreen.length})...`);

    for (const { symbol } of batch) {
      try {
        const result = await service.screenStock(symbol);
        processed++;

        if (result) {
          if (result.passedCriteria >= 10) {
            qualified++;
            console.log(`  [${processed}/${stocksToScreen.length}] ${symbol}: ✅ ${result.passedCriteria}/14`);
          } else {
            failed++;
            console.log(`  [${processed}/${stocksToScreen.length}] ${symbol}: ❌ ${result.passedCriteria}/14`);
          }
        } else {
          skipped++;
          console.log(`  [${processed}/${stocksToScreen.length}] ${symbol}: ⚠️  Insufficient data`);
        }
      } catch (error) {
        processed++;
        console.error(`  [${processed}/${stocksToScreen.length}] ${symbol}: ❌ Error - ${error}`);
      }
    }

    // Small delay between batches
    if (i + batchSize < stocksToScreen.length) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  // Get final counts
  const finalScreened = await prisma.screenedStock.count({
    where: { date: { gte: today, lt: tomorrow } }
  });
  const finalQualified = await prisma.screenedStock.count({
    where: { date: { gte: today, lt: tomorrow }, passedCriteria: { gte: 10 } }
  });
  const finalExcellent = await prisma.screenedStock.count({
    where: { date: { gte: today, lt: tomorrow }, passedCriteria: { gte: 12 } }
  });

  console.log(`\n✅ Screening Complete!`);
  console.log(`📊 14-Filter Results for ${today.toISOString().split('T')[0]}:`);
  console.log(`   Total in DB: ${stocks.length}`);
  console.log(`   Processed today: ${processed}`);
  console.log(`   Total screened: ${finalScreened}`);
  console.log(`   Qualified (10+/14): ${finalQualified}`);
  console.log(`   Excellent (12+/14): ${finalExcellent}`);
  console.log(`   Failed (0-9): ${finalScreened - finalQualified}`);
  console.log(`   Success rate: ${finalScreened > 0 ? ((finalQualified / finalScreened) * 100).toFixed(1) : 0}%`);

  await prisma.$disconnect();
}

screenAllStocks();
