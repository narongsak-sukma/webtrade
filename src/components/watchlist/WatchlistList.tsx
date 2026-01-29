'use client';

import { useEffect, useState } from 'react';

interface Watchlist {
  id: string;
  name: string;
  description: string | null;
  createdAt: string;
  _count: {
    stocks: number;
  };
}

export function WatchlistList() {
  const [watchlists, setWatchlists] = useState<Watchlist[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDescription, setNewDescription] = useState('');

  useEffect(() => {
    fetchWatchlists();
  }, []);

  const fetchWatchlists = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/watchlists');
      if (!res.ok) throw new Error('Failed to fetch watchlists');
      const data = await res.json();
      setWatchlists(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const createWatchlist = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/watchlists', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newName,
          description: newDescription || undefined,
        }),
      });

      if (!res.ok) throw new Error('Failed to create watchlist');

      setNewName('');
      setNewDescription('');
      setShowCreate(false);
      fetchWatchlists();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  };

  const deleteWatchlist = async (id: string) => {
    if (!confirm('Are you sure you want to delete this watchlist?')) return;

    try {
      const res = await fetch(`/api/watchlists/${id}`, {
        method: 'DELETE',
      });

      if (!res.ok) throw new Error('Failed to delete watchlist');
      fetchWatchlists();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  };

  if (loading) {
    return <div className="p-6">Loading watchlists...</div>;
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">My Watchlists</h1>
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          {showCreate ? 'Cancel' : '+ New Watchlist'}
        </button>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      {showCreate && (
        <form onSubmit={createWatchlist} className="mb-6 p-4 bg-gray-50 rounded-lg">
          <h2 className="text-xl font-semibold mb-4">Create New Watchlist</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Name</label>
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg"
                placeholder="My Watchlist"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Description (optional)</label>
              <textarea
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg"
                placeholder="Add a description..."
                rows={3}
              />
            </div>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Create
            </button>
          </div>
        </form>
      )}

      {watchlists.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <p className="text-lg mb-2">No watchlists yet</p>
          <p className="text-sm">Create your first watchlist to start tracking stocks</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {watchlists.map((watchlist) => (
            <div
              key={watchlist.id}
              className="border rounded-lg p-4 hover:shadow-lg transition-shadow"
            >
              <div className="flex justify-between items-start mb-2">
                <h3 className="text-xl font-semibold">{watchlist.name}</h3>
                <button
                  onClick={() => deleteWatchlist(watchlist.id)}
                  className="text-red-600 hover:text-red-800 text-sm"
                >
                  Delete
                </button>
              </div>
              {watchlist.description && (
                <p className="text-gray-600 text-sm mb-3">{watchlist.description}</p>
              )}
              <div className="flex justify-between items-center text-sm text-gray-500">
                <span>{watchlist._count.stocks} stocks</span>
                <a
                  href={`/watchlists/${watchlist.id}`}
                  className="text-blue-600 hover:text-blue-800"
                >
                  View →
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
