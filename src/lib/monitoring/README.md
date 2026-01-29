# Agent 4: DevOps Engineer - Monitoring System

## 🎯 Your Mission

Build a comprehensive monitoring and alerting system for TradingWeb.

## 📋 Deliverables

### 1. health.ts
Health check system:
- Check database connection
- Check job status
- Check API endpoints
- Check disk space
- Calculate uptime
- Return overall health status

**Interface** (MUST follow):
```typescript
interface HealthCheckResponse {
  status: 'healthy' | 'degraded' | 'down';
  timestamp: Date;
  uptime: number;
  services: ServiceStatus[];
  version: string;
}
```

### 2. metrics.ts
Metrics collection:
- Server metrics (CPU, memory, disk)
- Database metrics (connections, latency, slow queries)
- Job metrics (running, failed, execution time)
- API metrics (RPS, latency, error rate)
- Collect every 60 seconds

### 3. alerts.ts
Alerting system:
- Configure alert rules
- Send alerts (email, Slack, webhook)
- Alert severity levels (info, warning, critical)
- Alert deduplication
- Alert history tracking

### 4. API Route

#### GET /api/health
Public health check endpoint
- Returns overall system status
- Used by load balancers, uptime monitors
- No authentication required

### 5. Admin Dashboard

#### /admin/monitoring
Monitoring dashboard showing:
- Overall health status
- Service status cards
- Metrics charts (CPU, memory, API latency)
- Recent alerts
- Job execution timeline
- System uptime

## 🔒 Constraints

- ✅ Follow TypeScript interfaces in `src/types/agent-contracts.ts`
- ✅ No business logic (monitoring only)
- ✅ Minimal overhead (<1% CPU)
- ✅ Async operations only
- ✅ No blocking calls
- ✅ Graceful degradation

## 📁 Location

Create files in:
- `src/lib/monitoring/` - Core monitoring code
- `src/app/api/health/route.ts` - Health endpoint
- `src/app/admin/monitoring/page.tsx` - Dashboard

## 🔍 Health Checks

### Database Health
```typescript
{
  name: 'database',
  status: 'up' | 'down' | 'degraded',
  lastCheck: Date,
  responseTime: number, // ms
  error?: string
}
```

Check:
- Connection pool status
- Query latency (should be <100ms)
- Slow query count (<10 per minute)
- Database size

### Job System Health
```typescript
{
  name: 'jobs',
  status: 'up' | 'down' | 'degraded',
  lastCheck: Date,
  error?: string
}
```

Check:
- Scheduled jobs running
- Last execution time
- Failed job count
- Job queue length

### API Health
```typescript
{
  name: 'api',
  status: 'up' | 'down' | 'degraded',
  lastCheck: Date,
  responseTime: number,
  errorRate: number // 0-1
}
```

Check:
- API responding
- Average latency (<200ms)
- Error rate (<1%)
- Active connections

## 📊 Metrics to Collect

### Server Metrics
- CPU usage (0-1)
- Memory usage (0-1)
- Disk usage (0-1)
- System uptime (seconds)
- Load average (1, 5, 15 min)

### Database Metrics
- Active connections
- Query latency (p50, p95, p99)
- Slow queries (>1s)
- Database size (bytes)
- Row counts per table

### Job Metrics
- Total jobs
- Running jobs
- Failed jobs (last 24h)
- Average execution time
- Last run time

### API Metrics
- Requests per second
- Average latency
- Error rate
- Active connections
- Status codes (200, 400, 500)

## 🔔 Alert Rules

### Critical Alerts (Page immediately)
- System down (health = 'down')
- Database connection lost
- Error rate >10%
- API latency >5s
- Disk usage >90%

### Warning Alerts (Email within 5min)
- System degraded (health = 'degraded')
- Error rate >5%
- API latency >1s
- Memory usage >80%
- Job failures >5/hour

### Info Alerts (Log only)
- System started
- Job completed
- New user registered
- Model retrained

## 🎨 Dashboard Design

Create a monitoring dashboard at `/admin/monitoring` with:

**Header**:
- Overall status badge (green/yellow/red)
- System uptime
- Last refresh (auto-refresh every 30s)

**Status Cards** (4 cards in row):
- Database: [UP/DOWN] - 45ms latency
- Jobs: [RUNNING/IDLE] - 0 failed
- API: [HEALTHY/DEGRADED] - 120ms avg
- Server: [CPU 45%] [MEM 62%] [DISK 34%]

**Charts** (3 charts):
- CPU/Memory/Disk over time (line chart)
- API latency over time (line chart)
- Error rate over time (bar chart)

**Recent Alerts**:
- Table with last 20 alerts
- Columns: time, severity, source, message
- Color-coded by severity

**Job Timeline**:
- Gantt chart of job executions
- Last 24 hours

## ✅ Integration Process

1. Create monitoring library
2. Implement health checks
3. Create metrics collector
4. Build alert system
5. Create API endpoint
6. Build admin dashboard
7. Submit for Ralph Loop review
8. Fix issues identified
9. Integration tested

## 🧪 Testing

Test these scenarios:
- ✅ Health check returns correct status
- ✅ Metrics collect without errors
- ✅ Alerts fire when thresholds breached
- ✅ Dashboard renders correctly
- ✅ Auto-refresh works
- ✅ Graceful degradation when monitoring fails
- ✅ No performance impact (<1% overhead)

## 🔄 Integration Points

Add to existing services:
```typescript
// src/services/jobScheduler.ts
// Add monitoring calls

await jobScheduler.executeJob(jobId);
monitoring.logEvent({
  type: 'info',
  source: 'jobs',
  message: `Job ${jobId} completed`,
  timestamp: new Date()
});
```

## ⚠️ Important

- Ralph Loop will validate monitoring accuracy
- Must not impact application performance
- Must handle monitoring system failures
- Must be async and non-blocking
- Must have minimal dependencies
- Must work in production (not just dev)
- Must be testable

## 🔧 Configuration

Environment variables needed:
```env
# Monitoring
MONITORING_ENABLED=true
HEALTH_CHECK_INTERVAL=60000  # 60 seconds
METRICS_RETENTION_DAYS=30

# Alerts
ALERT_EMAIL_ENABLED=false
ALERT_EMAIL_TO=admin@tradingweb.com
ALERT_SLACK_ENABLED=false
ALERT_SLACK_WEBHOOK=https://hooks.slack.com/...
ALERT_WEBHOOK_ENABLED=false
```

---

**Agent**: DevOps Engineer
**Mode**: Controlled (Ralph Loop orchestrates)
**Timeline**: ~2 weeks parallel work
**Review**: Continuous validation by Ralph Loop
