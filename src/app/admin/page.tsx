import { MainLayout } from '@/components/layout/MainLayout';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Play, Square, Clock, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';

async function getJobsData() {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const res = await fetch(`${baseUrl}/api/jobs`, {
    cache: 'no-store',
  });

  if (!res.ok) {
    throw new Error('Failed to fetch jobs');
  }

  return res.json();
}

async function getJobLogs() {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const res = await fetch(`${baseUrl}/api/jobs/logs?limit=20`, {
    cache: 'no-store',
  });

  if (!res.ok) {
    throw new Error('Failed to fetch job logs');
  }

  return res.json();
}

export default async function AdminPage() {
  const jobs = await getJobsData();
  const logs = await getJobLogs();

  const activeJobs = jobs.filter((j: any) => j.status === 'running').length;
  const failedJobs = logs.filter((l: any) => l.status === 'failed').length;
  const completedJobs = logs.filter((l: any) => l.status === 'completed').length;

  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-neutral-900 dark:text-neutral-100">
            Admin Dashboard
          </h1>
          <p className="text-neutral-600 dark:text-neutral-400 mt-1">
            Manage and monitor background jobs
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatsCard
            title="Total Jobs"
            value={jobs.length}
            icon={<Clock className="h-5 w-5" />}
          />
          <StatsCard
            title="Active Jobs"
            value={activeJobs}
            trend="up"
            icon={<Play className="h-5 w-5" />}
          />
          <StatsCard
            title="Completed (24h)"
            value={completedJobs}
            trend="up"
            trendValue="+18%"
            icon={<CheckCircle className="h-5 w-5" />}
          />
          <StatsCard
            title="Failed (24h)"
            value={failedJobs}
            trend={failedJobs > 0 ? 'down' : 'neutral'}
            icon={<XCircle className="h-5 w-5" />}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {jobs.map((job: any) => (
            <Card key={job.id} variant="bordered" className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                    {job.name}
                  </h3>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400">
                    {job.type}
                  </p>
                </div>
                <Badge
                  variant={job.status === 'running' ? 'info' : job.status === 'idle' ? 'success' : 'error'}
                >
                  {job.status.toUpperCase()}
                </Badge>
              </div>

              <div className="space-y-2 mb-4 text-sm">
                <div className="flex justify-between text-neutral-600 dark:text-neutral-400">
                  <span>Schedule:</span>
                  <span className="font-mono text-xs">{job.schedule || 'Manual'}</span>
                </div>
                {job.lastRun && (
                  <div className="flex justify-between text-neutral-600 dark:text-neutral-400">
                    <span>Last Run:</span>
                    <span>{new Date(job.lastRun).toLocaleString()}</span>
                  </div>
                )}
                {job.runCount > 0 && (
                  <div className="flex justify-between text-neutral-600 dark:text-neutral-400">
                    <span>Run Count:</span>
                    <span>{job.runCount}</span>
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                <form method="POST" action="/api/jobs" className="flex-1">
                  <input type="hidden" name="action" value="start" />
                  <input type="hidden" name="jobId" value={job.id} />
                  <Button
                    type="submit"
                    variant="primary"
                    size="sm"
                    disabled={job.status === 'running'}
                    loading={job.status === 'running'}
                    className="w-full"
                  >
                    Start
                  </Button>
                </form>

                <form method="POST" action="/api/jobs" className="flex-1">
                  <input type="hidden" name="action" value="stop" />
                  <input type="hidden" name="jobId" value={job.id} />
                  <Button
                    type="submit"
                    variant="danger"
                    size="sm"
                    disabled={job.status === 'stopped' || job.status === 'idle'}
                    className="w-full"
                  >
                    Stop
                  </Button>
                </form>
              </div>

              {job.lastError && (
                <div className="mt-4 p-3 bg-error-50 dark:bg-error-950 border border-error-200 dark:border-error-900 rounded">
                  <p className="text-xs text-error-800 dark:text-error-400 font-medium mb-1">
                    Last Error:
                  </p>
                  <p className="text-xs text-error-600 dark:text-error-500">{job.lastError}</p>
                </div>
              )}
            </Card>
          ))}
        </div>

        <Card variant="bordered" className="p-6">
          <h2 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100 mb-4">
            Recent Job Logs
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-neutral-200 dark:border-neutral-800">
                  <th className="text-left py-3 px-4 text-sm font-medium text-neutral-700 dark:text-neutral-300">
                    Job ID
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-neutral-700 dark:text-neutral-300">
                    Status
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-neutral-700 dark:text-neutral-300">
                    Message
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-neutral-700 dark:text-neutral-300">
                    Started
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-neutral-700 dark:text-neutral-300">
                    Duration
                  </th>
                </tr>
              </thead>
              <tbody>
                {logs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-8 text-neutral-500">
                      No logs available yet
                    </td>
                  </tr>
                ) : (
                  logs.map((log: any) => (
                    <tr key={log.id} className="border-b border-neutral-100 dark:border-neutral-900 hover:bg-neutral-50 dark:hover:bg-neutral-900">
                      <td className="py-3 px-4 text-sm font-mono text-neutral-700 dark:text-neutral-300">
                        {log.jobId.slice(0, 8)}...
                      </td>
                      <td className="py-3 px-4">
                        <Badge
                          variant={log.status === 'completed' ? 'success' : log.status === 'failed' ? 'error' : 'info'}
                          size="sm"
                        >
                          {log.status}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-sm text-neutral-700 dark:text-neutral-300">
                        {log.message || '-'}
                      </td>
                      <td className="py-3 px-4 text-sm text-neutral-700 dark:text-neutral-300">
                        {new Date(log.startedAt).toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-sm text-neutral-700 dark:text-neutral-300">
                        {log.duration ? `${log.duration}s` : '-'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </MainLayout>
  );
}
