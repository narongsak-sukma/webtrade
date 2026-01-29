/**
 * Stock Screening Script
 *
 * Screens all stocks in database using Minervini Trend Template
 * and generates BUY/SELL/HOLD signals
 *
 * Usage:
 *   npx tsx scripts/run-screening.ts
 */

import { PrismaClient } from '@prisma/client';
import { MinerviniScreenerService } from '../src/services/minerviniScreener';

const prisma = new PrismaClient();
const screener = new MinerviniScreenerService();

async function runScreening() {
  try {
    console.log('🔍 Starting stock screening...\n');

    // Get all stocks
    const stocks = await prisma.stock.findMany({
      select: { symbol: true },
    });

    console.log(`Found ${stocks.length} stocks to screen\n`);

    let passedCount = 0;
    let failedCount = 0;

    for (const { symbol } of stocks) {
      console.log(`Screening ${symbol}...`);

      // Screen the stock
      const result = await screener.screenStock(symbol);

      if (!result) {
        console.log(`  ⏭️  Skipped (insufficient data)\n`);
        failedCount++;
        continue;
      }

      // Determine signal for display (not stored in DB, calculated on the fly)
      const signal = result.passedCriteria >= 6 ? 1 : result.passedCriteria <= 2 ? -1 : 0;

      // Store screening result
      await prisma.screenedStock.upsert({
        where: {
          symbol_date: {
            symbol: result.symbol,
            date: result.date,
          },
        },
        update: {
          price: result.price,
          ma50: result.ma50,
          ma150: result.ma150,
          ma200: result.ma200,
          priceAboveMa150: result.criteria?.priceAboveMa150 ?? false,
          ma150AboveMa200: result.criteria?.ma150AboveMa200 ?? false,
          ma200TrendingUp: result.criteria?.ma200TrendingUp ?? false,
          ma50AboveMa150: result.criteria?.ma50AboveMa150 ?? false,
          priceAboveMa50: result.criteria?.priceAboveMa50 ?? false,
          priceAbove52WeekLow: result.criteria?.priceAbove52wLow ?? false,
          priceNear52WeekHigh: result.criteria?.priceNear52wHigh ?? false,
          relativeStrengthPositive: result.criteria?.rsPositive ?? false,
          week52Low: result.week52Low,
          week52High: result.week52High,
          relativeStrength: result.relativeStrength,
          passedCriteria: result.passedCriteria,
        },
        create: {
          symbol: result.symbol,
          date: result.date,
          price: result.price,
          ma50: result.ma50,
          ma150: result.ma150,
          ma200: result.ma200,
          priceAboveMa150: result.criteria?.priceAboveMa150 ?? false,
          ma150AboveMa200: result.criteria?.ma150AboveMa200 ?? false,
          ma200TrendingUp: result.criteria?.ma200TrendingUp ?? false,
          ma50AboveMa150: result.criteria?.ma50AboveMa150 ?? false,
          priceAboveMa50: result.criteria?.priceAboveMa50 ?? false,
          priceAbove52WeekLow: result.criteria?.priceAbove52wLow ?? false,
          priceNear52WeekHigh: result.criteria?.priceNear52wHigh ?? false,
          relativeStrengthPositive: result.criteria?.rsPositive ?? false,
          week52Low: result.week52Low,
          week52High: result.week52High,
          relativeStrength: result.relativeStrength,
          passedCriteria: result.passedCriteria,
        },
      });

      const signalText = signal === 1 ? 'BUY 🟢' : signal === -1 ? 'SELL 🔴' : 'HOLD ⏸️';
      const status = result.passedCriteria >= 6 ? '✓ PASSED' : '✗ FAILED';

      console.log(`  ${status} - ${result.passedCriteria}/8 criteria`);
      console.log(`  Signal: ${signalText}`);
      console.log(`  Price: $${result.price?.toFixed(2)} | RS: ${result.relativeStrength?.toFixed(2)}%\n`);

      if (result.passedCriteria >= 6) passedCount++;
      else failedCount++;
    }

    console.log('\n' + '='.repeat(50));
    console.log('✅ Screening complete!');
    console.log('='.repeat(50));
    console.log(`Total stocks screened: ${stocks.length}`);
    console.log(`Passed criteria (>=6): ${passedCount}`);
    console.log(`Failed criteria (<6): ${failedCount}`);
    console.log('='.repeat(50));

    // Show summary of passed stocks
    const passedStocks = await prisma.screenedStock.findMany({
      where: {
        date: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
        },
        passedCriteria: { gte: 6 },
      },
      include: {
        stock: {
          select: { name: true },
        },
      },
      orderBy: {
        passedCriteria: 'desc',
      },
    });

    if (passedStocks.length > 0) {
      console.log('\n📊 Stocks that passed Minervini criteria:\n');
      passedStocks.forEach(s => {
        const signal = s.signal === 1 ? 'BUY' : s.signal === -1 ? 'SELL' : 'HOLD';
        console.log(`  ${s.symbol} (${s.stock?.name || 'N/A'})`);
        console.log(`    Signal: ${signal} | Score: ${s.passedCriteria}/8 | Price: $${s.price?.toFixed(2)}`);
      });
    }

  } catch (error) {
    console.error('❌ Error during screening:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runScreening();
