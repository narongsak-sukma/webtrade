/**
 * Market Regime Detection Demo
 *
 * Demonstrates market regime detection and signal adjustment
 *
 * Usage:
 *   npx tsx scripts/demo-market-regime.ts
 */

import { MarketRegimeService, MarketState } from '../src/services/marketRegime';

console.log('\n' + '='.repeat(70));
console.log('📊 MARKET REGIME DETECTION DEMO');
console.log('='.repeat(70) + '\n');

async function runMarketRegimeDemo() {
  const regimeService = new MarketRegimeService();

  // ============================================================
  // SCENARIO 1: Detect Current Market Regime
  // ============================================================
  console.log('📊 SCENARIO 1: Detecting Current Market Regime');
  console.log('-'.repeat(70));

  try {
    const regime = await regimeService.detectMarketRegime();

    console.log('\n📈 Regime Summary:');
    console.log(`  Market State: ${regime.state}`);
    console.log(`  Volatility: ${regime.volatility}`);
    console.log(`  Trend Strength: ${regime.trendStrength.toFixed(1)}/100`);
    console.log(`  Confidence: ${(regime.confidence * 100).toFixed(1)}%`);

    console.log('\n💡 Trading Recommendations:');
    console.log(`  Position Sizing: ${regime.recommendations.positionSizing.toUpperCase()}`);
    console.log(`  Risk Adjustment: ${(regime.recommendations.riskAdjustment * 100).toFixed(0)}% of normal size`);
    console.log(`  Allow New Positions: ${regime.recommendations.allowNewPositions ? '✅ YES' : '❌ NO'}`);
    console.log(`  Preferred Strategies:`);
    regime.recommendations.preferredStrategies.forEach(strategy => {
      console.log(`    - ${strategy}`);
    });

  } catch (error) {
    console.error(`❌ Error detecting regime: ${error}`);
  }

  // ============================================================
  // SCENARIO 2: Adjust Signals Based on Regime
  // ============================================================
  console.log('\n📊 SCENARIO 2: Signal Adjustment Based on Market Regime');
  console.log('-'.repeat(70));

  try {
    const regime = await regimeService.detectMarketRegime();

    console.log('\n🔄 Signal Adjustments:');
    console.log(`  Current Market: ${regime.state} (${regime.volatility} volatility)\n`);

    // Test different signal scenarios
    const testSignals = [
      { original: 1, description: 'BUY' },
      { original: 0, description: 'HOLD' },
      { original: -1, description: 'SELL' },
    ];

    testSignals.forEach(({ original, description }) => {
      const adjusted = regimeService.adjustSignalForRegime(original, regime);
      const adjustedDesc = adjusted === 1 ? 'BUY 🟢' : adjusted === -1 ? 'SELL 🔴' : 'HOLD ⏸️';

      console.log(`  ${description} → ${adjustedDesc}`);
      if (original !== adjusted) {
        console.log(`    ⚠️  Adjusted due to ${regime.state} market`);
      } else {
        console.log(`    ✅ No adjustment needed`);
      }
    });

  } catch (error) {
    console.error(`❌ Error: ${error}`);
  }

  // ============================================================
  // SCENARIO 3: Position Size Adjustment
  // ============================================================
  console.log('\n📊 SCENARIO 3: Position Size Adjustment');
  console.log('-'.repeat(70));

  try {
    const regime = await regimeService.detectMarketRegime();

    console.log('\n💰 Position Size Calculations:');
    console.log(`  Market: ${regime.state} (${regime.volatility} volatility)\n`);

    const basePosition = 10000; // $10,000 base position
    const adjustedPosition = regimeService.adjustPositionSizeForRegime(basePosition, regime);

    console.log(`  Base Position Size: $${basePosition.toLocaleString()}`);
    console.log(`  Risk Adjustment: ${(regime.recommendations.riskAdjustment * 100).toFixed(0)}%`);
    console.log(`  Adjusted Position: $${adjustedPosition.toLocaleString()}`);
    console.log(`  Difference: $${(basePosition - adjustedPosition).toLocaleString()}`);

    if (adjustedPosition < basePosition) {
      console.log(`  📉 REDUCED due to ${regime.state} market`);
    } else if (adjustedPosition > basePosition) {
      console.log(`  📈 INCREASED due to ${regime.state} market`);
    } else {
      console.log(`  ✅ NO CHANGE - normal market conditions`);
    }

  } catch (error) {
    console.error(`❌ Error: ${error}`);
  }

  // ============================================================
  // SCENARIO 4: Market Favorability Check
  // ============================================================
  console.log('\n📊 SCENARIO 4: Market Favorability Check');
  console.log('-'.repeat(70));

  try {
    const regime = await regimeService.detectMarketRegime();
    const isFavorable = regimeService.isFavorableMarket(regime);

    console.log('\n🎯 Market Conditions:');
    console.log(`  Current State: ${regime.state}`);
    console.log(`  Volatility: ${regime.volatility}`);
    console.log(`  Favorable for Trading: ${isFavorable ? '✅ YES' : '❌ NO'}`);

    if (!isFavorable) {
      console.log('\n⚠️  Recommendations:');
      console.log('  • Consider reducing position sizes');
      console.log('  • Focus on capital preservation');
      console.log('  • Wait for better market conditions');
      if (!regime.recommendations.allowNewPositions) {
        console.log('  • Do NOT open new positions');
        console.log('  • Consider hedging existing positions');
      }
    } else {
      console.log('\n✅ Good conditions for:');
      console.log('  • Opening new positions');
      console.log('  • Following ML signals');
      console.log('  • Normal risk management');
    }

  } catch (error) {
    console.error(`❌ Error: ${error}`);
  }

  // ============================================================
  // SCENARIO 5: Strategy Recommendations
  // ============================================================
  console.log('\n📊 SCENARIO 5: Strategy Recommendations by Market State');
  console.log('-'.repeat(70));

  const marketStates: { state: MarketState; description: string }[] = [
    { state: 'BULL', description: 'Strong uptrend, positive breadth' },
    { state: 'BEAR', description: 'Downtrend, negative breadth' },
    { state: 'SIDEWAYS', description: 'No clear trend, range-bound' },
    { state: 'VOLATILE', description: 'High volatility, elevated VIX' },
  ];

  console.log('\n📋 Recommended Strategies by Market State:\n');

  marketStates.forEach(({ state, description }) => {
    console.log(`  ${state}:`);
    console.log(`    ${description}`);

    let strategies: string[] = [];
    let sizing: string = '';

    switch (state) {
      case 'BULL':
        strategies = ['momentum', 'growth', 'breakout'];
        sizing = 'normal to aggressive';
        break;
      case 'BEAR':
        strategies = ['defensive', 'value', 'short-selling'];
        sizing = 'conservative';
        break;
      case 'SIDEWAYS':
        strategies = ['mean-reversion', 'range-trading'];
        sizing = 'normal to reduced';
        break;
      case 'VOLATILE':
        strategies = ['cash', 'volatility-trading', 'options-hedging'];
        sizing = 'very conservative';
        break;
    }

    console.log(`    Strategies: ${strategies.join(', ')}`);
    console.log(`    Position Sizing: ${sizing}`);
    console.log('');
  });

  // ============================================================
  // SUMMARY
  // ============================================================
  console.log('='.repeat(70));
  console.log('✅ MARKET REGIME DETECTION FEATURES DEMONSTRATED');
  console.log('='.repeat(70) + '\n');

  console.log('🔑 Key Market Regime Features:\n');
  console.log('1. Market State Detection:');
  console.log('   - BULL: Strong uptrend, positive breadth');
  console.log('   - BEAR: Downtrend, negative breadth');
  console.log('   - SIDEWAYS: No clear trend');
  console.log('   - VOLATILE: High volatility overrides all\n');
  console.log('2. Volatility Regime:');
  console.log('   - LOW: VIX < 15 (complacent)');
  console.log('   - MEDIUM: VIX 15-25 (normal)');
  console.log('   - HIGH: VIX > 25 (elevated fear)\n');
  console.log('3. Signal Adjustment:');
  console.log('   - Downgrade BUY to HOLD in bear markets');
  console.log('   - Block new positions in volatile markets');
  console.log('   - Upgrade HOLD to BUY in strong bull markets\n');
  console.log('4. Position Sizing:');
  console.log('   - BULL: 100% of normal size');
  console.log('   - SIDEWAYS: 75% of normal size');
  console.log('   - BEAR: 50% of normal size');
  console.log('   - VOLATILE: 40% of normal size\n');
  console.log('5. Market Indicators:');
  console.log('   - S&P 500 trend (200-day)');
  console.log('   - VIX level (volatility)');
  console.log('   - Advance/Decline ratio');
  console.log('   - New Highs - New Lows');
  console.log('   - Market Breadth (% above MA200)\n');
  console.log('='.repeat(70) + '\n');
}

// Run demo
runMarketRegimeDemo().catch(console.error);
