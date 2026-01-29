/**
 * ML Signal Generation Script
 *
 * Complete workflow:
 * 1. Get stocks that PASSED Minervini screening (score >= 6)
 * 2. Run ML analysis on passed stocks only
 * 3. Generate BUY/SELL/HOLD recommendations for TODAY
 * 4. Store signals in database
 *
 * Usage:
 *   npx tsx scripts/generate-ml-signals.ts
 */

import { PrismaClient } from '@prisma/client';
import { MLSignalService } from '../src/services/mlSignals';

const prisma = new PrismaClient();
const mlService = new MLSignalService();

async function generateMLSignals() {
  try {
    console.log('🤖 ML Signal Generation - Starting...\n');

    // Initialize ML service
    await mlService.initialize();
    console.log('✅ ML Service initialized\n');

    // Step 1: Get stocks that PASSED screening (score >= 6)
    console.log('📊 Step 1: Fetching stocks that passed Minervini criteria...');

    const passedStocks = await prisma.screenedStock.findMany({
      where: {
        passedCriteria: {
          gte: 6, // Passed 6 or more criteria out of 8
        },
        date: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
        },
      },
      include: {
        stock: {
          select: {
            name: true,
            sector: true,
          },
        },
      },
      orderBy: {
        passedCriteria: 'desc', // Best stocks first
      },
    });

    console.log(`✅ Found ${passedStocks.length} stocks that passed screening\n`);

    if (passedStocks.length === 0) {
      console.log('⚠️  No stocks passed screening. Run screening first:');
      console.log('   npx tsx scripts/run-screening.ts\n');
      return;
    }

    // Show passed stocks
    console.log('📈 Stocks that passed Minervini criteria:\n');
    passedStocks.forEach((stock, index) => {
      console.log(`  ${index + 1}. ${stock.symbol} (${stock.stock?.name || 'N/A'})`);
      console.log(`     Score: ${stock.passedCriteria}/8 | Price: $${stock.price?.toFixed(2)}`);
    });
    console.log('');

    // Step 2: Generate ML signals for passed stocks only
    console.log('🤖 Step 2: Generating ML signals for passed stocks...\n');

    let buyCount = 0;
    let sellCount = 0;
    let holdCount = 0;

    for (const stock of passedStocks) {
      console.log(`Processing ${stock.symbol}...`);

      try {
        // Check if we have enough price data
        const priceCount = await prisma.stockPrice.count({
          where: { symbol: stock.symbol }
        });

        if (priceCount < 60) {
          console.log(`  ⏭️  Skipped (insufficient data: ${priceCount} days)\n`);
          holdCount++;
          continue;
        }

        // Generate ML signal (service fetches prices internally)
        const signalData = await mlService.generateSignal(stock.symbol);

        if (!signalData) {
          console.log(`  ⏭️  Skipped (ML service returned null)\n`);
          holdCount++;
          continue;
        }

        // Signal is already calculated (1=buy, 0=hold, -1=sell)
        const signal = signalData.signal;
        let signalText = signal === 1 ? 'BUY 🟢' : signal === -1 ? 'SELL 🔴' : 'HOLD ⏸️';

        if (signal === 1) buyCount++;
        else if (signal === -1) sellCount++;
        else holdCount++;

        // Store signal in database
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

        console.log(`  ✅ Signal: ${signalText}`);
        console.log(`     Confidence: ${(signalData.confidence * 100).toFixed(1)}%`);
        console.log(`     RSI: ${signalData.rsi.toFixed(2)} | MACD: ${signalData.macd.toFixed(2)}\n`);

      } catch (error) {
        console.error(`  ❌ Error: ${error}\n`);
        holdCount++;
      }
    }

    // Summary
    console.log('='.repeat(60));
    console.log('✅ ML Signal Generation Complete!');
    console.log('='.repeat(60));
    console.log(`Total Stocks Analyzed: ${passedStocks.length}`);
    console.log(`BUY Signals 🟢: ${buyCount}`);
    console.log(`SELL Signals 🔴: ${sellCount}`);
    console.log(`HOLD Signals ⏸️ : ${holdCount}`);
    console.log('='.repeat(60));

    // Show BUY recommendations
    const buySignals = await prisma.signal.findMany({
      where: {
        date: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
        },
        signal: 1,
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

    if (buySignals.length > 0) {
      console.log('\n🎯 Today\'s BUY Recommendations:\n');
      buySignals.forEach((sig, i) => {
        console.log(`  ${i + 1}. ${sig.symbol} (${sig.stock?.name || 'N/A'})`);
        console.log(`     Confidence: ${(sig.confidence.toNumber() * 100).toFixed(1)}%`);
      });
      console.log('');
    }

  } catch (error) {
    console.error('❌ Error generating ML signals:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
generateMLSignals();
