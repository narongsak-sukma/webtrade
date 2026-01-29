/**
 * Historical Data Import Script
 *
 * Imports historical stock price data from CSV files or generates synthetic data
 * for ML model training and testing.
 *
 * Usage:
 *   npm run db:seed-import  # Generate synthetic data
 *   node scripts/import-historical-data.ts  # Import from CSV
 */

import { PrismaClient } from '@prisma/client';
import { readFileSync } from 'fs';
import { join } from 'path';

const prisma = new PrismaClient();

interface HistoricalPriceData {
  symbol: string;
  name: string;
  exchange: string;
  prices: {
    date: string;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
    adjClose: number;
  }[];
}

/**
 * Generate synthetic historical price data for testing/ML training
 */
async function generateSyntheticData() {
  console.log('Generating synthetic historical data...\n');

  // Fetch all stocks from database
  const stocks = await prisma.stock.findMany({
    select: { symbol: true, name: true, sector: true }
  });

  console.log(`Generating data for ${stocks.length} stocks...\n`);

  const daysToGenerate = 500; // ~2 years of daily data
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - daysToGenerate);

  for (const stock of stocks) {
    const symbol = stock.symbol;
    console.log(`[${stocks.indexOf(stock) + 1}/${stocks.length}] Generating data for ${symbol}...`);

    // Stock already exists in database, just generate prices
    const prices = [];
    let basePrice = 50 + Math.random() * 150; // $50-$200 starting price
    const trend = (Math.random() - 0.5) * 0.1; // -0.05 to +0.05 daily trend (smaller)

    for (let i = 0; i < daysToGenerate; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);

      // Simulate realistic price movement with smaller volatility
      basePrice = basePrice * (1 + trend + (Math.random() - 0.5) * 0.02);

      // Ensure price stays within reasonable bounds
      if (basePrice < 10) basePrice = 10;
      if (basePrice > 5000) basePrice = 5000;

      const open = basePrice + (Math.random() - 0.5) * basePrice * 0.01;
      const close = basePrice + (Math.random() - 0.5) * basePrice * 0.01;
      const high = Math.max(open, close) + Math.random() * basePrice * 0.005;
      const low = Math.min(open, close) - Math.random() * basePrice * 0.005;
      const volume = Math.floor(Math.random() * 10000000) + 100000;

      prices.push({
        date,
        open: Number(open.toFixed(2)),
        high: Number(high.toFixed(2)),
        low: Number(low.toFixed(2)),
        close: Number(close.toFixed(2)),
        volume,
        adjClose: Number(close.toFixed(2)),
      });
    }

    // Batch insert prices
    await prisma.stockPrice.createMany({
      data: prices.map(p => ({
        symbol,
        ...p,
      })),
      skipDuplicates: true,
    });

    console.log(`  ✓ Generated ${prices.length} days of data`);
  }

  console.log('\n✓ Synthetic data generation complete!\n');
}

/**
 * Calculate look-ahead returns for ML labeling
 */
async function calculateLookAheadReturns(symbol: string, lookAheadDays: number = 10) {
  const prices = await prisma.stockPrice.findMany({
    where: { symbol },
    orderBy: { date: 'asc' },
  });

  if (prices.length < lookAheadDays + 50) {
    console.log(`Insufficient data for ${symbol} (need ${lookAheadDays + 50} days)`);
    return [];
  }

  const labels = [];

  for (let i = 50; i < prices.length - lookAheadDays; i++) {
    const currentPrice = Number(prices[i].close);
    const futurePrice = Number(prices[i + lookAheadDays].close);
    const returnValue = (futurePrice - currentPrice) / currentPrice;

    let label: 'buy' | 'sell' | 'hold' = 'hold';
    if (returnValue > 0.05) {
      label = 'buy';
    } else if (returnValue < -0.03) {
      label = 'sell';
    }

    labels.push({
      date: prices[i].date,
      symbol,
      returnValue,
      label,
    });
  }

  return labels;
}

/**
 * Generate ML training features from price data
 */
