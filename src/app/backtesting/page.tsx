'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function BacktestingPage() {
  const [config, setConfig] = useState({
    symbol: 'AAPL',
    startDate: '2023-01-01',
    endDate: '2024-12-31',
    initialCapital: 100000,
    commission: 5,
    slippage: 0.001,
    positionSizePercent: 0.95,
    stopLossPercent: 0.05,
    takeProfitPercent: 0.15,
  });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const runBacktest = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/backtest/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });
      const data = await res.json();
      if (data.success) {
        setResult(data.data);
      } else {
        alert('Error: ' + (data.error || 'Backtest failed'));
      }
    } catch (err: any) {
      alert('Error: ' + (err.message || 'Backtest failed'));
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">Backtesting Engine</h1>
            <p className="text-neutral-600 dark:text-neutral-400">Test Strategies with Realistic Costs</p>
          </div>
          <Link href="/pipeline" className="text-primary-600 hover:underline">← Back to Pipeline</Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="bg-white dark:bg-neutral-800 rounded-lg shadow p-6">
            <h2 className="text-xl font-bold mb-6">Configuration</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Symbol</label>
                <input
                  type="text"
                  value={config.symbol}
                  onChange={(e) => setConfig({ ...config, symbol: e.target.value.toUpperCase() })}
                  className="w-full px-4 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg dark:bg-neutral-700 dark:text-neutral-100"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-2">Start Date</label>
                  <input
                    type="date"
                    value={config.startDate}
                    onChange={(e) => setConfig({ ...config, startDate: e.target.value })}
                    className="w-full px-4 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg dark:bg-neutral-700 dark:text-neutral-100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">End Date</label>
                  <input
                    type="date"
                    value={config.endDate}
                    onChange={(e) => setConfig({ ...config, endDate: e.target.value })}
                    className="w-full px-4 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg dark:bg-neutral-700 dark:text-neutral-100"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Initial Capital ($)</label>
                <input
                  type="number"
                  value={config.initialCapital}
                  onChange={(e) => setConfig({ ...config, initialCapital: parseFloat(e.target.value) })}
                  className="w-full px-4 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg dark:bg-neutral-700 dark:text-neutral-100"
                />
              </div>

              <div className="border-t pt-4">
                <p className="text-sm font-medium mb-3">Trading Costs</p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs mb-1">Commission ($)</label>
                    <input
                      type="number"
                      value={config.commission}
                      onChange={(e) => setConfig({ ...config, commission: parseFloat(e.target.value) })}
                      className="w-full px-3 py-2 border rounded text-sm dark:bg-neutral-700 dark:text-neutral-100"
                    />
                  </div>
                  <div>
                    <label className="block text-xs mb-1">Slippage (%)</label>
                    <input
                      type="number"
                      step="0.001"
                      value={config.slippage}
                      onChange={(e) => setConfig({ ...config, slippage: parseFloat(e.target.value) })}
                      className="w-full px-3 py-2 border rounded text-sm dark:bg-neutral-700 dark:text-neutral-100"
                    />
                  </div>
                </div>
              </div>

              <button
                onClick={runBacktest}
                disabled={loading}
                className="w-full px-4 py-3 bg-primary-600 hover:bg-primary-700 disabled:bg-neutral-300 dark:disabled:bg-neutral-700 text-white rounded-lg font-medium"
              >
                {loading ? 'Running...' : '🚀 Run Backtest'}
              </button>
            </div>
          </div>

          {result && (
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white dark:bg-neutral-800 rounded-lg shadow p-6">
                <h2 className="text-xl font-bold mb-4">Results for {result.symbol}</h2>

                <div className="grid grid-cols-4 gap-4 mb-6">
                  <div className="p-4 bg-neutral-50 dark:bg-neutral-900 rounded">
                    <p className="text-sm text-neutral-600">Total Trades</p>
                    <p className="text-2xl font-bold">{result.totalTrades}</p>
                  </div>
                  <div className="p-4 bg-neutral-50 dark:bg-neutral-900 rounded">
                    <p className="text-sm text-neutral-600">Win Rate</p>
                    <p className="text-2xl font-bold">{result.winRate?.toFixed(1)}%</p>
                  </div>
                  <div className="p-4 bg-neutral-50 dark:bg-neutral-900 rounded">
                    <p className="text-sm text-neutral-600">Net Profit</p>
                    <p className={`text-2xl font-bold ${result.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {result.netProfit >= 0 ? '+' : ''}${result.netProfit?.toFixed(0)}
                    </p>
                  </div>
                  <div className="p-4 bg-neutral-50 dark:bg-neutral-900 rounded">
                    <p className="text-sm text-neutral-600">Return</p>
                    <p className={`text-2xl font-bold ${result.netProfitPct >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {result.netProfitPct >= 0 ? '+' : ''}{result.netProfitPct?.toFixed(2)}%
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="p-4 bg-neutral-50 dark:bg-neutral-900 rounded">
                    <p className="text-sm text-neutral-600">Sharpe Ratio</p>
                    <p className="text-xl font-bold">{result.sharpeRatio?.toFixed(2)}</p>
                  </div>
                  <div className="p-4 bg-neutral-50 dark:bg-neutral-900 rounded">
                    <p className="text-sm text-neutral-600">Sortino Ratio</p>
                    <p className="text-xl font-bold">{result.sortinoRatio?.toFixed(2)}</p>
                  </div>
                  <div className="p-4 bg-neutral-50 dark:bg-neutral-900 rounded">
                    <p className="text-sm text-neutral-600">Profit Factor</p>
                    <p className="text-xl font-bold">{result.profitFactor?.toFixed(2)}</p>
                  </div>
                </div>
              </div>

              {result.trades && result.trades.length > 0 && (
                <div className="bg-white dark:bg-neutral-800 rounded-lg shadow p-6">
                  <h3 className="text-lg font-bold mb-4">Recent Trades</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="px-4 py-2 text-left">Entry Date</th>
                          <th className="px-4 py-2 text-left">Exit Date</th>
                          <th className="px-4 py-2 text-left">Entry $</th>
                          <th className="px-4 py-2 text-left">Exit $</th>
                          <th className="px-4 py-2 text-left">P/L</th>
                          <th className="px-4 py-2 text-left">Return %</th>
                        </tr>
                      </thead>
                      <tbody>
                        {result.trades.slice(0, 10).map((trade: any, i: number) => (
                          <tr key={i} className="border-b">
                            <td className="px-4 py-2">{new Date(trade.entryDate).toLocaleDateString()}</td>
                            <td className="px-4 py-2">{new Date(trade.exitDate).toLocaleDateString()}</td>
                            <td className="px-4 py-2">{trade.entryPrice?.toFixed(2)}</td>
                            <td className="px-4 py-2">{trade.exitPrice?.toFixed(2)}</td>
                            <td className={`px-4 py-2 ${trade.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {trade.netProfit >= 0 ? '+' : ''}{trade.netProfit?.toFixed(2)}
                            </td>
                            <td className={`px-4 py-2 ${trade.returnPct >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {trade.returnPct >= 0 ? '+' : ''}{trade.returnPct?.toFixed(2)}%
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
