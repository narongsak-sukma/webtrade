# 🚀 TradingWeb - Deployment Guide

**Version**: 1.0.0 Production Ready
**Date**: 2025-01-25
**Status**: All 5 agents complete, ready for production

---

## 📋 Quick Start Deployment

### Option 1: Docker (Recommended for Production)

```bash
# 1. Build and start all services
docker-compose up -d

# 2. Wait for services to be healthy
docker-compose logs -f

# 3. Initialize database
docker-compose exec -it tradingweb-app npx prisma db push
docker-compose exec -it tradingweb-app npx prisma db seed

# 4. Check health
curl http://localhost:3000/api/health

# 5. Access application
open http://localhost:3000
```

### Option 2: Manual Deployment (Development)

```bash
# 1. Install dependencies
npm install

# 2. Set up environment
cp .env.example .env
# Edit .env with your credentials

# 3. Set up PostgreSQL
# Using Homebrew:
brew install postgresql
brew services start postgresql

# Or Docker:
docker run --name postgres \
  -e POSTGRES_PASSWORD=yourpassword \
  -e POSTGRES_DB=tradingweb \
  -p 5432:5432 \
  -d postgres

# 4. Configure database
npm run db:push
npm run db:seed

# 5. Start application
npm run dev
```

---

## 🔧 Environment Configuration

### Required Environment Variables

```bash
# Database (REQUIRED)
DATABASE_URL="postgresql://user:password@localhost:5432/tradingweb?schema=public"

# JWT Secret (REQUIRED)
JWT_SECRET="your-super-secret-jwt-key-min-32-chars"

# App Configuration
NEXT_PUBLIC_APP_URL="http://localhost:3000"  # Change to production URL
NODE_ENV="production"

# Monitoring
MONITORING_ENABLED=true
HEALTH_CHECK_INTERVAL=60000

# Job Schedules (Bangkok UTC+7)
DATA_FEED_SCHEDULE="0 23 * * *"    # 6 AM Bangkok
SCREENING_SCHEDULE="30 23 * * *"  # 6:30 AM Bangkok
ML_SIGNALS_SCHEDULE="0 0 * * *"      # 7 AM Bangkok
```

---

## 📦 Production Deployment Checklist

### Pre-Deployment

- [ ] **Database Setup**
  - [ ] PostgreSQL server ready
  - [ ] Database user created
  - [ ] Environment variables configured
  - [ ] Connection tested

- [ ] **Dependencies Installed**
  - [ ] `npm install` completed
  - [ ] No missing dependencies

- [ ] **Environment Verified**
  [ ] `.env` file configured
  [ ] `DATABASE_URL` correct
  [ ] `JWT_SECRET` secure (32+ chars)
  [ ] `NEXT_PUBLIC_APP_URL` correct

- [ ] **Tests Passing**
  [ ] `npm run test:all` passes (with DB)
  - ] All critical tests passing
  [ ] No critical vulnerabilities

### Deployment Steps

1. **Build Application**
   ```bash
   npm run build
   ```

2. **Start Services**
   ```bash
   # Docker:
   docker-compose up -d

   # Or manual:
   npm run start
   ```

3. **Run Migrations**
   ```bash
   npm run db:push
   ```

4. **Seed Database**
   ```bash
   npm run db:seed
   ```

5. **Verify Deployment**
   ```bash
   # Check health
   curl http://your-domain.com/api/health

   # Check dashboard
   curl http://your-domain.com/dashboard
   ```

6. **Configure Jobs**
   - Access admin panel
   - Start background jobs
   - Verify schedules correct (6 AM Bangkok time)
   - Check job logs

---

## 🔐 Security Configuration

### Production Security Checklist

- [ ] **Database Security**
  - [ ] Strong database password
  - [ ] Limited user permissions
  - [ ] SSL/TLS for database connection

- [ ] **API Security**
  [ ] HTTPS enabled in production
  [ ] Rate limiting configured
  [ ] CORS configured correctly
  [ ] Security headers set

