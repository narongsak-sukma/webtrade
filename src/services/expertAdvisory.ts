/**
 * Expert Advisory Board
 * Simulates 3 expert stock investors with different philosophies
 * Each expert scores stocks on their criteria, then we take consensus
 */

import { prisma } from '@/lib/prisma';

interface ExpertScore {
  expert: string;
  score: number; // 0-100
  reason: string;
}

interface StockRecommendation {
  symbol: string;
  name: string;
  market: string;
  currency: string;
  screeningScore: number;
  consensusScore: number;
  expertScores: ExpertScore[];
  finalRecommendation: 'STRONG BUY' | 'BUY' | 'HOLD' | 'AVOID' | 'STRONG SELL';
  confidence: number;
}

/**
 * Expert 1: Mark Minervini (Trend Following)
 * Focuses on powerful uptrends with strong momentum
 * Criteria: Price action, volume, trend strength
 */
const minerviniExpert = (stock: any): ExpertScore => {
  let score = 0;
  const reasons = [];

  // Strong uptrend (price well above key MAs)
  if (stock.priceAboveMa150 && stock.ma150AboveMa200) {
    score += 15;
    reasons.push('Powerful uptrend');
  }

  // Price near 52-week highs
  if (stock.priceNear52WeekHigh) {
    score += 15;
    reasons.push('Near 52-week highs (strength)');
  }

  // Strong volume support (Filter 10)
  if (stock.volumeAboveAvg) {
    score += 10;
    reasons.push('Strong volume confirmation');
  }

  // Multiple MA alignments
  if (stock.ma50AboveMa150 && stock.ma150AboveMa200 && stock.priceAboveMa20) {
    score += 15;
    reasons.push('Perfect MA alignment');
  }

  // ADX strong trend (Filter 12)
  if (stock.adxStrong) {
    score += 10;
    reasons.push('Strong trend momentum');
  }

  // MACD bullish (Filter 11)
  if (stock.macdBullish) {
    score += 10;
    reasons.push('Bullish momentum');
  }

  // Minimum screening score (now out of 14)
  score += (stock.passedCriteria / 14) * 25; // 0-25 points

  return {
    expert: 'Mark Minervini (Trend Expert)',
    score: Math.min(score, 100),
    reason: reasons.join(', ') || 'Moderate trend'
  };
};

/**
 * Expert 2: Peter Lynch (Growth at Reasonable Price)
 * Focuses on growth stocks that are not overvalued
 * Criteria: RSI not overbought, steady uptrend
 */
const lynchExpert = (stock: any): ExpertScore => {
  let score = 0;
  const reasons = [];

  // RSI in sweet spot (30-70, not overbought) - Filter 9
  if (stock.rsiInRange && stock.priceAboveMa150) {
    score += 25;
    reasons.push('Growth with strength');
  } else if (!stock.rsiInRange) {
    score -= 20; // Penalty for overbought/oversold
  }

  // Steady trend (not too volatile)
  if (stock.passedCriteria >= 10) { // Changed threshold for 14 criteria
    score += 25;
    reasons.push('Proven trend');
  }

  // Price above all major MAs (institutional support)
  if (stock.priceAboveMa150 && stock.ma150AboveMa200 && stock.priceAboveMa20) {
    score += 20;
    reasons.push('Institutional quality');
  }

  // Bollinger Band position (Filter 14) - not overextended
  if (stock.priceInBBRange) {
    score += 15;
    reasons.push('Reasonable valuation');
  } else if (stock.priceNear52WeekHigh) {
    score -= 10; // Warning: may be extended
  }

  // Volume confirmation (Filter 10)
  if (stock.volumeAboveAvg) {
    score += 10;
    reasons.push('Institutional accumulation');
  }

  // Minimum screening foundation
  score += Math.max(0, (stock.passedCriteria - 6) * 5); // 0-40 points

  return {
    expert: 'Peter Lynch (Growth Expert)',
    score: Math.min(Math.max(score, 0), 100),
    reason: reasons.join(', ') || 'Evaluate trend'
  };
};

/**
 * Expert 3: Warren Buffett (Quality & Value)
 * Focuses on high-quality companies at fair prices
 * Criteria: Strong fundamentals, reasonable valuation
 */
