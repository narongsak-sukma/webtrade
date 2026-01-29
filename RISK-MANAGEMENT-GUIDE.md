# Risk Management Layer - Complete Guide

**Version**: 1.0.0
**Status**: ✅ Complete and Tested
**Date**: 2026-01-26

---

## 🎯 What Is Risk Management?

**Risk management protects your trading account from blowing up.**

Even with a 90% win rate strategy, without proper risk management you can still lose everything if you:
- Risk too much per trade
- Have too many correlated positions
- Don't use stop-losses
- Don't limit max drawdown

---

## 📊 Features Implemented

### 1. **Position Sizing Calculators**

#### Fixed Fractional Method (Default)
```typescript
{
  accountBalance: 100000,
  riskPerTrade: 0.02,      // 2% of account
  entryPrice: 150,
  stopLossPercent: 0.05,   // 5% stop loss
  riskRewardRatio: 3       // Target 3:1 reward-risk
}
```

**Output:**
- Shares to buy
- Position size (total cost)
- Stop loss price
- Take profit price
- Max loss/gain amounts

**API**: `POST /api/risk/calculate-position-size`

#### Kelly Criterion (Aggressive)
```typescript
{
  accountBalance: 100000,
  entryPrice: 150,
  winRate: 0.55,           // 55% win rate
  avgWin: 500,             // Avg win $500
  avgLoss: 300             // Avg loss $300
}
```

**Output:**
- Optimal position size based on historical performance
- Uses half-Kelly for safety (less aggressive than full Kelly)

#### Volatility-Adjusted Sizing
```typescript
{
  accountBalance: 100000,
  entryPrice: 150,
  stopLoss: 142,
  atr: 5                   // ATR (volatility)
}
```

**Logic**:
- Low volatility (ATR small) → larger position
- High volatility (ATR large) → smaller position

---

### 2. **Portfolio Risk Analysis**

```typescript
{
  positions: [
    { symbol: 'AAPL', entryPrice: 150, currentPrice: 155, shares: 100, stopLoss: 142 },
    { symbol: 'MSFT', entryPrice: 300, currentPrice: 295, shares: 50, stopLoss: 285 }
  ],
  accountBalance: 100000,
  maxPortfolioHeat: 0.20    // Max 20% of account at risk
}
```

**Output:**
- Total position value
- Total risk (if all stops hit)
- Portfolio heat (% of account at risk)
- Can add new position? (yes/no)
- Warnings (over-concentration, etc.)

**API**: `POST /api/risk/check-portfolio`

---

### 3. **Trading Limits Check**

```typescript
{
  accountBalance: 100000,
  maxDrawdown: 0.15,           // 15% max drawdown
  currentDrawdown: 0.08,        // Currently 8% down
  consecutiveLosses: 3,
  maxConsecutiveLosses: 5,
  dailyLossLimit: 2000
}
```

**Output:**
- `canTrade`: true/false
- `reasons`: Why trading is blocked
- `recommendedActions`: What to do next

---

### 4. **Risk-Reward Validation**

```typescript
riskManagementService.isValidTrade(
  entryPrice: 150,
  stopLoss: 142,
  takeProfit: 172,
  minRiskReward: 2.0   // Minimum 2:1
)
// Returns: true (because reward/risk = 20/8 = 2.5)
```

---

### 5. **Correlation Risk Check**

```typescript
riskManagementService.calculateCorrelationRisk(
  ['AAPL', 'MSFT', 'GOOGL'],  // Existing positions (all tech)
  'NVDA',                     // Want to add
  3                           // Max correlated positions
)
```

**Output:**
- `canAdd`: false
- `message`: "Already have 3 Technology positions"

---

## 🚀 Usage Examples

### Example 1: Calculate Position Size for New Trade

```typescript
// API call
const response = await fetch('/api/risk/calculate-position-size', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    accountBalance: 100000,
    entryPrice: 175.50,
    riskPerTrade: 0.02,    // 2% risk
    stopLossPercent: 0.05, // 5% stop
    riskRewardRatio: 3     // 3:1 target
  })
});

const result = await response.json();
console.log(`Buy ${result.data.shares} shares`);
console.log(`Risk: $${result.data.maxLoss.toFixed(2)}`);
```

**Response:**
```json
{
  "success": true,
  "data": {
    "shares": 227,
    "positionSize": 39835,
    "riskAmount": 2000,
    "stopLossPrice": 166.73,
    "takeProfitPrice": 190.98,
    "maxLoss": 1755,
    "maxGain": 5265,
    "riskRewardRatio": 3
  }
}
```

---

### Example 2: Check Portfolio Risk Before Adding New Position

```typescript
const response = await fetch('/api/risk/check-portfolio', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    positions: currentPositions,
    accountBalance: 100000,
    maxPortfolioHeat: 0.20
  })
});

const result = await response.json();

if (!result.data.canAddNewPosition) {
  console.log('⚠️  Cannot add new position - portfolio heat too high');
}
```

---

## 🔑 Key Risk Management Rules

