'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Navigation } from '@/components/layout/Navigation';
import { X, TrendingUp, AlertCircle, CheckCircle2, Sparkles, Target, Activity } from 'lucide-react';

type TierType = 'elite' | 'qualified' | 'failed' | null;

interface TierDetails {
  title: string;
  icon: React.ReactNode;
  criteria: string;
  percentage: string;
  color: string;
  description: string;
  features: string[];
  examples: string[];
  action: string;
  actionLink: string;
}

const tierDetails: Record<string, TierDetails> = {
  elite: {
    title: 'ELITE Tier',
    icon: <Sparkles className="w-6 h-6" />,
    criteria: '13-14/14 Filters Passed',
    percentage: 'Top 0.4%',
    color: 'primary',
    description: 'The absolute best setups in the market. Only stocks that pass 13 or 14 out of 14 filters qualify for ELITE status. These rare gems get ML-powered buy/sell/hold recommendations.',
    features: [
      'ML-powered trading signals (BUY/SELL/HOLD)',
      '80-100% confidence scores',
      'All 8 Minervini Stage 2 criteria met',
      'All 6 technical indicators aligned',
      'Automatic analysis and alerts',
      'Best risk/reward opportunities',
    ],
    examples: [
      'Passes MA20 > MA50 > MA150 > MA200 alignment',
      'RSI between 30-70 (not overextended)',
      'Price within 5% of 52-week high (strength)',
      'Volume above 50-day average (confirmation)',
      'MACD bullish with positive histogram',
      'Strong relative strength vs S&P 500',
    ],
    action: 'View ELITE Stocks',
    actionLink: '/screening?filter=elite',
  },
  qualified: {
    title: 'Qualified Tier',
    icon: <CheckCircle2 className="w-6 h-6" />,
    criteria: '10-12/14 Filters Passed',
    percentage: 'Next 18.3%',
    color: 'green',
    description: 'Good setups that meet most criteria but may have 1-2 filters not passing. These stocks deserve manual review and consideration for your watchlist.',
    features: [
      'Strong technical foundation',
      'Expert advisory analysis',
      'Manual review recommended',
      'Good risk/reward potential',
      'Watchlist candidates',
      'May improve to ELITE status',
    ],
    examples: [
      'Most Minervini criteria met (6-8/8)',
      'Technical indicators mostly bullish',
      'Near ELITE qualification (12/14)',
      'Slight weakness in 1-2 areas',
      'Good momentum but needs confirmation',
      'Volume patterns acceptable',
    ],
    action: 'View Qualified Stocks',
    actionLink: '/screening?filter=qualified',
  },
  failed: {
    title: 'Failed Tier',
    icon: <AlertCircle className="w-6 h-6" />,
    criteria: '0-9/14 Filters Passed',
    percentage: 'Bottom 81.3%',
    color: 'red',
    description: 'Stocks that do not meet minimum quality standards. These fail too many criteria and are not recommended for trading. Focus your time and capital on better opportunities.',
    features: [
      'Fails multiple key criteria',
      'Weak technical setup',
      'Not recommended for trading',
      'High risk/low reward',
      'Better opportunities exist',
      'Skip and move on',
    ],
    examples: [
      'Price below key moving averages',
      'No clear trend established',
      'Weak relative strength',
      'Poor volume confirmation',
      'Bearish MACD alignment',
      'Fails most Minervini criteria',
    ],
    action: 'Avoid These Stocks',
    actionLink: '/screening?filter=failed',
  },
};

