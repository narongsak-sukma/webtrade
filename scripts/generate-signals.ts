import { prisma } from '../src/lib/prisma';

async function generateSignals() {
  console.log('🤖 Generating ML signals for qualified stocks...');

  // Get stocks that passed screening (6+ criteria)
  const qualifiedStocks = await prisma.screenedStock.findMany({
    where: {
      passedCriteria: { gte: 6 }
    },
    select: { symbol: true },
    distinct: ['symbol']
  });

  console.log(`Found ${qualifiedStocks.length} qualified stocks`);

  const { MLSignalService } = await import('../src/services/mlSignals');
  const mlService = new MLSignalService();
  await mlService.initialize();

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let generated = 0;

  for (const { symbol } of qualifiedStocks) {
    try {
      console.log(`[${generated + 1}/${qualifiedStocks.length}] Generating signal for ${symbol}...`);
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
      console.error(`  ❌ Error: ${error}`);
    }
  }

  console.log(`\n✅ Generated ${generated} signals for qualified stocks!`);
  await prisma.$disconnect();
}

generateSignals();
