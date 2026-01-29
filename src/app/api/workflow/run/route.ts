/**
 * POST /api/workflow/run
 *
 * Run complete trading workflow: screening + ML signals
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    console.log('\n🔄 Starting complete workflow...');

    // Step 1: Run screening
    console.log('📊 Step 1: Running stock screening...');
    const stocks = await prisma.stock.findMany();
    const screener = await import('@/services/minerviniScreener');
    const MinerviniScreenerService = screener.MinerviniScreenerService;

    let screenedCount = 0;
    let qualifiedCount = 0;

    for (const { symbol } of stocks) {
      try {
        const result = await MinerviniScreenerService.screenStock(symbol);
        screenedCount++;

        if (result.passedCriteria >= 6) {
          qualifiedCount++;
        }
      } catch (error) {
        console.error(`Error screening ${symbol}:`, error);
      }
    }

    console.log(`✅ Screening complete: ${screenedCount} stocks, ${qualifiedCount} qualified`);

    // Step 2: Generate ML signals for qualified stocks
    console.log('🤖 Step 2: Generating ML signals...');
    const mlService = await import('@/services/mlSignals');
    const MLSignalService = mlService.MLSignalService;
    const mlServiceInstance = new MLSignalService();
    await mlServiceInstance.initialize();

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let signalsGenerated = 0;

    for (const { symbol } of stocks) {
      try {
        const signalData = await mlServiceInstance.generateSignal(symbol);

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
            price: signalData.price,
            rsi: signalData.rsi,
            macd: signalData.macd,
            ma20Ma50: signalData.ma20Ma50,
            bollingerUpper: signalData.bollingerUpper,
            bollingerMiddle: signalData.bollingerMiddle,
            bollingerLower: signalData.bollingerLower,
            obv: signalData.obv || BigInt(0),
          },
          create: {
            symbol,
            date: today,
            signal: signalData.signal,
            confidence: signalData.confidence,
            price: signalData.price || 0,
            rsi: signalData.rsi || 50,
            macd: signalData.macd || 0,
            ma20Ma50: signalData.ma20Ma50 || false,
            bollingerUpper: signalData.bollingerUpper || 0,
            bollingerMiddle: signalData.bollingerMiddle || 0,
            bollingerLower: signalData.bollingerLower || 0,
            obv: BigInt(0),
          },
        });

        signalsGenerated++;
      } catch (error) {
        console.error(`Error generating signal for ${symbol}:`, error);
      }
    }

    console.log(`✅ ML signals generated: ${signalsGenerated} signals`);

    return NextResponse.json({
      success: true,
      message: `Workflow complete!\n\nScreened: ${screenedCount} stocks\nQualified: ${qualifiedCount} stocks\nSignals generated: ${signalsGenerated} signals`,
    });
  } catch (error) {
    console.error('Workflow error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Workflow failed',
      },
      { status: 500 }
    );
  }
}
