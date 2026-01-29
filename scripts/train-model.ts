#!/usr/bin/env ts-node
/**
 * Train ML Model - CLI Script
 *
 * This script orchestrates the complete ML training pipeline:
 * 1. Fetches historical data from database
 * 2. Generates labels using look-ahead returns
 * 3. Trains RandomForest classifier
 * 4. Evaluates performance
 * 5. Saves best model
 *
 * Usage:
 *   npx ts-node scripts/train-model.ts
 *   npm run train:model
 */

import { prisma } from '../src/lib/prisma';
import { trainingPipeline, DEFAULT_TRAINING_CONFIG } from '../src/models/training';
import { stockClassifier } from '../src/models/StockClassifier';
import { modelEvaluator } from '../src/models/evaluation';
import { TrainingData } from '../src/types/agent-contracts';

interface TrainingOptions {
  lookAheadDays?: number;
  buyThreshold?: number;
  sellThreshold?: number;
  minDataPoints?: number;
  trainTestSplit?: number;
}

/**
 * Main training function
 */
async function trainModel(options: TrainingOptions = {}) {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║        TradingWeb - ML Model Training Pipeline           ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  const startTime = Date.now();

  try {
    // Merge options with defaults
    const config = {
      ...DEFAULT_TRAINING_CONFIG,
      ...options,
    };

    console.log('Training Configuration:');
    console.log(`  Look-ahead days: ${config.lookAheadDays}`);
    console.log(`  Buy threshold: ${(config.buyThreshold! * 100).toFixed(1)}%`);
    console.log(`  Sell threshold: ${(config.sellThreshold! * 100).toFixed(1)}%`);
    console.log(`  Min data points: ${config.minDataPoints}`);
    console.log(`  Train/test split: ${(config.trainTestSplit! * 100).toFixed(0)}%/${((1 - config.trainTestSplit!) * 100).toFixed(0)}%\n`);

    // Step 1: Prepare training data
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Step 1: Preparing Training Data\n');

    const { trainingData, testData, stats } = await trainingPipeline.prepareTrainingData(config);

    console.log('\nDataset Statistics:');
    console.log(`  Total samples: ${stats.totalSamples}`);
    console.log(`  Training samples: ${stats.trainingSamples}`);
    console.log(`  Test samples: ${stats.testSamples}`);
    console.log(`  Unique stocks: ${stats.symbols.length}`);
    console.log('\nTraining Label Distribution:');
    console.log(`  Buy: ${stats.trainingDistribution.buy} (${((stats.trainingDistribution.buy / stats.trainingSamples) * 100).toFixed(1)}%)`);
    console.log(`  Hold: ${stats.trainingDistribution.hold} (${((stats.trainingDistribution.hold / stats.trainingSamples) * 100).toFixed(1)}%)`);
    console.log(`  Sell: ${stats.trainingDistribution.sell} (${((stats.trainingDistribution.sell / stats.trainingSamples) * 100).toFixed(1)}%)`);

    // Step 2: Train model
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Step 2: Training ML Model\n');

    const trainingResult = await stockClassifier.train(trainingData);

    if (!trainingResult.success) {
      throw new Error(`Training failed: ${trainingResult.error}`);
    }

    console.log('\n✓ Training completed successfully!');
    console.log(`  Accuracy: ${(trainingResult.accuracy * 100).toFixed(2)}%`);
    console.log(`  Model saved to: ${trainingResult.modelPath}`);

    if (trainingResult.featureImportance) {
      console.log('\nFeature Importance:');
      const sorted = Object.entries(trainingResult.featureImportance)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5);
      sorted.forEach(([feature, importance]) => {
        console.log(`  ${feature}: ${(importance * 100).toFixed(2)}%`);
      });
    }

    // Step 3: Evaluate model
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Step 3: Evaluating Model Performance\n');

    const metrics = await stockClassifier.evaluate(testData);

    console.log(modelEvaluator.generateClassificationReport(metrics));

    // Validate against criteria
    const validation = modelEvaluator.validateModel(metrics);

    console.log('Model Validation:');
    validation.criteria.forEach((c) => {
      const status = c.passed ? '✓' : '✗';
      const pct = (c.actual * 100).toFixed(2);
      console.log(`  ${status} ${c.name}: ${pct}% (threshold: ${(c.threshold * 100).toFixed(0)}%)`);
    });

    if (validation.passes) {
      console.log('\n✓ Model meets all minimum criteria!');
    } else {
      console.log('\n⚠ Warning: Model does not meet all criteria');
    }

    // Step 4: Performance summary
    const duration = ((Date.now() - startTime) / 1000).toFixed(1);

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Training Complete\n');
    console.log(`  Total time: ${duration}s`);
    console.log(`  Samples processed: ${stats.totalSamples}`);
    console.log(`  Final accuracy: ${(metrics.accuracy * 100).toFixed(2)}%`);
    console.log(`  Model path: ${trainingResult.modelPath}`);
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // Save metrics to file
    const fs = await import('fs/promises');
    const path = await import('path');

    const metricsPath = path.join(process.cwd(), 'public', 'models', 'training-metrics.json');
    await fs.mkdir(path.dirname(metricsPath), { recursive: true });
    await fs.writeFile(metricsPath, JSON.stringify({
      trainedAt: new Date().toISOString(),
      config,
      stats,
      trainingResult,
      evaluationMetrics: metrics,
      validation,
      duration: parseFloat(duration),
    }, null, 2));

    console.log(`✓ Metrics saved to: ${metricsPath}\n`);

    return {
      success: true,
      accuracy: metrics.accuracy,
      modelPath: trainingResult.modelPath,
      metrics,
    };
  } catch (error: any) {
    console.error('\n✗ Training failed:', error.message);
    console.error(error.stack);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * CLI entry point
 */
async function main() {
  const args = process.argv.slice(2);

  // Parse simple arguments
  const options: TrainingOptions = {};

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    const nextArg = args[i + 1];

    if (arg === '--look-ahead' && nextArg) {
      options.lookAheadDays = parseInt(nextArg);
      i++;
    } else if (arg === '--buy-threshold' && nextArg) {
      options.buyThreshold = parseFloat(nextArg);
      i++;
    } else if (arg === '--sell-threshold' && nextArg) {
      options.sellThreshold = parseFloat(nextArg);
      i++;
    } else if (arg === '--min-data' && nextArg) {
      options.minDataPoints = parseInt(nextArg);
      i++;
    } else if (arg === '--help' || arg === '-h') {
      console.log(`
Usage: npx ts-node scripts/train-model.ts [options]

Options:
  --look-ahead <days>       Days to look ahead for labels (default: 10)
  --buy-threshold <pct>     Buy threshold as decimal (default: 0.05)
  --sell-threshold <pct>    Sell threshold as decimal (default: -0.03)
  --min-data <points>       Minimum historical data points (default: 252)
  --help, -h                Show this help message

Examples:
  npx ts-node scripts/train-model.ts
  npx ts-node scripts/train-model.ts --look-ahead 20 --buy-threshold 0.08
      `);
      process.exit(0);
    }
  }

  const result = await trainModel(options);
  return result;
}

// Run if called directly
if (require.main === module) {
  main().then((result) => {
    process.exit(result.success ? 0 : 1);
  });
}

export { trainModel };
