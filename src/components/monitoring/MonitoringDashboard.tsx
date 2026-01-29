'use client';

import { useState, useEffect } from 'react';

interface Job {
  id: string;
  name: string;
  type: string;
  status: string;
  enabled: boolean;
  lastRun: string | null;
  runCount: number;
  lastError: string | null;
  _count: {
    logs: number;
  };
}

interface JobLog {
  id: string;
  status: string;
  message: string;
  error: string | null;
  duration: number | null;
  startedAt: string;
  completedAt: string | null;
  job: {
    name: string;
    type: string;
  };
}

interface MonitoringData {
  jobs: Job[];
  recentLogs: JobLog[];
  recentErrors: JobLog[];
  summary: {
    totalJobs: number;
    enabledJobs: number;
    runningJobs: number;
    failedJobs: number;
    totalExecutions: number;
    successfulExecutions: number;
    failedExecutions: number;
  };
}

export function MonitoringDashboard() {
  const [data, setData] = useState<MonitoringData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTab, setSelectedTab] = useState<'overview' | 'jobs' | 'logs' | 'errors'>('overview');

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 10000); // Refresh every 10 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    try {
      const res = await fetch('/api/admin/monitoring');
      if (!res.ok) throw new Error('Failed to fetch monitoring data');
      const monitoringData = await res.json();
      setData(monitoringData);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running':
        return 'bg-blue-100 text-blue-800';
      case 'idle':
        return 'bg-green-100 text-green-800';
      case 'error':
        return 'bg-red-100 text-red-800';
      case 'stopped':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return <div className="p-6">Loading monitoring data...</div>;
  }

  if (!data) {
    return <div className="p-6">Failed to load monitoring data</div>;
  }

  const successRate = data.summary.totalExecutions > 0
    ? ((data.summary.successfulExecutions / data.summary.totalExecutions) * 100).toFixed(1)
    : '0.0';

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">System Monitoring</h1>
        <button
          onClick={fetchData}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Refresh
        </button>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      {/* Tabs */}
      <div className="mb-4 border-b">
        <nav className="flex space-x-4">
          {(['overview', 'jobs', 'logs', 'errors'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setSelectedTab(tab)}
              className={`py-2 px-4 border-b-2 capitalize ${
                selectedTab === tab
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab}
            </button>
          ))}
        </nav>
      </div>

      {/* Overview Tab */}
      {selectedTab === 'overview' && (
        <div>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="bg-white border rounded-lg p-4">
              <div className="text-sm text-gray-500 mb-1">Total Jobs</div>
              <div className="text-2xl font-bold">{data.summary.totalJobs}</div>
              <div className="text-xs text-gray-500">{data.summary.enabledJobs} enabled</div>
            </div>

            <div className="bg-white border rounded-lg p-4">
              <div className="text-sm text-gray-500 mb-1">Running</div>
              <div className="text-2xl font-bold text-blue-600">{data.summary.runningJobs}</div>
            </div>

            <div className="bg-white border rounded-lg p-4">
              <div className="text-sm text-gray-500 mb-1">Failed</div>
              <div className="text-2xl font-bold text-red-600">{data.summary.failedJobs}</div>
            </div>

            <div className="bg-white border rounded-lg p-4">
              <div className="text-sm text-gray-500 mb-1">Success Rate</div>
              <div className="text-2xl font-bold text-green-600">{successRate}%</div>
              <div className="text-xs text-gray-500">
                {data.summary.successfulExecutions}/{data.summary.totalExecutions} executions
              </div>
            </div>
          </div>

          {/* Recent Errors */}
          <div className="bg-white border rounded-lg p-4">
            <h2 className="text-xl font-semibold mb-4">Recent Errors</h2>
            {data.recentErrors.length === 0 ? (
              <p className="text-gray-500">No recent errors</p>
            ) : (
              <div className="space-y-2">
                {data.recentErrors.map((log) => (
                  <div key={log.id} className="p-3 bg-red-50 border border-red-200 rounded">
                    <div className="flex justify-between items-start mb-1">
                      <span className="font-medium">{log.job.name}</span>
                      <span className="text-xs text-gray-500">
                        {new Date(log.startedAt).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-sm text-red-700">{log.error}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Jobs Tab */}
      {selectedTab === 'jobs' && (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border border-gray-300">
            <thead>
              <tr className="bg-gray-100">
                <th className="px-4 py-2 text-left">Name</th>
                <th className="px-4 py-2 text-left">Type</th>
                <th className="px-4 py-2 text-left">Status</th>
                <th className="px-4 py-2 text-center">Enabled</th>
                <th className="px-4 py-2 text-right">Runs</th>
                <th className="px-4 py-2 text-left">Last Run</th>
                <th className="px-4 py-2 text-left">Last Error</th>
              </tr>
            </thead>
            <tbody>
              {data.jobs.map((job) => (
                <tr key={job.id} className="border-t hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">{job.name}</td>
                  <td className="px-4 py-3 capitalize">{job.type.replace('_', ' ')}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${getStatusColor(job.status)}`}>
                      {job.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    {job.enabled ? '✓' : '✗'}
                  </td>
                  <td className="px-4 py-3 text-right">{job.runCount}</td>
                  <td className="px-4 py-3">
                    {job.lastRun ? new Date(job.lastRun).toLocaleString() : 'Never'}
                  </td>
                  <td className="px-4 py-3">
                    {job.lastError ? (
                      <span className="text-red-600 text-sm truncate block max-w-xs">
                        {job.lastError}
                      </span>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Logs Tab */}
      {selectedTab === 'logs' && (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border border-gray-300">
            <thead>
              <tr className="bg-gray-100">
                <th className="px-4 py-2 text-left">Time</th>
                <th className="px-4 py-2 text-left">Job</th>
                <th className="px-4 py-2 text-left">Status</th>
                <th className="px-4 py-2 text-left">Message</th>
                <th className="px-4 py-2 text-right">Duration</th>
              </tr>
            </thead>
            <tbody>
              {data.recentLogs.map((log) => (
                <tr key={log.id} className="border-t hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm">
                    {new Date(log.startedAt).toLocaleString()}
                  </td>
                  <td className="px-4 py-3">{log.job.name}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${
                      log.status === 'completed'
                        ? 'bg-green-100 text-green-800'
                        : log.status === 'failed'
                        ? 'bg-red-100 text-red-800'
                        : log.status === 'started'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {log.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm">{log.message}</td>
                  <td className="px-4 py-3 text-right">
                    {log.duration ? `${log.duration}s` : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Errors Tab */}
      {selectedTab === 'errors' && (
        <div className="space-y-4">
          {data.recentErrors.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <p className="text-lg mb-2">No recent errors</p>
              <p className="text-sm">System is running smoothly!</p>
            </div>
          ) : (
            data.recentErrors.map((log) => (
              <div key={log.id} className="bg-white border rounded-lg p-4">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="font-semibold">{log.job.name}</h3>
                    <p className="text-sm text-gray-500 capitalize">{log.job.type}</p>
                  </div>
                  <span className="text-sm text-gray-500">
                    {new Date(log.startedAt).toLocaleString()}
                  </span>
                </div>
                <div className="bg-red-50 border border-red-200 rounded p-3">
                  <p className="text-sm text-red-800 font-mono">{log.error}</p>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