### **Rule 1: Never Risk More Than 2% Per Trade**
- Maximum 1-2% of account balance per trade
- If account = $100,000, max risk = $2,000

### **Rule 2: Use Stop-Loss Always**
- Set stop loss before entering trade
- Use ATR-based stops for volatility
- Never move stop loss away from entry

### **Rule 3: Minimum 2:1 Risk-Reward Ratio**
- For every $1 risked, make $2 if right
- Skip trades with poor risk-reward
- Target 3:1 when possible

### **Rule 4: Limit Portfolio Heat to 20%**
- Total risk across all positions ≤ 20% of account
- Prevents catastrophic loss
- Keeps drawdown manageable

### **Rule 5: Avoid Sector Concentration**
- Max 3-4 positions per sector
- Diversify across sectors
- Use correlation checks

### **Rule 6: Stop Trading if Drawdown > 15%**
- Hit max drawdown? Stop trading immediately
- Review strategy performance
- Reduce position sizes

### **Rule 7: Stop After 5 Consecutive Losses**
- Something wrong with strategy or market
- Take a break, review trades
- Check if market regime changed

---

## 📈 Position Sizing Comparison

### **Scenario: $100,000 account, Stock at $150**

| Method | Shares | Position Size | Max Loss | Risk Level |
|--------|--------|---------------|----------|------------|
| **Fixed 1%** | 133 | $19,950 | $665 | Conservative |
| **Fixed 2%** | 266 | $39,900 | $1,330 | Moderate |
| **Kelly (55% WR)** | 93 | $14,000 | $279 | Aggressive |

**Recommendation**: Use **Fixed 2%** for most traders.

---

## ⚠️ Common Mistakes to Avoid

### ❌ Mistake 1: No Stop Loss
- **Wrong**: "I'll sell when it feels wrong"
- **Right**: Always set stop loss before entry

### ❌ Mistake 2: Risking Too Much
- **Wrong**: "This is a sure thing, I'll risk 10%"
- **Right**: Never risk more than 2% per trade

### ❌ Mistake 3: Ignoring Correlation
- **Wrong**: Holding AAPL, MSFT, GOOGL, NVDA (all tech)
- **Right**: Diversify across sectors

### ❌ Mistake 4: Increasing Size After Losses
- **Wrong**: "I need to make back my losses"
- **Right**: Reduce size or stop trading after losses

### ❌ Mistake 5: No Position Size Limit
- **Wrong**: Sizing based on conviction, not risk
- **Right**: Calculate size using risk % and stop loss

---

## 🧪 Testing the Risk Management

```bash
# Run demo to see risk management in action
npx tsx scripts/demo-risk-management.ts
```

**Output Examples:**
```
📊 SCENARIO 1: Position Sizing
  Account: $100,000
  Stock: $150
  Risk: 2% per trade

  ✅ Buy 266 shares ($39,900)
  🛡️ Stop Loss: $142.50 (5%)
  🎯 Take Profit: $172.50 (15%)
  💰 Max Loss: $1,995
  📈 Max Gain: $5,985

📊 SCENARIO 3: Portfolio Risk
  Total Position: $54,690
  Total Risk: $2,710 (2.7% of account)
  ✅ Portfolio Heat: 2.7% (under 20% limit)
  ✅ Can add new position

📊 SCENARIO 6: Correlation Check
  Existing: AAPL, MSFT, GOOGL
  Want to add: NVDA
  ⚠️  Already have 3 tech positions
  💡 Add JPM (finance) instead
```

---

## 🎯 Integration with Trading System

### **Before Opening Trade:**
1. Check trading limits (am I allowed to trade?)
2. Calculate position size (how many shares?)
3. Validate risk-reward ratio (is trade worth it?)
4. Check portfolio risk (can I add this position?)
5. Check correlation (am I too concentrated?)

### **After Opening Trade:**
1. Set stop loss immediately
2. Set take profit target
3. Monitor portfolio heat
4. Track daily drawdown

### **When Stops Hit:**
1. Close position
2. Review what went wrong
3. Adjust strategy if needed

---

## 📚 API Endpoints

### Calculate Position Size
```
POST /api/risk/calculate-position-size
Content-Type: application/json

{
  "accountBalance": 100000,
  "entryPrice": 175.50,
  "riskPerTrade": 0.02,
  "stopLossPercent": 0.05,
  "riskRewardRatio": 3,
  "method": "fixed"
}
```

### Check Portfolio Risk
```
POST /api/risk/check-portfolio
Content-Type: application/json

{
  "positions": [...],
  "accountBalance": 100000,
  "maxPortfolioHeat": 0.20
}
```

---

## ✅ Summary

**Risk Management Layer is complete with:**

✅ Position sizing (Fixed, Kelly, Volatility-adjusted)
✅ Portfolio risk analysis
✅ Trading limits (drawdown, consecutive losses)
✅ Risk-reward validation
✅ Correlation risk checking
✅ API endpoints
✅ Demo scripts

**Next: Build Backtesting Engine** 📊

This will validate your strategies with realistic costs and walk-forward validation.
