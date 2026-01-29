/**
 * Generate Synthetic Market Index Data
 *
 * Generates realistic S&P 500 and VIX data for market regime detection
 *
 * Usage:
 *   npx tsx scripts/generate-market-data.ts
 */

import { prisma } from '../src/lib/prisma';

async function generateMarketData() {
  console.log('\n' + '='.repeat(70));
  console.log('📊 GENERATING SYNTHETIC MARKET DATA');
  console.log('='.repeat(70) + '\n');

  const endDate = new Date();
  const startDate = new Date(endDate);
  startDate.setDate(startDate.getDate() - 500); // 500 days back
  const daysToGenerate = 500;

  // Generate S&P 500 data (simulating different market regimes)
  console.log('📈 Generating S&P 500 (^GSPC) data...');

  const sp500Data = [];
  let sp500Price = 4000; // Starting price

  for (let i = 0; i < daysToGenerate; i++) {
    const date = new Date(startDate);
    date.setDate(date.getDate() + i);

    // Skip weekends
    if (date.getDay() === 0 || date.getDay() === 6) continue;

    // Simulate different market regimes
    const regimePhase = Math.floor(i / 100); // Change regime every ~100 days
    let dailyReturn = 0;

    switch (regimePhase % 4) {
      case 0: // BULL market
        dailyReturn = (Math.random() - 0.45) * 0.02; // Slight upward bias
        break;
      case 1: // SIDEWAYS
        dailyReturn = (Math.random() - 0.5) * 0.01; // No bias
        break;
      case 2: // BEAR market
        dailyReturn = (Math.random() - 0.55) * 0.02; // Slight downward bias
        break;
      case 3: // VOLATILE
        dailyReturn = (Math.random() - 0.5) * 0.04; // High volatility
        break;
    }

    const open = sp500Price;
    const change = sp500Price * dailyReturn;
    const close = open + change;
    const high = Math.max(open, close) * (1 + Math.random() * 0.005);
    const low = Math.min(open, close) * (1 - Math.random() * 0.005);
    const volume = 2000000000 + Math.random() * 500000000;

    sp500Data.push({
      symbol: '^GSPC',
      date,
      open,
      high,
      low,
      close,
      volume: BigInt(Math.floor(volume)),
      adjClose: close,
    });

    sp500Price = close;
  }

  // Generate VIX data (inverse correlation to S&P 500 returns)
  console.log('📊 Generating VIX (^VIX) data...');

  const vixData = [];
  let vixValue = 20; // Starting VIX

  for (let i = 0; i < sp500Data.length; i++) {
    const sp500Item = sp500Data[i];
    const sp500Return = (sp500Item.close - sp500Item.open) / sp500Item.open;

    // VIX tends to rise when market falls
    const vixChange = -sp500Return * 50 + (Math.random() - 0.5) * 2;
    vixValue = Math.max(10, Math.min(50, vixValue + vixChange)); // Keep between 10-50

    const date = sp500Item.date;
    const open = vixValue;
    const close = vixValue * (1 + (Math.random() - 0.5) * 0.05);
    const high = Math.max(open, close) * (1 + Math.random() * 0.02);
    const low = Math.min(open, close) * (1 - Math.random() * 0.02);
    const volume = BigInt(0);

    vixData.push({
      symbol: '^VIX',
      date,
      open,
      high,
      low,
      close,
      volume,
      adjClose: close,
    });
  }

  // Clear existing data
  console.log('\n🗑️  Clearing existing market data...');
  await prisma.stockPrice.deleteMany({
    where: {
      symbol: { in: ['^GSPC', '^VIX'] },
    },
  });

  // Insert S&P 500 data
  console.log(`\n💾 Inserting ${sp500Data.length} S&P 500 records...`);
  await prisma.stockPrice.createMany({
    data: sp500Data,
    skipDuplicates: true,
  });

  // Insert VIX data
  console.log(`💾 Inserting ${vixData.length} VIX records...`);
  await prisma.stockPrice.createMany({
    data: vixData,
    skipDuplicates: true,
  });

  // Calculate some stats
  const sp500Latest = sp500Data[sp500Data.length - 1];
  const sp500First = sp500Data[0];
  const sp500Change = ((sp500Latest.close - sp500First.close) / sp500First.close) * 100;

  const vixLatest = vixData[vixData.length - 1];
  const avgVIX = vixData.reduce((sum, d) => sum + d.close, 0) / vixData.length;

  console.log('\n✅ Market Data Generation Complete!');
  console.log('\n📊 S&P 500 Summary:');
  console.log(`  Start Price: ${sp500First.close.toFixed(2)}`);
  console.log(`  End Price: ${sp500Latest.close.toFixed(2)}`);
  console.log(`  Change: ${sp500Change.toFixed(2)}%`);
  console.log(`  Days: ${sp500Data.length}`);

  console.log('\n📊 VIX Summary:');
  console.log(`  Current: ${vixLatest.close.toFixed(2)}`);
  console.log(`  Average: ${avgVIX.toFixed(2)}`);
  console.log(`  Days: ${vixData.length}`);

  console.log('\n' + '='.repeat(70));
  console.log('✅ MARKET DATA READY FOR REGIME DETECTION');
  console.log('='.repeat(70) + '\n');
}

// Run
generateMarketData().catch(console.error);
