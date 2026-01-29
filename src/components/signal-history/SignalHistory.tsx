'use client';

import { useState, useEffect, useCallback } from 'react';

interface Signal {
  id: string;
  symbol: string;
  date: string;
  signal: number;
  confidence: number;
  strategy: string;
  stock?: {
    name: string;
    sector?: string;
  };
}

interface PaginationData {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface SignalsResponse {
  signals: Signal[];
  pagination: PaginationData;
}

export function SignalHistory() {
  const [signals, setSignals] = useState<Signal[]>([]);
  const [pagination, setPagination] = useState<PaginationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [symbol, setSymbol] = useState('');
  const [signalType, setSignalType] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [page, setPage] = useState(1);

  const fetchSignals = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '50',
      });

      if (symbol) params.append('symbol', symbol);
      if (signalType) params.append('type', signalType);
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);

      const res = await fetch(`/api/signals?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to fetch signals');

      const data: SignalsResponse = await res.json();
      setSignals(data.signals);
      setPagination(data.pagination);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [page, symbol, signalType, startDate, endDate]);

  useEffect(() => {
    fetchSignals();
  }, [fetchSignals]);

  const getSignalLabel = (signal: number) => {
    switch (signal) {
      case 1:
        return 'BUY';
      case -1:
        return 'SELL';
      case 0:
        return 'HOLD';
      default:
        return 'UNKNOWN';
    }
  };

  const getSignalColor = (signal: number) => {
    switch (signal) {
      case 1:
        return 'bg-green-100 text-green-800';
      case -1:
        return 'bg-red-100 text-red-800';
      case 0:
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const resetFilters = () => {
    setSymbol('');
    setSignalType('');
    setStartDate('');
    setEndDate('');
    setPage(1);
  };

  const exportToCSV = () => {
    if (signals.length === 0) return;

    const headers = ['Symbol', 'Date', 'Signal', 'Confidence', 'Strategy', 'Name'];
    const rows = signals.map(s => [
      s.symbol,
      new Date(s.date).toLocaleDateString(),
      getSignalLabel(s.signal),
      s.confidence.toFixed(2),
      s.strategy,
      s.stock?.name || '',
    ]);

    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `signals_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Signal History</h1>
        <button
          onClick={exportToCSV}
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
          disabled={signals.length === 0}
        >
          Export CSV
        </button>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      {/* Filters */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Symbol</label>
            <input
              type="text"
              value={symbol}
              onChange={(e) => {
                setSymbol(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2 border rounded-lg"
              placeholder="e.g., AAPL"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Signal Type</label>
            <select
              value={signalType}
              onChange={(e) => {
                setSignalType(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2 border rounded-lg"
            >
              <option value="">All</option>
              <option value="buy">Buy</option>
              <option value="sell">Sell</option>
              <option value="hold">Hold</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Start Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2 border rounded-lg"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">End Date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2 border rounded-lg"
            />
          </div>

          <div className="flex items-end">
            <button
              onClick={resetFilters}
              className="w-full px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
            >
              Reset Filters
            </button>
          </div>
        </div>
      </div>

      {/* Results */}
      {loading ? (
        <div className="text-center py-12">Loading...</div>
      ) : signals.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <p className="text-lg mb-2">No signals found</p>
          <p className="text-sm">Try adjusting your filters</p>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white border border-gray-300">
              <thead>
                <tr className="bg-gray-100">
                  <th className="px-4 py-2 text-left cursor-pointer hover:bg-gray-200">Symbol</th>
                  <th className="px-4 py-2 text-left cursor-pointer hover:bg-gray-200">Date</th>
                  <th className="px-4 py-2 text-left cursor-pointer hover:bg-gray-200">Signal</th>
                  <th className="px-4 py-2 text-right cursor-pointer hover:bg-gray-200">Confidence</th>
                  <th className="px-4 py-2 text-left">Strategy</th>
                  <th className="px-4 py-2 text-left">Name</th>
                </tr>
              </thead>
              <tbody>
                {signals.map((signal) => (
                  <tr key={signal.id} className="border-t hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium">{signal.symbol}</td>
                    <td className="px-4 py-3">
                      {new Date(signal.date).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${getSignalColor(signal.signal)}`}>
                        {getSignalLabel(signal.signal)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {(signal.confidence * 100).toFixed(0)}%
                    </td>
                    <td className="px-4 py-3 capitalize">{signal.strategy}</td>
                    <td className="px-4 py-3 text-gray-600">{signal.stock?.name || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <div className="mt-4 flex justify-center items-center gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1 border rounded hover:bg-gray-100 disabled:opacity-50"
              >
                Previous
              </button>
              <span className="text-sm">
                Page {page} of {pagination.totalPages} ({pagination.total} total)
              </span>
              <button
                onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))}
                disabled={page === pagination.totalPages}
                className="px-3 py-1 border rounded hover:bg-gray-100 disabled:opacity-50"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
