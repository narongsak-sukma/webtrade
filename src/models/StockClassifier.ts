/**
 * StockClassifier - ML Model Interface
 *
 * This is a TypeScript interface to the Python-based ML model.
 * The actual training and prediction happens in Python (scikit-learn),
 * but this provides type-safe integration with the Next.js app.
 */

import {
  MLModel,
  TrainingData,
  ModelPrediction,
  TrainingResult,
  EvaluationMetrics,
  TestData,
  FeatureValues,
} from '@/types/agent-contracts';

export class StockClassifier implements MLModel {
  private modelPath: string | null = null;
  private isLoaded = false;

  /**
   * Train model on historical data
   * This delegates to the Python training script
   */
  async train(data: TrainingData[]): Promise<TrainingResult> {
    console.log(`[StockClassifier] Starting training with ${data.length} samples`);

    try {
      // Prepare data for Python script
      const trainingData = {
        samples: data.length,
        features: this.extractFeaturesArray(data),
        labels: data.map(d => d.target),
        symbols: [...new Set(data.map(d => d.symbol))],
      };

      // Save training data to temporary file
      const fs = await import('fs/promises');
      const path = await import('path');
      const tempDir = path.join(process.cwd(), 'temp');
      await fs.mkdir(tempDir, { recursive: true });

      const tempFile = path.join(tempDir, 'training-data.json');
      await fs.writeFile(tempFile, JSON.stringify(trainingData, null, 2));

      // Run Python training script
      const { exec } = await import('child_process');
      const util = await import('util');
      const execPromise = util.promisify(exec);

      const pythonScript = path.join(process.cwd(), 'scripts', 'train-model.py');
      const modelOutputPath = path.join(process.cwd(), 'public', 'models', 'stock-classifier.joblib');

      const command = `python3 "${pythonScript}" --input "${tempFile}" --output "${modelOutputPath}"`;

      console.log(`[StockClassifier] Running: ${command}`);
      const { stdout, stderr } = await execPromise(command);

      if (stderr && !stderr.includes('Warning')) {
        console.error('[StockClassifier] Training stderr:', stderr);
      }

      console.log('[StockClassifier] Training stdout:', stdout);

      // Parse results from output
      const results = this.parseTrainingOutput(stdout);

      // Clean up temp file
      await fs.unlink(tempFile);

      this.modelPath = modelOutputPath;
      this.isLoaded = true;

      return {
        success: true,
        accuracy: results.accuracy,
        featureImportance: results.featureImportance,
        modelPath: modelOutputPath,
      };
    } catch (error: any) {
      console.error('[StockClassifier] Training failed:', error);
      return {
        success: false,
        accuracy: 0,
        error: error.message || 'Training failed',
      };
    }
  }

  /**
   * Generate prediction for a stock
   * This uses the trained Python model via subprocess or loaded weights
   */
  async predict(symbol: string, features: FeatureValues): Promise<ModelPrediction> {
    if (!this.isLoaded || !this.modelPath) {
      throw new Error('Model not loaded. Call train() or load() first.');
    }

    try {
      // Use Python to make prediction
      const { exec } = await import('child_process');
      const util = await import('util');
      const execPromise = util.promisify(exec);

      const path = await import('path');
      const pythonScript = path.join(process.cwd(), 'scripts', 'predict.py');

      // Prepare feature vector
      const featureVector = this.featuresToArray(features);

      const command = `python3 "${pythonScript}" --model "${this.modelPath}" --features '${JSON.stringify(featureVector)}'`;

      const { stdout, stderr } = await execPromise(command, {
        timeout: 5000, // 5 second timeout
      });

      if (stderr) {
        console.error('[StockClassifier] Prediction stderr:', stderr);
      }

      const result = JSON.parse(stdout);

      return {
        symbol,
        date: new Date(),
        signal: result.signal,
        confidence: result.confidence,
        probabilities: result.probabilities,
        features,
      };
    } catch (error: any) {
      console.error('[StockClassifier] Prediction failed:', error);

      // Fallback to rule-based prediction if ML fails
      return this.ruleBasedPrediction(symbol, features);
    }
  }

