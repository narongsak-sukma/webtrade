/**
 * ML Signal Generation Script for Thai Stocks (SET100)
 *
 * Complete workflow:
 * 1. Get Thai stocks that PASSED Minervini screening (score >= 10)
 * 2. Run ML analysis on passed stocks only
 * 3. Generate BUY/SELL/HOLD recommendations for TODAY
 * 4. Store signals in database
 *
 * Usage:
 *   npx tsx scripts/generate-ml-signals-th.ts
 */

import { PrismaClient } from '@prisma/client';
import { MLSignalService } from '../src/services/mlSignals';

const prisma = new PrismaClient();
const mlService = new MLSignalService();

async function generateMLSignalsTH() {
  try {
    console.log('🌏 ML Signal Generation for Thai Stocks (SET100) - Starting...\n');

    // Initialize ML service
    await mlService.initialize();
    console.log('✅ ML Service initialized\n');

    // Step 1: Get Thai stocks that PASSED screening (score >= 10)
    console.log('📊 Step 1: Fetching Thai stocks that passed Minervini criteria...');

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const passedStocks = await prisma.screenedStock.findMany({
      where: {
        stock: {
          market: 'TH',
        },
        passedCriteria: {
          gte: 10, // Passed 10 or more criteria out of 14
        },
        date: {
          gte: today,
        },
      },
      include: {
        stock: {
          select: {
            name: true,
            sector: true,
            market: true,
            currency: true,
          },
        },
      },
      orderBy: {
        passedCriteria: 'desc', // Best stocks first
      },
    });

    console.log(`✅ Found ${passedStocks.length} Thai stocks that passed screening\n`);

    if (passedStocks.length === 0) {
      console.log('⚠️  No Thai stocks passed screening. Run Thai screening first:');
      console.log('   npx tsx scripts/run-screening-th.ts\n');
      return;
    }

    // Show passed stocks
    console.log('📈 Thai stocks that passed Minervini criteria:\n');
    passedStocks.forEach((stock, index) => {
      const currency = stock.stock?.currency === 'THB' ? '฿' : '$';
      console.log(`  ${index + 1}. ${stock.symbol} (${stock.stock?.name || 'N/A'})`);
      console.log(`     Score: ${stock.passedCriteria}/14 | Price: ${currency}${stock.price?.toFixed(2)}`);
    });
    console.log('');

    // Step 2: Generate ML signals for passed stocks only
    console.log('🤖 Step 2: Generating ML signals for Thai stocks...\n');

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

        const currency = stock.stock?.currency === 'THB' ? '฿' : '$';
        console.log(`  ✅ Signal: ${signalText}`);
        console.log(`     Confidence: ${(signalData.confidence * 100).toFixed(1)}%`);
        console.log(`     RSI: ${signalData.rsi.toFixed(2)} | MACD: ${signalData.macd.toFixed(2)}`);
        console.log(`     Price: ${currency}${stock.price?.toFixed(2)}\n`);

      } catch (error) {
        console.error(`  ❌ Error: ${error}\n`);
        holdCount++;
      }
    }

    // Summary
    console.log('='.repeat(60));
    console.log('✅ ML Signal Generation Complete for Thai Stocks!');
    console.log('='.repeat(60));
    console.log(`Market: TH (SET100)`);
    console.log(`Total Stocks Analyzed: ${passedStocks.length}`);
    console.log(`BUY Signals 🟢: ${buyCount}`);
    console.log(`SELL Signals 🔴: ${sellCount}`);
    console.log(`HOLD Signals ⏸️ : ${holdCount}`);
    console.log('='.repeat(60));

    // Show BUY recommendations
    const buySignals = await prisma.signal.findMany({
      where: {
        date: {
          gte: today,
        },
        signal: 1,
      },
      include: {
        stock: {
          select: { name: true, market: true, currency: true },
        },
      },
      orderBy: {
        confidence: 'desc',
      },
    });

    // Filter only Thai stocks
    const thaiBuySignals = buySignals.filter(s => s.stock?.market === 'TH');

    if (thaiBuySignals.length > 0) {
      console.log('\n🎯 Today\'s Thai BUY Recommendations:\n');
      thaiBuySignals.forEach((sig, i) => {
        const currency = sig.stock?.currency === 'THB' ? '฿' : '$';
        console.log(`  ${i + 1}. ${sig.symbol} (${sig.stock?.name || 'N/A'})`);
        console.log(`     Confidence: ${(sig.confidence.toNumber() * 100).toFixed(1)}%`);
      });
      console.log('');
    }

    console.log('💡 View Thai signals at: http://localhost:3030/signals?market=TH\n');

  } catch (error) {
    console.error('\n❌ Error generating Thai ML signals:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
generateMLSignalsTH();
