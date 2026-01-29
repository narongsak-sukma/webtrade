/**
 * Stock Screening Script for Thai Stocks (SET100)
 *
 * Screens all Thai stocks using Minervini Trend Template
 * and generates BUY/SELL/HOLD signals
 *
 * Usage:
 *   npx tsx scripts/run-screening-th.ts
 */

import { PrismaClient } from '@prisma/client';
import { MinerviniScreenerService } from '../src/services/minerviniScreener';

const prisma = new PrismaClient();
const screener = new MinerviniScreenerService();

async function runScreening() {
  try {
    console.log('🌏 Starting SET100 stock screening (Thailand)...\n');
    console.log('=' .repeat(60));

    // Get only Thai stocks
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

    console.log(`Found ${stocks.length} SET100 stocks to screen\n`);

    let passedCount = 0;
    let failedCount = 0;
    let skippedCount = 0;

    for (let i = 0; i < stocks.length; i++) {
      const { symbol, name } = stocks[i];

      console.log(`[${i + 1}/${stocks.length}] ${symbol} - ${name}`);
      console.log(`  Screening...`);

      // Screen the stock
      const result = await screener.screenStock(symbol);

      if (!result) {
        console.log(`  ⏭️  Skipped (insufficient data)\n`);
        skippedCount++;
        continue;
      }

      // Store screening result - the screener already saved to DB, but we'll ensure it
      // The screener returns flat structure, not nested criteria/technicalIndicators
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
          // Minervini Criteria 1-8 - flat structure from screener
          priceAboveMa150: result.priceAboveMa150,
          ma150AboveMa200: result.ma150AboveMa200,
          ma200TrendingUp: result.ma200TrendingUp,
          ma50AboveMa150: result.ma50AboveMa150,
          priceAboveMa50: result.priceAboveMa50,
          priceAbove52WeekLow: result.priceAbove52WeekLow,
          priceNear52WeekHigh: result.priceNear52WeekHigh,
          relativeStrengthPositive: result.relativeStrengthPositive,
          // Technical Filters 9-14 - flat structure from screener
          rsi: result.rsi,
          rsiInRange: result.rsiInRange ?? false,
          volume: result.volume,
          volumeAvg50: result.volumeAvg50,
          volumeAboveAvg: result.volumeAboveAvg ?? false,
          macd: result.macd,
          macdSignal: result.macdSignal,
          macdBullish: result.macdBullish ?? false,
          adx: result.adx,
          adxStrong: result.adxStrong ?? false,
          ma20: result.ma20,
          priceAboveMa20: result.priceAboveMa20 ?? false,
          bollingerUpper: result.bollingerUpper,
          bollingerMiddle: result.bollingerMiddle,
          bollingerLower: result.bollingerLower,
          priceInBBRange: result.priceInBBRange ?? false,
          // Metadata
          week52Low: result.week52Low,
          week52High: result.week52High,
          relativeStrength: result.relativeStrength,
          passedCriteria: result.passedCriteria,
          totalCriteria: result.totalCriteria ?? 14,
        },
        create: {
          symbol: result.symbol,
          date: result.date,
          price: result.price,
          ma50: result.ma50,
          ma150: result.ma150,
          ma200: result.ma200,
          // Minervini Criteria 1-8 - flat structure from screener
          priceAboveMa150: result.priceAboveMa150,
          ma150AboveMa200: result.ma150AboveMa200,
          ma200TrendingUp: result.ma200TrendingUp,
          ma50AboveMa150: result.ma50AboveMa150,
          priceAboveMa50: result.priceAboveMa50,
          priceAbove52WeekLow: result.priceAbove52WeekLow,
          priceNear52WeekHigh: result.priceNear52WeekHigh,
          relativeStrengthPositive: result.relativeStrengthPositive,
          // Technical Filters 9-14 - flat structure from screener
          rsi: result.rsi,
          rsiInRange: result.rsiInRange ?? false,
          volume: result.volume,
          volumeAvg50: result.volumeAvg50,
          volumeAboveAvg: result.volumeAboveAvg ?? false,
          macd: result.macd,
          macdSignal: result.macdSignal,
          macdBullish: result.macdBullish ?? false,
          adx: result.adx,
          adxStrong: result.adxStrong ?? false,
          ma20: result.ma20,
          priceAboveMa20: result.priceAboveMa20 ?? false,
          bollingerUpper: result.bollingerUpper,
          bollingerMiddle: result.bollingerMiddle,
          bollingerLower: result.bollingerLower,
          priceInBBRange: result.priceInBBRange ?? false,
          // Metadata
          week52Low: result.week52Low,
          week52High: result.week52High,
          relativeStrength: result.relativeStrength,
          passedCriteria: result.passedCriteria,
          totalCriteria: result.totalCriteria ?? 14,
        },
      });

      if (result.passedCriteria >= 10) {
        passedCount++;
      } else {
        failedCount++;
      }

      const tier = result.passedCriteria >= 13 ? '⭐ ELITE' :
                   result.passedCriteria >= 10 ? '✅ QUALIFIED' : '❌ FAILED';

      console.log(`  ${tier} - ${result.passedCriteria}/14 criteria`);
      console.log(`  Price: ฿${result.price?.toFixed(2)} | RS: ${result.relativeStrength?.toFixed(2)}%`);
      console.log(`\n`);
    }

    console.log('=' .repeat(60));
    console.log('✅ Screening complete!\n');
    console.log(`📊 Results:`);
    console.log(`   Total Screened: ${stocks.length - skippedCount}`);
    console.log(`   Qualified (10+/14): ${passedCount}`);
    console.log(`   Failed (0-9/14): ${failedCount}`);
    console.log(`   Skipped: ${skippedCount}`);
    console.log(`\n💡 View Thai stocks at: http://localhost:3030/screening?market=TH\n`);

  } catch (error) {
    console.error('\n❌ Error:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runScreening();
