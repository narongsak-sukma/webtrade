'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function PipelinePage() {
  const [stats, setStats] = useState({
    totalStocks: 0,
    screenedStocks: 0,
    qualifiedStocks: 0,
    signalsCount: 0,
    buySignals: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/dashboard/stats')
      .then(res => res.json())
      .then(data => {
        setStats(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error loading stats:', err);
        setLoading(false);
      });
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 to-neutral-100 dark:from-neutral-950 dark:to-neutral-900">
      <div className="bg-white dark:bg-neutral-800 shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-neutral-900 dark:text-neutral-100">
                Trading Pipeline Dashboard
              </h1>
              <p className="text-neutral-600 dark:text-neutral-400">
                Complete algorithmic trading workflow
              </p>
            </div>
            <Link href="/dashboard" className="text-primary-600 hover:underline">
              View Dashboard →
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="text-center py-12">Loading...</div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <div className="bg-white dark:bg-neutral-800 rounded-lg shadow p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-neutral-600 dark:text-neutral-400">Total Stocks</p>
                    <p className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
                      {stats.totalStocks}
                    </p>
                  </div>
                  <div className="text-3xl">📈</div>
                </div>
              </div>

              <div className="bg-white dark:bg-neutral-800 rounded-lg shadow p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-neutral-600 dark:text-neutral-400">Qualified</p>
                    <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                      {stats.qualifiedStocks}
                    </p>
                  </div>
                  <div className="text-3xl">✅</div>
                </div>
              </div>

              <div className="bg-white dark:bg-neutral-800 rounded-lg shadow p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-neutral-600 dark:text-neutral-400">Buy Signals</p>
                    <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                      {stats.buySignals}
                    </p>
                  </div>
                  <div className="text-3xl">🟢</div>
                </div>
              </div>

              <div className="bg-white dark:bg-neutral-800 rounded-lg shadow p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-neutral-600 dark:text-neutral-400">Active Signals</p>
                    <p className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
                      {stats.signalsCount}
                    </p>
                  </div>
                  <div className="text-3xl">🎯</div>
                </div>
              </div>
            </div>

            <h2 className="text-xl font-bold mb-4">Trading Pipeline</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <a href="/screening" className="block bg-white dark:bg-neutral-800 rounded-lg shadow hover:shadow-xl transition-all p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="text-4xl">🔍</div>
                  <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">1</div>
                </div>
                <h3 className="text-lg font-semibold mb-2">Stock Screening</h3>
                <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-4">
                  Minervini Trend Template Analysis
                </p>
                <div className="bg-neutral-50 dark:bg-neutral-900 rounded-lg p-3">
                  <p className="text-sm font-medium">
                    {stats.qualifiedStocks}/{stats.screenedStocks} stocks qualified
                  </p>
                </div>
              </a>

              <a href="/dashboard" className="block bg-white dark:bg-neutral-800 rounded-lg shadow hover:shadow-xl transition-all p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="text-4xl">🤖</div>
                  <div className="text-2xl font-bold text-green-600 dark:text-green-400">2</div>
                </div>
                <h3 className="text-lg font-semibold mb-2">ML Signals</h3>
                <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-4">
                  AI-Driven Trading Signals
                </p>
                <div className="bg-neutral-50 dark:bg-neutral-900 rounded-lg p-3">
                  <p className="text-sm font-medium">
                    {stats.buySignals} BUY signals available
                  </p>
                </div>
              </a>

              <a href="/risk" className="block bg-white dark:bg-neutral-800 rounded-lg shadow hover:shadow-xl transition-all p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="text-4xl">🛡️</div>
                  <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">3</div>
                </div>
                <h3 className="text-lg font-semibold mb-2">Risk Management</h3>
                <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-4">
                  Position Sizing Calculator
                </p>
                <div className="bg-neutral-50 dark:bg-neutral-900 rounded-lg p-3">
                  <p className="text-sm font-medium">
                    Calculate position sizes and portfolio risk
                  </p>
                </div>
              </a>

              <a href="/backtesting" className="block bg-white dark:bg-neutral-800 rounded-lg shadow hover:shadow-xl transition-all p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="text-4xl">📊</div>
                  <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">4</div>
                </div>
                <h3 className="text-lg font-semibold mb-2">Backtesting</h3>
                <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-4">
                  Performance Validation
                </p>
                <div className="bg-neutral-50 dark:bg-neutral-900 rounded-lg p-3">
                  <p className="text-sm font-medium">
                    Test strategies with realistic costs
                  </p>
                </div>
              </a>
            </div>

            <div className="bg-white dark:bg-neutral-800 rounded-lg shadow p-6 mt-8">
              <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <button
                  onClick={async () => {
                    alert('🔄 Running complete trading workflow...\n\n1. Screening stocks\n2. Generating ML signals\n3. Updating risk metrics\n\nThis will take 1-2 minutes. Please wait...');
                    try {
                      const res = await fetch('/api/workflow/run', { method: 'POST' });
                      const data = await res.json();
                      if (data.success) {
                        alert('✅ Complete workflow finished!\n\n' + data.message);
                        // Reload page to show updated stats
                        window.location.reload();
                      } else {
                        alert('❌ Error: ' + data.error);
                      }
                    } catch (err: any) {
                      alert('❌ Error: ' + (err.message || 'Workflow failed'));
                    }
                  }}
                  className="px-4 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors text-sm w-full"
                >
                  🔄 Run Complete Workflow
                </button>
                <button
                  onClick={async () => {
                    if (!confirm('Update data from Yahoo Finance? This will take several minutes.')) return;
                    alert('📥 Updating data from Yahoo Finance...\n\nThis will fetch latest stock prices.\nPlease wait...');
                    try {
                      const res = await fetch('/api/stocks/fetch', { method: 'POST' });
                      const data = await res.json();
                      if (data.success) {
                        alert('✅ Data updated successfully!\n\nUpdated ' + data.updated + ' records');
                        window.location.reload();
                      } else {
                        alert('❌ Error: ' + data.error);
                      }
                    } catch (err: any) {
                      alert('❌ Error: ' + (err.message || 'Update failed'));
                    }
                  }}
                  className="px-4 py-3 bg-neutral-100 dark:bg-neutral-700 hover:bg-neutral-200 dark:hover:bg-neutral-600 text-neutral-900 dark:text-neutral-100 rounded-lg transition-colors text-sm w-full"
                >
                  📥 Update Data
                </button>
                <button
                  onClick={() => {
                  alert('📊 Refreshing data...\n\nReloading page with latest statistics.');
                  window.location.reload();
                }}
                  className="px-4 py-3 bg-neutral-100 dark:bg-neutral-700 hover:bg-neutral-200 dark:hover:bg-neutral-600 text-neutral-900 dark:text-neutral-100 rounded-lg transition-colors text-sm w-full"
                >
                  📊 Refresh Data
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
