/**
 * Complete Trading Workflow - All Steps in Order
 *
 * This script runs the complete pipeline:
 * 1. Fetch stock data from Yahoo Finance (with rate limiting)
 * 2. Run Minervini Trend Template screening
 * 3. Generate ML signals (ONLY for stocks that passed screening)
 *
 * Usage:
 *   npx tsx scripts/run-complete-workflow.ts
 */

import { PrismaClient } from '@prisma/client';
import { yahooFinanceService } from '../src/services/yahooFinance';
import { MinerviniScreenerService } from '../src/services/minerviniScreener';
import { MLSignalService } from '../src/services/mlSignals';

const prisma = new PrismaClient();

// Configuration: Which stocks to process?
const SYMBOLS = [
  'AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA', 'META', 'NVDA',
  'BRK-B', 'LLY', 'AVGO', 'JPM', 'V', 'JNJ', 'WMT', 'PG',
  'XOM', 'MA', 'HD', 'CVX', 'MRK', 'ABBV', 'PEP', 'BAC'
];

async function runCompleteWorkflow() {
  const startTime = Date.now();

  try {
    console.log('\n' + '='.repeat(70));
    console.log('🚀 COMPLETE TRADING WORKFLOW - Starting');
    console.log('='.repeat(70));
    console.log(`📅 Date: ${new Date().toLocaleString()}`);
    console.log(`📊 Processing ${SYMBOLS.length} stocks`);
    console.log('='.repeat(70) + '\n');

    // ============================================================
    // STEP 1: Load Data from Yahoo Finance
    // ============================================================
    console.log('\n📥 STEP 1: Loading Stock Data from Yahoo Finance');
    console.log('-'.repeat(70));

    const dataFeedResult = await yahooFinanceService.fetchDataFeed(SYMBOLS, true);

    console.log(`\n✅ Step 1 Complete!`);
    console.log(`   Records updated: ${dataFeedResult.updated}`);
    console.log(`   Errors: ${dataFeedResult.errors.length}`);

    if (dataFeedResult.errors.length > 0) {
      console.log(`   Error details:`);
      dataFeedResult.errors.forEach(err => console.log(`   - ${err}`));
    }

    // ============================================================
    // STEP 2: Run Minervini Screening
    // ============================================================
    console.log('\n🔍 STEP 2: Running Minervini Trend Template Screening');
    console.log('-'.repeat(70));

    const screener = new MinerviniScreenerService();

    // Get all stocks
    const stocks = await prisma.stock.findMany({
      where: { symbol: { in: SYMBOLS } },
      select: { symbol: true },
    });

    let passedCount = 0;

    for (const { symbol } of stocks) {
      console.log(`\nScreening ${symbol}...`);

      const result = await screener.screenStock(symbol);

      if (!result) {
        console.log(`  ⏭️  Skipped (insufficient data)`);
        continue;
      }

      // Determine signal based on criteria passed
      const signal = result.passedCriteria >= 6 ? 1 : result.passedCriteria <= 2 ? -1 : 0;
      const signalText = signal === 1 ? 'BUY 🟢' : signal === -1 ? 'SELL 🔴' : 'HOLD ⏸️';
      const status = result.passedCriteria >= 6 ? '✓ PASSED' : '✗ FAILED';

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

      console.log(`  ${status} - ${result.passedCriteria}/8 criteria`);
      console.log(`  Signal: ${signalText}`);
      console.log(`  Price: $${result.price?.toFixed(2)}`);

      if (result.passedCriteria >= 6) passedCount++;
    }

    console.log(`\n✅ Step 2 Complete!`);
    console.log(`   Passed screening: ${passedCount}/${stocks.length} stocks`);

    // ============================================================
    // STEP 3: Generate ML Signals (ONLY for passed stocks)
    // ============================================================
    console.log('\n🤖 STEP 3: Generating ML Signals for Passed Stocks');
    console.log('-'.repeat(70));

    if (passedCount === 0) {
      console.log('⚠️  No stocks passed screening. Skipping ML signal generation.\n');
    } else {
      // Get stocks that passed
      const passedStocks = await prisma.screenedStock.findMany({
        where: {
          symbol: { in: SYMBOLS },
          passedCriteria: { gte: 6 },
          date: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
          },
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

      console.log(`Processing ${passedStocks.length} stocks that passed criteria...\n`);

      const mlService = new MLSignalService();
      await mlService.initialize();

      let buyCount = 0;
      let sellCount = 0;
      let holdCount = 0;

      for (const stock of passedStocks) {
        console.log(`Processing ${stock.symbol}...`);

        try {
          const signalData = await mlService.generateSignal(stock.symbol);

          if (!signalData) {
            console.log(`  ⏭️  Skipped (ML returned null)\n`);
            holdCount++;
            continue;
          }

          const signal = signalData.signal;
          let signalText = signal === 1 ? 'BUY 🟢' : signal === -1 ? 'SELL 🔴' : 'HOLD ⏸️';

          if (signal === 1) buyCount++;
          else if (signal === -1) sellCount++;
          else holdCount++;

          // Store signal
          await prisma.signal.upsert({
            where: {
              symbol_date: {
                symbol: stock.symbol,
                date: new Date(),
              },
            },
            update: {
              signal: signal,
              confidence: signalData.confidence,
              ma20Ma50: signalData.ma20Ma50,
              rsi: signalData.rsi,
              macd: signalData.macd,
              macdSignal: signalData.macdSignal,
              macdHistogram: signalData.macdHistogram,
              obv: signalData.obv || BigInt(0),
              bollingerUpper: signalData.bollingerUpper,
              bollingerMiddle: signalData.bollingerMiddle,
              bollingerLower: signalData.bollingerLower,
            },
            create: {
              symbol: stock.symbol,
              date: new Date(),
              signal: signal,
              confidence: signalData.confidence,
              ma20Ma50: signalData.ma20Ma50,
              rsi: signalData.rsi,
              macd: signalData.macd,
              macdSignal: signalData.macdSignal,
              macdHistogram: signalData.macdHistogram,
              obv: signalData.obv || BigInt(0),
              bollingerUpper: signalData.bollingerUpper,
              bollingerMiddle: signalData.bollingerMiddle,
              bollingerLower: signalData.bollingerLower,
            },
          });

          console.log(`  ✅ ${signalText} (Confidence: ${(signalData.confidence * 100).toFixed(1)}%)\n`);

        } catch (error) {
          console.error(`  ❌ Error: ${error}\n`);
          holdCount++;
        }
      }

      console.log(`✅ Step 3 Complete!`);
      console.log(`   BUY signals: ${buyCount}`);
      console.log(`   SELL signals: ${sellCount}`);
      console.log(`   HOLD signals: ${holdCount}`);
    }

    // ============================================================
    // SUMMARY
    // ============================================================
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);

    console.log('\n' + '='.repeat(70));
    console.log('✅ WORKFLOW COMPLETE!');
    console.log('='.repeat(70));
    console.log(`⏱️  Total time: ${elapsed} seconds`);
    console.log(`📊 Stocks processed: ${SYMBOLS.length}`);
    console.log(`✅ Passed screening: ${passedCount}`);
    console.log('='.repeat(70) + '\n');

    // Show today's recommendations
    const todaySignals = await prisma.signal.findMany({
      where: {
        date: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
        },
      },
      include: {
        stock: {
          select: { name: true },
        },
      },
      orderBy: {
        confidence: 'desc',
      },
    });

    if (todaySignals.length > 0) {
      console.log('🎯 Today\'s ML Recommendations:\n');
      todaySignals.forEach((sig) => {
        const signalText = sig.signal === 1 ? 'BUY 🟢' : sig.signal === -1 ? 'SELL 🔴' : 'HOLD ⏸️';
        console.log(`  ${sig.symbol} (${sig.stock?.name || 'N/A'})`);
        console.log(`    Signal: ${signalText} | Confidence: ${(sig.confidence.toNumber() * 100).toFixed(1)}%\n`);
      });
    }

  } catch (error) {
    console.error('\n❌ Workflow error:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the workflow
runCompleteWorkflow();
