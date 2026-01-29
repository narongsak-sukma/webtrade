/**
 * Test fetching Thai stock prices (limited to 3 stocks)
 */

import { PrismaClient } from '@prisma/client';
import yahooFinance from 'yahoo-finance2';

const prisma = new PrismaClient();
yahooFinance.suppressNotices(['ripHistorical']);

async function testFetch() {
  console.log('🌏 Testing Thai Stock Price Fetching (3 stocks)\n');

  // Get only first 3 Thai stocks
  const stocks = await prisma.stock.findMany({
    where: { market: 'TH' },
    select: { symbol: true, name: true },
    orderBy: { symbol: 'asc' },
    take: 3,
  });

  console.log(`Found ${stocks.length} stocks to test:\n`);

  const startDate = new Date();
  startDate.setMonth(startDate.getMonth() - 3); // 3 months for testing

  console.log(`📅 Fetching from: ${startDate.toISOString().split('T')[0]}\n`);

  for (let i = 0; i < stocks.length; i++) {
    const { symbol, name } = stocks[i];
    console.log(`[${i + 1}/${stocks.length}] ${symbol} - ${name}`);

    try {
      const result = await yahooFinance.chart(symbol, {
        period1: startDate.toISOString().split('T')[0],
        interval: '1d',
      });

      if (!result || !result.quotes || result.quotes.length === 0) {
        console.log(`    ⚠️  No data found\n`);
        continue;
      }

      const priceData = result.quotes.map((quote: any) => ({
        symbol,
        date: new Date(quote.date),
        open: parseFloat(quote.open),
        high: parseFloat(quote.high),
        low: parseFloat(quote.low),
        close: parseFloat(quote.close),
        adjClose: parseFloat(quote.close),
        volume: BigInt(quote.volume),
      }));

      await prisma.stockPrice.createMany({
        data: priceData,
        skipDuplicates: true,
      });

      const latest = result.quotes[result.quotes.length - 1];
      console.log(`    ✅ ${priceData.length} days fetched`);
      console.log(`    Latest: ${latest.date} - Close: ฿${parseFloat(latest.close).toFixed(2)}\n`);

    } catch (error) {
      console.error(`    ❌ Error: ${error instanceof Error ? error.message : error}\n`);
    }

    // Rate limit delay
    if (i < stocks.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  console.log('✅ Test complete!');
  await prisma.$disconnect();
}

testFetch();
