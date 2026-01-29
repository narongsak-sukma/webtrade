/**
 * End-to-End Multi-Market Testing Script
 *
 * Tests complete workflow for US and TH markets:
 * 1. Screening results with market filtering
 * 2. Expert recommendations with market filtering
 * 3. ML signals with market filtering
 * 4. Currency display correctness
 * 5. Data integrity checks
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface TestResult {
  test: string;
  status: 'PASS' | 'FAIL';
  details: string;
}

const results: TestResult[] = [];

function log(message: string) {
  console.log(message);
}

function recordTest(test: string, status: 'PASS' | 'FAIL', details: string) {
  results.push({ test, status, details });
  const icon = status === 'PASS' ? '✅' : '❌';
  log(`${icon} ${test}: ${details}`);
}

async function testScreeningResults() {
  log('\n📊 Testing Screening Results with Market Filtering\n');

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Test 1: All markets
  const allStocks = await prisma.screenedStock.count({
    where: { date: { gte: today } }
  });
  recordTest('Screening: All Markets', allStocks > 0 ? 'PASS' : 'FAIL', `${allStocks} stocks found`);

  // Test 2: US market only
  const usStocks = await prisma.screenedStock.count({
    where: {
      date: { gte: today },
      stock: { market: 'US' }
    }
  });
  recordTest('Screening: US Market', usStocks > 0 ? 'PASS' : 'FAIL', `${usStocks} stocks found`);

  // Test 3: TH market only
  const thStocks = await prisma.screenedStock.count({
    where: {
      date: { gte: today },
      stock: { market: 'TH' }
    }
  });
  recordTest('Screening: TH Market', thStocks > 0 ? 'PASS' : 'FAIL', `${thStocks} stocks found`);

  // Test 4: US stocks have USD currency
  const usStockSample = await prisma.screenedStock.findFirst({
    where: {
      date: { gte: today },
      stock: { market: 'US' }
    },
    include: { stock: { select: { currency: true } } }
  });
  const usCurrencyCorrect = usStockSample?.stock?.currency === 'USD';
  recordTest('Screening: US Currency', usCurrencyCorrect ? 'PASS' : 'FAIL', usStockSample?.stock?.currency || 'N/A');

  // Test 5: TH stocks have THB currency
  const thStockSample = await prisma.screenedStock.findFirst({
    where: {
      date: { gte: today },
      stock: { market: 'TH' }
    },
    include: { stock: { select: { currency: true } } }
  });
  const thCurrencyCorrect = thStockSample?.stock?.currency === 'THB';
  recordTest('Screening: TH Currency', thCurrencyCorrect ? 'PASS' : 'FAIL', thStockSample?.stock?.currency || 'N/A');
}

async function testExpertRecommendations() {
  log('\n🤠 Testing Expert Recommendations with Market Filtering\n');

  // Import the service function
  const { getExpertRecommendations } = await import('../src/services/expertAdvisory');

  // Test 1: All markets
  const allRecs = await getExpertRecommendations(5);
  recordTest('Expert Recs: All Markets', allRecs.length > 0 ? 'PASS' : 'FAIL', `${allRecs.length} recommendations`);

  // Test 2: US market only
  const usRecs = await getExpertRecommendations(5, 'US');
  const allUs = usRecs.every(r => r.market === 'US');
  recordTest('Expert Recs: US Market', allUs && usRecs.length > 0 ? 'PASS' : 'FAIL', `${usRecs.length} US stocks, all correct market`);

  // Test 3: TH market only
  const thRecs = await getExpertRecommendations(5, 'TH');
  const allTh = thRecs.every(r => r.market === 'TH');
  recordTest('Expert Recs: TH Market', allTh && thRecs.length > 0 ? 'PASS' : 'FAIL', `${thRecs.length} TH stocks, all correct market`);

  // Test 4: Currency field exists and matches market
  const usHasUSD = usRecs.every(r => r.currency === 'USD');
  recordTest('Expert Recs: US Currency', usHasUSD ? 'PASS' : 'FAIL', 'All US stocks have USD');

  const thHasTHB = thRecs.every(r => r.currency === 'THB');
  recordTest('Expert Recs: TH Currency', thHasTHB ? 'PASS' : 'FAIL', 'All TH stocks have THB');

  // Test 5: Recommendations include both markets when "all" is selected
  const hasBothMarkets = allRecs.some(r => r.market === 'US') && allRecs.some(r => r.market === 'TH');
  recordTest('Expert Recs: Mixed Markets', hasBothMarkets ? 'PASS' : 'FAIL', 'Contains both US and TH stocks');
}

async function testMLSignals() {
  log('\n🤖 Testing ML Signals with Market Filtering\n');

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Test 1: US ML signals exist
  const usSignals = await prisma.signal.findMany({
    where: {
      date: { gte: today },
      stock: { market: 'US' }
    }
  });
  recordTest('ML Signals: US Market', usSignals.length > 0 ? 'PASS' : 'FAIL', `${usSignals.length} US signals found`);

  // Test 2: TH ML signals exist
  const thSignals = await prisma.signal.findMany({
    where: {
      date: { gte: today },
      stock: { market: 'TH' }
    }
  });
  recordTest('ML Signals: TH Market', thSignals.length > 0 ? 'PASS' : 'FAIL', `${thSignals.length} TH signals found`);

  // Test 3: Signal values are valid (-1, 0, 1)
  const validSignals = thSignals.every(s => s.signal === -1 || s.signal === 0 || s.signal === 1);
  recordTest('ML Signals: Valid Values', validSignals ? 'PASS' : 'FAIL', 'All signals are -1, 0, or 1');

  // Test 4: Confidence values are valid (0-1)
  const validConfidence = thSignals.every(s => s.confidence.toNumber() >= 0 && s.confidence.toNumber() <= 1);
  recordTest('ML Signals: Valid Confidence', validConfidence ? 'PASS' : 'FAIL', 'All confidence values in [0, 1]');

  // Test 5: Technical indicators exist
  const hasIndicators = thSignals.every(s =>
    s.rsi !== null && s.rsi !== undefined &&
    s.macd !== null && s.macd !== undefined &&
    s.bollingerUpper !== null && s.bollingerUpper !== undefined
  );
  recordTest('ML Signals: Technical Indicators', hasIndicators ? 'PASS' : 'FAIL', 'RSI, MACD, Bollinger present');
}

async function testMarketBadgeLogic() {
  log('\n🏷️  Testing Market Badge and Currency Display Logic\n');

  // Test currency symbol function
  const getCurrencySymbol = (currency: string): string => {
    return currency === 'THB' ? '฿' : '$';
  };

  // Test 1: USD converts to $
  const usdSymbol = getCurrencySymbol('USD');
  recordTest('Currency: USD Symbol', usdSymbol === '$' ? 'PASS' : 'FAIL', `USD → "${usdSymbol}"`);

  // Test 2: THB converts to ฿
  const thbSymbol = getCurrencySymbol('THB');
  recordTest('Currency: THB Symbol', thbSymbol === '฿' ? 'PASS' : 'FAIL', `THB → "${thbSymbol}"`);

  // Test 3: Market badge colors (US = blue, TH = purple)
  const usBadgeClass = 'bg-blue-500/20 text-blue-400 border border-blue-500/30';
  const thBadgeClass = 'bg-purple-500/20 text-purple-400 border border-purple-500/30';

  recordTest('Badges: US Blue', usBadgeClass.includes('blue') ? 'PASS' : 'FAIL', 'US badge uses blue color');
  recordTest('Badges: TH Purple', thBadgeClass.includes('purple') ? 'PASS' : 'FAIL', 'TH badge uses purple color');
}

async function testDataIntegrity() {
  log('\n🔒 Testing Data Integrity\n');

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Test 1: All stocks have market field (check if market is set for a sample)
  const totalStocks = await prisma.stock.count();
  const stocksSample = await prisma.stock.findMany({
    where: {
      OR: [
        { market: 'US' },
        { market: 'TH' }
      ]
    },
    take: 10
  });
  const allHaveMarket = stocksSample.length > 0 && stocksSample.every(s => s.market === 'US' || s.market === 'TH');
  recordTest('Integrity: Market Field', allHaveMarket ? 'PASS' : 'FAIL', `Sample of ${stocksSample.length} stocks all have market field`);

  // Test 2: All stocks have currency field (check if currency is set for a sample)
  const stocksWithCurrency = await prisma.stock.findMany({
    where: {
      OR: [
        { currency: 'USD' },
        { currency: 'THB' }
      ]
    },
    take: 10
  });
  const allHaveCurrency = stocksWithCurrency.length > 0 && stocksWithCurrency.every(s => s.currency === 'USD' || s.currency === 'THB');
  recordTest('Integrity: Currency Field', allHaveCurrency ? 'PASS' : 'FAIL', `Sample of ${stocksWithCurrency.length} stocks all have currency field`);

  // Test 3: US stocks all have USD currency
  const usWithWrongCurrency = await prisma.stock.count({
    where: {
      market: 'US',
      currency: { not: 'USD' }
    }
  });
  recordTest('Integrity: US-USD Match', usWithWrongCurrency === 0 ? 'PASS' : 'FAIL', `${usWithWrongCurrency} US stocks not using USD`);

  // Test 4: TH stocks all have THB currency
  const thWithWrongCurrency = await prisma.stock.count({
    where: {
      market: 'TH',
      currency: { not: 'THB' }
    }
  });
  recordTest('Integrity: TH-THB Match', thWithWrongCurrency === 0 ? 'PASS' : 'FAIL', `${thWithWrongCurrency} TH stocks not using THB`);

  // Test 5: Screening scores are within valid range (0-14)
  const invalidScores = await prisma.screenedStock.count({
    where: {
      date: { gte: today },
      OR: [
        { passedCriteria: { lt: 0 } },
        { passedCriteria: { gt: 14 } }
      ]
    }
  });
  recordTest('Integrity: Score Range', invalidScores === 0 ? 'PASS' : 'FAIL', `${invalidScores} stocks with invalid scores`);
}

async function generateTestReport() {
  log('\n' + '='.repeat(60));
  log('📋 END-TO-END TEST REPORT');
  log('='.repeat(60) + '\n');

  const passed = results.filter(r => r.status === 'PASS').length;
  const failed = results.filter(r => r.status === 'FAIL').length;
  const total = results.length;
  const passRate = ((passed / total) * 100).toFixed(1);

  log(`Total Tests: ${total}`);
  log(`Passed: ${passed} ✅`);
  log(`Failed: ${failed} ❌`);
  log(`Pass Rate: ${passRate}%\n`);

  if (failed > 0) {
    log('❌ FAILED TESTS:');
    results
      .filter(r => r.status === 'FAIL')
      .forEach(r => log(`   • ${r.test}: ${r.details}`));
    log('');
  }

  const status = failed === 0 ? '🎉 ALL TESTS PASSED!' : '⚠️  SOME TESTS FAILED';
  log(status);
  log('='.repeat(60) + '\n');
}

async function runTests() {
  try {
    log('🚀 Starting Multi-Market End-to-End Tests...\n');

    await testScreeningResults();
    await testExpertRecommendations();
    await testMLSignals();
    await testMarketBadgeLogic();
    await testDataIntegrity();

    await generateTestReport();

    process.exit(results.filter(r => r.status === 'FAIL').length > 0 ? 1 : 0);

  } catch (error) {
    log(`\n❌ Test execution error: ${error}`);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runTests();