  /**
   * Evaluate model performance on test data
   */
  async evaluate(testData: TestData[]): Promise<EvaluationMetrics> {
    if (!this.isLoaded) {
      throw new Error('Model not loaded');
    }

    try {
      const predictions = await Promise.all(
        testData.map(async (data) => {
          const prediction = await this.predict(data.symbol, data.features);
          return {
            predicted: prediction.signal === 'buy' ? 1 : prediction.signal === 'sell' ? -1 : 0,
            actual: data.target,
            futureReturn: data.futureReturn,
          };
        })
      );

      // Calculate metrics
      let correct = 0;
      let truePositive = 0;
      let falsePositive = 0;
      let falseNegative = 0;
      let totalBuyPredictions = 0;
      let totalBuyActual = 0;

      predictions.forEach((p) => {
        if (p.predicted === p.actual) correct++;
        if (p.actual === 1) totalBuyActual++;
        if (p.predicted === 1) {
          totalBuyPredictions++;
          if (p.actual === 1) truePositive++;
          else falsePositive++;
        } else if (p.actual === 1 && p.predicted !== 1) {
          falseNegative++;
        }
      });

      const accuracy = correct / predictions.length;
      const precision = totalBuyPredictions > 0 ? truePositive / totalBuyPredictions : 0;
      const recall = totalBuyActual > 0 ? truePositive / totalBuyActual : 0;
      const f1Score = precision + recall > 0 ? (2 * precision * recall) / (precision + recall) : 0;

      // Confusion matrix
      const confusionMatrix = [
        [0, 0, 0], // [actual sell][predicted sell, hold, buy]
        [0, 0, 0], // [actual hold][predicted sell, hold, buy]
        [0, 0, 0], // [actual buy][predicted sell, hold, buy]
      ];

      predictions.forEach((p) => {
        const actualIdx = p.actual + 1; // -1->0, 0->1, 1->2
        const predictedIdx = p.predicted + 1;
        confusionMatrix[actualIdx][predictedIdx]++;
      });

      // Calculate ROI (simplified backtesting)
      let roi = 0;
      if (predictions.length > 0) {
        const buyReturns = predictions
          .filter((p) => p.predicted === 1 && p.futureReturn !== undefined)
          .map((p) => p.futureReturn!);
        if (buyReturns.length > 0) {
          roi = buyReturns.reduce((sum, r) => sum + r, 0) / buyReturns.length;
        }
      }

      return {
        accuracy,
        precision,
        recall,
        f1Score,
        confusionMatrix,
        roi,
      };
    } catch (error: any) {
      console.error('[StockClassifier] Evaluation failed:', error);
      throw error;
    }
  }

  /**
   * Save model to disk
   */
  async save(path: string): Promise<void> {
    if (!this.modelPath) {
      throw new Error('No model to save');
    }

    const fs = await import('fs/promises');
    await fs.copyFile(this.modelPath, path);
    console.log(`[StockClassifier] Model saved to ${path}`);
  }

  /**
   * Load model from disk
   */
  async load(path: string): Promise<void> {
    const fs = await import('fs/promises');

    try {
      await fs.access(path);
      this.modelPath = path;
      this.isLoaded = true;
      console.log(`[StockClassifier] Model loaded from ${path}`);
    } catch (error) {
      throw new Error(`Model file not found: ${path}`);
    }
  }

  /**
   * Check if model is loaded
   */
  isModelLoaded(): boolean {
    return this.isLoaded;
  }

  // ============================================================================
  // Private Helper Methods
  // ============================================================================

  /**
   * Extract features array from training data
   */
  private extractFeaturesArray(data: TrainingData[]): number[][] {
    return data.map((d) => this.featuresToArray(d.features));
  }

  /**
   * Convert FeatureValues to array for ML model
   */
  private featuresToArray(features: FeatureValues): number[] {
    return [
      features.ma20Ma50,
      features.rsi,
      features.macd,
      features.macdSignal,
      features.macdHistogram,
      features.bollingerUpper || 0,
      features.bollingerMiddle || 0,
      features.bollingerLower || 0,
      Number(features.obv) / 1e9, // Normalize OBV (convert from BigInt to billions)
      features.ichimokuTenkan || 0,
      features.ichimokuKijun || 0,
      features.ichimokuSenkouA || 0,
      features.ichimokuSenkouB || 0,
    ];
  }

  /**
   * Parse training output from Python script
   */
  private parseTrainingOutput(stdout: string): any {
    const lines = stdout.split('\n');

    let accuracy = 0;
    const featureImportance: Record<string, number> = {};

    for (const line of lines) {
      if (line.includes('Accuracy:')) {
        accuracy = parseFloat(line.split(':')[1].trim());
      }
      if (line.includes('Feature Importance:')) {
        try {
          const jsonStr = line.split(':', 2)[1].trim();
          Object.assign(featureImportance, JSON.parse(jsonStr));
        } catch (e) {
          console.error('Failed to parse feature importance:', e);
        }
      }
    }

    return { accuracy, featureImportance };
  }

  /**
   * Fallback rule-based prediction
   */
  private ruleBasedPrediction(symbol: string, features: FeatureValues): ModelPrediction {
    let signal: 'buy' | 'hold' | 'sell' = 'hold';
    let confidence = 0.5;

    const buyScore =
      (features.rsi < 30 ? 1 : 0) +
      (features.macdHistogram > 0 ? 1 : 0) +
      (features.bollingerLower && features.bollingerLower > 0 ? 1 : 0) +
      (features.ma20Ma50 > 1 ? 1 : 0);

    const sellScore =
      (features.rsi > 70 ? 1 : 0) +
      (features.macdHistogram < 0 ? 1 : 0) +
      (features.bollingerUpper && features.bollingerUpper > 0 ? 1 : 0) +
      (features.ma20Ma50 < 1 ? 1 : 0);

    if (buyScore >= 3) {
      signal = 'buy';
      confidence = 0.6 + (buyScore - 3) * 0.1;
    } else if (sellScore >= 3) {
      signal = 'sell';
      confidence = 0.6 + (sellScore - 3) * 0.1;
    }

    return {
      symbol,
      date: new Date(),
      signal,
      confidence: Math.min(confidence, 0.9),
      probabilities: {
        buy: signal === 'buy' ? confidence : 0.1,
        hold: signal === 'hold' ? 0.8 : 0.1,
        sell: signal === 'sell' ? confidence : 0.1,
      },
      features,
    };
  }
}

export const stockClassifier = new StockClassifier();
