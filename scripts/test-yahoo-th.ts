import yahooFinance from 'yahoo-finance2';

async function testFetch() {
  const symbols = ['BBL.BK', 'ADVANC.BK', 'AOT.BK'];

  for (const symbol of symbols) {
    try {
      console.log(`\n📈 Testing ${symbol}...`);
      const result = await yahooFinance.historical(symbol, {
        period1: '2024-01-01',
        interval: '1d',
      });

      if (result && result.length > 0) {
        const latest = result[result.length - 1];
        console.log(`  ✅ Success! Fetched ${result.length} days of data`);
        console.log(`  Latest: ${latest.date} - Close: ${latest.close}`);
      } else {
        console.log(`  ⚠️  No data found`);
      }
    } catch (error) {
      console.error(`  ❌ Error: ${error instanceof Error ? error.message : error}`);
    }
  }
}

testFetch();
