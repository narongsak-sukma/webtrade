'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Watchlist {
  id: string;
  name: string;
}

interface AddToWatchlistProps {
  symbol: string;
  className?: string;
}

export function AddToWatchlist({ symbol, className = '' }: AddToWatchlistProps) {
  const [watchlists, setWatchlists] = useState<Watchlist[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (showDropdown) {
      fetchWatchlists();
    }
  }, [showDropdown]);

  const fetchWatchlists = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/watchlists');
      if (!res.ok) throw new Error('Failed to fetch watchlists');
      const data = await res.json();
      setWatchlists(data);
    } catch (err) {
      console.error('Error fetching watchlists:', err);
    } finally {
      setLoading(false);
    }
  };

  const addToWatchlist = async (watchlistId: string) => {
    try {
      const res = await fetch(`/api/watchlists/${watchlistId}/stocks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ symbol }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 409) {
          setMessage('Already in watchlist');
        } else {
          throw new Error(data.error || 'Failed to add to watchlist');
        }
        return;
      }

      setMessage('Added to watchlist!');
      setShowDropdown(false);
      setTimeout(() => setMessage(''), 2000);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Failed to add');
    }
  };

  return (
    <div className={`relative ${className}`}>
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
      >
        + Watchlist
      </button>

      {message && (
        <div className="absolute top-full mt-1 left-0 text-xs whitespace-nowrap">
          <span className="bg-gray-800 text-white px-2 py-1 rounded">{message}</span>
        </div>
      )}

      {showDropdown && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setShowDropdown(false)}
          />
          <div className="absolute top-full mt-1 left-0 z-20 bg-white border rounded-lg shadow-lg min-w-[200px]">
            {loading ? (
              <div className="p-3 text-gray-500">Loading...</div>
            ) : watchlists.length === 0 ? (
              <div className="p-3 text-gray-500">No watchlists</div>
            ) : (
              <ul className="py-1">
                {watchlists.map((watchlist) => (
                  <li key={watchlist.id}>
                    <button
                      onClick={() => addToWatchlist(watchlist.id)}
                      className="w-full px-4 py-2 text-left hover:bg-gray-100"
                    >
                      {watchlist.name}
                    </button>
                  </li>
                ))}
              </ul>
            )}
            <div className="border-t pt-1">
              <Link
                href="/watchlists"
                className="block px-4 py-2 text-sm text-blue-600 hover:bg-gray-100"
              >
                + Create Watchlist
              </Link>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
