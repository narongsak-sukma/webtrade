# TradingWeb Complete Workflow Guide

**Date**: 2026-01-26
**Status**: ✅ All systems operational

---

## 📋 Complete Trading Pipeline (3 Steps)

### Step 1: Load Data from Yahoo Finance
```bash
# Fetch stock data ONE BY ONE with 2-second delay
npx tsx scripts/import-historical-data.ts generate
```
**What it does:**
- Downloads historical price data from Yahoo Finance
- **Rate limiting**: 2 seconds between each ticker (prevents blocking)
- **One ticker at a time** (sequential, not parallel)
- Stores in database: `StockPrice` table

**Example output:**
```
📊 Starting data feed for 25 symbols
⏱️  Will process ONE BY ONE with 2000ms delay between each

[1/25] Processing AAPL...
⏳ Rate limiting: waiting 2000ms before next Yahoo Finance request...
✅ AAPL: Saved 753 records
⏳  Waiting 2000ms before next ticker...

[2/25] Processing MSFT...
...
```

---

### Step 2: Run Minervini Screening
```bash
npx tsx scripts/run-screening.ts
```
**What it does:**
- Screens all stocks using Minervini Trend Template (8-point checklist)
- Checks: Price above MA150, MA150 above MA200, MA200 trending up, etc.
- Stores results in: `ScreenedStock` table
- Only stocks scoring **6+ out of 8** pass

**Example output:**
```
🔍 Starting stock screening...
Found 25 stocks to screen

Screening AAPL...
  ✓ PASSED - 7/8 criteria
  Signal: BUY 🟢
  Price: $744.86 | RS: 12.5%

Screening MSFT...
  ✓ PASSED - 6/8 criteria
  Signal: BUY 🟢
  Price: $500.39 | RS: 8.2%

Screening AMZN...
  ✗ FAILED - 2/8 criteria
  Signal: SELL 🔴
  Price: $9.99 | RS: -5.1%

==================================================
✅ Screening complete!
Total stocks screened: 25
Passed criteria (>=6): 8
Failed criteria (<6): 17
==================================================
```

---

### Step 3: Generate ML Signals (ONLY for PASSED stocks)
```bash
npx tsx scripts/generate-ml-signals.ts
```
**What it does:**
- **Only processes stocks that passed Step 2** (score >= 6)
- Uses trained ML model (RandomForest classifier)
- Generates TODAY'S trading recommendation: BUY/SELL/HOLD
- Stores in: `Signal` table

**Example output:**
```
🤖 ML Signal Generation - Starting...
✅ ML Service initialized

📊 Step 1: Fetching stocks that passed Minervini criteria...
✅ Found 8 stocks that passed screening

📈 Stocks that passed Minervini criteria:
  1. AAPL (Apple Inc.) - Score: 7/8
  2. MSFT (Microsoft) - Score: 6/8
  3. GOOGL (Google) - Score: 7/8
  ...

🤖 Step 2: Generating ML signals for passed stocks...

Processing AAPL...
  ✅ Signal: BUY 🟢
     Confidence: 87.3%
     RSI: 92.92 | MACD: 31.18

Processing MSFT...
  ✅ Signal: HOLD ⏸️
     Confidence: 75.2%
     RSI: 48.26 | MACD: 0.79

Processing GOOGL...
  ✅ Signal: SELL 🔴
     Confidence: 100.0%
     RSI: 50.17 | MACD: 1.84

============================================================
✅ ML Signal Generation Complete!
============================================================
BUY Signals 🟢: 2
SELL Signals 🔴: 3
HOLD Signals ⏸️ : 3
============================================================
```

---

## 🚀 Run All Steps at Once (Master Script)

```bash
npx tsx scripts/run-complete-workflow.ts
```

**This runs everything automatically:**
1. ✅ Fetch data from Yahoo (with 2s delays)
2. ✅ Run Minervini screening
3. ✅ Generate ML signals for passed stocks
4. ✅ Show today's recommendations

---

## 📊 View Results in Dashboard

1. **Login**: http://localhost:3030/login
   - Email: `admin@tradingweb.com`
   - Password: `admin123`

2. **Dashboard**: http://localhost:3030/dashboard
   - Shows stocks that passed Minervini criteria
   - Displays BUY/SELL/HOLD signals
   - Shows price, change %, and stats

---

## 🗂️ Database Tables

After running the workflow:

### `Stock` table
```sql
symbol | name | exchange | sector
AAPL   | Apple Inc. | NASDAQ | Technology
MSFT   | Microsoft | NASDAQ | Technology
```

### `StockPrice` table
```sql
symbol | date | open | high | low | close | volume
AAPL   | 2026-01-26 | 740.00 | 745.00 | 738.00 | 744.86 | 50000000
```

### `ScreenedStock` table (Minervini results)
```sql
symbol | date | price | passed_criteria | ma50 | ma150 | ma200
AAPL   | 2026-01-26 | 744.86 | 7 | 642.44 | 502.08 | 447.11
```

### `Signal` table (ML predictions)
```sql
symbol | date | signal | confidence | rsi | macd
AAPL   | 2026-01-26 | 1 | 0.8734 | 92.92 | 31.18
```

---

## ⚙️ Configuration

### Change which stocks to process:
Edit `scripts/run-complete-workflow.ts`:
```typescript
const SYMBOLS = [
  'AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA', 'META', 'NVDA',
  // Add more S&P 500 stocks here...
];
```

### Change rate limiting delay:
Edit `src/services/yahooFinance.ts`:
```typescript
private readonly RATE_LIMIT_DELAY = 2000; // 2 seconds (change to 3000 for 3s, etc.)
```

### Change Minervini passing score:
Edit `scripts/run-screening.ts`:
```typescript
const signal = result.passedCriteria >= 6 ? 1 : result.passedCriteria <= 2 ? -1 : 0;
// Change >= 6 to >= 7 for stricter criteria
```

---

## 🎯 Key Points

1. **Yahoo Finance rate limiting**: 2 seconds between each ticker (configurable)
2. **Sequential processing**: ONE ticker at a time, not parallel/batch
3. **Screening filters**: Only stocks scoring 6+/8 go to ML
4. **ML generates today's signal**: BUY/SELL/HOLD based on technical indicators
5. **Dashboard displays**: Results already in DB, no fetching on page load

---

## 📈 Expected Performance

**Processing 25 stocks:**
- Step 1 (Yahoo fetch): ~50 seconds (25 × 2s delay)
- Step 2 (Screening): ~5 seconds
- Step 3 (ML signals): ~10 seconds
- **Total**: ~65 seconds for complete workflow

---

## 🛠️ Troubleshooting

### Issue: "No stocks passed screening"
**Solution**: Run Step 1 first to load data into database

### Issue: "Yahoo Finance blocking"
**Solution**: Increase `RATE_LIMIT_DELAY` to 3000ms (3 seconds)

### Issue: "ML model not loaded"
**Solution**: Ensure `public/models/stock-classifier.joblib` exists

### Issue: "Dashboard shows no data"
**Solution**: Run all 3 steps, then rebuild app: `npm run build && npm start`

---

## ✅ Workflow Complete!

Your trading system is now:
- Loading data safely from Yahoo Finance
- Screening stocks with Minervini criteria
- Generating ML-powered trading signals
- Displaying results in the dashboard

Ready for production! 🚀
