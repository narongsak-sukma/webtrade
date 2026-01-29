import { prisma } from '../src/lib/prisma';

async function quickScreen() {
  console.log('📊 Running quick screening for first 20 stocks...');

  const stocks = await prisma.stock.findMany({
    take: 20,
    select: { symbol: true }
  });

  const { minerviniScreenerService } = await import('../src/services/minerviniScreener');

  let processed = 0;
  let qualified = 0;

  for (const { symbol } of stocks) {
    try {
      console.log(`[${processed + 1}/${stocks.length}] Screening ${symbol}...`);
      const result = await minerviniScreenerService.screenStock(symbol);
      processed++;

      if (result.passedCriteria >= 6) {
        qualified++;
        console.log(`  ✅ Qualified: ${result.passedCriteria}/8`);
      } else {
        console.log(`  ❌ Failed: ${result.passedCriteria}/8`);
      }
    } catch (error) {
      console.error(`  ❌ Error: ${error}`);
    }
  }

  console.log(`\n✅ Screening complete!`);
  console.log(`   Processed: ${processed} stocks`);
  console.log(`   Qualified: ${qualified} stocks`);

  await prisma.$disconnect();
}

quickScreen();
