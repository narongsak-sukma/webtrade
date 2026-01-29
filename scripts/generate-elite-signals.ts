/**
 * Generate ML Signals for ELITE Stocks (13+/14)
 *
 * This script generates ML-powered buy/sell/hold recommendations
 * ONLY for the best setups - stocks that passed 13+ out of 14 filters.
 */

import { mlSignalService } from '../src/services/mlSignals';

async function main() {
  console.log('🌟 ELITE Stock ML Signal Generation');
  console.log('===================================\n');
  console.log('Focusing on the BEST setups (13+/14 filters)');
  console.log('Only ~1-2% of stocks qualify for ELITE tier\n');

  try {
    const result = await mlSignalService.generateSignalsForElite();

    console.log('\n✅ ML Signal Generation Complete!');
    console.log(`📊 Generated ${result.generated} ML signals`);
    console.log(`🎯 Elite stocks analyzed: ${result.symbols.length}`);

    if (result.symbols.length > 0) {
      console.log('\n📈 ELITE Stocks with ML Recommendations:');
      result.symbols.forEach((symbol, index) => {
        console.log(`   ${index + 1}. ${symbol}`);
      });
    }

    console.log('\n💡 Next Steps:');
    console.log('   1. View signals at: http://localhost:3030/signals');
    console.log('   2. Each ELITE stock has ML-powered buy/sell/hold recommendation');
    console.log('   3. Check confidence scores to make informed decisions');

  } catch (error) {
    console.error('❌ Error generating ML signals:', error);
    process.exit(1);
  }
}

main();
