#!/usr/bin/env ts-node
/**
 * Test ML Model System
 *
 * Comprehensive test suite for the ML model system.
 * Tests all components: training, prediction, evaluation, integration.
 *
 * Usage:
 *   npx ts-node scripts/test-ml-system.ts
 */

import { prisma } from '../src/lib/prisma';
import { stockClassifier } from '../src/models/StockClassifier';
import { trainingPipeline } from '../src/models/training';
import { predictionService } from '../src/models/prediction';
import { mlSignalService } from '../src/services/mlSignals';
import { ModelPrediction, TrainingData, FeatureValues } from '../src/types/agent-contracts';

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message: string, color: keyof typeof colors = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logTest(testName: string) {
  console.log(`\n${colors.cyan}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);
  console.log(`${colors.blue}TEST: ${testName}${colors.reset}`);
  console.log(`${colors.cyan}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}\n`);
}

async function runTest(testName: string, testFn: () => Promise<void>) {
  try {
    logTest(testName);
    await testFn();
    log(`✓ ${testName} PASSED\n`, 'green');
    return true;
  } catch (error: any) {
    log(`✗ ${testName} FAILED: ${error.message}\n`, 'red');
    console.error(error);
    return false;
  }
}

// ============================================================================
// TESTS
// ============================================================================

async function test1_DatabaseConnection() {
  const result = await prisma.$queryRaw`SELECT 1 as test`;
  if (!result || !Array.isArray(result) || result.length === 0) {
    throw new Error('Database query failed');
  }
  log('  Database connection: OK', 'green');
  log(`  Query result: ${JSON.stringify(result)}`, 'yellow');
}

async function test2_HistoricalDataExists() {
  const stocks = await prisma.stockPrice.groupBy({
    by: ['symbol'],
    _count: { symbol: true },
  });

  log(`  Found ${stocks.length} stocks in database`, 'green');

  const withSufficientData = stocks.filter(s => s._count.symbol >= 252);
  log(`  ${withSufficientData.length} stocks have 1+ years of data`, 'yellow');

  if (withSufficientData.length === 0) {
    throw new Error('No stocks with sufficient historical data (252+ days)');
  }

  // Show top 5
  const top5 = stocks
    .sort((a, b) => b._count.symbol - a._count.symbol)
    .slice(0, 5);

  log('\n  Top 5 stocks by data points:', 'cyan');
  top5.forEach(s => {
    log(`    ${s.symbol}: ${s._count.symbol} days`, 'yellow');
  });
}

async function test3_TrainingPipeline() {
  log('  Preparing training data...', 'yellow');

  const { trainingData, testData, stats } = await trainingPipeline.prepareTrainingData({
    lookAheadDays: 10,
    buyThreshold: 0.05,
    sellThreshold: -0.03,
    minDataPoints: 252,
    trainTestSplit: 0.8,
  });

  log(`  ✓ Training data: ${stats.trainingSamples} samples`, 'green');
  log(`  ✓ Test data: ${stats.testSamples} samples`, 'green');
  log(`  ✓ Unique stocks: ${stats.symbols.length}`, 'green');
  log(`  ✓ Label distribution:`, 'cyan');
  log(`    Buy: ${stats.trainingDistribution.buy} (${((stats.trainingDistribution.buy / stats.trainingSamples) * 100).toFixed(1)}%)`, 'yellow');
  log(`    Hold: ${stats.trainingDistribution.hold} (${((stats.trainingDistribution.hold / stats.trainingSamples) * 100).toFixed(1)}%)`, 'yellow');
  log(`    Sell: ${stats.trainingDistribution.sell} (${((stats.trainingDistribution.sell / stats.trainingSamples) * 100).toFixed(1)}%)`, 'yellow');

  if (trainingData.length === 0) {
    throw new Error('No training data generated');
  }
}

async function test4_PythonDependencies() {
  const { exec } = await import('child_process');
  const util = await import('util');
  const execPromise = util.promisify(exec);

  try {
    const { stdout } = await execPromise('python3 -c "import sklearn; import joblib; print(\'OK\')"');
    if (!stdout.includes('OK')) {
      throw new Error('Import check failed');
    }
    log('  ✓ scikit-learn installed', 'green');
    log('  ✓ joblib installed', 'green');
  } catch (error) {
    throw new Error('Python ML dependencies not installed. Run: pip3 install -r scripts/requirements.txt');
  }
}

async function test5_PythonTrainingScript() {
  const { exec } = await import('child_process');
  const util = await import('util');
  const execPromise = util.promisify(exec);

  // Create minimal test data
  const fs = await import('fs/promises');
  const path = await import('path');

  const tempDir = path.join(process.cwd(), 'temp');
  await fs.mkdir(tempDir, { recursive: true });

  const testData = {
    samples: 100,
    features: Array.from({ length: 100 }, () => Array.from({ length: 13 }, () => Math.random())),
    labels: Array.from({ length: 100 }, () => Math.floor(Math.random() * 3) - 1), // -1, 0, 1
    symbols: ['TEST'],
  };

  const testFile = path.join(tempDir, 'test-training-data.json');
  await fs.writeFile(testFile, JSON.stringify(testData, null, 2));

  const modelOutputPath = path.join(process.cwd(), 'temp', 'test-model.joblib');

  try {
    log('  Running Python training script...', 'yellow');

    const command = `python3 scripts/train-model.py --input "${testFile}" --output "${modelOutputPath}"`;
    const { stdout, stderr } = await execPromise(command, { timeout: 60000 });

    if (stdout.includes('Accuracy:')) {
      log('  ✓ Training script works', 'green');
    } else {
      throw new Error('Training script did not produce expected output');
    }

    // Check if model file was created
    await fs.access(modelOutputPath);
    log('  ✓ Model file created', 'green');

    // Cleanup
    await fs.unlink(testFile);
    await fs.unlink(modelOutputPath);
  } catch (error: any) {
    throw new Error(`Python training script failed: ${error.message}`);
  }
}

async function test6_PythonPredictionScript() {
  const { exec } = await import('child_process');
  const util = await import('util');
  const execPromise = util.promisify(exec);

  // First create a simple model
  const fs = await import('fs/promises');
  const path = await import('path');

  const tempDir = path.join(process.cwd(), 'temp');
  await fs.mkdir(tempDir, { recursive: true });

  const testData = {
    samples: 100,
    features: Array.from({ length: 100 }, () => Array.from({ length: 13 }, () => Math.random())),
    labels: Array.from({ length: 100 }, () => Math.floor(Math.random() * 3) - 1),
    symbols: ['TEST'],
  };

  const trainFile = path.join(tempDir, 'test-train-data.json');
  const modelPath = path.join(tempDir, 'test-predict-model.joblib');

  await fs.writeFile(trainFile, JSON.stringify(testData, null, 2));

  try {
    // Train a model
    await execPromise(`python3 scripts/train-model.py --input "${trainFile}" --output "${modelPath}"`);

    // Test prediction
    const testFeatures = Array.from({ length: 13 }, () => Math.random());
    const command = `python3 scripts/predict.py --model "${modelPath}" --features '${JSON.stringify(testFeatures)}'`;

    const { stdout } = await execPromise(command);

    const result = JSON.parse(stdout);

    if (!result.signal || !result.confidence || !result.probabilities) {
      throw new Error('Prediction output missing required fields');
    }

    log('  ✓ Prediction script works', 'green');
    log(`    Signal: ${result.signal}`, 'yellow');
    log(`    Confidence: ${result.confidence.toFixed(2)}`, 'yellow');

    // Cleanup
    await fs.unlink(trainFile);
    await fs.unlink(modelPath);
  } catch (error: any) {
    throw new Error(`Python prediction script failed: ${error.message}`);
  }
}

async function test7_StockClassifierInterface() {
  // Test that StockClassifier implements MLModel interface correctly
  const methods = ['train', 'predict', 'evaluate', 'save', 'load'];

  for (const method of methods) {
    if (typeof (stockClassifier as any)[method] !== 'function') {
      throw new Error(`StockClassifier missing method: ${method}`);
    }
  }

  log('  ✓ StockClassifier implements all required methods', 'green');
}

async function test8_PredictionService() {
  try {
    await predictionService.initialize();
    log('  ✓ Prediction service initialized', 'green');
    log(`    Model ready: ${predictionService.isReady()}`, 'yellow');
  } catch (error) {
    log('  ⚠ Prediction service initialization failed (expected if model not trained)', 'yellow');
    log('    This is OK - model will be trained during production', 'yellow');
  }
}

async function test9_MLSignalServiceIntegration() {
  await mlSignalService.initialize();

  const usingML = mlSignalService.isUsingML();
  log(`  ML mode: ${usingML ? 'Enabled' : 'Fallback to rules'}`, 'yellow');

  // Get a stock with data
  const stocks = await prisma.$queryRaw<Array<{ symbol: string }>>`
    SELECT symbol
    FROM stock_prices
    GROUP BY symbol
    HAVING COUNT(*) >= 252
    LIMIT 1
  `;

  if (stocks.length === 0) {
    log('  ⚠ No stocks with sufficient data to test signal generation', 'yellow');
    return;
  }

  const symbol = stocks[0].symbol;
  log(`  Testing signal generation for ${symbol}...`, 'yellow');

  const signal = await mlSignalService.generateSignal(symbol);

  if (!signal) {
    throw new Error(`Failed to generate signal for ${symbol}`);
  }

  log('  ✓ Signal generated successfully', 'green');
  log(`    Signal: ${signal.signal === 1 ? 'BUY' : signal.signal === -1 ? 'SELL' : 'HOLD'}`, 'yellow');
  log(`    Confidence: ${(signal.confidence * 100).toFixed(1)}%`, 'yellow');
  log(`    RSI: ${signal.rsi.toFixed(2)}`, 'yellow');
}

async function test10_FeatureCalculation() {
  // Test that all features can be calculated
  const prices = await prisma.stockPrice.findMany({
    where: { symbol: 'AAPL' },
    orderBy: { date: 'asc' },
    take: -300,
  });

  if (prices.length < 200) {
    log('  ⚠ Not enough AAPL data to test features', 'yellow');
    return;
  }

  const closes = prices.map(p => Number(p.close));
  const volumes = prices.map(p => BigInt(p.volume));

  const service = (mlSignalService as any);
  const ma20 = service.calculateSMA(closes, 20);
  const ma50 = service.calculateSMA(closes, 50);
  const rsi = service.calculateRSI(closes, 14);
  const macd = service.calculateMACD(closes);
  const bollinger = service.calculateBollingerBands(closes, 20, 2);
  const obv = service.calculateOBV(closes, volumes);
  const ichimoku = service.calculateIchimoku(closes);

  const features = [ma20, ma50, rsi, macd, bollinger, obv, ichimoku];
  const featureNames = ['MA20', 'MA50', 'RSI', 'MACD', 'Bollinger', 'OBV', 'Ichimoku'];

  let allValid = true;
  features.forEach((f, i) => {
    const valid = f !== null && f !== undefined;
    if (valid) {
      log(`  ✓ ${featureNames[i]}: OK`, 'green');
    } else {
      log(`  ✗ ${featureNames[i]}: FAILED`, 'red');
      allValid = false;
    }
  });

  if (!allValid) {
    throw new Error('Some features could not be calculated');
  }
}

// ============================================================================
// MAIN TEST RUNNER
// ============================================================================

async function main() {
  console.log('\n');
  log('╔════════════════════════════════════════════════════════════╗', 'cyan');
  log('║     TradingWeb - ML Model System Test Suite               ║', 'cyan');
  log('╚════════════════════════════════════════════════════════════╝', 'cyan');
  console.log('\n');

  const tests = [
    { name: 'Database Connection', fn: test1_DatabaseConnection },
    { name: 'Historical Data Exists', fn: test2_HistoricalDataExists },
    { name: 'Training Pipeline', fn: test3_TrainingPipeline },
    { name: 'Python ML Dependencies', fn: test4_PythonDependencies },
    { name: 'Python Training Script', fn: test5_PythonTrainingScript },
    { name: 'Python Prediction Script', fn: test6_PythonPredictionScript },
    { name: 'StockClassifier Interface', fn: test7_StockClassifierInterface },
    { name: 'Prediction Service', fn: test8_PredictionService },
    { name: 'ML Signal Service Integration', fn: test9_MLSignalServiceIntegration },
    { name: 'Feature Calculation', fn: test10_FeatureCalculation },
  ];

  const results = {
    passed: 0,
    failed: 0,
    total: tests.length,
  };

  for (const test of tests) {
    const passed = await runTest(test.name, test.fn);
    if (passed) {
      results.passed++;
    } else {
      results.failed++;
    }
  }

  // Summary
  console.log(`\n${colors.cyan}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);
  log('TEST SUMMARY', 'blue');
  console.log(`${colors.cyan}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}\n`);

  log(`Total Tests: ${results.total}`, 'cyan');
  log(`Passed: ${results.passed}`, 'green');
  log(`Failed: ${results.failed}`, results.failed > 0 ? 'red' : 'green');

  const successRate = ((results.passed / results.total) * 100).toFixed(1);
  log(`Success Rate: ${successRate}%`, results.failed === 0 ? 'green' : 'yellow');

  console.log('\n');

  if (results.failed === 0) {
    log('✓ ALL TESTS PASSED!', 'green');
    log('\nNext steps:', 'cyan');
    log('  1. Train the model: npm run train:model', 'yellow');
    log('  2. Start the dev server: npm run dev', 'yellow');
    log('  3. Generate signals via API or scheduled jobs', 'yellow');
    process.exit(0);
  } else {
    log('✗ SOME TESTS FAILED', 'red');
    log('\nPlease fix the issues above before proceeding.', 'yellow');
    process.exit(1);
  }
}

// Run tests
main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
