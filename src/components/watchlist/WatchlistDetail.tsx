'use client';

import { useEffect, useState, useCallback } from 'react';

interface Stock {
  symbol: string;
  name: string;
  latestPrice?: {
    close: number;
    date: string;
  };
}

interface WatchlistData {
  id: string;
  name: string;
  description: string | null;
  stocks: Array<{
    stock: Stock;
  }>;
}

interface WatchlistDetailProps {
  watchlistId: string;
}

export function WatchlistDetail({ watchlistId }: WatchlistDetailProps) {
  const [watchlist, setWatchlist] = useState<WatchlistData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newSymbol, setNewSymbol] = useState('');

  const fetchWatchlist = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/watchlists/${watchlistId}`);
      if (!res.ok) throw new Error('Failed to fetch watchlist');
      const data = await res.json();
      setWatchlist(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [watchlistId]);

  useEffect(() => {
    fetchWatchlist();
  }, [fetchWatchlist]);

  const addStock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSymbol.trim()) return;

    try {
      const res = await fetch(`/api/watchlists/${watchlistId}/stocks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ symbol: newSymbol.toUpperCase().trim() }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to add stock');
      }

      setNewSymbol('');
      fetchWatchlist();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  };

  const removeStock = async (symbol: string) => {
    if (!confirm(`Remove ${symbol} from watchlist?`)) return;

    try {
      const res = await fetch(`/api/watchlists/${watchlistId}/stocks?symbol=${symbol}`, {
        method: 'DELETE',
      });

      if (!res.ok) throw new Error('Failed to remove stock');
      fetchWatchlist();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  };

  if (loading) {
    return <div className="p-6">Loading watchlist...</div>;
  }

  if (!watchlist) {
    return <div className="p-6">Watchlist not found</div>;
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">{watchlist.name}</h1>
        {watchlist.description && (
          <p className="text-gray-600">{watchlist.description}</p>
        )}
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
          <button
            onClick={() => setError(null)}
            className="ml-2 text-red-800 underline"
          >
            Dismiss
          </button>
        </div>
      )}

      <form onSubmit={addStock} className="mb-6">
        <div className="flex gap-2">
          <input
            type="text"
            value={newSymbol}
            onChange={(e) => setNewSymbol(e.target.value)}
            className="flex-1 px-3 py-2 border rounded-lg"
            placeholder="Add stock symbol (e.g., AAPL)"
            required
          />
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Add
          </button>
        </div>
      </form>

      {watchlist.stocks.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <p className="text-lg mb-2">No stocks in this watchlist yet</p>
          <p className="text-sm">Add stocks using the form above</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border border-gray-300">
            <thead>
              <tr className="bg-gray-100">
                <th className="px-4 py-2 text-left">Symbol</th>
                <th className="px-4 py-2 text-left">Name</th>
                <th className="px-4 py-2 text-right">Latest Price</th>
                <th className="px-4 py-2 text-left">Date</th>
                <th className="px-4 py-2 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {watchlist.stocks.map(({ stock }) => (
                <tr key={stock.symbol} className="border-t hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">{stock.symbol}</td>
                  <td className="px-4 py-3">{stock.name}</td>
                  <td className="px-4 py-3 text-right">
                    {stock.latestPrice ? (
                      `$${stock.latestPrice.close.toFixed(2)}`
                    ) : (
                      <span className="text-gray-400">N/A</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {stock.latestPrice ? (
                      new Date(stock.latestPrice.date).toLocaleDateString()
                    ) : (
                      <span className="text-gray-400">N/A</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => removeStock(stock.symbol)}
                      className="text-red-600 hover:text-red-800 text-sm"
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
