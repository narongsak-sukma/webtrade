import { prisma } from '../src/lib/prisma';

async function screenAllStocks() {
  console.log('📊 Running full screening on ALL stocks in database...\n');

  const stocks = await prisma.stock.findMany({
    select: { symbol: true },
    orderBy: { symbol: 'asc' }
  });

  console.log(`Found ${stocks.length} stocks to screen\n`);

  const { minerviniScreenerService } = await import('../src/services/minerviniScreener');
  const service = minerviniScreenerService;

  let processed = 0;
  let qualified = 0;
  let failed = 0;

  // Process in batches of 50 to avoid overwhelming
  const batchSize = 50;

  for (let i = 0; i < stocks.length; i += batchSize) {
    const batch = stocks.slice(i, i + batchSize);
    console.log(`\n📦 Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(stocks.length / batchSize)} (stocks ${i + 1}-${Math.min(i + batchSize, stocks.length)})...`);

    for (const { symbol } of batch) {
      try {
        const result = await service.screenStock(symbol);
        processed++;

        if (result) {
          if (result.passedCriteria >= 6) {
            qualified++;
            console.log(`  [${processed}/${stocks.length}] ${symbol}: ✅ ${result.passedCriteria}/8`);
          } else {
            failed++;
            console.log(`  [${processed}/${stocks.length}] ${symbol}: ❌ ${result.passedCriteria}/8`);
          }
        } else {
          console.log(`  [${processed}/${stocks.length}] ${symbol}: ⚠️  Insufficient data`);
        }
      } catch (error) {
        processed++;
        console.error(`  [${processed}/${stocks.length}] ${symbol}: ❌ Error - ${error}`);
      }
    }

    // Small delay between batches to avoid rate limiting
    if (i + batchSize < stocks.length) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  console.log(`\n✅ Screening Complete!`);
  console.log(`   Total stocks: ${stocks.length}`);
  console.log(`   Processed: ${processed}`);
  console.log(`   Qualified (6+): ${qualified}`);
  console.log(`   Failed (0-5): ${failed}`);
  console.log(`   Success rate: ${((qualified / processed) * 100).toFixed(1)}%`);

  await prisma.$disconnect();
}

screenAllStocks();
