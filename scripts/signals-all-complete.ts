import { prisma } from '../src/lib/prisma';

async function generateAllSignals() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  console.log('🤖 Generating ML signals for qualified stocks...\n');
  console.log(`📅 Target date: ${today.toISOString().split('T')[0]}\n`);

  // Get stocks that passed screening (6+ criteria) for today or latest
  const qualifiedStocks = await prisma.screenedStock.groupBy({
    by: ['symbol'],
    where: {
      passedCriteria: { gte: 6 }
    },
    orderBy: {
      _max: {
        date: 'desc'
      }
    },
    take: 503
  });

  console.log(`Found ${qualifiedStocks.length} qualified stocks (6+ criteria)\n`);

  // Check which stocks already have today's signals
  const existingSignals = await prisma.signal.findMany({
    where: {
      date: { gte: today, lt: tomorrow }
    },
    select: { symbol: true }
  });

  const processedSymbols = new Set(existingSignals.map(s => s.symbol));
  console.log(`Already generated signals today: ${processedSymbols.size} stocks`);
  console.log(`Remaining to process: ${qualifiedStocks.length - processedSymbols.size} stocks\n`);

  if (processedSymbols.size >= qualifiedStocks.length) {
    console.log('✅ All qualified stocks already have ML signals for today!');
    console.log(`📊 Summary: ${existingSignals.length} signals generated`);
    await prisma.$disconnect();
    return;
  }

  // Filter out already processed stocks
  const stocksToProcess = qualifiedStocks.filter(s => !processedSymbols.has(s.symbol));
  console.log(`Will generate signals for ${stocksToProcess.length} stocks...\n`);

  const { MLSignalService } = await import('../src/services/mlSignals');
  const mlService = new MLSignalService();
  await mlService.initialize();

  let generated = 0;
  let failed = 0;

  for (const stock of stocksToProcess) {
    const symbol = stock.symbol;
    try {
      console.log(`[${generated + 1}/${stocksToProcess.length}] Generating signal for ${symbol}...`);

      const signalData = await mlService.generateSignal(symbol);

      await prisma.signal.upsert({
        where: {
          symbol_date: {
            symbol: symbol,
            date: today,
          },
        },
        update: {
          signal: signalData.signal,
          confidence: signalData.confidence,
          rsi: signalData.rsi || 50,
          macd: signalData.macd || 0,
          macdSignal: signalData.macdSignal || 0,
          macdHistogram: signalData.macdHistogram || 0,
          ma20Ma50: signalData.ma20Ma50 ? 1 : 0,
          bollingerUpper: signalData.bollingerUpper || 0,
          bollingerMiddle: signalData.bollingerMiddle || 0,
          bollingerLower: signalData.bollingerLower || 0,
          obv: signalData.obv || BigInt(0),
        },
        create: {
          symbol,
          date: today,
          signal: signalData.signal,
          confidence: signalData.confidence,
          rsi: signalData.rsi || 50,
          macd: signalData.macd || 0,
          macdSignal: signalData.macdSignal || 0,
          macdHistogram: signalData.macdHistogram || 0,
          ma20Ma50: signalData.ma20Ma50 ? 1 : 0,
          bollingerUpper: signalData.bollingerUpper || 0,
          bollingerMiddle: signalData.bollingerMiddle || 0,
          bollingerLower: signalData.bollingerLower || 0,
          obv: BigInt(0),
        },
      });

      generated++;
      const signalType = signalData.signal === 1 ? 'BUY' : signalData.signal === -1 ? 'SELL' : 'HOLD';
      console.log(`  ✅ ${signalType} (${(signalData.confidence * 100).toFixed(0)}% confidence)`);
    } catch (error) {
      failed++;
      console.error(`  ❌ Error: ${error}`);
    }
  }

  // Get final counts
  const finalSignals = await prisma.signal.count({
    where: { date: { gte: today, lt: tomorrow } }
  });

  console.log(`\n✅ ML Signal Generation Complete!`);
  console.log(`📊 Final Results for ${today.toISOString().split('T')[0]}:`);
  console.log(`   Qualified stocks: ${qualifiedStocks.length}`);
  console.log(`   Signals generated: ${finalSignals}`);
  console.log(`   Success rate: ${finalSignals > 0 ? ((finalSignals / qualifiedStocks.length) * 100).toFixed(1) : 0}%`);

  await prisma.$disconnect();
}

generateAllSignals();
