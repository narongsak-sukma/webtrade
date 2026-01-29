import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkThaiElite() {
  console.log('Checking Thai Elite Stocks (13+/14 passed) - Latest results only\n');

  // Get the latest screening date
  const latestResult = await prisma.screenedStock.findFirst({
    where: {
      stock: { market: 'TH' },
    },
    orderBy: { date: 'desc' },
    select: { date: true },
  });

  if (!latestResult) {
    console.log('No Thai screening results found');
    await prisma.$disconnect();
    return;
  }

  const today = new Date(latestResult.date);
  today.setHours(0, 0, 0, 0);
  const endOfDay = new Date(today);
  endOfDay.setHours(23, 59, 59, 999);

  const eliteStocks = await prisma.screenedStock.findMany({
    where: {
      stock: { market: 'TH' },
      passedCriteria: { gte: 13 },
      date: {
        gte: today,
        lte: endOfDay,
      },
    },
    include: {
      stock: {
        select: {
          symbol: true,
          name: true,
        },
      },
    },
    orderBy: {
      passedCriteria: 'desc',
    },
  });

  console.log(`Found ${eliteStocks.length} Thai elite stocks from ${latestResult.date.toISOString().split('T')[0]}:\n`);

  eliteStocks.forEach(stock => {
    console.log(`\n${stock.stock.symbol} - ${stock.stock.name}`);
    console.log(`Score: ${stock.passedCriteria}/14`);
    console.log(`Price: ${stock.price}`);
    console.log(`\nMinervini Criteria (1-8):`);
    console.log(`  1. Price > MA150: ${stock.priceAboveMa150 ? '✓' : '✗'}`);
    console.log(`  2. MA150 > MA200: ${stock.ma150AboveMa200 ? '✓' : '✗'}`);
    console.log(`  3. MA200 Rising: ${stock.ma200TrendingUp ? '✓' : '✗'}`);
    console.log(`  4. MA50 > MA150: ${stock.ma50AboveMa150 ? '✓' : '✗'}`);
    console.log(`  5. Price > MA50: ${stock.priceAboveMa50 ? '✓' : '✗'}`);
    console.log(`  6. >30% Above 52W Low: ${stock.priceAbove52WeekLow ? '✓' : '✗'}`);
    console.log(`  7. Near 52W High: ${stock.priceNear52WeekHigh ? '✓' : '✗'}`);
    console.log(`  8. Outperforming SPY: ${stock.relativeStrengthPositive ? '✓' : '✗'}`);
    console.log(`\nTechnical Filters (9-14):`);
    console.log(`  9. RSI 30-70: ${stock.rsiInRange ? '✓' : '✗'} (${stock.rsi?.toFixed(1)})`);
    console.log(`  10. Volume Confirmation: ${stock.volumeAboveAvg ? '✓' : '✗'}`);
    console.log(`  11. MACD Bullish: ${stock.macdBullish ? '✓' : '✗'} (${stock.macd?.toFixed(2)})`);
    console.log(`  12. ADX > 25: ${stock.adxStrong ? '✓' : '✗'} (${stock.adx?.toFixed(1)})`);
    console.log(`  13. Price > MA20: ${stock.priceAboveMa20 ? '✓' : '✗'} (${stock.ma20?.toFixed(2)})`);
    console.log(`  14. Bollinger Position: ${stock.priceInBBRange ? '✓' : '✗'}`);

    // Count actual passes
    const actualPasses = [
      stock.priceAboveMa150,
      stock.ma150AboveMa200,
      stock.ma200TrendingUp,
      stock.ma50AboveMa150,
      stock.priceAboveMa50,
      stock.priceAbove52WeekLow,
      stock.priceNear52WeekHigh,
      stock.relativeStrengthPositive,
      stock.rsiInRange,
      stock.volumeAboveAvg,
      stock.macdBullish,
      stock.adxStrong,
      stock.priceAboveMa20,
      stock.priceInBBRange,
    ].filter(Boolean).length;

    console.log(`\n⚠️  Actual count: ${actualPasses}/14 (stored: ${stock.passedCriteria}/14)`);
    if (actualPasses !== stock.passedCriteria) {
      console.log(`❌ DATA INCONSISTENCY DETECTED!`);
    }
  });

  await prisma.$disconnect();
}

checkThaiElite();
