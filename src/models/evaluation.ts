/**
 * Evaluation Metrics - Model performance assessment
 *
 * This module provides comprehensive evaluation metrics for the ML model,
 * including accuracy, precision, recall, confusion matrix, and backtesting ROI.
 */

import { EvaluationMetrics, ModelPrediction, TestData } from '@/types/agent-contracts';

export interface BacktestResult {
  totalReturn: number;
  annualizedReturn: number;
  sharpeRatio: number;
  maxDrawdown: number;
  winRate: number;
  totalTrades: number;
  profitableTrades: number;
  avgReturnPerTrade: number;
}

export class ModelEvaluator {
  /**
   * Calculate comprehensive evaluation metrics
   */
  static async evaluate(predictions: Array<{ predicted: number; actual: number; futureReturn?: number }>): Promise<EvaluationMetrics> {
    if (predictions.length === 0) {
      throw new Error('No predictions to evaluate');
    }

    // Basic metrics
    let correct = 0;
    let truePositive = 0;
    let falsePositive = 0;
    let trueNegative = 0;
    let falseNegative = 0;
    let holdCorrect = 0;

    predictions.forEach((p) => {
      const predicted = p.predicted;
      const actual = p.actual;

      if (predicted === actual) {
        correct++;
        if (actual === 1) truePositive++;
        else if (actual === -1) trueNegative++;
        else holdCorrect++;
      } else {
        if (predicted === 1 && actual !== 1) falsePositive++;
        if (actual === 1 && predicted !== 1) falseNegative++;
      }
    });

    const accuracy = correct / predictions.length;
    const precision = truePositive + falsePositive > 0 ? truePositive / (truePositive + falsePositive) : 0;
    const recall = truePositive + falseNegative > 0 ? truePositive / (truePositive + falseNegative) : 0;
    const f1Score = precision + recall > 0 ? (2 * precision * recall) / (precision + recall) : 0;

    // Confusion matrix: [actual][predicted]
    // Rows: actual sell (-1), hold (0), buy (1)
    // Cols: predicted sell (-1), hold (0), buy (1)
    const confusionMatrix = [
      [0, 0, 0], // actual sell
      [0, 0, 0], // actual hold
      [0, 0, 0], // actual buy
    ];

    predictions.forEach((p) => {
      const actualIdx = p.actual + 1; // -1->0, 0->1, 1->2
      const predictedIdx = p.predicted + 1;
      confusionMatrix[actualIdx][predictedIdx]++;
    });

    // ROI calculation (backtesting)
    const buyPredictions = predictions.filter((p) => p.predicted === 1 && p.futureReturn !== undefined);
    let roi = 0;
    if (buyPredictions.length > 0) {
      roi = buyPredictions.reduce((sum, p) => sum + (p.futureReturn || 0), 0) / buyPredictions.length;
    }

    return {
      accuracy,
      precision,
      recall,
      f1Score,
      confusionMatrix,
      roi,
    };
  }

  /**
   * Backtest strategy with detailed performance metrics
   */
  static backtest(
    predictions: Array<{
      date: Date;
      signal: 'buy' | 'hold' | 'sell';
      futureReturn?: number;
    }>
  ): BacktestResult {
    const buyTrades = predictions.filter((p) => p.signal === 'buy' && p.futureReturn !== undefined);

    if (buyTrades.length === 0) {
      return {
        totalReturn: 0,
        annualizedReturn: 0,
        sharpeRatio: 0,
        maxDrawdown: 0,
        winRate: 0,
        totalTrades: 0,
        profitableTrades: 0,
        avgReturnPerTrade: 0,
      };
    }

    const returns = buyTrades.map((p) => p.futureReturn || 0);
    const totalReturn = returns.reduce((sum, r) => sum + r, 0);
    const avgReturnPerTrade = totalReturn / returns.length;

    const profitableTrades = returns.filter((r) => r > 0).length;
    const winRate = profitableTrades / returns.length;

    // Calculate max drawdown
    let cumulativeReturn = 0;
    let peak = 0;
    let maxDrawdown = 0;

    returns.forEach((r) => {
      cumulativeReturn += r;
      if (cumulativeReturn > peak) {
        peak = cumulativeReturn;
      }
      const drawdown = peak - cumulativeReturn;
      if (drawdown > maxDrawdown) {
        maxDrawdown = drawdown;
      }
    });

    // Calculate Sharpe ratio (simplified, assuming 0% risk-free rate)
    const avgReturn = avgReturnPerTrade;
    const variance = returns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / returns.length;
    const stdDev = Math.sqrt(variance);
    const sharpeRatio = stdDev > 0 ? avgReturn / stdDev : 0;

    // Annualized return (assuming ~252 trading days per year)
    const annualizedReturn = totalReturn * (252 / predictions.length);

    return {
      totalReturn,
      annualizedReturn,
      sharpeRatio,
      maxDrawdown,
      winRate,
      totalTrades: buyTrades.length,
      profitableTrades,
      avgReturnPerTrade,
    };
  }