const buffettExpert = (stock: any): ExpertScore => {
  let score = 0;
  const reasons = [];

  // Strong trend confirmation (12+ out of 14 criteria)
  if (stock.passedCriteria >= 12) {
    score += 30;
    reasons.push('Perfect technical setup');
  } else if (stock.passedCriteria >= 10) {
    score += 20;
    reasons.push('Strong technicals');
  }

  // Steady, reliable uptrend (not speculative)
  if (stock.priceAboveMa150 && stock.ma50AboveMa150 && !stock.priceNear52WeekHigh) {
    score += 20;
    reasons.push('Steady compounder');
  }

  // Conservative trend (price > MA200, showing long-term strength)
  if (stock.ma150AboveMa200) {
    score += 15;
    reasons.push('Long-term uptrend');
  }

  // ADX strong trend (Filter 12) - quality trend, not noise
  if (stock.adxStrong) {
    score += 10;
    reasons.push('Quality trend');
  }

  // Bollinger Bands (Filter 14) - fair value, not overextended
  if (stock.priceInBBRange) {
    score += 10;
    reasons.push('Fair valuation');
  } else if (!stock.rsiInRange) {
    score -= 15; // Avoid overbought
    reasons.push('Overextended warning');
  }

  // Strong foundation
  score += (stock.passedCriteria / 14) * 15; // 0-15 points

  return {
    expert: 'Warren Buffett (Quality Expert)',
    score: Math.min(Math.max(score, 0), 100),
    reason: reasons.join(', ') || 'Quality check'
  };
};

/**
 * Get consensus recommendation from 3 experts
 * Now uses 14 criteria instead of 8 (more explainable filters)
 */
export async function getExpertRecommendations(limit: number = 5, market?: string): Promise<StockRecommendation[]> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Build where clause for market filter
  const whereClause: any = {
    date: { gte: today },
    passedCriteria: { gte: 10 }  // Increased from 6 to 10 (14 criteria total)
  };

  // If market specified, filter by it
  if (market && market !== 'all') {
    whereClause.stock = {
      market: market.toUpperCase(),
    };
  }

  // Get qualified stocks from latest screening (require 10+ out of 14 criteria)
  const qualifiedStocks = await prisma.screenedStock.findMany({
    where: whereClause,
    include: {
      stock: {
        select: { name: true, sector: true, market: true, currency: true }
      }
    },
    orderBy: { passedCriteria: 'desc' }
  });

  console.log(`🤠 Expert Advisory Board analyzing ${qualifiedStocks.length} qualified stocks (10+/14 criteria)...\n`);

  // Get expert scores for each stock
  const recommendations: StockRecommendation[] = [];

  for (const screenedStock of qualifiedStocks) {
    const expertScores: ExpertScore[] = [
      minerviniExpert(screenedStock),
      lynchExpert(screenedStock),
      buffettExpert(screenedStock)
    ];

    // Calculate consensus (average of expert scores)
    const avgScore = expertScores.reduce((sum, s) => sum + s.score, 0) / expertScores.length;

    // Determine final recommendation based on consensus
    let finalRecommendation: StockRecommendation['finalRecommendation'];
    let confidence = avgScore / 100;

    if (avgScore >= 80) {
      finalRecommendation = 'STRONG BUY';
      confidence = 0.9;
    } else if (avgScore >= 65) {
      finalRecommendation = 'BUY';
      confidence = 0.8;
    } else if (avgScore >= 40) {
      finalRecommendation = 'HOLD';
      confidence = 0.6;
    } else if (avgScore >= 25) {
      finalRecommendation = 'AVOID';
      confidence = 0.5;
    } else {
      finalRecommendation = 'STRONG SELL';
      confidence = 0.8;
    }

    recommendations.push({
      symbol: screenedStock.symbol,
      name: screenedStock.stock?.name || screenedStock.symbol,
      market: screenedStock.stock?.market || 'US',
      currency: screenedStock.stock?.currency || 'USD',
      screeningScore: screenedStock.passedCriteria,
      consensusScore: Math.round(avgScore),
      expertScores,
      finalRecommendation,
      confidence
    });
  }

  // Sort by consensus score and take top N
  recommendations.sort((a, b) => b.consensusScore - a.consensusScore);
  const topRecommendations = recommendations.slice(0, limit);

  console.log(`\n📊 Expert Consensus - Top ${limit} Recommendations:`);
  topRecommendations.forEach((rec, i) => {
    console.log(`\n${i + 1}. ${rec.symbol} (${rec.name})`);
    console.log(`   Minervini: ${rec.expertScores[0].score}/100 - "${rec.expertScores[0].reason}"`);
    console.log(`   Lynch:     ${rec.expertScores[1].score}/100 - "${rec.expertScores[1].reason}"`);
    console.log(`   Buffett:   ${rec.expertScores[2].score}/100 - "${rec.expertScores[2].reason}"`);
    console.log(`   📈 CONSENSUS: ${rec.consensusScore}/100`);
    console.log(`   🎯 RECOMMENDATION: ${rec.finalRecommendation} (${(rec.confidence * 100).toFixed(0)}% confidence)`);
  });

  return topRecommendations;
}

export { getExpertRecommendations as getDailyTopPicks };