- [ ] **Authentication**
  - [ ] JWT_SECRET is strong (32+ characters)
  - [ ] Password hashing with bcrypt (cost 12)
  - [ ] Rate limiting on auth endpoints
  - [ ] Session timeout configured

- [ ] **Environment Variables**
  [ ] No sensitive data in .env
  [ ] .env in .gitignore
  [ ] Production .env.local created separately

- [ ] **Dependencies**
  - [ ] No known vulnerabilities
  - [ ] Dependencies up to date
  - [ ] `npm audit` clean

---

## 🚀 Production Server Requirements

### Minimum Requirements

- **CPU**: 2 cores
- **RAM**: 4 GB
- **Disk**: 20 GB SSD
- **OS**: Linux (Ubuntu 20.04+ or Debian 11+)
- **Database**: PostgreSQL 15+
- **Node.js**: 20+

### Recommended

- **CPU**: 4 cores
- **RAM**: 8 GB
- **Disk**: 50 GB SSD
- **OS**: Ubuntu 22.04 LTS

---

## 🐳 Docker Deployment (Complete)

### docker-compose.yml (Already Created)

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    container_name: tradingweb-db
    restart: unless-stopped
    environment:
      POSTGRES_USER: tradingweb
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
      POSTGRES_DB: tradingweb
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U tradingweb"]
      interval: 10s
      timeout: 5s
      retries: 5

  app:
    build:
      context: .
      dockerfile: Dockerfile
    container_name: tradingweb-app
    restart: unless-stopped
    ports:
      - "3000:3000"
    environment:
      DATABASE_URL: postgresql://tradingweb:${POSTGRES_PASSWORD}@postgres:5432/tradingweb?schema=public
      NODE_ENV: production
      NEXT_PUBLIC_APP_URL: ${APP_URL:-http://localhost:3000}
      JWT_SECRET: ${JWT_SECRET}
      MONITORING_ENABLED: true
    depends_on:
      postgres:
        condition: service_healthy
    volumes:
      - ./logs:/app/logs
```

### Environment File (.env for production)

```bash
# Database
DATABASE_URL="postgresql://tradingweb:STRONG_PASSWORD@postgres:5432/tradingweb?schema=public"

# JWT
JWT_SECRET="YOUR_PROD_JWT_SECRET_MIN_32_CHARS"

# App
NEXT_PUBLIC_APP_URL="https://your-domain.com"
NODE_ENV="production"

# Monitoring
MONITORING_ENABLED=true
HEALTH_CHECK_INTERVAL=60000
```

### Deploy Command

```bash
# Export environment variables
export POSTGRES_PASSWORD=your_secure_password
export JWT_SECRET=your_jwt_secret_min_32_characters
export APP_URL=https://your-domain.com

# Start
docker-compose up -d
```

---

## 📊 Post-Deployment Verification

### 1. Health Check

```bash
curl http://localhost:3000/api/health
```

**Expected Response**:
```json
{
  "status": "healthy",
  "timestamp": "2025-01-25T...",
  "uptime": 3600,
  "services": [
    { "name": "database", "status": "up", "responseTime": 45 },
    { "name": "jobs", "status": "up" },
    { "name": "api", "status": "up", "responseTime": 120 }
  ]
}
```

### 2. Check Dashboard

```bash
curl http://localhost:3000/dashboard
```

### 3. Test Authentication

```bash
# Test registration
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test123!@#","name":"Test User"}'
```

### 4. Verify Jobs

- Visit http://localhost:3000/admin
- Check job statuses
- Verify jobs are scheduled
- Check recent logs

### 5. Monitor System

- Visit http://localhost:3000/admin/monitoring
- Verify metrics displaying
- Check for alerts

---

## 🔧 Troubleshooting Deployment Issues

### Issue: Database Connection Failed

**Problem**: `PrismaClientInitializationError`

**Solutions**:
1. Check DATABASE_URL is correct
2. Verify PostgreSQL is running: `docker ps`
3. Check database logs: `docker-compose logs postgres`
4. Test connection manually:
   ```bash
   psql $DATABASE_URL
   ```

### Issue: Port Already in Use

**Problem**: Port 3000 occupied

**Solutions**:
1. Kill process on port 3000:
   ```bash
   lsof -ti:3000 | xargs kill -9
   ```
2. Or use different port in docker-compose.yml

### Issue: Jobs Not Running

**Problem**: Scheduled jobs not executing

**Solutions**:
1. Check job status in Admin Panel
2. Verify environment variable for schedules
3. Check job logs for errors
4. Manually trigger job to test

### Issue: Authentication Failing

**Problem**: Login/registration not working

**Solutions**:
1. Verify JWT_SECRET is set
2. Check environment variables loaded
3. Test auth endpoints directly
4. Check database User table exists

### Issue: High Memory Usage

**Problem**: Application using too much memory

**Solutions**:
1. Add node memory limit
2. Optimize Prisma queries
3. Add pagination to large datasets
4. Scale server resources

---

## 📈 Performance Optimization

### Database Optimization

```sql
-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_stock_symbol_date ON stock_prices(symbol, date DESC);
CREATE INDEX IF NOT EXISTS idx_signal_symbol_date ON signals(symbol, date DESC);
CREATE INDEX IF NOT EXISTS idx_screened_date ON screened_stocks(date DESC);
```

### Application Optimization

1. **Enable Compression**
2. **CDN for static assets**
3. **Cache API responses**
4. **Optimize images**
5. **Enable gzip**

---

## 🔄 CI/CD Integration

### GitHub Actions Example

```yaml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'

      - name: Install dependencies
        run: npm ci

      - name: Build application
        run: npm run build

      - name: Deploy to server
        run: |
          scp -r .build user@server:/var/www/tradingweb
          ssh user@server "cd /var/www/tradingweb && pm2 reload"

      - name: Run migrations
        run: |
          ssh user@server "cd /var/www/tradingweb && npx prisma migrate deploy"

      - name: Run tests
        run: |
          ssh user@server "cd /var/www/tradingweb && npm run test:all"
```

---

## 📦 Deployment Checklist

### Pre-Deployment
- [ ] Backup current database
- [ ] Review all changes
- [ ] Update environment variables
- [ ] Security review completed
- [ ] All tests passing

### Deployment
- [ ] Code pushed to repository
- [ ] CI/CD pipeline passed
- [ ] Database migrations applied
- [ ] Application deployed
- [ ] Health check passing
- [ ] Smoke tests passed

### Post-Deployment
- [ ] Monitoring active
- [ ] Alerts configured
- [ ] Backup automation working
- [ ] Performance baseline established
- [ ] Documentation updated
- [ ] Team notified

---

## 🆘 Support

### Getting Help

If you encounter issues:

1. **Check Logs**
   ```bash
   # Application logs
   docker-compose logs -f app

   # Database logs
   docker-compose logs -f postgres
   ```

2. **Check Documentation**
   - README.md - General help
   - docs/ - Technical documentation
   - docs/REMAINING_TASKS.md - Task list
   - docs/TESTING_CHECKLIST.md - Testing guide

3. **Known Issues**
   - Check docs/BUG_REPORTING.md for common issues
   - Review docs/TROUBLESHOOTING.md for solutions

4. **Get Support**
   - Create issue on GitHub
   - Check existing issues
   - Contact team

---

## ✅ Deployment Success Criteria

Your deployment is successful when:

- ✅ All health checks pass
- ✅ Dashboard loads correctly
- ✅ Authentication works
- ✅ Jobs are running on schedule
- ✅ Monitoring is active
- ✅ No critical errors in logs
- ✅ Tests passing
- ✅ Performance acceptable
- ✅ Security validated

---

**Production Ready**: ✅ YES
**Date**: 2025-01-25
**Version**: 1.0.0

---

## 📞 Emergency Contacts

| Role | Name | Contact |
|------|------|---------|
| Backend | [Your Name] | [Your Email] |
| DevOps | [Your Name] | [Your Email] |
| Database | [Your Name] | [Your Email] |

---

**Last Updated**: 2025-01-25
**Next Review**: After first production deployment
