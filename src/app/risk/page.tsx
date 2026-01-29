'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function RiskPage() {
  const [accountBalance, setAccountBalance] = useState(100000);
  const [entryPrice, setEntryPrice] = useState('');
  const [riskPercent, setRiskPercent] = useState(2);
  const [stopLoss, setStopLoss] = useState(5);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const calculate = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/risk/calculate-position-size', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accountBalance,
          entryPrice: parseFloat(entryPrice),
          riskPerTrade: riskPercent / 100,
          stopLossPercent: stopLoss / 100,
          riskRewardRatio: 3,
        }),
      });
      const data = await res.json();
      if (data.success) setResult(data.data);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">Risk Management</h1>
            <p className="text-neutral-600 dark:text-neutral-400">Position Sizing Calculator</p>
          </div>
          <Link href="/pipeline" className="text-primary-600 hover:underline">← Back to Pipeline</Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white dark:bg-neutral-800 rounded-lg shadow p-6">
            <h2 className="text-xl font-bold mb-6">Position Size Calculator</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Account Balance ($)</label>
                <input
                  type="number"
                  value={accountBalance}
                  onChange={(e) => setAccountBalance(parseFloat(e.target.value))}
                  className="w-full px-4 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-neutral-700 dark:text-neutral-100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Entry Price ($)</label>
                <input
                  type="number"
                  value={entryPrice}
                  onChange={(e) => setEntryPrice(e.target.value)}
                  placeholder="175.50"
                  className="w-full px-4 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-neutral-700 dark:text-neutral-100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Risk Per Trade: {riskPercent}%</label>
                <input
                  type="range"
                  min="0.5" max="5" step="0.5"
                  value={riskPercent}
                  onChange={(e) => setRiskPercent(parseFloat(e.target.value))}
                  className="w-full"
                />
                <p className="text-xs text-neutral-500 mt-1">Risk Amount: ${(accountBalance * riskPercent / 100).toLocaleString()}</p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Stop Loss: {stopLoss}%</label>
                <input
                  type="range"
                  min="2" max="15" step="1"
                  value={stopLoss}
                  onChange={(e) => setStopLoss(parseFloat(e.target.value))}
                  className="w-full"
                />
              </div>

              <button
                onClick={calculate}
                disabled={loading || !entryPrice}
                className="w-full px-4 py-3 bg-primary-600 hover:bg-primary-700 disabled:bg-neutral-300 dark:disabled:bg-neutral-700 text-white rounded-lg transition-colors font-medium"
              >
                {loading ? 'Calculating...' : 'Calculate Position Size'}
              </button>
            </div>
          </div>

          {result && (
            <div className="bg-white dark:bg-neutral-800 rounded-lg shadow p-6">
              <h2 className="text-xl font-bold mb-6">📊 Recommendation</h2>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-neutral-600">Shares to Buy</p>
                    <p className="text-2xl font-bold">{result.shares}</p>
                  </div>
                  <div>
                    <p className="text-sm text-neutral-600">Position Size</p>
                    <p className="text-2xl font-bold">${result.positionSize?.toLocaleString()}</p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3 text-center p-4 bg-neutral-50 dark:bg-neutral-900 rounded-lg">
                  <div>
                    <p className="text-xs text-neutral-600">Entry</p>
                    <p className="font-semibold">${parseFloat(entryPrice).toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-neutral-600">Stop Loss</p>
                    <p className="font-semibold text-red-600">${result.stopLossPrice?.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-neutral-600">Take Profit</p>
                    <p className="font-semibold text-green-600">${result.takeProfitPrice?.toFixed(2)}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg text-center">
                    <p className="text-sm text-neutral-600">Max Loss</p>
                    <p className="text-xl font-bold text-red-600">-${result.maxLoss?.toFixed(2)}</p>
                  </div>
                  <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg text-center">
                    <p className="text-sm text-neutral-600">Max Gain</p>
                    <p className="text-xl font-bold text-green-600">+${result.maxGain?.toFixed(2)}</p>
                  </div>
                </div>

                <div className="p-4 bg-primary-50 dark:bg-primary-900/20 rounded-lg text-center">
                  <p className="text-sm text-neutral-600">Risk-Reward Ratio</p>
                  <p className="text-2xl font-bold text-primary-600">1:{result.riskRewardRatio?.toFixed(1)}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="mt-8 bg-white dark:bg-neutral-800 rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">🛡️ Risk Management Guidelines</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <p className="font-medium">1. Risk 1-2% per trade</p>
              <p className="text-sm text-neutral-600 mt-1">Never risk more than 2% of your account</p>
            </div>
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <p className="font-medium">2. Use stop-loss always</p>
              <p className="text-sm text-neutral-600 mt-1">Set stop-loss before entering trade</p>
            </div>
            <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
              <p className="font-medium">3. Target 2:1 risk-reward</p>
              <p className="text-sm text-neutral-600 mt-1">For every $1 risked, aim for $2 profit</p>
            </div>
            <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
              <p className="font-medium">4. Limit portfolio heat to 20%</p>
              <p className="text-sm text-neutral-600 mt-1">Total risk across all positions</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
