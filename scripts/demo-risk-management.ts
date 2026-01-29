/**
 * Risk Management Demo & Testing Script
 *
 * Demonstrates the Risk Management Layer with real trading scenarios
 *
 * Usage:
 *   npx tsx scripts/demo-risk-management.ts
 */

import { riskManagementService } from '../src/services/riskManagement';

console.log('\n' + '='.repeat(70));
console.log('🔒 RISK MANAGEMENT DEMO');
console.log('='.repeat(70) + '\n');

async function runRiskManagementDemo() {
  // ============================================================
  // SCENARIO 1: Position Sizing - Fixed Fractional
  // ============================================================
  console.log('📊 SCENARIO 1: Position Sizing (Fixed Fractional Method)');
  console.log('-'.repeat(70));

  const sizing1 = riskManagementService.calculateFixedFractionalPosition({
    accountBalance: 100000, // $100,000 account
    riskPerTrade: 0.02, // 2% risk per trade
    entryPrice: 150, // Stock at $150
    stopLossPercent: 0.05, // 5% stop loss
    riskRewardRatio: 3, // Target 3:1 reward-risk
  });

  console.log(`Account Balance: $100,000`);
  console.log(`Entry Price: $${sizing1.entryPrice}`);
  console.log(`Risk Per Trade: 2%`);
  console.log(`\n📈 Position Size:`);
  console.log(`  Shares: ${sizing1.shares}`);
  console.log(`  Position Cost: $${sizing1.positionSize.toLocaleString()}`);
  console.log(`  % of Account: ${((sizing1.positionSize / 100000) * 100).toFixed(1)}%`);
  console.log(`\n🛡️  Risk Management:`);
  console.log(`  Stop Loss: $${sizing1.stopLossPrice.toFixed(2)} (5% below entry)`);
  console.log(`  Take Profit: $${sizing1.takeProfitPrice.toFixed(2)} (15% above entry)`);
  console.log(`  Max Loss: $${sizing1.maxLoss.toFixed(2)}`);
  console.log(`  Max Gain: $${sizing1.maxGain.toFixed(2)}`);
  console.log(`  Risk-Reward Ratio: ${sizing1.riskRewardRatio}:1\n`);

  // ============================================================
  // SCENARIO 2: Kelly Criterion (Aggressive)
  // ============================================================
  console.log('📊 SCENARIO 2: Position Sizing (Kelly Criterion)');
  console.log('-'.repeat(70));

  const sizing2 = riskManagementService.calculateKellyPosition({
    accountBalance: 100000,
    entryPrice: 150,
    winRate: 0.55, // 55% win rate
    avgWin: 500, // Average win $500
    avgLoss: 300, // Average loss $300
  });

  console.log(`Win Rate: 55%`);
  console.log(`Average Win: $${sizing2.avgWin}`);
  console.log(`Average Loss: $${sizing2.avgLoss}`);
  console.log(`\n📈 Kelly Position:`);
  console.log(`  Shares: ${sizing2.shares}`);
  console.log(`  Position Size: $${sizing2.positionSize.toLocaleString()}`);
  console.log(`  % of Account: ${((sizing2.positionSize / 100000) * 100).toFixed(1)}%`);
  console.log(`  Max Loss: $${sizing2.maxLoss.toFixed(2)}`);
  console.log(`  Max Gain: $${sizing2.maxGain.toFixed(2)}\n`);

  // ============================================================
  // SCENARIO 3: Portfolio Risk Check
  // ============================================================
  console.log('📊 SCENARIO 3: Portfolio Risk Analysis');
  console.log('-'.repeat(70));

  const portfolioRisk = riskManagementService.calculatePortfolioRisk({
    positions: [
      { symbol: 'AAPL', entryPrice: 150, currentPrice: 155, shares: 100, stopLoss: 142 },
      { symbol: 'MSFT', entryPrice: 300, currentPrice: 295, shares: 50, stopLoss: 285 },
      { symbol: 'GOOGL', entryPrice: 140, currentPrice: 148, shares: 80, stopLoss: 133 },
      { symbol: 'TSLA', entryPrice: 200, currentPrice: 210, shares: 60, stopLoss: 190 },
    ],
    accountBalance: 100000,
    maxPortfolioHeat: 0.20, // Max 20% of account at risk
  });

  console.log(`Account Balance: $100,000`);
  console.log(`Max Portfolio Heat: 20%`);
  console.log(`\n📊 Portfolio Analysis:`);
  console.log(`  Total Position Value: $${portfolioRisk.totalPositionSize.toLocaleString()}`);
  console.log(`  Total Risk (if all stops hit): $${portfolioRisk.totalRisk.toLocaleString()}`);
  console.log(`  Portfolio Heat: ${(portfolioRisk.portfolioHeat * 100).toFixed(1)}%`);
  console.log(`  Can Add New Position: ${portfolioRisk.canAddNewPosition ? '✅ Yes' : '❌ No'}`);

  if (portfolioRisk.warnings.length > 0) {
    console.log(`\n⚠️  Warnings:`);
    portfolioRisk.warnings.forEach(warning => console.log(`  ${warning}`));
  }
  console.log();

  // ============================================================
  // SCENARIO 4: Trading Limits Check
  // ============================================================
  console.log('📊 SCENARIO 4: Trading Limits Check');
  console.log('-'.repeat(70));

  const limits1 = riskManagementService.checkTradingLimits({
    accountBalance: 100000,
    maxDrawdown: 0.15, // 15% max drawdown
    currentDrawdown: 0.08, // Currently 8% down
    consecutiveLosses: 3,
    maxConsecutiveLosses: 5,
    dailyLossLimit: 2000,
  });

  console.log(`Max Drawdown: 15%`);
  console.log(`Current Drawdown: ${limits1.currentDrawdown * 100}%`);
  console.log(`Consecutive Losses: ${limits1.consecutiveLosses}/${limits1.maxConsecutiveLosses}`);
  console.log(`\n✅ Status: ${limits1.canTrade ? 'CAN TRADE' : 'MUST STOP'}`);

  if (limits1.recommendedActions.length > 0) {
    console.log(`\n📋 Recommendations:`);
    limits1.recommendedActions.forEach(action => console.log(`  ${action}`));
  }
  console.log();

  // ============================================================
  // SCENARIO 5: Approaching Limits (Warning)
  // ============================================================
  console.log('📊 SCENARIO 5: Approaching Trading Limits');
  console.log('-'.repeat(70));

  const limits2 = riskManagementService.checkTradingLimits({
    accountBalance: 100000,
    maxDrawdown: 0.15,
    currentDrawdown: 0.12, // 12% drawdown (close to 15% limit!)
    consecutiveLosses: 4, // Close to 5 limit
    maxConsecutiveLosses: 5,
    dailyLossLimit: 2000,
  });

  console.log(`Max Drawdown: 15%`);
  console.log(`Current Drawdown: ${limits2.currentDrawdown * 100}%`);
  console.log(`Consecutive Losses: ${limits2.consecutiveLosses}/${limits2.maxConsecutiveLosses}`);
  console.log(`\n✅ Status: ${limits2.canTrade ? 'CAN TRADE' : 'MUST STOP'}`);

  if (limits2.reasons.length > 0) {
    console.log(`\n❌ Reasons:`);
    limits2.reasons.forEach(reason => console.log(`  ${reason}`));
  }

  if (limits2.recommendedActions.length > 0) {
    console.log(`\n⚠️  Warnings & Recommendations:`);
    limits2.recommendedActions.forEach(action => console.log(`  ${action}`));
  }
  console.log();

  // ============================================================
  // SCENARIO 6: Correlation Risk Check
  // ============================================================
  console.log('📊 SCENARIO 6: Sector Concentration Risk');
  console.log('-'.repeat(70));

  const existingPositions = ['AAPL', 'MSFT', 'GOOGL']; // All tech
  const correlation1 = riskManagementService.calculateCorrelationRisk(
    existingPositions,
    'NVDA', // Want to add more tech
    3
  );

  console.log(`Existing Positions: ${existingPositions.join(', ')}`);
  console.log(`Want to Add: NVDA`);
  console.log(`\n${correlation1.message}`);

  const correlation2 = riskManagementService.calculateCorrelationRisk(
    ['AAPL', 'MSFT'],
    'JPM', // Finance (different sector)
    3
  );

  console.log(`\nExisting Positions: AAPL, MSFT`);
  console.log(`Want to Add: JPM`);
  console.log(`\n${correlation2.message}\n`);

  // ============================================================
  // SCENARIO 7: Volatility-Adjusted Position Sizing
  // ============================================================
  console.log('📊 SCENARIO 7: Volatility-Adjusted Position Sizing');
  console.log('-'.repeat(70));

  // Low volatility stock
  const volSizing1 = riskManagementService.calculateVolatilityAdjustedPosition({
    accountBalance: 100000,
    entryPrice: 150,
    stopLoss: 142,
    atr: 2, // Low volatility
  });

  console.log(`Stock A: $150 (Low Volatility - ATR: $2)`);
  console.log(`  Shares: ${volSizing1.shares}`);
  console.log(`  Position Size: $${volSizing1.positionSize.toLocaleString()}`);

  // High volatility stock
  const volSizing2 = riskManagementService.calculateVolatilityAdjustedPosition({
    accountBalance: 100000,
    entryPrice: 150,
    stopLoss: 142,
    atr: 10, // High volatility
  });

  console.log(`\nStock B: $150 (High Volatility - ATR: $10)`);
  console.log(`  Shares: ${volSizing2.shares}`);
  console.log(`  Position Size: $${volSizing2.positionSize.toLocaleString()}`);
  console.log(`\n💡 Position size reduced by: ${(((volSizing1.positionSize - volSizing2.positionSize) / volSizing1.positionSize) * 100).toFixed(1)}% due to higher volatility\n`);

  // ============================================================
  // SUMMARY
  // ============================================================
  console.log('='.repeat(70));
  console.log('✅ RISK MANAGEMENT FEATURES DEMONSTRATED');
  console.log('='.repeat(70));
  console.log('\n🔑 Key Risk Management Principles:\n');
  console.log('1. Position Sizing:');
  console.log('   - Fixed Fractional: Risk 1-2% per trade');
  console.log('   - Kelly Criterion: Based on win rate (aggressive)');
  console.log('   - Volatility-Adjusted: Reduce size in volatile stocks\n');
  console.log('2. Portfolio Risk:');
  console.log('   - Limit total risk to 20% of account');
  console.log('   - Avoid sector concentration');
  console.log('   - Monitor portfolio heat\n');
  console.log('3. Trading Limits:');
  console.log('   - Max drawdown: 15% (stop trading if hit)');
  console.log('   - Max consecutive losses: 5');
  console.log('   - Daily loss limits\n');
  console.log('4. Risk-Reward Ratio:');
  console.log('   - Minimum 2:1 (prefer 3:1)');
  console.log('   - Skip trades with poor risk-reward\n');
  console.log('='.repeat(70) + '\n');
}

// Run demo
runRiskManagementDemo().catch(console.error);