  /**
   * Calculate feature importance scores
   */
  static calculateFeatureImportance(
    model: any,
    featureNames: string[]
  ): Record<string, number> {
    // This would typically come from the trained model
    // For now, return placeholder values
    return featureNames.reduce((acc, name, idx) => {
      acc[name] = 1 / featureNames.length; // Equal importance
      return acc;
    }, {} as Record<string, number>);
  }

  /**
   * Generate classification report
   */
  static generateClassificationReport(metrics: EvaluationMetrics): string {
    const { accuracy, precision, recall, f1Score, confusionMatrix, roi } = metrics;

    let report = '=== Classification Report ===\n\n';
    report += `Overall Accuracy: ${(accuracy * 100).toFixed(2)}%\n\n`;

    report += 'Buy Signal Performance:\n';
    report += `  Precision: ${(precision * 100).toFixed(2)}%\n`;
    report += `  Recall: ${(recall * 100).toFixed(2)}%\n`;
    report += `  F1-Score: ${(f1Score * 100).toFixed(2)}%\n\n`;

    report += 'Confusion Matrix:\n';
    report += '              Predicted\n';
    report += '        Sell  Hold  Buy\n';
    report += `Sell   ${confusionMatrix[0][0].toString().padStart(4)}  ${confusionMatrix[0][1].toString().padStart(4)}  ${confusionMatrix[0][2].toString().padStart(4)}\n`;
    report += `Hold   ${confusionMatrix[1][0].toString().padStart(4)}  ${confusionMatrix[1][1].toString().padStart(4)}  ${confusionMatrix[1][2].toString().padStart(4)}\n`;
    report += `Buy    ${confusionMatrix[2][0].toString().padStart(4)}  ${confusionMatrix[2][1].toString().padStart(4)}  ${confusionMatrix[2][2].toString().padStart(4)}\n\n`;

    if (roi !== undefined) {
      report += 'Backtesting Results:\n';
      report += `  Average ROI per Buy Signal: ${(roi * 100).toFixed(2)}%\n`;
      report += `  ${roi > 0 ? '✓' : '✗'} ROI ${roi > 0 ? 'Positive' : 'Negative'}\n\n`;
    }

    return report;
  }

  /**
   * Compare model vs baseline (buy-and-hold)
   */
  static compareWithBenchmark(
    modelReturns: number[],
    benchmarkReturns: number[]
  ): {
    modelOutperformance: number;
    modelWinRate: number;
    informationRatio: number;
  } {
    if (modelReturns.length !== benchmarkReturns.length) {
      throw new Error('Return arrays must have same length');
    }

    const modelTotalReturn = modelReturns.reduce((sum, r) => sum + r, 0);
    const benchmarkTotalReturn = benchmarkReturns.reduce((sum, r) => sum + r, 0);

    const modelOutperformance = modelTotalReturn - benchmarkTotalReturn;

    let modelWins = 0;
    modelReturns.forEach((r, i) => {
      if (r > benchmarkReturns[i]) {
        modelWins++;
      }
    });
    const modelWinRate = modelWins / modelReturns.length;

    // Information ratio
    const excessReturns = modelReturns.map((r, i) => r - benchmarkReturns[i]);
    const avgExcessReturn = excessReturns.reduce((sum, r) => sum + r, 0) / excessReturns.length;
    const trackingError = Math.sqrt(
      excessReturns.reduce((sum, r) => sum + Math.pow(r - avgExcessReturn, 2), 0) / excessReturns.length
    );
    const informationRatio = trackingError > 0 ? avgExcessReturn / trackingError : 0;

    return {
      modelOutperformance,
      modelWinRate,
      informationRatio,
    };
  }

  /**
   * Validate model meets minimum criteria
   */
  static validateModel(metrics: EvaluationMetrics): {
    passes: boolean;
    criteria: {
      name: string;
      threshold: number;
      actual: number;
      passed: boolean;
    }[];
  } {
    const criteria = [
      {
        name: 'Accuracy',
        threshold: 0.60,
        actual: metrics.accuracy,
        passed: metrics.accuracy >= 0.60,
      },
      {
        name: 'Precision (Buy)',
        threshold: 0.50,
        actual: metrics.precision,
        passed: metrics.precision >= 0.50,
      },
      {
        name: 'Recall (Buy)',
        threshold: 0.40,
        actual: metrics.recall,
        passed: metrics.recall >= 0.40,
      },
      {
        name: 'F1-Score',
        threshold: 0.45,
        actual: metrics.f1Score,
        passed: metrics.f1Score >= 0.45,
      },
    ];

    const passes = criteria.every((c) => c.passed);

    return { passes, criteria };
  }
}

export const modelEvaluator = ModelEvaluator;
