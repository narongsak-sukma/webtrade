# TradingWeb Production Deployment Guide

This guide covers deploying TradingWeb to production environments.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Environment Setup](#environment-setup)
- [Database Setup](#database-setup)
- [Application Setup](#application-setup)
- [Running in Production](#running-in-production)
- [Docker Deployment](#docker-deployment)
- [Monitoring and Maintenance](#monitoring-and-maintenance)
- [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Required Software

- **Node.js**: v18.x or higher
- **PostgreSQL**: v14.x or higher
- **Python**: v3.9+ (for ML model)
- **npm**: v9.x or higher
- **git**: For version control

### System Requirements

- **CPU**: 2+ cores recommended
- **RAM**: 4GB minimum, 8GB recommended
- **Storage**: 20GB minimum (for database + models)
- **Network**: Stable internet connection for data feeds

---

## Environment Setup

### 1. Clone the Repository

```bash
git clone <your-repo-url>
cd tradingweb
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Set Up Environment Variables

```bash
cp .env.example .env
```

Edit `.env` with production values:

```bash
# Database - UPDATE THESE
DATABASE_URL="postgresql://tradingweb:YOUR_PASSWORD@localhost:5432/tradingweb?schema=public"

# JWT Secret - GENERATE STRONG RANDOM SECRET
JWT_SECRET="generate-with-openssl-rand-base64-32"

# App Configuration
NEXT_PUBLIC_APP_URL="https://your-domain.com"
NODE_ENV="production"

# Job Schedules (UTC cron expressions)
DATA_FEED_SCHEDULE="0 23 * * *"
SCREENING_SCHEDULE="30 23 * * *"
ML_SIGNALS_SCHEDULE="0 0 * * *"

# Monitoring
MONITORING_ENABLED=true
HEALTH_CHECK_INTERVAL=60000
METRICS_RETENTION_DAYS=30
```

### Generate Secure JWT Secret

```bash
openssl rand -base64 32
```

---

## Database Setup

### 1. Create PostgreSQL Database

```bash
# Create database user
sudo -u postgres createuser tradingweb --createdb --pwprompt

# Create database
sudo -u postgres createdb -O tradingweb tradingweb
```

### 2. Run Migrations

```bash
npm run db:generate
npm run db:push
```

### 3. Seed Database (Optional)

```bash
# Seed with initial data
npm run db:seed

# Import historical data for ML training
npm run db:seed-import
```

### 4. Verify Database Connection

```bash
npm run db:studio
```

---

## Application Setup

### 1. Build the Application

```bash
npm run build
```

### 2. Train ML Model (Optional but Recommended)

```bash
# Train the ML model with historical data
npm run train:model
```

The trained model will be saved to `public/models/stock-classifier.joblib`

### 3. Verify Build

```bash
# Check build output
ls -la .next/

# Verify static assets
ls -la public/models/
```

---

## Running in Production

### Using PM2 (Recommended)

Install PM2:

```bash
npm install -g pm2
```

Create ecosystem file `ecosystem.config.js`:

```javascript
module.exports = {
  apps: [{
    name: 'tradingweb',
    script: 'node_modules/.bin/next',
    args: 'start -p 3030',
    instances: 1,
    exec_mode: 'cluster',
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 3030
    }
  }]
};
```

Start the application:

```bash
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

### Using systemd (Alternative)

Create `/etc/systemd/system/tradingweb.service`:

```ini
[Unit]
Description=TradingWeb Application
After=network.target postgresql.service

[Service]
Type=simple
User=www-data
WorkingDirectory=/var/www/tradingweb
ExecStart=/usr/bin/npm start
Restart=always
RestartSec=10
Environment=NODE_ENV=production
Environment=PORT=3030

[Install]
WantedBy=multi-user.target
```

Enable and start:

```bash
sudo systemctl enable tradingweb
sudo systemctl start tradingweb
```

---

## Docker Deployment

### Using Docker Compose (Recommended)

1. Build and start services:

```bash
docker-compose up -d
```

2. View logs:

```bash
docker-compose logs -f
```

3. Stop services:

```bash
docker-compose down
```

### Manual Docker Build

1. Build the image:

```bash
docker build -t tradingweb:latest .
```

2. Run the container:

```bash
docker run -d \
  --name tradingweb \
  -p 3030:3030 \
  --env-file .env \
  --restart unless-stopped \
  tradingweb:latest
```

---

## Monitoring and Maintenance

### Health Checks

Check application health:

```bash
curl http://localhost:3030/api/health
```

Expected response:

```json
{
  "status": "healthy",
  "timestamp": "2026-01-26T...",
  "uptime": 12345,
  "services": [
    { "name": "database", "status": "up" },
    { "name": "ml-model", "status": "up" },
    { "name": "data-feed", "status": "up" }
  ]
}
```

### View Logs

**PM2 logs:**

```bash
pm2 logs tradingweb
```

**Docker logs:**

```bash
docker-compose logs -f app
```

**Systemd logs:**

```bash
sudo journalctl -u tradingweb -f
```

### Database Maintenance

**Backup database:**

```bash
pg_dump -U tradingweb tradingweb > backup_$(date +%Y%m%d).sql
```

**Restore database:**

```bash
psql -U tradingweb tradingweb < backup_20260126.sql
```

**Run migrations:**

```bash
npm run db:migrate
```

### Update Application

1. Pull latest changes:

```bash
git pull origin main
```

2. Install dependencies:

```bash
npm install
```

3. Run migrations:

```bash
npm run db:migrate
```

4. Rebuild:

```bash
npm run build
```

5. Restart service:

```bash
pm2 restart tradingweb
# or
sudo systemctl restart tradingweb
# or
docker-compose up -d --build
```

---

## Troubleshooting

### Application Won't Start

1. Check environment variables:
   ```bash
   cat .env
   ```

2. Verify database connection:
   ```bash
   psql -U tradingweb -d tradingweb -c "SELECT 1"
   ```

3. Check port availability:
   ```bash
   lsof -i :3030
   ```

4. Review logs for errors

### Database Connection Issues

1. Verify PostgreSQL is running:
   ```bash
   sudo systemctl status postgresql
   ```

2. Check database exists:
   ```bash
   psql -U postgres -c "\l" | grep tradingweb
   ```

3. Test connection:
   ```bash
   psql -U tradingweb -d tradingweb
   ```

### ML Model Errors

1. Verify model file exists:
   ```bash
   ls -la public/models/stock-classifier.joblib
   ```

2. Check Python dependencies:
   ```bash
   python3 -m pip list | grep -E "(scikit-learn|pandas|numpy)"
   ```

3. Retrain model if needed:
   ```bash
   npm run train:model
   ```

### High Memory Usage

1. Check Node.js memory:
   ```bash
   pm2 monit
   ```

2. Adjust max_memory_restart in `ecosystem.config.js`

3. Consider adding swap space:
   ```bash
   sudo fallocate -l 2G /swapfile
   sudo chmod 600 /swapfile
   sudo mkswap /swapfile
   sudo swapon /swapfile
   ```

### Job Scheduler Issues

1. Check job status via API:
   ```bash
   curl http://localhost:3030/api/jobs
   ```

2. Manually trigger a job:
   ```bash
   curl -X POST http://localhost:3030/api/jobs/data-feed/trigger
   ```

3. Review job logs:
   ```bash
   curl http://localhost:3030/api/jobs/logs
   ```

---

## Security Checklist

- [ ] Change default JWT_SECRET
- [ ] Set strong database password
- [ ] Enable HTTPS (use reverse proxy)
- [ ] Configure firewall rules
- [ ] Set up database backups
- [ ] Enable monitoring alerts
- [ ] Review environment variables
- [ ] Update dependencies regularly
- [ ] Restrict API rate limits
- [ ] Enable CORS properly

---

## Performance Optimization

1. **Enable Next.js caching**: Configure CDN for static assets
2. **Database indexing**: Verify indexes on frequently queried columns
3. **Connection pooling**: Configure Prisma connection pool
4. **Worker threads**: For ML model predictions
5. **Rate limiting**: Implement API rate limits
6. **CDN**: Use CDN for static assets

---

## Support

For issues or questions:

- Check logs: `pm2 logs tradingweb`
- Review this guide
- Check GitHub issues
- Contact development team

---

**Last Updated**: 2026-01-26
**Version**: 1.0.0
