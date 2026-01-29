'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Navigation } from '@/components/layout/Navigation';
import { ProcessControlPanel } from '@/components/ProcessControlPanel';
import { StockPriceChart } from '@/components/StockPriceChart';

interface StockData {
  symbol: string;
  name: string | null;
  market: string;
  currency: string;
  price: number;
  ma50: number;
  ma150: number;
  ma200: number;

  // Original Minervini Criteria 1-8
  priceAboveMa150: boolean;
  ma150AboveMa200: boolean;
  ma200TrendingUp: boolean;
  ma50AboveMa150: boolean;
  priceAboveMa50: boolean;
  priceAbove52WeekLow: boolean;
  priceNear52WeekHigh: boolean;
  relativeStrengthPositive: boolean;

  // Explainable Filters 9-14
  rsi: number | null;
  rsiInRange: boolean;
  volume: number | null;
  volumeAvg50: number | null;
  volumeAboveAvg: boolean;
  macd: number | null;
  macdSignal: number | null;
  macdBullish: boolean;
  adx: number | null;
  adxStrong: boolean;
  ma20: number | null;
  priceAboveMa20: boolean;
  bollingerUpper: number | null;
  bollingerMiddle: number | null;
  bollingerLower: number | null;
  priceInBBRange: boolean;

  // Metadata
  week52Low: number | null;
  week52High: number | null;
  relativeStrength: number | null;
  passedCriteria: number;
  totalCriteria: number;
}

