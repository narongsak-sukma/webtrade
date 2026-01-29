'use client';

import { useState, useEffect } from 'react';

interface ProcessStatus {
  name: string;
  displayName: string;
  description: string;
  lastRun: Date | null;
  canRun: boolean;
  isRunning: boolean;
  market: 'US' | 'TH' | 'both';
}

export function ProcessControlPanel() {
  const [processes, setProcesses] = useState<ProcessStatus[]>([
    {
      name: 'screening-us',
      displayName: 'US Stock Screening',
      description: 'Fetch latest prices and run 14-filter Minervini screening for S&P 500',
      lastRun: null,
      canRun: false,
      isRunning: false,
      market: 'US',
    },
    {
      name: 'screening-th',
      displayName: 'TH Stock Screening',
      description: 'Fetch latest prices and run 14-filter Minervini screening for SET100',
      lastRun: null,
      canRun: false,
      isRunning: false,
      market: 'TH',
    },
    {
      name: 'ml-signals-us',
      displayName: 'US ML Signals',
      description: 'Generate ML-powered trading signals for qualified US stocks',
      lastRun: null,
      canRun: false,
      isRunning: false,
      market: 'US',
    },
    {
      name: 'ml-signals-th',
      displayName: 'TH ML Signals',
      description: 'Generate ML-powered trading signals for qualified Thai stocks',
      lastRun: null,
      canRun: false,
      isRunning: false,
      market: 'TH',
    },
  ]);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProcessStatus();

    // Poll for updates every 5 seconds if any process is running
    const interval = setInterval(() => {
      const hasRunningProcess = processes.some(p => p.isRunning);
      if (hasRunningProcess) {
        fetchProcessStatus();
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [processes]);

  const fetchProcessStatus = async () => {
    try {
      const res = await fetch('/api/process/status');
      const data = await res.json();

      setProcesses(prev =>
        prev.map(p => ({
          ...p,
          lastRun: data[p.name]?.lastRun ? new Date(data[p.name].lastRun) : null,
          canRun: data[p.name]?.canRun || false,
          isRunning: data[p.name]?.isRunning || false,
        }))
      );
    } catch (error) {
      console.error('Error fetching process status:', error);
    } finally {
      setLoading(false);
    }
  };

  const runProcess = async (processName: string) => {
    const confirmed = confirm(
      'This will fetch the latest stock data and run analysis. Continue?'
    );

    if (!confirmed) return;

    setProcesses(prev =>
      prev.map(p =>
        p.name === processName ? { ...p, isRunning: true } : p
      )
    );

    try {
      const res = await fetch('/api/process/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ process: processName }),
      });

      const data = await res.json();

      if (data.success) {
        alert(data.message || 'Process completed successfully!');
        await fetchProcessStatus();
      } else {
        alert(data.error || 'Process failed');
      }
    } catch (error) {
      console.error('Error running process:', error);
      alert('Failed to run process');
    } finally {
      setProcesses(prev =>
        prev.map(p =>
          p.name === processName ? { ...p, isRunning: false } : p
        )
      );
    }
  };

  const getMarketIcon = (market: 'US' | 'TH' | 'both') => {
    if (market === 'US') return '🇺🇸';
    if (market === 'TH') return '🇹🇭';
    return '🌏';
  };

  const getMarketColor = (market: 'US' | 'TH' | 'both') => {
    if (market === 'US') return 'blue';
    if (market === 'TH') return 'purple';
    return 'emerald';
  };

  const formatDate = (date: Date | null) => {
    if (!date) return 'Never';
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

    if (diffHours < 1) {
      const diffMins = Math.floor(diffMs / (1000 * 60));
      return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`;
    } else if (diffHours < 24) {
      return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
    } else {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    }
  };

  const isToday = (date: Date | null) => {
    if (!date) return false;
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  if (loading) {
    return (
      <div className="bg-surface-secondary border border-border rounded-2xl p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-surface-tertiary rounded w-1/3"></div>
          <div className="h-20 bg-surface-tertiary rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-surface-secondary border border-border rounded-2xl p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold text-white">Process Control</h2>
          <p className="text-sm text-text-secondary mt-1">
            Manage data fetching and analysis processes
          </p>
        </div>
        <button
          onClick={fetchProcessStatus}
          className="px-4 py-2 text-sm bg-surface-tertiary hover:bg-surface-hover border border-border rounded-lg text-text-primary transition-all duration-200"
        >
          Refresh Status
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {processes.map((process) => {
          const marketColor = getMarketColor(process.market);
          const hasRunToday = isToday(process.lastRun);

          return (
            <div
              key={process.name}
              className={`bg-surface-tertiary border ${
                hasRunToday
                  ? 'border-emerald-500/30'
                  : process.canRun
                  ? `border-${marketColor}-500/30`
                  : 'border-border'
              } rounded-xl p-4 transition-all duration-200`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{getMarketIcon(process.market)}</span>
                  <h3 className="font-semibold text-white">{process.displayName}</h3>
                </div>
                {hasRunToday && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-emerald-500/20 text-emerald-400 text-xs font-semibold rounded-full border border-emerald-500/30">
                    ✓ Done Today
                  </span>
                )}
              </div>

              <p className="text-sm text-text-secondary mb-4">
                {process.description}
              </p>

              <div className="flex items-center justify-between">
                <div className="text-xs text-text-tertiary">
                  <span className="block">Last run: {formatDate(process.lastRun)}</span>
                  {process.lastRun && (
                    <span className="block mt-1">
                      {process.lastRun.toLocaleDateString('en-US', {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </span>
                  )}
                </div>

                <button
                  onClick={() => runProcess(process.name)}
                  disabled={!process.canRun || process.isRunning || hasRunToday}
                  className={`px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                    hasRunToday
                      ? 'bg-surface-hover text-text-tertiary cursor-not-allowed border border-border'
                      : process.canRun && !process.isRunning
                      ? `bg-${marketColor}-500/20 text-${marketColor}-400 border border-${marketColor}-500/30 hover:bg-${marketColor}-500/30 hover:scale-105`
                      : 'bg-surface-hover text-text-tertiary cursor-not-allowed border border-border'
                  }`}
                >
                  {process.isRunning ? (
                    <span className="flex items-center gap-2">
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                          fill="none"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                      </svg>
                      Running...
                    </span>
                  ) : hasRunToday ? (
                    'Locked Today'
                  ) : !process.canRun ? (
                    'Unavailable'
                  ) : (
                    'Run Now'
                  )}
                </button>
              </div>

              {!process.canRun && !hasRunToday && (
                <div className="mt-3 pt-3 border-t border-border">
                  <p className="text-xs text-text-tertiary flex items-center gap-1">
                    <svg
                      className="w-3 h-3"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    Requires latest screening data
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-6 p-4 bg-surface-tertiary border border-border rounded-xl">
        <div className="flex items-start gap-3">
          <svg
            className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <div className="flex-1">
            <p className="text-sm text-text-secondary">
              <span className="font-semibold text-white">Daily Data Lock:</span> Each
              process can only run once per day to prevent unnecessary API calls
              and duplicate data. Processes unlock automatically at midnight.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
