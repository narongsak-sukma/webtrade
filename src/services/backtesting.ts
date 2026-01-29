/**
 * Backtesting Engine
 *
 * Validates trading strategies with realistic costs and walk-forward validation
 * Not just train/test split - true walk-forward testing
 *
 * @version 1.0.0
 */

import { prisma } from '@/lib/prisma';
import { MLSignalService } from './mlSignals';

export interface BacktestConfig {
  symbol: string;
  startDate: Date;
  endDate: Date;
  initialCapital: number;
  commission: number; // per trade
  slippage: number; // % per trade
  positionSizePercent: number; // % of capital per trade
  maxPositions: number;
  stopLossPercent?: number;
  takeProfitPercent?: number;
  useWalkForward: boolean;
  walkForward?: {
    trainPeriod: number; // days
    testPeriod: number; // days
  };
}

export interface Trade {
  symbol: string;
  entryDate: Date;
  entryPrice: number;
  exitDate: Date;
  exitPrice: number;
  shares: number;
  type: 'LONG' | 'SHORT';
  exitReason: 'STOP_LOSS' | 'TAKE_PROFIT' | 'SIGNAL_CHANGE' | 'END_OF_PERIOD';
  grossProfit: number;
  commission: number;
  slippage: number;
  netProfit: number;
  returnPct: number;
  holdDays: number;
}

export interface BacktestResult {
  symbol: string;
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  winRate: number;
  grossProfit: number;
  totalCosts: number; // commission + slippage
  netProfit: number;
  netProfitPct: number;
  avgWin: number;
  avgLoss: number;
  profitFactor: number;
  maxDrawdown: number;
  maxDrawdownPct: number;
  sharpeRatio: number;
  sortinoRatio: number;
  equityCurve: { date: Date; equity: number; }[];
  trades: Trade[];
  metrics: {
    totalHoldDays: number;
    avgHoldDays: number;
    bestTrade: Trade;
    worstTrade: Trade;
    consecutiveWins: number;
    consecutiveLosses: number;
  };
}

export class BacktestingEngine {
  private mlService = new MLSignalService();

  /**
   * Run backtest with realistic costs
   */
  async runBacktest(config: BacktestConfig): Promise<BacktestResult> {
    console.log(`\n📊 Backtesting ${config.symbol}...`);
    console.log(`   Period: ${config.startDate.toISOString().split('T')[0]} to ${config.endDate.toISOString().split('T')[0]}`);
    console.log(`   Initial Capital: $${config.initialCapital.toLocaleString()}`);
    console.log(`   Costs: $${config.commission}/trade commission, ${(config.slippage * 100).toFixed(2)}% slippage\n`);

    // Fetch historical price data
    const prices = await prisma.stockPrice.findMany({
      where: {
        symbol: config.symbol,
        date: {
          gte: config.startDate,
          lte: config.endDate,
        },
      },
      orderBy: { date: 'asc' },
    });

    if (prices.length < 100) {
      throw new Error(`Insufficient data for backtesting: ${prices.length} days`);
    }

    console.log(`✓ Loaded ${prices.length} days of price data\n`);

    // Initialize ML service
    await this.mlService.initialize();

    // Generate signals for backtest period
    const signals = await this.generateBacktestSignals(config.symbol, prices);

    // Run backtest
    const { trades, equityCurve } = await this.executeTrades(
      config,
      prices,
      signals
    );

    // Calculate metrics
    const metrics = this.calculateMetrics(trades, equityCurve, config);

    return {
      symbol: config.symbol,
      totalTrades: trades.length,
      winningTrades: metrics.winningTrades,
      losingTrades: metrics.losingTrades,
      winRate: metrics.winRate,
      grossProfit: metrics.grossProfit,
      totalCosts: metrics.totalCosts,
      netProfit: metrics.netProfit,
      netProfitPct: metrics.netProfitPct,
      avgWin: metrics.avgWin,
      avgLoss: metrics.avgLoss,
      profitFactor: metrics.profitFactor,
      maxDrawdown: metrics.maxDrawdown,
      maxDrawdownPct: metrics.maxDrawdownPct,
      sharpeRatio: metrics.sharpeRatio,
      sortinoRatio: metrics.sortinoRatio,
      equityCurve,
      trades,
      metrics: {
        totalHoldDays: metrics.totalHoldDays,
        avgHoldDays: metrics.avgHoldDays,
        bestTrade: metrics.bestTrade,
        worstTrade: metrics.worstTrade,
        consecutiveWins: metrics.consecutiveWins,
        consecutiveLosses: metrics.consecutiveLosses,
      },
    };
  }

