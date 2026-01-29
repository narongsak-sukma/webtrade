/**
 * Backtesting Demo & Testing Script
 *
 * Demonstrates the Backtesting Engine with realistic trading scenarios
 *
 * Usage:
 *   npx tsx scripts/demo-backtesting.ts
 */

import { BacktestingEngine, BacktestConfig } from '../src/services/backtesting';

console.log('\n' + '='.repeat(70));
console.log('📊 BACKTESTING ENGINE DEMO');
console.log('='.repeat(70) + '\n');

async function runBacktestingDemo() {
  const engine = new BacktestingEngine();

  // ============================================================
  // SCENARIO 1: Basic Backtest with Realistic Costs
  // ============================================================
  console.log('📊 SCENARIO 1: Backtesting AAPL with Realistic Costs');
  console.log('-'.repeat(70));

  const config1: BacktestConfig = {
    symbol: 'AAPL',
    startDate: new Date('2024-01-01'),
    endDate: new Date('2024-12-31'),
    initialCapital: 100000,
    commission: 5, // $5 per trade
    slippage: 0.001, // 0.1% slippage
    positionSizePercent: 0.95, // Use 95% of capital per trade
    maxPositions: 1,
    stopLossPercent: 0.05, // 5% stop loss
    takeProfitPercent: 0.15, // 15% take profit
  };

  try {
    const result1 = await engine.runBacktest(config1);

    console.log(`\n📈 Backtest Results:`);
    console.log(`  Total Trades: ${result1.totalTrades}`);
    console.log(`  Win Rate: ${result1.winRate.toFixed(1)}%`);
    console.log(`  Gross Profit: $${result1.grossProfit.toFixed(2)}`);
    console.log(`  Total Costs: $${result1.totalCosts.toFixed(2)} (commission + slippage)`);
    console.log(`  Net Profit: $${result1.netProfit.toFixed(2)}`);
    console.log(`  Net Return: ${result1.netProfitPct.toFixed(2)}%`);
    console.log(`\n📊 Performance Metrics:`);
    console.log(`  Profit Factor: ${result1.profitFactor.toFixed(2)}`);
    console.log(`  Max Drawdown: $${result1.maxDrawdown.toFixed(2)} (${result1.maxDrawdownPct.toFixed(1)}%)`);
    console.log(`  Sharpe Ratio: ${result1.sharpeRatio.toFixed(2)}`);
    console.log(`  Sortino Ratio: ${result1.sortinoRatio.toFixed(2)}`);

    console.log(`\n📋 Trading Statistics:`);
    console.log(`  Average Win: $${result1.avgWin.toFixed(2)}`);
    console.log(`  Average Loss: $${result1.avgLoss.toFixed(2)}`);
    console.log(`  Average Hold: ${result1.metrics.avgHoldDays.toFixed(1)} days`);
    console.log(`  Best Trade: $${result1.metrics.bestTrade.netProfit.toFixed(2)} (${result1.metrics.bestTrade.returnPct.toFixed(1)}%)`);
    console.log(`  Worst Trade: $${result1.metrics.worstTrade.netProfit.toFixed(2)} (${result1.metrics.worstTrade.returnPct.toFixed(1)}%)`);
    console.log(`  Max Consecutive Wins: ${result1.metrics.consecutiveWins}`);
    console.log(`  Max Consecutive Losses: ${result1.metrics.consecutiveLosses}`);

    // Show first 5 trades
    console.log(`\n📋 Sample Trades (first 5 of ${result1.trades.length}):`);
    result1.trades.slice(0, 5).forEach((trade, i) => {
      const profitText = trade.netProfit >= 0 ? '+' : '';
      console.log(`  ${i + 1}. ${trade.entryDate.toISOString().split('T')[0]}: BUY $${trade.entryPrice.toFixed(2)}`);
      console.log(`     ${trade.exitDate.toISOString().split('T')[0]}: SELL $${trade.exitPrice.toFixed(2)} (${trade.exitReason})`);
      console.log(`     ${trade.holdDays} days | P/L: ${profitText}$${trade.netProfit.toFixed(2)} (${trade.returnPct.toFixed(1)}%)`);
    });

    console.log(`\n💰 Final Capital: $${result1.equityCurve[result1.equityCurve.length - 1].equity.toFixed(2)}`);
    console.log(`   Starting Capital: $${config1.initialCapital.toLocaleString()}`);
  } catch (error) {
    console.error(`❌ Error: ${error}`);
  }

  // ============================================================
  // SUMMARY
  // ============================================================
  console.log('\n' + '='.repeat(70));
  console.log('✅ BACKTESTING FEATURES DEMONSTRATED');
  console.log('='.repeat(70));
  console.log('\n🔑 Key Backtesting Features:\n');
  console.log('1. Realistic Costs:');
  console.log('   - Commission per trade ($5 default)');
  console.log('   - Slippage (0.1% of trade)');
  console.log('   - Total costs reduce profits by 5-15%\n');
  console.log('2. Performance Metrics:');
  console.log('   - Sharpe Ratio: Risk-adjusted returns');
  console.log('   - Sortino Ratio: Downside risk only');
  console.log('   - Max Drawdown: Largest peak-to-trough');
  console.log('   - Profit Factor: Avg win / Avg loss\n');
  console.log('3. Trade Analysis:');
  console.log('   - Win rate, avg hold time');
  console.log('   - Best/worst trades');
  console.log('   - Consecutive wins/losses\n');
  console.log('4. Equity Curve:');
  console.log('   - Track account value over time');
  console.log('   - Visualize growth/drawdown\n');
  console.log('5. Risk Management:');
  console.log('   - Stop loss (5% default)');
  console.log('   - Take profit (15% default)');
  console.log('   - Position sizing (95% of capital)\n');
  console.log('='.repeat(70) + '\n');
}

// Run demo
runBacktestingDemo().catch(console.error);