export default function ScreeningPage() {
  const [stocks, setStocks] = useState<StockData[]>([]);
  const [filteredStocks, setFilteredStocks] = useState<StockData[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');
  const [market, setMarket] = useState<string>('all');
  const [selectedStock, setSelectedStock] = useState<StockData | null>(null);
  const [chartStock, setChartStock] = useState<StockData | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    fetchData();
  }, [market]);

  useEffect(() => {
    if (stocks.length > 0) {
      applyFilter();
    }
  }, [stocks, filter, market]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/screening/results?market=${market}`);
      const data = await res.json();
      setStocks(data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching screening data:', error);
      setLoading(false);
    }
  };

  const applyFilter = () => {
    let filtered;
    if (filter === 'all') {
      filtered = stocks;
    } else if (filter === 'elite') {
      filtered = stocks.filter(s => s.passedCriteria >= 13);
    } else if (filter === 'qualified') {
      filtered = stocks.filter(s => s.passedCriteria >= 10 && s.passedCriteria < 13);
    } else if (filter === 'failed') {
      filtered = stocks.filter(s => s.passedCriteria < 10);
    } else {
      const criteria = parseInt(filter);
      filtered = stocks.filter(s => s.passedCriteria === criteria);
    }
    setFilteredStocks(filtered);
    console.log(`Filter applied: ${filter}, Stocks: ${stocks.length}, Filtered: ${filtered.length}`);
  };

  const getCurrencySymbol = (currency: string): string => {
    return currency === 'THB' ? '฿' : '$';
  };

  const getFilterInfo = (key: string): { label: string; explanation: string; category: string } => {
    const filters: Record<string, { label: string; explanation: string; category: string }> = {
      // Minervini Criteria 1-8
      priceAboveMa150: {
        label: '1. Price > MA150',
        explanation: 'Current price above 150-day moving average (medium-term uptrend)',
        category: 'Minervini'
      },
      ma150AboveMa200: {
        label: '2. MA150 > MA200',
        explanation: '150-day MA above 200-day MA (bullish alignment)',
        category: 'Minervini'
      },
      ma200TrendingUp: {
        label: '3. MA200 Rising',
        explanation: '200-day MA trending up over last 30 days (long-term bullish)',
        category: 'Minervini'
      },
      ma50AboveMa150: {
        label: '4. MA50 > MA150 > MA200',
        explanation: 'Perfect moving average stack (short, medium, long-term aligned)',
        category: 'Minervini'
      },
      priceAboveMa50: {
        label: '5. Price > MA50',
        explanation: 'Price above 50-day MA (short-term strength)',
        category: 'Minervini'
      },
      priceAbove52WeekLow: {
        label: '6. >30% Above 52W Low',
        explanation: 'Price at least 30% above 52-week low (confirmed recovery)',
        category: 'Minervini'
      },
      priceNear52WeekHigh: {
        label: '7. Near 52W High',
        explanation: 'Price within 25% of 52-week high (shows strength)',
        category: 'Minervini'
      },
      relativeStrengthPositive: {
        label: '8. Outperforming SPY',
        explanation: 'Stock beating S&P 500 (relative strength positive)',
        category: 'Minervini'
      },

      // Technical Filters 9-14
      rsiInRange: {
        label: '9. RSI 30-70',
        explanation: 'RSI in sweet spot, not overbought (>70) or oversold (<30)',
        category: 'Technical'
      },
      volumeAboveAvg: {
        label: '10. Volume Confirmation',
        explanation: 'Volume above 50-day average (institutional support)',
        category: 'Technical'
      },
      macdBullish: {
        label: '11. MACD Bullish',
        explanation: 'MACD line positive (bullish momentum)',
        category: 'Technical'
      },
      adxStrong: {
        label: '12. ADX > 25',
        explanation: 'ADX above 25 (strong trend, not choppy)',
        category: 'Technical'
      },
      priceAboveMa20: {
        label: '13. Price > MA20',
        explanation: 'Price above 20-day MA (near-term uptrend)',
        category: 'Technical'
      },
      priceInBBRange: {
        label: '14. Bollinger Position',
        explanation: 'Price in middle 50% of Bollinger Bands (fair value)',
        category: 'Technical'
      },
    };
    return filters[key] || { label: key, explanation: '', category: 'Other' };
  };

  const getExplanation = (stock: StockData): string => {
    const total = stock.totalCriteria || 14;
    const passed = stock.passedCriteria;
    const percentage = (passed / total) * 100;

    if (passed >= 10) {
      const strongPoints = [];
      if (stock.priceAboveMa150 && stock.ma150AboveMa200) strongPoints.push('✓ Powerful uptrend (price above MA150/MA200)');
      if (stock.ma50AboveMa150) strongPoints.push('✓ Perfect MA alignment');
      if (stock.priceNear52WeekHigh) strongPoints.push('✓ Near 52-week highs');
      if (stock.volumeAboveAvg) strongPoints.push('✓ Strong volume confirmation');
      if (stock.macdBullish) strongPoints.push('✓ MACD bullish momentum');
      if (stock.adxStrong) strongPoints.push('✓ Strong trend (ADX > 25)');
      if (stock.rsiInRange) strongPoints.push('✓ RSI in optimal range');
      if (stock.priceInBBRange) strongPoints.push('✓ Fair valuation (Bollinger Bands)');

      return `✅ ${stock.symbol} PASSED screening with ${passed}/${total} criteria (${percentage.toFixed(0)}%)

Strong points:
${strongPoints.map(p => '  ' + p).join('\n')}

This stock shows ${passed >= 12 ? 'EXCELLENT' : passed >= 10 ? 'GOOD' : 'MODERATE'} technical characteristics.
${passed >= 12 ? 'TOP TIER stock ready for expert review.' : passed >= 10 ? 'Qualified for expert advisory review.' : 'Borderline - consider for watchlist.'}`;
    } else {
      const weakPoints = [];
      if (!stock.priceAboveMa150 || !stock.ma150AboveMa200) weakPoints.push('✗ Weak trend (price below key MAs)');
      if (!stock.ma50AboveMa150) weakPoints.push('✗ Bearish MA alignment');
      if (!stock.volumeAboveAvg) weakPoints.push('✗ Low volume support');
      if (!stock.adxStrong) weakPoints.push('✗ Weak or choppy trend');
      if (!stock.rsiInRange) weakPoints.push('✗ RSI outside optimal range');
      if (!stock.priceInBBRange) weakPoints.push('✗ Overextended valuation');

      return `❌ ${stock.symbol} FAILED screening (${passed}/${total} criteria - ${percentage.toFixed(0)}%)

Reasons for failure:
${weakPoints.length > 0 ? weakPoints.map(p => '  ' + p).join('\n') : '  ✗ Did not meet minimum 10/14 criteria'}

This stock does not meet our quality standards.
AVOID or keep on watchlist until technical conditions improve.`;
    }
  };

  if (!mounted) {
    return null;
  }

  return (
    <div className="min-h-screen bg-animated relative">
      {/* Navigation */}
      <Navigation />

      {/* Animated background gradient overlay */}
      <div className="fixed inset-0 bg-gradient-to-br from-bg-primary via-bg-secondary to-bg-tertiary opacity-90 pointer-events-none" />

      <div className="relative z-10 max-w-[1800px] mx-auto p-6 lg:p-8">
        {/* Hero Section */}
        <div className="mb-8 animate-fade-in">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center shadow-lg glow-effect">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <h1 className="text-4xl lg:text-5xl font-bold bg-gradient-to-r from-white to-primary-light bg-clip-text text-transparent">
                  Stock Screening
                </h1>
              </div>
              <p className="text-text-secondary text-lg ml-15">
                Advanced Technical Analysis • {stocks.length} Stocks Analyzed • 14 Explainable Filters
              </p>
            </div>

            {/* Market Selector */}
            <div className="flex items-center gap-3">
              <span className="text-sm text-text-secondary font-medium">Market:</span>
              <div className="flex rounded-lg overflow-hidden border border-border">
                <button
                  onClick={() => setMarket('all')}
                  className={`px-4 py-2 text-sm font-medium transition-all ${
                    market === 'all'
                      ? 'bg-primary text-white'
                      : 'bg-bg-card text-text-secondary hover:text-white hover:bg-bg-secondary'
                  }`}
                >
                  All Markets
                </button>
                <button
                  onClick={() => setMarket('US')}
                  className={`px-4 py-2 text-sm font-medium transition-all ${
                    market === 'US'
                      ? 'bg-primary text-white'
                      : 'bg-bg-card text-text-secondary hover:text-white hover:bg-bg-secondary'
                  }`}
                >
                  🇺🇸 US (S&P 500)
                </button>
                <button
                  onClick={() => setMarket('TH')}
                  className={`px-4 py-2 text-sm font-medium transition-all ${
                    market === 'TH'
                      ? 'bg-primary text-white'
                      : 'bg-bg-card text-text-secondary hover:text-white hover:bg-bg-secondary'
                  }`}
                >
                  🇹🇭 TH (SET100)
                </button>
              </div>
            </div>
            <Link
              href="/pipeline"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-bg-card border border-border hover:border-primary transition-all duration-300 group"
            >
              <svg className="w-5 h-5 text-text-secondary group-hover:text-primary transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              <span className="text-text-secondary group-hover:text-primary transition-colors font-medium">Back to Pipeline</span>
            </Link>
          </div>

          {/* Info Banner */}
          <div className="card-premium p-6 bg-gradient-to-br from-bg-card via-bg-tertiary to-bg-card">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center border border-primary/20">
                <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-bold text-white mb-3">Explainable Filtering System</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div className="bg-bg-secondary/50 rounded-lg p-4 border border-border">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center text-primary font-bold text-xs">1-8</span>
                      <p className="font-semibold text-white">Minervini Trend Template</p>
                    </div>
                    <p className="text-text-secondary">
                      Price alignment, moving averages, relative strength, and position within 52-week range
                    </p>
                  </div>
                  <div className="bg-bg-secondary/50 rounded-lg p-4 border border-border">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center text-primary font-bold text-xs">9-14</span>
                      <p className="font-semibold text-white">Technical Indicators</p>
                    </div>
                    <p className="text-text-secondary">
                      RSI, Volume, MACD, ADX, MA20, and Bollinger Bands for additional confirmation
                    </p>
                  </div>
                </div>
                <div className="mt-4 flex items-center gap-2 px-4 py-3 bg-primary/10 border border-primary/20 rounded-lg">
                  <svg className="w-5 h-5 text-primary flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  <p className="text-sm text-white">
                    <span className="font-semibold text-primary">Elite Tier (13+/14):</span> Only the best setups with ML-powered buy/sell recommendations.
                    <span className="text-text-secondary mx-2">•</span>
                    <span className="font-semibold text-success">Qualified (10+/14):</span> Good setups for review.
                    Every filter is explainable, systematic, and scientifically grounded. No black box algorithms.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 mb-8 animate-slide-up" style={{ animationDelay: '0.1s' }}>
          <div
            onClick={() => setFilter('all')}
            className={`stat-card group cursor-pointer hover:scale-105 transition-transform duration-200 ${filter === 'all' ? 'ring-2 ring-primary/50' : ''}`}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-text-secondary text-sm font-medium">Total Screened</span>
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
            </div>
            <p className="metric-value">{stocks.length}</p>
            <p className="text-xs text-text-secondary mt-2 flex items-center gap-1">
              Stocks analyzed
              <svg className="w-3 h-3 text-primary opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </p>
          </div>

          <div
            onClick={() => setFilter('qualified')}
            className={`stat-card-success group cursor-pointer hover:scale-105 transition-transform duration-200 ${filter === 'qualified' ? 'ring-2 ring-success/50' : ''}`}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-text-secondary text-sm font-medium">Qualified (10+/14)</span>
              <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center group-hover:bg-success/20 transition-colors">
                <svg className="w-5 h-5 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <p className="metric-value" style={{ background: 'linear-gradient(135deg, #FFFFFF 0%, #10B981 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
              {stocks.filter((s: StockData) => s.passedCriteria >= 10).length}
            </p>
            <div className="flex items-center gap-2 mt-2">
              <div className="flex-1 h-1.5 bg-bg-tertiary rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-success to-success-light rounded-full transition-all duration-1000"
                  style={{ width: `${((stocks.filter((s: StockData) => s.passedCriteria >= 10).length / stocks.length) * 100).toFixed(0)}%` }}
                />
              </div>
              <span className="text-xs text-text-secondary whitespace-nowrap">
                {stocks.length > 0 ? ((stocks.filter((s: StockData) => s.passedCriteria >= 10).length / stocks.length) * 100).toFixed(1) : 0}%
              </span>
            </div>
            <p className="text-xs text-text-secondary mt-2 flex items-center gap-1">
              Click to view
              <svg className="w-3 h-3 text-success opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </p>
          </div>

          <div
            onClick={() => setFilter('elite')}
            className={`stat-card group relative overflow-hidden cursor-pointer hover:scale-105 transition-transform duration-200 ${filter === 'elite' ? 'ring-2 ring-primary/50' : ''}`}
            style={{ background: 'linear-gradient(135deg, rgba(0, 212, 170, 0.15) 0%, rgba(0, 212, 170, 0.05) 100%)', border: '2px solid rgba(0, 212, 170, 0.3)', boxShadow: '0 0 30px rgba(0, 212, 170, 0.4)' }}
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl"></div>
            <div className="relative">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-text-secondary text-sm font-medium">Top Tier</span>
                  <span className="px-2 py-0.5 rounded-full bg-gradient-to-r from-primary to-primary-light text-white text-xs font-bold">13+/14</span>
                </div>
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-primary-light flex items-center justify-center group-hover:scale-110 transition-transform">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                  </svg>
                </div>
              </div>
              <p className="metric-value" style={{ background: 'linear-gradient(135deg, #FFFFFF 0%, #00D4AA 50%, #5DF5CE 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', fontSize: '2.5rem' }}>
                {stocks.filter((s: StockData) => s.passedCriteria >= 13).length}
              </p>
              <p className="text-xs text-text-secondary mt-2 font-medium flex items-center gap-1">
                ⭐ Elite setups with ML signals
                <svg className="w-3 h-3 text-primary opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </p>
            </div>
          </div>

          <div
            onClick={() => setFilter('failed')}
            className={`stat-card-danger cursor-pointer hover:scale-105 transition-transform duration-200 ${filter === 'failed' ? 'ring-2 ring-danger/50' : ''}`}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-text-secondary text-sm font-medium">Failed (0-9/14)</span>
              <div className="w-10 h-10 rounded-lg bg-danger/10 flex items-center justify-center group-hover:bg-danger/20 transition-colors">
                <svg className="w-5 h-5 text-danger" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
            </div>
            <p className="metric-value" style={{ background: 'linear-gradient(135deg, #FFFFFF 0%, #EF4444 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
              {stocks.filter((s: StockData) => s.passedCriteria < 10).length}
            </p>
            <p className="text-xs text-text-secondary mt-2 flex items-center gap-1">
              Below threshold
              <svg className="w-3 h-3 text-danger opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </p>
          </div>
        </div>

        {/* Process Control Panel */}
        <ProcessControlPanel />

        {/* Filter Section */}
        <div className="card-premium p-6 mb-8 animate-slide-up" style={{ animationDelay: '0.2s' }}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
              Filter by Passed Criteria
            </h3>
            <span className="text-sm text-text-secondary">
              Showing {filteredStocks.length} of {stocks.length} stocks
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`filter-tag transition-all duration-200 ${
                filter === 'all'
                  ? 'ring-2 ring-primary/50 scale-105'
                  : 'hover:scale-105'
              }`}
              style={filter === 'all' ? {
                background: 'linear-gradient(135deg, #00D4AA 0%, #00B894 100%)',
                borderColor: '#00D4AA',
                boxShadow: '0 0 15px rgba(0, 212, 170, 0.3)'
              } : {}}
            >
              All ({stocks.length})
            </button>
            <button
              onClick={() => setFilter('elite')}
              className={`filter-tag transition-all duration-200 ${
                filter === 'elite'
                  ? 'ring-2 ring-primary/50 scale-105'
                  : 'hover:scale-105'
              }`}
              style={filter === 'elite' ? {
                background: 'linear-gradient(135deg, #00D4AA 0%, #00B894 100%)',
                borderColor: '#00D4AA',
                boxShadow: '0 0 20px rgba(0, 212, 170, 0.4)',
                animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite'
              } : {
                borderWidth: '2px',
                borderColor: 'rgba(0, 212, 170, 0.3)'
              }}
            >
              ⭐ Elite 13+ ({stocks.filter((s: StockData) => s.passedCriteria >= 13).length})
            </button>
            <button
              onClick={() => setFilter('qualified')}
              className={`filter-tag transition-all duration-200 ${
                filter === 'qualified'
                  ? 'ring-2 ring-success/50 scale-105'
                  : 'hover:scale-105'
              }`}
              style={filter === 'qualified' ? {
                background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                borderColor: '#10B981',
                boxShadow: '0 0 15px rgba(16, 185, 129, 0.3)'
              } : {}}
            >
              Qualified 10+ ({stocks.filter((s: StockData) => s.passedCriteria >= 10).length})
            </button>
            <button
              onClick={() => setFilter('failed')}
              className={`filter-tag transition-all duration-200 ${
                filter === 'failed'
                  ? 'ring-2 ring-danger/50 scale-105'
                  : 'hover:scale-105'
              }`}
              style={filter === 'failed' ? {
                background: 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)',
                borderColor: '#EF4444',
                boxShadow: '0 0 15px rgba(239, 68, 68, 0.3)'
              } : {}}
            >
              Failed 0-9 ({stocks.filter((s: StockData) => s.passedCriteria < 10).length})
            </button>
            {[14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1, 0].map(n => (
              <button
                key={n}
                onClick={() => setFilter(n.toString())}
                className={`filter-tag transition-all duration-200 ${
                  filter === n.toString()
                    ? 'ring-2 scale-105'
                    : 'hover:scale-105'
                } ${
                  filter === n.toString() && n >= 10
                    ? 'ring-success/50'
                    : filter === n.toString()
                    ? 'ring-danger/50'
                    : ''
                }`}
                style={filter === n.toString() ? {
                  background: n >= 10
                    ? 'linear-gradient(135deg, #10B981 0%, #059669 100%)'
                    : 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)',
                  borderColor: n >= 10 ? '#10B981' : '#EF4444',
                  boxShadow: n >= 10
                    ? '0 0 15px rgba(16, 185, 129, 0.3)'
                    : '0 0 15px rgba(239, 68, 68, 0.3)'
                } : {}}
              >
                {n}/14
              </button>
            ))}
          </div>
        </div>

        {/* Results Table */}
        {loading ? (
          <div className="card-premium p-12 text-center animate-fade-in">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-4">
              <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
            <p className="text-lg font-medium text-white mb-2">Loading screening results...</p>
            <p className="text-sm text-text-secondary">Analyzing technical indicators and criteria</p>
          </div>
        ) : (
          <div className="card-premium overflow-hidden animate-slide-up" style={{ animationDelay: '0.3s' }}>
            <div className="overflow-x-auto">
              <table className="table-premium">
                <thead>
                  <tr>
                    <th className="rounded-tl-lg">Symbol</th>
                    <th>Company</th>
                    <th>Market</th>
                    <th>Price</th>
                    <th>Score</th>
                    <th>Status</th>
                    <th className="rounded-tr-lg">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStocks.map((stock, index) => (
                    <tr
                      key={stock.symbol}
                      className={`cursor-pointer group ${stock.passedCriteria >= 13 ? 'bg-gradient-to-r from-primary/5 to-transparent' : ''}`}
                      onClick={() => setSelectedStock(stock)}
                      style={{
                        animation: `fadeIn 0.3s ease-out ${index * 0.02}s both`,
                        ...(stock.passedCriteria >= 13 ? {
                          borderLeft: '3px solid #00D4AA',
                          boxShadow: 'inset 0 0 20px rgba(0, 212, 170, 0.1)'
                        } : {})
                      }}
                    >
                      <td className="font-mono font-bold text-white group-hover:text-primary transition-colors">
                        {stock.symbol}
                      </td>
                      <td className="text-text-secondary">
                        {stock.name || '-'}
                      </td>
                      <td>
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
                          stock.market === 'TH'
                            ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                            : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                        }`}>
                          {stock.market === 'TH' ? '🇹🇭 TH' : '🇺🇸 US'}
                        </span>
                      </td>
                      <td>
                        <span className="inline-flex items-center gap-1 font-mono text-white">
                          <span className="text-text-secondary text-sm">{getCurrencySymbol(stock.currency)}</span>
                          {parseFloat(stock.price).toFixed(2)}
                        </span>
                      </td>
                      <td>
                        <div className="flex items-center gap-3">
                          <div className="flex-1 w-24 h-2 bg-bg-tertiary rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-500 ${
                                stock.passedCriteria >= 10
                                  ? 'bg-gradient-to-r from-success to-success-light'
                                  : stock.passedCriteria >= 7
                                  ? 'bg-gradient-to-r from-warning to-warning-light'
                                  : 'bg-gradient-to-r from-danger to-danger-light'
                              }`}
                              style={{ width: `${(stock.passedCriteria / (stock.totalCriteria || 14)) * 100}%` }}
                            />
                          </div>
                          <span className="font-mono text-sm font-semibold text-white whitespace-nowrap">
                            {stock.passedCriteria}/14
                          </span>
                        </div>
                      </td>
                      <td>
                        {stock.passedCriteria >= 13 ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-gradient-to-r from-primary to-primary-light text-white border-2 border-primary/30 shadow-lg" style={{ animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite', boxShadow: '0 0 15px rgba(0, 212, 170, 0.4)' }}>
                            <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></span>
                            ⭐ ELITE
                          </span>
                        ) : stock.passedCriteria >= 10 ? (
                          <span className="badge-success">
                            <span className="status-dot-success w-1.5 h-1.5"></span>
                            Qualified
                          </span>
                        ) : (
                          <span className="badge-danger">
                            <span className="status-dot-danger w-1.5 h-1.5"></span>
                            Failed
                          </span>
                        )}
                      </td>
                      <td>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedStock(stock);
                          }}
                          className="inline-flex items-center gap-2 text-primary hover:text-primary-light transition-colors text-sm font-medium group/btn"
                        >
                          View Details
                          <svg className="w-4 h-4 transform group-hover/btn:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {filteredStocks.length === 0 && (
              <div className="text-center py-12">
                <svg className="w-16 h-16 mx-auto text-text-muted mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-lg font-medium text-text-secondary mb-1">No stocks found</p>
                <p className="text-sm text-text-muted">Try adjusting your filter criteria</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {selectedStock && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setSelectedStock(null)}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

          {/* Modal Content */}
          <div
            className="relative w-full max-w-5xl max-h-[90vh] overflow-y-auto card-premium animate-scale-in rounded-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 z-10 bg-bg-card/95 backdrop-blur-sm border-b border-border px-6 py-4 rounded-t-2xl">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center shadow-lg">
                    <span className="text-white font-bold text-lg">{selectedStock.symbol.charAt(0)}</span>
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-white">{selectedStock.symbol}</h2>
                    <p className="text-text-secondary">{selectedStock.name || 'N/A'}</p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedStock(null)}
                  className="w-10 h-10 rounded-xl bg-bg-tertiary hover:bg-bg-hover border border-border flex items-center justify-center transition-all hover:scale-110"
                >
                  <svg className="w-5 h-5 text-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Score Badge */}
              <div className="flex items-center gap-4">
                <div className={`flex-1 p-6 rounded-xl border transition-all ${
                  selectedStock.passedCriteria >= 10
                    ? 'bg-success/10 border-success/30'
                    : 'bg-danger/10 border-danger/30'
                }`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-text-secondary text-sm mb-1">Screening Score</p>
                      <p className={`text-4xl font-bold font-mono ${
                        selectedStock.passedCriteria >= 10 ? 'text-success' : 'text-danger'
                      }`}>
                        {selectedStock.passedCriteria}/14
                      </p>
                    </div>
                    <div className={`w-20 h-20 rounded-2xl flex items-center justify-center ${
                      selectedStock.passedCriteria >= 10 ? 'bg-success/20' : 'bg-danger/20'
                    }`}>
                      {selectedStock.passedCriteria >= 10 ? (
                        <svg className="w-10 h-10 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      ) : (
                        <svg className="w-10 h-10 text-danger" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      )}
                    </div>
                  </div>
                  <div className="mt-4">
                    <div className="h-3 bg-bg-tertiary rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-1000 ${
                          selectedStock.passedCriteria >= 10
                            ? 'bg-gradient-to-r from-success to-success-light'
                            : 'bg-gradient-to-r from-danger to-danger-light'
                        }`}
                        style={{ width: `${(selectedStock.passedCriteria / (selectedStock.totalCriteria || 14)) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Chart Button - Only for Elite Stocks with Buy Signal */}
              {selectedStock.passedCriteria >= 13 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    console.log('Opening chart for elite stock:', selectedStock.symbol);
                    setChartStock(selectedStock);
                    setSelectedStock(null);
                  }}
                  className="w-full p-6 rounded-xl bg-gradient-to-r from-primary/20 via-primary/10 to-primary/20 border-2 border-primary/40 hover:border-primary hover:from-primary/30 hover:via-primary/20 hover:to-primary/30 transition-all duration-300 group"
                >
                  <div className="flex items-center justify-center gap-4">
                    <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                      <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
                      </svg>
                    </div>
                    <div className="text-left flex-1">
                      <h3 className="text-xl font-bold text-white mb-1 group-hover:text-primary-light transition-colors">
                        View Price Chart & Technical Analysis
                      </h3>
                      <p className="text-text-secondary text-sm">
                        Historical prices, moving averages, volume charts, and more
                      </p>
                    </div>
                    <svg className="w-6 h-6 text-primary group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </div>
                </button>
              )}

              {/* Explanation */}
              <div className={`p-6 rounded-xl border ${
                selectedStock.passedCriteria >= 10
                  ? 'bg-success/5 border-success/20'
                  : 'bg-danger/5 border-danger/20'
              }`}>
                <h3 className={`font-semibold mb-3 flex items-center gap-2 ${
                  selectedStock.passedCriteria >= 10 ? 'text-success-light' : 'text-danger-light'
                }`}>
                  {selectedStock.passedCriteria >= 10 ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  )}
                  {selectedStock.passedCriteria >= 10 ? 'Why Consider This Stock' : 'Why This Stock Failed'}
                </h3>
                <p className="text-sm text-white whitespace-pre-line font-mono leading-relaxed">
                  {getExplanation(selectedStock)}
                </p>
              </div>

              {/* All 14 Criteria */}
              <div>
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  All 14 Explainable Filters
                </h3>

                <div className="space-y-6">
                  {/* Minervini Criteria */}
                  <div>
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center border border-primary/20">
                        <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                        </svg>
                      </div>
                      <div>
                        <h4 className="font-semibold text-white">Minervini Trend Template (1-8)</h4>
                        <p className="text-sm text-text-secondary">Mark Minervini's proven trend identification criteria</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {[
                        { key: 'priceAboveMa150', value: selectedStock.priceAboveMa150 },
                        { key: 'ma150AboveMa200', value: selectedStock.ma150AboveMa200 },
                        { key: 'ma200TrendingUp', value: selectedStock.ma200TrendingUp },
                        { key: 'ma50AboveMa150', value: selectedStock.ma50AboveMa150 },
                        { key: 'priceAboveMa50', value: selectedStock.priceAboveMa50 },
                        { key: 'priceAbove52WeekLow', value: selectedStock.priceAbove52WeekLow },
                        { key: 'priceNear52WeekHigh', value: selectedStock.priceNear52WeekHigh },
                        { key: 'relativeStrengthPositive', value: selectedStock.relativeStrengthPositive },
                      ].map((c) => {
                        const info = getFilterInfo(c.key);
                        return (
                          <div
                            key={c.key}
                            className={`p-4 rounded-xl border transition-all hover:scale-[1.02] ${
                              c.value
                                ? 'bg-success/5 border-success/30 hover:border-success/50'
                                : 'bg-danger/5 border-danger/30 hover:border-danger/50'
                            }`}
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex-1">
                                <p className="font-semibold text-white text-sm mb-1">{info.label}</p>
                                <p className="text-xs text-text-secondary leading-relaxed">{info.explanation}</p>
                              </div>
                              <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                                c.value ? 'bg-success/20' : 'bg-danger/20'
                              }`}>
                                {c.value ? (
                                  <svg className="w-5 h-5 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                  </svg>
                                ) : (
                                  <svg className="w-5 h-5 text-danger" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                  </svg>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Technical Filters */}
                  <div>
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center border border-primary/20">
                        <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                      </div>
                      <div>
                        <h4 className="font-semibold text-white">Technical Indicators (9-14)</h4>
                        <p className="text-sm text-text-secondary">Additional technical confirmation filters</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {[
                        { key: 'rsiInRange', value: selectedStock.rsiInRange, displayValue: selectedStock.rsi?.toFixed(1) },
                        { key: 'volumeAboveAvg', value: selectedStock.volumeAboveAvg, displayValue: selectedStock.volume ? `${(selectedStock.volume / 1000000).toFixed(1)}M` : null },
                        { key: 'macdBullish', value: selectedStock.macdBullish, displayValue: selectedStock.macd?.toFixed(2) },
                        { key: 'adxStrong', value: selectedStock.adxStrong, displayValue: selectedStock.adx?.toFixed(1) },
                        { key: 'priceAboveMa20', value: selectedStock.priceAboveMa20, displayValue: selectedStock.ma20?.toFixed(2) },
                        { key: 'priceInBBRange', value: selectedStock.priceInBBRange, displayValue: null },
                      ].map((c) => {
                        const info = getFilterInfo(c.key);
                        return (
                          <div
                            key={c.key}
                            className={`p-4 rounded-xl border transition-all hover:scale-[1.02] ${
                              c.value
                                ? 'bg-success/5 border-success/30 hover:border-success/50'
                                : 'bg-danger/5 border-danger/30 hover:border-danger/50'
                            }`}
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex-1">
                                <p className="font-semibold text-white text-sm mb-1">{info.label}</p>
                                <p className="text-xs text-text-secondary leading-relaxed">{info.explanation}</p>
                              </div>
                              <div className="text-right flex-shrink-0">
                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center mx-auto mb-1 ${
                                  c.value ? 'bg-success/20' : 'bg-danger/20'
                                }`}>
                                  {c.value ? (
                                    <svg className="w-5 h-5 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                  ) : (
                                    <svg className="w-5 h-5 text-danger" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                  )}
                                </div>
                                {c.displayValue && (
                                  <span className="text-xs font-mono text-text-secondary">{c.displayValue}</span>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>

              {/* Technical Data */}
              <div>
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
                  </svg>
                  Technical Indicators Values
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-4 rounded-xl bg-bg-secondary border border-border hover:border-primary/50 transition-all">
                    <p className="text-text-secondary text-xs mb-2">Current Price</p>
                    <p className="text-xl font-bold font-mono text-white">
                      {getCurrencySymbol(selectedStock.currency)}{parseFloat(selectedStock.price).toFixed(2)}
                    </p>
                  </div>
                  <div className="p-4 rounded-xl bg-bg-secondary border border-border hover:border-primary/50 transition-all">
                    <p className="text-text-secondary text-xs mb-2">RSI</p>
                    <p className="text-xl font-bold font-mono text-white">
                      {selectedStock.rsi?.toFixed(1) || 'N/A'}
                    </p>
                  </div>
                  <div className="p-4 rounded-xl bg-bg-secondary border border-border hover:border-primary/50 transition-all">
                    <p className="text-text-secondary text-xs mb-2">MACD</p>
                    <p className="text-xl font-bold font-mono text-white">
                      {selectedStock.macd?.toFixed(2) || 'N/A'}
                    </p>
                  </div>
                  <div className="p-4 rounded-xl bg-bg-secondary border border-border hover:border-primary/50 transition-all">
                    <p className="text-text-secondary text-xs mb-2">ADX</p>
                    <p className="text-xl font-bold font-mono text-white">
                      {selectedStock.adx?.toFixed(1) || 'N/A'}
                    </p>
                  </div>
                  <div className="p-4 rounded-xl bg-bg-secondary border border-border hover:border-primary/50 transition-all">
                    <p className="text-text-secondary text-xs mb-2">MA20</p>
                    <p className="text-xl font-bold font-mono text-white">
                      {getCurrencySymbol(selectedStock.currency)}{selectedStock.ma20?.toFixed(2) || 'N/A'}
                    </p>
                  </div>
                  <div className="p-4 rounded-xl bg-bg-secondary border border-border hover:border-primary/50 transition-all">
                    <p className="text-text-secondary text-xs mb-2">MA50</p>
                    <p className="text-xl font-bold font-mono text-white">
                      {getCurrencySymbol(selectedStock.currency)}{parseFloat(selectedStock.ma50).toFixed(2)}
                    </p>
                  </div>
                  <div className="p-4 rounded-xl bg-bg-secondary border border-border hover:border-primary/50 transition-all">
                    <p className="text-text-secondary text-xs mb-2">MA150</p>
                    <p className="text-xl font-bold font-mono text-white">
                      {getCurrencySymbol(selectedStock.currency)}{parseFloat(selectedStock.ma150).toFixed(2)}
                    </p>
                  </div>
                  <div className="p-4 rounded-xl bg-bg-secondary border border-border hover:border-primary/50 transition-all">
                    <p className="text-text-secondary text-xs mb-2">MA200</p>
                    <p className="text-xl font-bold font-mono text-white">
                      {getCurrencySymbol(selectedStock.currency)}{parseFloat(selectedStock.ma200).toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Price Chart Modal */}
      {chartStock && (
        <StockPriceChart
          symbol={chartStock.symbol}
          name={chartStock.name || chartStock.symbol}
          market={chartStock.market}
          currency={chartStock.currency}
          currentPrice={chartStock.price}
          onClose={() => setChartStock(null)}
        />
      )}
    </div>
  );
}