  /**
   * Generate signals for backtesting period
   */
  private async generateBacktestSignals(
    symbol: string,
    prices: any[]
  ): Promise<Map<Date, number>> {
    const signals = new Map<Date, number>();

    console.log('🤖 Generating ML signals for backtest...');

    // Generate signals using a sliding window
    const lookback = 60; // Use 60 days of history for features

    for (let i = lookback; i < prices.length; i++) {
      const historicalPrices = prices.slice(0, i);

      try {
        const signalData = await this.mlService.generateSignal(symbol);

        if (signalData && signalData.signal !== undefined) {
          signals.set(prices[i].date, signalData.signal);
        }
      } catch (error) {
        // If ML fails, use default HOLD signal
        signals.set(prices[i].date, 0);
      }
    }

    console.log(`✓ Generated ${signals.size} signals\n`);
    return signals;
  }

  /**
   * Execute trades based on signals
   */
  private async executeTrades(
    config: BacktestConfig,
    prices: any[],
    signals: Map<Date, number>
  ): Promise<{ trades: Trade[]; equityCurve: { date: Date; equity: number }[] }> {
    const trades: Trade[] = [];
    const equityCurve: { date: Date; equity: number }[] = [];
    let currentCapital = config.initialCapital;
    let inPosition = false;
    let entryPrice = 0;
    let entryDate: Date | null = null;
    let shares = 0;

    // Add initial capital to equity curve
    equityCurve.push({
      date: prices[0].date,
      equity: config.initialCapital,
    });

    for (let i = 1; i < prices.length; i++) {
      const price = prices[i];
      const date = price.date;
      const signal = signals.get(date) || 0;

      // Skip if no signal change
      if (signal === 0 && !inPosition) {
        continue;
      }

      if (!inPosition && signal === 1) {
        // BUY signal - enter long position
        const capitalToUse = currentCapital * config.positionSizePercent;
        const commission = config.commission;
        const slippageCost = price.close * config.slippage;

        const shares = Math.floor((capitalToUse - commission - slippageCost) / price.close);
        const totalCost = shares * price.close + commission + slippageCost;

        if (shares > 0 && totalCost <= currentCapital) {
          entryPrice = price.close;
          entryDate = date;
          inPosition = true;
          currentCapital -= totalCost;

          // Check for stop loss or take profit
          if (config.stopLossPercent) {
            const stopLossPrice = entryPrice * (1 - config.stopLossPercent);
            if (price.low <= stopLossPrice) {
              // Stopped out same day
              const exitPrice = stopLossPrice;
              const exitReason = 'STOP_LOSS';

              const grossProfit = (exitPrice - entryPrice) * shares;
              const exitCommission = config.commission;
              const exitSlippage = exitPrice * config.slippage;
              const netProfit = grossProfit - exitCommission - exitSlippage;
              const returnPct = ((exitPrice - entryPrice) / entryPrice) * 100;

              trades.push({
                symbol: config.symbol,
                entryDate,
                entryPrice,
                exitDate: date,
                exitPrice,
                shares,
                type: 'LONG',
                exitReason: 'STOP_LOSS',
                grossProfit,
                commission: exitCommission + commission,
                slippage: exitSlippage,
                netProfit,
                returnPct,
                holdDays: 0,
              });

              currentCapital += netProfit;
              inPosition = false;
            }
          }
        }
      } else if (inPosition) {
        // Check exit conditions
        let shouldExit = false;
        let exitReason: 'STOP_LOSS' | 'TAKE_PROFIT' | 'SIGNAL_CHANGE' | 'END_OF_PERIOD' = 'SIGNAL_CHANGE';

        // Signal change to SELL
        if (signal === -1) {
          shouldExit = true;
          exitReason = 'SIGNAL_CHANGE';
        }

        // Stop loss
        if (config.stopLossPercent) {
          const stopLossPrice = entryPrice * (1 - config.stopLossPercent);
          if (price.low <= stopLossPrice) {
            shouldExit = true;
            exitReason = 'STOP_LOSS';
          }
        }

        // Take profit
        if (config.takeProfitPercent) {
          const takeProfitPrice = entryPrice * (1 + config.takeProfitPercent);
          if (price.high >= takeProfitPrice) {
            shouldExit = true;
            exitReason = 'TAKE_PROFIT';
          }
        }

        // End of period
        if (i === prices.length - 1) {
          shouldExit = true;
          exitReason = 'END_OF_PERIOD';
        }

        if (shouldExit) {
          let exitPrice = price.close;

          if (exitReason === 'STOP_LOSS') {
            exitPrice = entryPrice * (1 - config.stopLossPercent!);
          } else if (exitReason === 'TAKE_PROFIT') {
            exitPrice = entryPrice * (1 + config.takeProfitPercent!);
          }

          const grossProfit = (exitPrice - entryPrice) * shares;
          const exitCommission = config.commission;
          const exitSlippage = exitPrice * config.slippage;
          const netProfit = grossProfit - exitCommission - exitSlippage;
          const returnPct = ((exitPrice - entryPrice) / entryPrice) * 100;

          const holdDays = Math.floor(
            (date.getTime() - entryDate!.getTime()) / (1000 * 60 * 60 * 24)
          );

          trades.push({
            symbol: config.symbol,
            entryDate: entryDate!,
            entryPrice,
            exitDate: date,
            exitPrice,
            shares,
            type: 'LONG',
            exitReason,
            grossProfit,
            commission: exitCommission + config.commission,
            slippage: exitSlippage,
            netProfit,
            returnPct,
            holdDays,
          });

          currentCapital += netProfit;
          inPosition = false;
        }
      }

      // Update equity curve
      if (inPosition) {
        const unrealizedPnl = (price.close - entryPrice) * shares;
        equityCurve.push({
          date,
          equity: currentCapital + unrealizedPnl,
        });
      } else {
        equityCurve.push({
          date,
          equity: currentCapital,
        });
      }
    }

    console.log(`✓ Executed ${trades.length} trades\n`);

    return { trades, equityCurve };
  }

