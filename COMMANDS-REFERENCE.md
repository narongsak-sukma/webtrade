# Trading System - Commands Reference

**Quick reference for all available commands and scripts**

---

## 📥 Data Loading Commands

### Load Initial Historical Data
```bash
# Load all historical data (for all stocks)
npx tsx scripts/import-historical-data.ts fetch --initial

# Load for specific stock
npx tsx scripts/import-historical-data.ts fetch --symbol AAPL

# Generate synthetic test data
npx tsx scripts/import-historical-data.ts generate
```

### Daily Updates
```bash
# Incremental update (today's data)
npx tsx scripts/import-historical-data.ts fetch
```

---

## 🔍 Stock Screening Commands

### Run Minervini Screening
```bash
# Screen all stocks in database
npx tsx scripts/run-screening.ts

# Screen specific stock
npx tsx scripts/run-screening.ts --symbol AAPL
```

**Output**: Stocks that pass 6+ criteria stored in `screened_stocks` table

---

## 🤖 ML Signal Generation

### Generate Signals for Qualified Stocks
```bash
# Generate ML signals for stocks with passed_criteria >= 6
npx tsx scripts/generate-ml-signals.ts

# Force regenerate for all stocks (not recommended)
npx tsx scripts/generate-ml-signals.ts --force-all
```

**Output**: Signals stored in `signals` table
- Only processes stocks that passed screening
- Generates BUY (1), HOLD (0), SELL (-1)

---

## 🎯 Complete Workflow

### Run Everything in Sequence
```bash
# Master script - runs data load, screening, ML signals
npx tsx scripts/run-complete-workflow.ts
```

**Steps**:
1. Load data from Yahoo Finance (with 2s delays)
2. Run Minervini screening
3. Generate ML signals (qualified stocks only)

---

## 🛡️ Risk Management

### Demo Risk Management Features
```bash
# See position sizing, portfolio risk, trading limits
npx tsx scripts/demo-risk-management.ts
```

**Scenarios**:
1. Position sizing (Fixed Fractional)
2. Position sizing (Kelly Criterion)
3. Position sizing (Volatility-Adjusted)
4. Portfolio risk check
5. Trading limits check
6. Correlation risk check

---

## 📊 Backtesting

### Run Backtest Demo
```bash
# See backtesting engine in action
npx tsx scripts/demo-backtesting.ts
```

**Output**:
- Total trades, win rate
- Net profit (with costs)
- Sharpe ratio, sortino ratio
- Max drawdown
- Equity curve

### API Backtesting
```bash
# Via API endpoint
curl -X POST http://localhost:3030/api/backtest/run \
  -H "Content-Type: application/json" \
  -d '{
    "symbol": "AAPL",
    "startDate": "2024-01-01",
    "endDate": "2024-12-31",
    "initialCapital": 100000,
    "commission": 5,
    "slippage": 0.001,
    "positionSizePercent": 0.95,
    "stopLossPercent": 0.05,
    "takeProfitPercent": 0.15
  }'
```

---

## 🚀 Application Commands

### Development Mode
```bash
# Start dev server (hot reload)
npm run dev
```

### Production Build
```bash
# Build for production
npm run build

# Start production server
npm start

# Custom port
PORT=3030 npm start
```

### Database Operations
```bash
# Push schema changes
npm run db:push

# Reset database (CAUTION: deletes all data)
npm run db:reset

# Open Prisma Studio (database GUI)
npx prisma studio
```

---

## 🧪 Testing Commands

### Run Route Tests (Playwright)
```bash
# Test all critical routes
npx tsx tests/routes.test.ts

# Test with specific user
npx tsx tests/routes.test.ts --email admin@example.com
```

### API Testing
```bash
# Test login endpoint
curl -X POST http://localhost:3030/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"admin123"}'

# Test screened stocks endpoint
curl http://localhost:3030/api/stocks?screened=true

# Test ML signal endpoint
curl http://localhost:3030/api/signals/AAPL
```

---

## 📱 Dashboard Access

### URLs
- **Dashboard**: http://localhost:3030/dashboard
- **Login**: http://localhost:3030/login
- **API Base**: http://localhost:3030/api

### Default Admin Credentials
- **Email**: admin@example.com
- **Password**: admin123

---

## 🔧 Troubleshooting Commands

### Check Database State
```bash
# Open Prisma Studio
npx prisma studio

# Check stock count
npx tsx -e "import { prisma } from './src/lib/prisma'; prisma.stock.count().then(console.log);"

# Check screened stocks
npx tsx -e "import { prisma } from './src/lib/prisma'; prisma.screenedStock.count().then(console.log);"
```

### Check ML Model
```bash
# Verify model exists
ls -lh public/models/stock-classifier.joblib

# Check model metadata
python3 -c "import joblib; m = joblib.load('public/models/stock-classifier.joblib'); print(m.get_params())"
```

### Clear Cache and Rebuild
```bash
# Clear Next.js cache
rm -rf .next

# Rebuild
npm run build

# Restart
npm start
```

---

## 📊 Quick Status Check

### System Status Script
```bash
# Check overall system status
npx tsx -e "
import { prisma } from './src/lib/prisma';

(async () => {
  const stocks = await prisma.stock.count();
  const prices = await prisma.stockPrice.count();
  const screened = await prisma.screenedStock.count();
  const signals = await prisma.signal.count();

  console.log('📊 System Status:');
  console.log(\`  Stocks: \${stocks}\`);
  console.log(\`  Price Records: \${prices}\`);
  console.log(\`  Screened Stocks: \${screened}\`);
  console.log(\`  ML Signals: \${signals}\`);
})();
"
```

---

## 🎯 Common Workflows

### Workflow 1: Fresh Start
```bash
# 1. Reset database
npm run db:reset

# 2. Load historical data
npx tsx scripts/import-historical-data.ts fetch --initial

# 3. Run screening
npx tsx scripts/run-screening.ts

# 4. Generate signals
npx tsx scripts/generate-ml-signals.ts

# 5. Start app
npm run build && npm start
```

### Workflow 2: Daily Update
```bash
# 1. Load today's data
npx tsx scripts/import-historical-data.ts fetch

# 2. Re-run screening
npx tsx scripts/run-screening.ts

# 3. Generate new signals
npx tsx scripts/generate-ml-signals.ts
```

### Workflow 3: Backtest Strategy
```bash
# 1. Ensure you have historical data
npx tsx scripts/import-historical-data.ts fetch --initial

# 2. Run backtest demo
npx tsx scripts/demo-backtesting.ts

# 3. Or use API for custom backtest
curl -X POST http://localhost:3030/api/backtest/run ...
```

---

## 📚 Documentation

- **SYSTEM-SUMMARY.md** - Complete system overview
- **BACKTESTING-GUIDE.md** - Backtesting documentation
- **RISK-MANAGEMENT-GUIDE.md** - Risk management docs
- **SCREENING-GUIDE.md** - Stock screening guide
- **ML-SIGNALS-GUIDE.md** - ML signal generation

---

## 🚨 Emergency Commands

### Stop Application
```bash
# Find and kill process
lsof -ti:3030 | xargs kill -9

# Or use pkill
pkill -f "node.*next"
```

### Database Backup
```bash
# Backup database
pg_dump tradingdb > backup_$(date +%Y%m%d).sql

# Restore database
psql tradingdb < backup_20260126.sql
```

### Clear All Data
```bash
# ⚠️  DELETES EVERYTHING
npm run db:reset
```

---

**Version**: 1.0.0
**Last Updated**: 2026-01-26
