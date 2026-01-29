'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Navigation } from '@/components/layout/Navigation';

interface ExpertRecommendation {
  symbol: string;
  name: string | null;
  screeningScore: number;
  consensusScore: number;
  expertScores: Array<{
    expert: string;
    score: number;
    reason: string;
  }>;
  finalRecommendation: 'STRONG BUY' | 'BUY' | 'HOLD' | 'AVOID' | 'STRONG SELL';
  confidence: number;
}

export default function SignalsPage() {
  const [recommendations, setRecommendations] = useState<ExpertRecommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<string>('');
  const [selectedStock, setSelectedStock] = useState<ExpertRecommendation | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    fetchRecommendations();
  }, []);

  const fetchRecommendations = async () => {
    try {
      const res = await fetch('/api/expert/recommendations?limit=5');
      const data = await res.json();

      const today = new Date().toISOString().split('T')[0];

      setRecommendations(data);
      setLastUpdate(today);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching recommendations:', error);
      setLoading(false);
    }
  };

  const getRecommendationConfig = (recommendation: string) => {
    switch (recommendation) {
      case 'STRONG BUY':
        return {
          color: 'success',
          bg: 'bg-success/10',
          border: 'border-success/30',
          text: 'text-success',
          gradient: 'from-success to-success-light',
          icon: (
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 01-.945-1.067c-.328-.68-.398-1.534-.398-2.654A1 1 0 005.05 6.05 6.981 6.981 0 003 11a7 7 0 1011.95-4.95c-.592-.591-.98-.985-1.348-1.467-.363-.476-.724-1.063-1.207-2.03zM12.12 15.12A3 3 0 017 13s.879.5 2.5.5c0-1 .5-4 1.25-4.5.5 1 .786 1.293 1.371 1.879A2.99 2.99 0 0113 13a2.99 2.99 0 01-.879 2.121z" clipRule="evenodd" />
            </svg>
          )
        };
      case 'BUY':
        return {
          color: 'success',
          bg: 'bg-success/10',
          border: 'border-success/30',
          text: 'text-success',
          gradient: 'from-success to-success-light',
          icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
          )
        };
      case 'HOLD':
        return {
          color: 'warning',
          bg: 'bg-warning/10',
          border: 'border-warning/30',
          text: 'text-warning',
          gradient: 'from-warning to-warning-light',
          icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          )
        };
      case 'AVOID':
        return {
          color: 'danger',
          bg: 'bg-danger/10',
          border: 'border-danger/30',
          text: 'text-danger',
          gradient: 'from-danger to-danger-light',
          icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          )
        };
      case 'STRONG SELL':
        return {
          color: 'danger',
          bg: 'bg-danger/10',
          border: 'border-danger/30',
          text: 'text-danger',
          gradient: 'from-danger to-danger-light',
          icon: (
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM7 9a1 1 0 100-2 1 1 0 000 2zm7-1a1 1 0 11-2 0 1 1 0 012 0zm-7.536 5.879a1 1 0 001.415 0 3 3 0 014.242 0 1 1 0 001.415-1.415 5 5 0 00-7.072 0 1 1 0 000 1.415z" clipRule="evenodd" />
            </svg>
          )
        };
      default:
        return {
          color: 'warning',
          bg: 'bg-warning/10',
          border: 'border-warning/30',
          text: 'text-warning',
          gradient: 'from-warning to-warning-light',
          icon: null
        };
    }
  };

  const getExpertAvatar = (expertName: string) => {
    const name = expertName.split(' ')[0].toLowerCase();
    switch (name) {
      case 'mark':
        return {
          initials: 'MM',
          gradient: 'from-blue-500 to-blue-600',
          icon: (
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
          )
        };
      case 'peter':
        return {
          initials: 'PL',
          gradient: 'from-green-500 to-green-600',
          icon: (
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          )
        };
      case 'warren':
        return {
          initials: 'WB',
          gradient: 'from-amber-500 to-amber-600',
          icon: (
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          )
        };
      default:
        return {
          initials: '??',
          gradient: 'from-gray-500 to-gray-600',
          icon: null
        };
    }
  };

  const getConsensusExplanation = (rec: ExpertRecommendation): string => {
    const strongBuy = rec.expertScores.filter(s => s.score >= 80).length;
    const buy = rec.expertScores.filter(s => s.score >= 65).length;
    const strongSell = rec.expertScores.filter(s => s.score < 25).length;

    if (strongBuy >= 2) {
      return `Strong consensus - All experts highly rate this stock`;
    } else if (strongBuy >= 1 || buy >= 2) {
      return `Strong buy signal - Multiple experts agree on upside potential`;
    } else if (strongSell >= 2) {
      return `Avoid recommendation - Experts agree to stay away`;
    } else {
      return `Mixed opinions - Consider waiting for clearer signals`;
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
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <h1 className="text-4xl lg:text-5xl font-bold bg-gradient-to-r from-white to-primary-light bg-clip-text text-transparent">
                  Expert Stock Recommendations
                </h1>
              </div>
              <p className="text-text-secondary text-lg ml-15">
                Top 5 Daily Picks • Expert Advisory Board • Consensus-Driven Analysis
              </p>
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

          {/* Expert Advisory Board */}
          <div className="card-premium p-6 bg-gradient-to-br from-bg-card via-bg-tertiary to-bg-card">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center border border-primary/20">
                <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-bold text-white mb-4">Expert Advisory Board</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  {/* Mark Minervini */}
                  <div className="p-4 rounded-xl bg-bg-secondary/50 border border-border hover:border-blue-500/50 transition-all group">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg">
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                        </svg>
                      </div>
                      <div>
                        <h3 className="font-semibold text-white">Mark Minervini</h3>
                        <p className="text-xs text-text-secondary">Trend Following</p>
                      </div>
                    </div>
                    <p className="text-xs text-text-secondary leading-relaxed">
                      Powerful uptrends with strong momentum and volume confirmation. Focuses on stocks in powerful uptrends.
                    </p>
                  </div>

                  {/* Peter Lynch */}
                  <div className="p-4 rounded-xl bg-bg-secondary/50 border border-border hover:border-green-500/50 transition-all group">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center shadow-lg">
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div>
                        <h3 className="font-semibold text-white">Peter Lynch</h3>
                        <p className="text-xs text-text-secondary">GARP</p>
                      </div>
                    </div>
                    <p className="text-xs text-text-secondary leading-relaxed">
                      Growth at Reasonable Price. Seeks growth stocks not overbought with steady trends and room to run.
                    </p>
                  </div>

                  {/* Warren Buffett */}
                  <div className="p-4 rounded-xl bg-bg-secondary/50 border border-border hover:border-amber-500/50 transition-all group">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center shadow-lg">
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                      </div>
                      <div>
                        <h3 className="font-semibold text-white">Warren Buffett</h3>
                        <p className="text-xs text-text-secondary">Quality & Value</p>
                      </div>
                    </div>
                    <p className="text-xs text-text-secondary leading-relaxed">
                      High-quality companies with steady compounders and reasonable valuations. Long-term oriented.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 px-4 py-3 bg-primary/10 border border-primary/20 rounded-lg">
                  <svg className="w-5 h-5 text-primary flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  <p className="text-sm text-white">
                    <span className="font-semibold text-primary">Consensus-Driven:</span> Only stocks passing 10+/14 explainable filters are reviewed.
                    Each expert independently scores stocks (0-100). We take the consensus and recommend only the top 5 per day.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Last Update & Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6 mb-8 animate-slide-up" style={{ animationDelay: '0.1s' }}>
          <div className="stat-card">
            <div className="flex items-center justify-between mb-3">
              <span className="text-text-secondary text-sm font-medium">Last Update</span>
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <p className="metric-value text-2xl">{lastUpdate || 'Loading...'}</p>
            <p className="text-xs text-text-secondary mt-2">Data refresh date</p>
          </div>

          <div className="stat-card-success">
            <div className="flex items-center justify-between mb-3">
              <span className="text-text-secondary text-sm font-medium">Strong Buy Signals</span>
              <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center">
                <svg className="w-5 h-5 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                </svg>
              </div>
            </div>
            <p className="metric-value text-2xl">
              {recommendations.filter(r => r.finalRecommendation === 'STRONG BUY').length}
            </p>
            <p className="text-xs text-text-secondary mt-2">Top tier recommendations</p>
          </div>

          <div className="stat-card">
            <div className="flex items-center justify-between mb-3">
              <span className="text-text-secondary text-sm font-medium">Avg Consensus</span>
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
            </div>
            <p className="metric-value text-2xl">
              {recommendations.length > 0
                ? (recommendations.reduce((sum, r) => sum + r.consensusScore, 0) / recommendations.length).toFixed(0)
                : '0'}
            </p>
            <p className="text-xs text-text-secondary mt-2">Average expert score</p>
          </div>
        </div>

        {/* Recommendations Grid */}
        {loading ? (
          <div className="card-premium p-12 text-center animate-fade-in">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-4">
              <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
            <p className="text-lg font-medium text-white mb-2">Expert Advisory Board deliberating...</p>
            <p className="text-sm text-text-secondary">Analyzing consensus scores and recommendations</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-slide-up" style={{ animationDelay: '0.2s' }}>
            {recommendations.map((rec, index) => {
              const config = getRecommendationConfig(rec.finalRecommendation);

              return (
                <div
                  key={rec.symbol}
                  className="card-premium p-6 cursor-pointer group hover:scale-[1.02] transition-all duration-300"
                  onClick={() => setSelectedStock(rec)}
                  style={{ animation: `fadeIn 0.3s ease-out ${index * 0.1}s both` }}
                >
                  {/* Header with Ranking & Badge */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-4">
                      <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${config.gradient} flex items-center justify-center shadow-lg`}>
                        <span className="text-white font-bold text-2xl">#{index + 1}</span>
                      </div>
                      <div>
                        <h3 className="text-2xl font-bold text-white group-hover:text-primary transition-colors">
                          {rec.symbol}
                        </h3>
                        <p className="text-sm text-text-secondary">
                          {rec.name || 'N/A'}
                        </p>
                      </div>
                    </div>
                    <span className={`px-4 py-2 rounded-xl border ${config.bg} ${config.border} ${config.text} font-semibold text-sm flex items-center gap-2`}>
                      {config.icon}
                      {rec.finalRecommendation}
                    </span>
                  </div>

                  {/* Consensus Score with Gradient Progress Bar */}
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm text-text-secondary">Expert Consensus Score</p>
                      <div className="flex items-center gap-2">
                        <p className={`text-2xl font-bold font-mono ${config.text}`}>
                          {rec.consensusScore}
                        </p>
                        <span className="text-sm text-text-secondary">/100</span>
                      </div>
                    </div>
                    <div className="w-full h-3 bg-bg-tertiary rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full bg-gradient-to-r ${config.gradient} transition-all duration-500`}
                        style={{ width: `${rec.consensusScore}%` }}
                      />
                    </div>
                    <p className="text-xs text-text-secondary mt-2">
                      {(rec.confidence * 100).toFixed(0)}% confidence level
                    </p>
                  </div>

                  {/* Expert Scores Cards */}
                  <div className="grid grid-cols-3 gap-3 mb-4">
                    {rec.expertScores.map((expert) => {
                      const avatar = getExpertAvatar(expert.expert);
                      const scoreConfig = expert.score >= 80
                        ? { bg: 'bg-success/10', border: 'border-success/30', text: 'text-success' }
                        : expert.score >= 65
                        ? { bg: 'bg-blue-500/10', border: 'border-blue-500/30', text: 'text-blue-400' }
                        : expert.score >= 40
                        ? { bg: 'bg-warning/10', border: 'border-warning/30', text: 'text-warning' }
                        : { bg: 'bg-danger/10', border: 'border-danger/30', text: 'text-danger' };

                      return (
                        <div
                          key={expert.expert}
                          className={`p-3 rounded-xl border ${scoreConfig.bg} ${scoreConfig.border} transition-all hover:scale-105`}
                        >
                          <div className="flex items-center gap-2 mb-2">
                            <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${avatar.gradient} flex items-center justify-center`}>
                              {avatar.icon}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-semibold text-white truncate">
                                {expert.expert.split(' ')[0]}
                              </p>
                            </div>
                          </div>
                          <p className={`text-lg font-bold font-mono ${scoreConfig.text}`}>
                            {expert.score}
                          </p>
                          <p className="text-xs text-text-secondary mt-1 line-clamp-2">
                            {expert.reason}
                          </p>
                        </div>
                      );
                    })}
                  </div>

                  {/* Screening Score Badge */}
                  <div className="flex items-center justify-between p-3 bg-bg-secondary/50 rounded-xl border border-border">
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="text-sm text-text-secondary">Screening Score</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-semibold text-white">
                        {rec.screeningScore}/14
                      </span>
                      <span className={`text-xs px-2 py-1 rounded-lg ${
                        rec.screeningScore >= 12
                          ? 'bg-success/20 text-success'
                          : rec.screeningScore >= 10
                          ? 'bg-blue-500/20 text-blue-400'
                          : 'bg-warning/20 text-warning'
                      }`}>
                        {rec.screeningScore >= 12 ? 'Excellent' : rec.screeningScore >= 10 ? 'Good' : 'Moderate'}
                      </span>
                    </div>
                  </div>

                  {/* View Details Button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedStock(rec);
                    }}
                    className="w-full mt-4 px-4 py-3 rounded-xl bg-bg-secondary hover:bg-bg-tertiary border border-border hover:border-primary transition-all duration-300 group/btn flex items-center justify-center gap-2"
                  >
                    <span className="text-white font-medium">View Expert Analysis</span>
                    <svg className="w-4 h-4 text-primary transform group-hover/btn:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {selectedStock && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in"
        >
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setSelectedStock(null)}
          />

          {/* Close Button (Top Right) */}
          <button
            onClick={() => setSelectedStock(null)}
            className="absolute top-6 right-6 z-[60] w-10 h-10 rounded-full bg-bg-tertiary hover:bg-bg-hover border border-border flex items-center justify-center transition-all hover:scale-110 hover:border-primary"
            aria-label="Close modal"
          >
            <svg className="w-5 h-5 text-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {/* Modal Content */}
          <div
            className="relative w-full max-w-5xl max-h-[90vh] overflow-y-auto card-premium animate-scale-in rounded-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Sticky Header */}
            <div className="sticky top-0 z-10 bg-bg-card/95 backdrop-blur-sm border-b border-border px-6 py-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center shadow-lg">
                    <span className="text-white font-bold text-lg">
                      #{recommendations.findIndex(r => r.symbol === selectedStock.symbol) + 1}
                    </span>
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-white">{selectedStock.symbol}</h2>
                    <p className="text-text-secondary">{selectedStock.name || 'N/A'}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Recommendation Badge */}
              {(() => {
                const config = getRecommendationConfig(selectedStock.finalRecommendation);
                return (
                  <div className={`p-6 rounded-xl border ${config.bg} ${config.border}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${config.gradient} flex items-center justify-center`}>
                          {config.icon}
                        </div>
                        <div>
                          <p className="text-sm text-text-secondary mb-1">Final Recommendation</p>
                          <p className={`text-2xl font-bold ${config.text}`}>
                            {selectedStock.finalRecommendation}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-text-secondary mb-1">Consensus Score</p>
                        <p className={`text-3xl font-bold font-mono ${config.text}`}>
                          {selectedStock.consensusScore}/100
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Consensus Explanation */}
              <div className="p-6 rounded-xl bg-bg-secondary/50 border border-border">
                <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                  <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                  Why This Recommendation
                </h3>
                <p className="text-sm text-white leading-relaxed">
                  {getConsensusExplanation(selectedStock)}
                </p>
              </div>

              {/* Individual Expert Scores */}
              <div>
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  Expert Consensus Breakdown
                </h3>
                <div className="space-y-4">
                  {selectedStock.expertScores.map((expert) => {
                    const avatar = getExpertAvatar(expert.expert);
                    const scoreConfig = expert.score >= 80
                      ? { bg: 'bg-success/10', border: 'border-success/30', text: 'text-success', gradient: 'from-success to-success-light' }
                      : expert.score >= 65
                      ? { bg: 'bg-blue-500/10', border: 'border-blue-500/30', text: 'text-blue-400', gradient: 'from-blue-500 to-blue-400' }
                      : expert.score >= 40
                      ? { bg: 'bg-warning/10', border: 'border-warning/30', text: 'text-warning', gradient: 'from-warning to-warning-light' }
                      : { bg: 'bg-danger/10', border: 'border-danger/30', text: 'text-danger', gradient: 'from-danger to-danger-light' };

                    return (
                      <div
                        key={expert.expert}
                        className={`p-6 rounded-xl border ${scoreConfig.bg} ${scoreConfig.border} transition-all hover:scale-[1.02]`}
                      >
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center gap-4">
                            <div className={`w-16 h-16 rounded-xl bg-gradient-to-br ${avatar.gradient} flex items-center justify-center shadow-lg`}>
                              {avatar.icon}
                            </div>
                            <div>
                              <p className="text-xl font-bold text-white">{expert.expert}</p>
                              <p className="text-sm text-text-secondary">Expert Analysis</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className={`text-4xl font-bold font-mono ${scoreConfig.text}`}>
                              {expert.score}
                            </p>
                            <p className="text-sm text-text-secondary">/100</p>
                          </div>
                        </div>

                        {/* Progress Bar */}
                        <div className="mb-4">
                          <div className="w-full h-2 bg-bg-tertiary rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full bg-gradient-to-r ${scoreConfig.gradient} transition-all duration-500`}
                              style={{ width: `${expert.score}%` }}
                            />
                          </div>
                        </div>

                        {/* Reasoning */}
                        <div className="p-4 bg-bg-secondary/50 rounded-lg border border-border">
                          <p className="text-sm text-white leading-relaxed">
                            {expert.reason}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Technical Summary */}
              <div className="p-6 rounded-xl bg-bg-secondary/50 border border-border">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  Technical Screening Summary
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-4 rounded-lg bg-bg-card border border-border">
                    <p className="text-xs text-text-secondary mb-2">Screening Score</p>
                    <p className="text-2xl font-bold font-mono text-white">
                      {selectedStock.screeningScore}/14
                    </p>
                  </div>
                  <div className="p-4 rounded-lg bg-bg-card border border-border">
                    <p className="text-xs text-text-secondary mb-2">Consensus Score</p>
                    <p className="text-2xl font-bold font-mono text-primary">
                      {selectedStock.consensusScore}/100
                    </p>
                  </div>
                  <div className="p-4 rounded-lg bg-bg-card border border-border">
                    <p className="text-xs text-text-secondary mb-2">Confidence</p>
                    <p className="text-2xl font-bold font-mono text-success">
                      {(selectedStock.confidence * 100).toFixed(0)}%
                    </p>
                  </div>
                  <div className="p-4 rounded-lg bg-bg-card border border-border">
                    <p className="text-xs text-text-secondary mb-2">Experts</p>
                    <p className="text-2xl font-bold font-mono text-primary">
                      3/3
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