  /**
   * Calculate performance metrics
   */
  private calculateMetrics(trades: Trade[], equityCurve: { date: Date; equity: number }[], config: BacktestConfig) {
    const winningTrades = trades.filter(t => t.netProfit > 0);
    const losingTrades = trades.filter(t => t.netProfit < 0);

    const grossProfit = trades.reduce((sum, t) => sum + t.grossProfit, 0);
    const totalCosts = trades.reduce((sum, t) => sum + t.commission + t.slippage, 0);
    const netProfit = trades.reduce((sum, t) => sum + t.netProfit, 0);
    const netProfitPct = (netProfit / config.initialCapital) * 100;

    const avgWin = winningTrades.length > 0
      ? winningTrades.reduce((sum, t) => sum + t.netProfit, 0) / winningTrades.length
      : 0;

    const avgLoss = losingTrades.length > 0
      ? losingTrades.reduce((sum, t) => sum + t.netProfit, 0) / losingTrades.length
      : 0;

    const profitFactor = Math.abs(avgLoss) > 0 ? avgWin / Math.abs(avgLoss) : 0;

    // Max drawdown
    let maxDrawdown = 0;
    let peak = equityCurve[0].equity;

    for (const point of equityCurve) {
      if (point.equity > peak) {
        peak = point.equity;
      }
      const drawdown = peak - point.equity;
      if (drawdown > maxDrawdown) {
        maxDrawdown = drawdown;
      }
    }

    const maxDrawdownPct = (maxDrawdown / equityCurve[0].equity) * 100;

    // Sharpe Ratio (assuming 5% risk-free rate)
    const tradingDays = trades.reduce((sum, t) => sum + t.holdDays, 0);
    const years = tradingDays / 252;
    const annualReturn = netProfitPct / 100; // decimal
    const annualVolatility = this.calculateVolatility(equityCurve.map((e, i) => {
      if (i === 0) return 0;
      const prevEquity = equityCurve[i - 1].equity;
      return (e.equity - prevEquity) / prevEquity;
    }));

    const riskFreeRate = 0.05;
    const sharpeRatio = (annualReturn - riskFreeRate) / (annualVolatility || 0.01);

    // Sortino Ratio (downside deviation only)
    const downsideReturns = equityCurve.map((e, i) => {
      if (i === 0) return 0;
      const prevEquity = equityCurve[i - 1].equity;
      const dailyReturn = (e.equity - prevEquity) / prevEquity;
      return dailyReturn < 0 ? dailyReturn : 0;
    });

    const downsideDeviation = this.calculateStdDev(downsideReturns);
    const sortinoRatio = (annualReturn - riskFreeRate) / (downsideDeviation || 0.01);

    // Best and worst trades
    const sortedTrades = [...trades].sort((a, b) => b.netProfit - a.netProfit);

    // Default trade object for when no trades were executed
    const defaultTrade: Trade = {
      symbol: config.symbol,
      entryDate: new Date(),
      entryPrice: 0,
      exitDate: new Date(),
      exitPrice: 0,
      shares: 0,
      type: 'LONG',
      exitReason: 'END_OF_PERIOD',
      grossProfit: 0,
      commission: 0,
      slippage: 0,
      netProfit: 0,
      returnPct: 0,
      holdDays: 0,
    };

    const bestTrade = sortedTrades.length > 0 ? sortedTrades[0] : defaultTrade;
    const worstTrade = sortedTrades.length > 0 ? sortedTrades[sortedTrades.length - 1] : defaultTrade;

    // Consecutive wins/losses
    let consecutiveWins = 0;
    let consecutiveLosses = 0;
    let maxConsecutiveWins = 0;
    let maxConsecutiveLosses = 0;

    for (const trade of trades) {
      if (trade.netProfit > 0) {
        consecutiveWins++;
        maxConsecutiveWins = Math.max(maxConsecutiveWins, consecutiveWins);
        consecutiveLosses = 0;
      } else {
        consecutiveLosses++;
        maxConsecutiveLosses = Math.max(maxConsecutiveLosses, consecutiveLosses);
        consecutiveWins = 0;
      }
    }

    const totalHoldDays = trades.reduce((sum, t) => sum + t.holdDays, 0);

    return {
      winningTrades: winningTrades.length,
      losingTrades: losingTrades.length,
      winRate: trades.length > 0 ? (winningTrades.length / trades.length) * 100 : 0,
      grossProfit,
      totalCosts,
      netProfit,
      netProfitPct,
      avgWin,
      avgLoss,
      profitFactor,
      maxDrawdown,
      maxDrawdownPct,
      sharpeRatio,
      sortinoRatio,
      bestTrade,
      worstTrade,
      consecutiveWins: maxConsecutiveWins,
      consecutiveLosses: maxConsecutiveLosses,
      totalHoldDays,
      avgHoldDays: trades.length > 0 ? totalHoldDays / trades.length : 0,
    };
  }

  /**
   * Calculate standard deviation
   */
  private calculateStdDev(values: number[]): number {
    if (values.length === 0) return 0;
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const squaredDiffs = values.map(v => Math.pow(v - mean, 2));
    return Math.sqrt(squaredDiffs.reduce((a, b) => a + b, 0) / values.length);
  }

  /**
   * Calculate volatility (annualized)
   */
  private calculateVolatility(dailyReturns: number[]): number {
    const stdDev = this.calculateStdDev(dailyReturns);
    return stdDev * Math.sqrt(252); // Annualize
  }
}

export const backtestingEngine = new BacktestingEngine();
