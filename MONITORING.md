# TradingWeb Production Monitoring Checklist

This checklist helps monitor and maintain the TradingWeb application in production.

## Daily Checks

### Application Health
- [ ] Check health endpoint: `curl https://your-domain.com/api/health`
- [ ] Verify response status is "healthy"
- [ ] Check uptime is reasonable
- [ ] Verify all services (database, ML model, data feed) are "up"

### Job Status
- [ ] Check jobs status: `curl https://your-domain.com/api/jobs`
- [ ] Verify jobs are scheduled correctly
- [ ] Check last run times
- [ ] Review job logs for errors

### Database
- [ ] Check database connection count
- [ ] Verify database size is reasonable
- [ ] Check for slow queries
- [ ] Review error logs

## Weekly Checks

### Data Quality
- [ ] Verify new stock data is being imported
- [ ] Check screened stocks count
- [ ] Review ML signal generation
- [ ] Validate data freshness

### Performance
- [ ] Check API response times
- [ ] Review memory usage
- [ ] Monitor CPU usage
- [ ] Check disk space

### Security
- [ ] Review authentication logs
- [ ] Check for failed login attempts
- [ ] Verify API rate limits
- [ ] Review access logs

## Monthly Checks

### Backups
- [ ] Verify database backups are running
- [ ] Test backup restoration
- [ ] Check backup retention policy
- [ ] Archive old backups

### Updates
- [ ] Check for Node.js updates
- [ ] Review npm security advisories: `npm audit`
- [ ] Update dependencies if needed
- [ ] Review application logs

### Capacity Planning
- [ ] Review storage usage trends
- [ ] Check database growth rate
- [ ] Monitor user growth
- [ ] Plan for scaling if needed

## Alert Response

### Critical Alerts (Immediate Action Required)
- Application down
- Database connection failed
- ML model not responding
- Disk space > 90%
- Memory > 90%

### Warning Alerts (Investigate Within 24 Hours)
- High error rate (> 5%)
- Slow API responses (> 2s)
- Job failures
- Data feed issues

### Info Alerts (Review During Regular Checks)
- Successful job completions
- System metrics updates
- Backup completions

## Monitoring Commands

### Application Health
```bash
# Health check
curl https://your-domain.com/api/health

# PM2 status
pm2 status

# PM2 logs
pm2 logs tradingweb --lines 100

# PM2 monit
pm2 monit
```

### Database
```bash
# Database size
psql -U tradingweb -d tradingweb -c "SELECT pg_size_pretty(pg_database_size('tradingweb'));"

# Connection count
psql -U tradingweb -d tradingweb -c "SELECT count(*) FROM pg_stat_activity;"

# Slow queries
psql -U tradingweb -d tradingweb -c "SELECT query, mean_exec_time FROM pg_stat_statements ORDER BY mean_exec_time DESC LIMIT 10;"
```

### System Resources
```bash
# CPU and memory
top
htop

# Disk usage
df -h

# Process monitoring
ps aux | grep node
```

### Logs
```bash
# Application logs
tail -f /var/log/tradingweb/app.log

# Error logs
tail -f /var/log/tradingweb/error.log

# System logs
journalctl -u tradingweb -f
```

## Troubleshooting Guide

### Application Not Responding

1. Check if process is running:
   ```bash
   ps aux | grep next
   pm2 status
   ```

2. Check port availability:
   ```bash
   lsof -i :3030
   ```

3. Review logs for errors:
   ```bash
   pm2 logs tradingweb --lines 100
   ```

4. Restart if needed:
   ```bash
   pm2 restart tradingweb
   ```

### High Memory Usage

1. Check memory usage:
   ```bash
   pm2 monit
   ```

2. Review memory trends:
   ```bash
   pm2 logs tradingweb --lines 1000 | grep memory
   ```

3. Restart if memory leak suspected:
   ```bash
   pm2 restart tradingweb
   ```

4. Consider adjusting max_memory_restart in ecosystem.config.js

### Database Issues

1. Check connection:
   ```bash
   psql -U tradingweb -d tradingweb -c "SELECT 1"
   ```

2. Check PostgreSQL status:
   ```bash
   sudo systemctl status postgresql
   ```

3. Review connection count:
   ```bash
   psql -U tradingweb -d tradingweb -c "SELECT count(*) FROM pg_stat_activity;"
   ```

4. Check for long-running queries:
   ```bash
   psql -U tradingweb -d tradingweb -c "SELECT pid, query, state FROM pg_stat_activity WHERE state != 'idle';"
   ```

### Job Failures

1. Check job status:
   ```bash
   curl https://your-domain.com/api/jobs
   ```

2. Review job logs:
   ```bash
   curl https://your-domain.com/api/jobs/logs
   ```

3. Manually trigger job:
   ```bash
   curl -X POST https://your-domain.com/api/jobs/data-feed/trigger
   ```

4. Check job scheduler logs in application logs

## Maintenance Tasks

### Rotate Logs
```bash
# PM2 log rotation
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 100M
pm2 set pm2-logrotate:retain 7
```

### Clean Old Metrics
```bash
# Delete metrics older than 30 days
psql -U tradingweb -d tradingweb -c "DELETE FROM metric_snapshots WHERE timestamp < NOW() - INTERVAL '30 days';"
```

### Vacuum Database
```bash
# Run PostgreSQL vacuum
psql -U tradingweb -d tradingweb -c "VACUUM ANALYZE;"
```

### Update SSL Certificates (if using HTTPS)
```bash
# If using Let's Encrypt
sudo certbot renew
sudo systemctl reload nginx
```

## Reporting

### Daily Report Summary
- Application uptime
- Number of jobs run
- Error count
- Data feed status

### Weekly Report Summary
- Average response times
- Database growth
- User activity
- Security incidents

### Monthly Report Summary
- Overall availability
- Performance trends
- Capacity changes
- Recommendations

---

**Last Updated**: 2026-01-26
**Version**: 1.0.0
