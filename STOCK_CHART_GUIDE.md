# Stock Price Chart - Quick Start Guide

## 🎯 How to Access the Stock Charts

### Method 1: Test Button (Easiest)
1. Go to http://localhost:3030/screening
2. Look for the **"Test Stock Chart"** button in the header (next to "Back to Pipeline")
3. Click it to open a sample chart for ICE (Intercontinental Exchange)

### Method 2: Click Company Name in Table
1. Go to http://localhost:3030/screening
2. Scroll down to the results table
3. Look for company names with a 📈 chart icon
4. Click on any company name
5. The chart modal will open

### Method 3: Click Company Name in Signals
1. Go to http://localhost:3030/signals
2. Find a recommendation card
3. Click on the company name
4. View the price chart

## 📊 What You'll See

When the chart opens, you'll see:
- **Full-screen modal** with backdrop blur
- **Stock name and symbol** with market badge (🇺🇸 US / 🇹🇭 TH)
- **Current price** with change indicator (green/red arrow)
- **Time range selector**: 1M, 3M, 6M, 1Y, ALL
- **Price chart**: Line chart with moving averages (MA20, MA50, MA200)
- **Volume chart**: Bar chart showing trading volume
- **Statistics**: High, Low, Avg Volume, Data Points
- **Close button**: Click ✕ to close

## 🎨 Features

- **Interactive tooltips**: Hover over the chart to see exact values
- **Moving averages**: Blue (MA20), Green (MA50), Purple (MA200) dashed lines
- **Current price line**: Amber horizontal reference line
- **Currency-aware**: Shows $ for USD, ฿ for THB
- **Change indicators**: Shows $ and % change for selected period
- **Responsive**: Works on desktop and mobile

## 🐛 Troubleshooting

### If chart doesn't open:
1. **Check browser console** (F12) for errors
2. **Hard refresh** the page (Ctrl+Shift+R or Cmd+Shift+R)
3. **Make sure dev server is running**: `npm run dev`
4. **Try the test button first** to verify the component works

### If data doesn't load:
1. Check that price data exists in database
2. Verify API is working: `curl http://localhost:3030/api/stock/ICE/prices?startDate=2025-10-01T00:00:00.000Z&endDate=2026-01-29T23:59:59.999Z`
3. Look for console errors in browser dev tools

### If clicking doesn't work:
1. Make sure JavaScript is enabled
2. Try the "Test Stock Chart" button first
3. Check if there are any React errors in console

## 💡 Tips

- **Use 3M or 6M** time range for best balance of detail
- **Look for crossovers** where price crosses moving averages
- **Check volume spikes** for significant price movements
- **Compare MA20 vs MA50** for short-term trends
- **MA200** shows long-term trend direction

## 📈 Example Use Cases

1. **Quick technical analysis**: Click stock name, view chart, assess trend
2. **Compare time periods**: Switch between 1M, 3M, 6M to see different perspectives
3. **Check moving average crossovers**: Bullish when price crosses above MA
4. **Identify support/resistance**: Price tends to bounce at MAs
5. **Volume confirmation**: High volume on moves = stronger signal

## 🔗 Links

- Screening page: http://localhost:3030/screening
- Signals page: http://localhost:3030/signals
- Test chart page: http://localhost:3030/test-chart

## 📝 Notes

- Charts fetch historical price data from database
- Moving averages are calculated server-side
- Maximum 500 data points per request
- Data updates when you change time range
- Charts are responsive and work on mobile