async function generateTrainingFeatures() {
  console.log('Generating ML training features...\n');

  const symbols = await prisma.stock.findMany({
    select: { symbol: true },
  });

  const allFeatures = [];

  for (const { symbol } of symbols) {
    const prices = await prisma.stockPrice.findMany({
      where: { symbol },
      orderBy: { date: 'asc' },
    });

    if (prices.length < 200) {
      console.log(`  ⚠️  ${symbol}: Insufficient data (${prices.length} days), skipping`);
      continue;
    }

    console.log(`Processing ${symbol} (${prices.length} days)...`);

    // Calculate technical indicators
    for (let i = 50; i < prices.length; i++) {
      const pricesSlice = prices.slice(0, i + 1);

      // SMA calculations
      const sma50 = calculateSMA(pricesSlice.slice(-50), p => Number(p.close));
      const sma150 = calculateSMA(pricesSlice.slice(-150), p => Number(p.close));
      const sma200 = calculateSMA(pricesSlice.slice(-200), p => Number(p.close));

      // RSI (14-period)
      const rsi = calculateRSI(pricesSlice.slice(-15), p => Number(p.close));

      // Price position relative to SMAs
      const currentClose = Number(prices[i].close);
      const priceAboveMa150 = currentClose > sma150;
      const ma150AboveMa200 = sma150 > sma200;
      const priceAboveMa50 = currentClose > sma50;
      const priceAboveMa200 = currentClose > sma200;

      // 52-week high/low
      const week52Data = pricesSlice.slice(-252);
      const week52High = Math.max(...week52Data.map(p => Number(p.high)));
      const week52Low = Math.min(...week52Data.map(p => Number(p.low)));
      const priceNear52High = currentClose >= week52High * 0.97;
      const priceAbove52WeekLow = currentClose > week52Low;

      // Volume trend
      const volumes = pricesSlice.slice(-20).map(p => Number(p.volume));
      const avgVolume = volumes.reduce((a, b) => a + b, 0) / volumes.length;
      const recentVolume = Number(pricesSlice.slice(-1)[0].volume);
      const highVolume = recentVolume > avgVolume * 1.5;

      // Volatility (standard deviation over 20 days)
      const returns = pricesSlice.slice(-21).slice(1).map((p, idx) =>
        (Number(p.close) - Number(pricesSlice[idx].close)) / Number(pricesSlice[idx].close)
      );
      const volatility = Math.sqrt(returns.reduce((sum, r) => sum + r * r, 0) / returns.length);

      allFeatures.push({
        symbol: symbol,
        date: prices[i].date,
        price: currentClose,
        sma50,
        sma150,
        sma200,
        rsi,
        priceAboveMa150,
        ma150AboveMa200,
        priceAboveMa50,
        priceAboveMa200,
        priceNear52High,
        priceAbove52WeekLow,
        highVolume,
        volatility,
      });
    }

    console.log(`  ✓ Generated ${allFeatures.length} feature vectors`);
  }

  return allFeatures;
}

// Helper functions
function calculateSMA(prices: any[], accessor: (p: any) => number): number {
  if (prices.length === 0) return 0;
  const sum = prices.reduce((acc, p) => acc + accessor(p), 0);
  return sum / prices.length;
}

function calculateRSI(prices: any[], accessor: (p: any) => number): number {
  if (prices.length < 2) return 50;

  let gains = 0;
  let losses = 0;

  for (let i = 1; i < prices.length; i++) {
    const change = accessor(prices[i]) - accessor(prices[i - 1]);
    if (change > 0) gains += change;
    else losses -= change;
  }

  const avgGain = gains / prices.length;
  const avgLoss = losses / prices.length;

  if (avgLoss === 0) return 100;

  const rs = 100 - (100 / (1 + avgGain / avgLoss));
  return rs;
}

/**
 * Main execution
 */
async function main() {
  const args = process.argv.slice(2);
  const mode = args[0] || 'generate';

  try {
    if (mode === 'generate') {
      await generateSyntheticData();
    } else if (mode === 'import') {
      console.log('CSV import not yet implemented');
    } else {
      console.log(`
Usage:
  npm run db:seed-import  Generate synthetic historical data
  node scripts/import-historical-data.ts import  Import from CSV files

Current database state:
  ${JSON.stringify(await prisma.stock.count(), null, 2)} stocks
  ${JSON.stringify(await prisma.stockPrice.count(), null, 2)} price records
      `);
    }

    // Generate training features after data is loaded
    if (mode === 'generate') {
      console.log('\nGenerating ML training features...');
      const features = await generateTrainingFeatures();
      console.log(`\n✓ Total training samples: ${features.length}`);
    }

  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  main();
}

export { generateSyntheticData, calculateLookAheadReturns, generateTrainingFeatures };