export default function HomePage() {
  const [mounted, setMounted] = useState(false);
  const [selectedTier, setSelectedTier] = useState<TierType>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg-primary">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-text-secondary">Loading...</p>
        </div>
      </div>
    );
  }

  const handleTierClick = (tier: TierType) => {
    setSelectedTier(tier);
    document.body.style.overflow = 'hidden';
  };

  const handleCloseModal = () => {
    setSelectedTier(null);
    document.body.style.overflow = 'unset';
  };

  return (
    <div className="min-h-screen bg-bg-primary">
      {/* Navigation */}
      <Navigation />

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-primary/5"></div>
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-primary/5 rounded-full blur-3xl"></div>

        <div className="relative max-w-7xl mx-auto px-6 lg:px-8 py-20 lg:py-32">
          {/* Header */}
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
              <span className="text-sm font-medium text-primary">AI-Powered Trading Platform</span>
            </div>

            <h1 className="text-5xl lg:text-7xl font-bold mb-6 animate-fade-in">
              <span className="bg-gradient-to-r from-white via-white to-primary-light bg-clip-text text-transparent">
                Trade Smarter
              </span>
              <br />
              <span className="bg-gradient-to-r from-primary to-primary-light bg-clip-text text-transparent">
                with AI Precision
              </span>
            </h1>

            <p className="text-xl text-text-secondary max-w-3xl mx-auto mb-4">
              Advanced stock screening with 14 explainable filters and ML-powered signals.
              Focus on the best opportunities with our elite tier system.
            </p>

            <p className="text-sm text-text-tertiary">
              Only the top 1-2% of stocks qualify for <span className="text-primary font-semibold">ELITE status</span> with ML recommendations
            </p>
          </div>

          {/* Stats Bar */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-16 max-w-4xl mx-auto">
            <div className="card-premium p-6 rounded-xl text-center">
              <div className="text-3xl font-bold text-white mb-1">503</div>
              <div className="text-sm text-text-secondary">Stocks Screened</div>
            </div>
            <div className="card-premium p-6 rounded-xl text-center">
              <div className="text-3xl font-bold text-primary mb-1">14</div>
              <div className="text-sm text-text-secondary">Explainable Filters</div>
            </div>
            <div className="card-premium p-6 rounded-xl text-center">
              <div className="text-3xl font-bold text-white mb-1">0.4%</div>
              <div className="text-sm text-text-secondary">ELITE Qualification</div>
            </div>
            <div className="card-premium p-6 rounded-xl text-center">
              <div className="text-3xl font-bold text-primary mb-1">ML</div>
              <div className="text-sm text-text-secondary">Powered Signals</div>
            </div>
          </div>

          {/* Main Feature Cards */}
          <div className="grid lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
            {/* Screening Card */}
            <Link href="/screening" className="group">
              <div className="card-premium rounded-2xl p-8 relative overflow-hidden transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl hover:shadow-primary/20">
                {/* Gradient Background */}
                <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

                {/* Decorative Elements */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-2xl"></div>

                <div className="relative">
                  {/* Badge */}
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/20 border border-primary/30 mb-6">
                    <Activity className="w-4 h-4 text-primary" />
                    <span className="text-sm font-semibold text-primary">Stock Screening</span>
                  </div>

                  {/* Title */}
                  <h2 className="text-3xl font-bold text-white mb-3 group-hover:text-primary transition-colors">
                    Screening Results
                  </h2>

                  {/* Description */}
                  <p className="text-text-secondary mb-6 leading-relaxed">
                    Screen 500+ stocks with our 14-filter system. 8 Minervini criteria + 6 technical indicators.
                    Find ELITE setups (13+/14) with comprehensive analysis.
                  </p>

                  {/* Key Features */}
                  <div className="space-y-3 mb-6">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
                        <CheckCircle2 className="w-4 h-4 text-primary" />
                      </div>
                      <span className="text-sm text-text-secondary">Minervini Stage 2 Analysis</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
                        <CheckCircle2 className="w-4 h-4 text-primary" />
                      </div>
                      <span className="text-sm text-text-secondary">Technical Indicators (RSI, MACD, etc.)</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
                        <CheckCircle2 className="w-4 h-4 text-primary" />
                      </div>
                      <span className="text-sm text-text-secondary">Elite Tier (13+/14) Highlight</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
                        <CheckCircle2 className="w-4 h-4 text-primary" />
                      </div>
                      <span className="text-sm text-text-secondary">Detailed Filter Breakdown</span>
                    </div>
                  </div>

                  {/* CTA Button */}
                  <div className="flex items-center gap-2 text-primary font-semibold group-hover:gap-4 transition-all">
                    <span>Explore Screenings</span>
                    <Target className="w-5 h-5" />
                  </div>
                </div>
              </div>
            </Link>

            {/* Signals Card */}
            <Link href="/signals" className="group">
              <div className="card-premium rounded-2xl p-8 relative overflow-hidden transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl hover:shadow-primary/20">
                {/* Gradient Background */}
                <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

                {/* Decorative Elements */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-2xl"></div>

                <div className="relative">
                  {/* Badge */}
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/20 border border-primary/30 mb-6">
                    <TrendingUp className="w-4 h-4 text-primary" />
                    <span className="text-sm font-semibold text-primary">ML Signals</span>
                  </div>

                  {/* Title */}
                  <h2 className="text-3xl font-bold text-white mb-3 group-hover:text-primary transition-colors">
                    Expert Signals
                  </h2>

                  {/* Description */}
                  <p className="text-text-secondary mb-6 leading-relaxed">
                    ML-powered buy/hold/sell recommendations for ELITE stocks only.
                    High-confidence signals with detailed technical analysis.
                  </p>

                  {/* Key Features */}
                  <div className="space-y-3 mb-6">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
                        <CheckCircle2 className="w-4 h-4 text-primary" />
                      </div>
                      <span className="text-sm text-text-secondary">ML-Powered Recommendations</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
                        <CheckCircle2 className="w-4 h-4 text-primary" />
                      </div>
                      <span className="text-sm text-text-secondary">80-100% Confidence Scores</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
                        <CheckCircle2 className="w-4 h-4 text-primary" />
                      </div>
                      <span className="text-sm text-text-secondary">Elite Stock Focus (13+/14)</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
                        <CheckCircle2 className="w-4 h-4 text-primary" />
                      </div>
                      <span className="text-sm text-text-secondary">Expert Advisory Analysis</span>
                    </div>
                  </div>

                  {/* CTA Button */}
                  <div className="flex items-center gap-2 text-primary font-semibold group-hover:gap-4 transition-all">
                    <span>View Signals</span>
                    <Target className="w-5 h-5" />
                  </div>
                </div>
              </div>
            </Link>
          </div>

          {/* Bottom CTA */}
          <div className="mt-16 text-center">
            <p className="text-sm text-text-tertiary">
              Only the best setups qualify for ELITE status —{" "}
              <span className="text-primary font-semibold">focused on quality, not quantity</span>
            </p>
          </div>
        </div>
      </section>

      {/* Three-Tier System Section */}
      <section className="relative py-20 border-t border-border">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-white mb-3">
              Three-Tier Quality System
            </h2>
            <p className="text-text-secondary mb-6">
              Click on any tier to see detailed information
            </p>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20">
              <Sparkles className="w-4 h-4 text-primary" />
              <span className="text-sm text-primary">Interactive - Click cards to explore</span>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {/* Elite Tier */}
            <button
              onClick={() => handleTierClick('elite')}
              className="card-premium rounded-2xl p-6 relative overflow-hidden text-left transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-primary/40 cursor-pointer group"
              style={{
                background: 'linear-gradient(135deg, rgba(0, 212, 170, 0.15) 0%, rgba(0, 212, 170, 0.05) 100%)',
                border: '2px solid rgba(0, 212, 170, 0.3)',
                boxShadow: '0 0 30px rgba(0, 212, 170, 0.4)',
              }}
            >
              <div className="absolute top-0 right-0 w-24 h-24 bg-primary/10 rounded-full blur-2xl"></div>

              <div className="relative">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-2xl group-hover:scale-110 transition-transform">⭐</span>
                  <span className="px-3 py-1 rounded-full bg-gradient-to-r from-primary to-primary-light text-white text-xs font-bold">
                    13+/14
                  </span>
                </div>

                <h3 className="text-xl font-bold text-white mb-2">ELITE</h3>
                <p className="text-sm text-text-secondary mb-4">Top 0.4% of stocks</p>

                <ul className="space-y-2 text-sm text-text-secondary mb-4">
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary"></span>
                    ML-powered signals
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary"></span>
                    Buy/Sell/Hold recommendations
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary"></span>
                    80-100% confidence
                  </li>
                </ul>

                <div className="text-primary text-sm font-semibold flex items-center gap-2 group-hover:gap-3 transition-all">
                  <span>Learn more</span>
                  <Sparkles className="w-4 h-4" />
                </div>
              </div>
            </button>

            {/* Qualified Tier */}
            <button
              onClick={() => handleTierClick('qualified')}
              className="card-premium rounded-2xl p-6 relative overflow-hidden text-left transition-all duration-300 hover:scale-105 hover:shadow-2xl cursor-pointer group"
            >
              <div className="absolute top-0 right-0 w-24 h-24 bg-green-500/10 rounded-full blur-2xl"></div>

              <div className="relative">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-2xl group-hover:scale-110 transition-transform">✅</span>
                  <span className="px-3 py-1 rounded-full bg-green-500/20 text-green-400 text-xs font-bold border border-green-500/30">
                    10-12/14
                  </span>
                </div>

                <h3 className="text-xl font-bold text-white mb-2">Qualified</h3>
                <p className="text-sm text-text-secondary mb-4">Next 18.3% of stocks</p>

                <ul className="space-y-2 text-sm text-text-secondary mb-4">
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                    Good setups
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                    Expert advisory analysis
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                    Manual review
                  </li>
                </ul>

                <div className="text-green-400 text-sm font-semibold flex items-center gap-2 group-hover:gap-3 transition-all">
                  <span>Learn more</span>
                  <CheckCircle2 className="w-4 h-4" />
                </div>
              </div>
            </button>

            {/* Failed Tier */}
            <button
              onClick={() => handleTierClick('failed')}
              className="card-premium rounded-2xl p-6 relative overflow-hidden text-left transition-all duration-300 hover:scale-105 hover:shadow-2xl cursor-pointer group"
            >
              <div className="absolute top-0 right-0 w-24 h-24 bg-red-500/10 rounded-full blur-2xl"></div>

              <div className="relative">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-2xl group-hover:scale-110 transition-transform">❌</span>
                  <span className="px-3 py-1 rounded-full bg-red-500/20 text-red-400 text-xs font-bold border border-red-500/30">
                    0-9/14
                  </span>
                </div>

                <h3 className="text-xl font-bold text-white mb-2">Failed</h3>
                <p className="text-sm text-text-secondary mb-4">Bottom 81.3% of stocks</p>

                <ul className="space-y-2 text-sm text-text-secondary mb-4">
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
                    Don't meet criteria
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
                    Not recommended
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
                    Skip
                  </li>
                </ul>

                <div className="text-red-400 text-sm font-semibold flex items-center gap-2 group-hover:gap-3 transition-all">
                  <span>Learn more</span>
                  <AlertCircle className="w-4 h-4" />
                </div>
              </div>
            </button>
          </div>
        </div>
      </section>

      {/* Tier Detail Modal */}
      {selectedTier && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={handleCloseModal}
          />

          {/* Close Button */}
          <button
            onClick={handleCloseModal}
            className="absolute top-6 right-6 z-[60] w-10 h-10 rounded-full bg-bg-tertiary hover:bg-bg-hover border border-border flex items-center justify-center transition-all hover:scale-110 hover:border-primary"
            aria-label="Close modal"
          >
            <X className="w-5 h-5 text-text-secondary" />
          </button>

          {/* Modal Content */}
          <div
            className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto card-premium animate-scale-in rounded-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {selectedTier && (
              <>
                {/* Header */}
                <div className="sticky top-0 z-10 bg-bg-card/95 backdrop-blur-sm border-b border-border px-8 py-6">
                  <div className="flex items-start gap-4">
                    <div
                      className={`w-16 h-16 rounded-2xl flex items-center justify-center ${
                        selectedTier === 'elite'
                          ? 'bg-gradient-to-br from-primary to-primary-dark shadow-lg shadow-primary/30'
                          : selectedTier === 'qualified'
                          ? 'bg-green-500/20 border-2 border-green-500/30'
                          : 'bg-red-500/20 border-2 border-red-500/30'
                      }`}
                    >
                      {selectedTier === 'elite' ? (
                        <span className="text-3xl">⭐</span>
                      ) : selectedTier === 'qualified' ? (
                        <span className="text-3xl">✅</span>
                      ) : (
                        <span className="text-3xl">❌</span>
                      )}
                    </div>

                    <div className="flex-1">
                      <h2 className="text-3xl font-bold text-white mb-2">
                        {tierDetails[selectedTier].title}
                      </h2>
                      <div className="flex items-center gap-3 flex-wrap">
                        <span className="px-3 py-1 rounded-full bg-primary/20 border border-primary/30 text-primary text-sm font-semibold">
                          {tierDetails[selectedTier].criteria}
                        </span>
                        <span className="text-text-secondary text-sm">
                          {tierDetails[selectedTier].percentage}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Content */}
                <div className="px-8 py-6 space-y-8">
                  {/* Description */}
                  <div>
                    <p className="text-text-secondary leading-relaxed text-lg">
                      {tierDetails[selectedTier].description}
                    </p>
                  </div>

                  {/* Features */}
                  <div>
                    <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                      <Target className="w-5 h-5 text-primary" />
                      Key Features
                    </h3>
                    <div className="grid sm:grid-cols-2 gap-3">
                      {tierDetails[selectedTier].features.map((feature, idx) => (
                        <div
                          key={idx}
                          className={`flex items-start gap-3 p-3 rounded-lg ${
                            selectedTier === 'elite'
                              ? 'bg-primary/10 border border-primary/20'
                              : selectedTier === 'qualified'
                              ? 'bg-green-500/10 border border-green-500/20'
                              : 'bg-red-500/10 border border-red-500/20'
                          }`}
                        >
                          <CheckCircle2
                            className={`w-5 h-5 flex-shrink-0 mt-0.5 ${
                              selectedTier === 'elite'
                                ? 'text-primary'
                                : selectedTier === 'qualified'
                                ? 'text-green-500'
                                : 'text-red-500'
                            }`}
                          />
                          <span className="text-sm text-text-secondary">{feature}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Examples */}
                  <div>
                    <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                      <Activity className="w-5 h-5 text-primary" />
                      What This Looks Like
                    </h3>
                    <div className="space-y-2">
                      {tierDetails[selectedTier].examples.map((example, idx) => (
                        <div
                          key={idx}
                          className="flex items-start gap-3 p-3 rounded-lg bg-bg-tertiary border border-border"
                        >
                          <div
                            className={`w-2 h-2 rounded-full flex-shrink-0 mt-2 ${
                              selectedTier === 'elite'
                                ? 'bg-primary'
                                : selectedTier === 'qualified'
                                ? 'bg-green-500'
                                : 'bg-red-500'
                            }`}
                          />
                          <span className="text-sm text-text-secondary">{example}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* CTA Button */}
                  <div className="pt-4 border-t border-border">
                    <Link
                      href={tierDetails[selectedTier].actionLink}
                      onClick={handleCloseModal}
                      className={`inline-flex items-center gap-3 px-6 py-3 rounded-xl font-semibold text-white transition-all hover:scale-105 hover:shadow-lg ${
                        selectedTier === 'elite'
                          ? 'bg-gradient-to-r from-primary to-primary-dark shadow-lg shadow-primary/30'
                          : selectedTier === 'qualified'
                          ? 'bg-green-600 hover:bg-green-500'
                          : 'bg-red-600 hover:bg-red-500'
                      }`}
                    >
                      {tierDetails[selectedTier].action}
                      <Target className="w-5 h-5" />
                    </Link>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="border-t border-border py-8">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 text-center">
          <p className="text-sm text-text-tertiary">
            AI-Powered Trading Platform • S&P 500 Stock Screening with ML Signals
          </p>
        </div>
      </footer>
    </div>
  );
}
