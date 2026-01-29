/**
 * Verify Thai ML Signals in Database
 *
 * Checks that ML signals were correctly generated and stored for Thai stocks
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function verifyThaiSignals() {
  try {
    console.log('🔍 Verifying Thai ML Signals in Database\n');

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Get all Thai signals from today
    const thaiSignals = await prisma.signal.findMany({
      where: {
        date: {
          gte: today,
        },
        stock: {
          market: 'TH',
        },
      },
      include: {
        stock: {
          select: {
            name: true,
            market: true,
            currency: true,
          },
        },
      },
      orderBy: {
        confidence: 'desc',
      },
    });

    console.log(`✅ Found ${thaiSignals.length} Thai ML signals for today\n`);

    if (thaiSignals.length === 0) {
      console.log('⚠️  No Thai signals found. Make sure to run:');
      console.log('   npx tsx scripts/generate-ml-signals-th.ts\n');
      return;
    }

    // Count signals by type
    const buySignals = thaiSignals.filter(s => s.signal === 1);
    const sellSignals = thaiSignals.filter(s => s.signal === -1);
    const holdSignals = thaiSignals.filter(s => s.signal === 0);

    console.log('📊 Signal Summary:');
    console.log(`   BUY Signals 🟢: ${buySignals.length}`);
    console.log(`   SELL Signals 🔴: ${sellSignals.length}`);
    console.log(`   HOLD Signals ⏸️ : ${holdSignals.length}\n`);

    // Show top 5 signals by confidence
    console.log('🎯 Top 5 Thai Signals by Confidence:\n');
    thaiSignals.slice(0, 5).forEach((sig, i) => {
      const currency = sig.stock?.currency === 'THB' ? '฿' : '$';
      const signalText = sig.signal === 1 ? 'BUY 🟢' : sig.signal === -1 ? 'SELL 🔴' : 'HOLD ⏸️';
      console.log(`  ${i + 1}. ${sig.symbol} (${sig.stock?.name || 'N/A'})`);
      console.log(`     Signal: ${signalText}`);
      console.log(`     Confidence: ${(sig.confidence.toNumber() * 100).toFixed(1)}%`);
      console.log(`     RSI: ${sig.rsi.toFixed(2)} | MACD: ${sig.macd.toFixed(2)}`);
      console.log('');
    });

    // Verify data integrity
    console.log('✅ Data Integrity Check:');
    console.log(`   All signals have market: ${thaiSignals.every(s => s.stock?.market === 'TH') ? '✅' : '❌'}`);
    console.log(`   All signals have currency: ${thaiSignals.every(s => s.stock?.currency === 'THB') ? '✅' : '❌'}`);
    console.log(`   All signals have valid confidence: ${thaiSignals.every(s => s.confidence.toNumber() >= 0 && s.confidence.toNumber() <= 1) ? '✅' : '❌'}`);
    console.log('');

    console.log('💡 View Thai signals at: http://localhost:3030/signals?market=TH\n');

  } catch (error) {
    console.error('\n❌ Error verifying Thai signals:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the verification
verifyThaiSignals();
