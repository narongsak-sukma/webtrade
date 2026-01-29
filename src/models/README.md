# Agent 3: ML Engineer - Enhanced Model

## 🎯 Your Mission

Build a proper ML model to replace the current rule-based signal generation system.

## 📋 Deliverables

### 1. StockClassifier.ts
Main ML model using scikit-learn or similar:
- RandomForest or XGBoost classifier
- Train on historical data
- Generate predictions (buy/hold/sell)
- Output confidence scores

**Interface** (MUST follow):
```typescript
class StockClassifier {
  train(data: TrainingData[]): Promise<TrainingResult>;
  predict(symbol: string, features: FeatureValues): Promise<ModelPrediction>;
  evaluate(testData: TestData[]): Promise<EvaluationMetrics>;
  save(path: string): Promise<void>;
  load(path: string): Promise<void>;
}
```

### 2. training.ts
Training pipeline:
- Data preprocessing
- Feature engineering
- Train/test split
- Cross-validation
- Hyperparameter tuning
- Model selection

### 3. prediction.ts
Prediction interface:
- Load trained model
- Generate features for stock
- Make prediction
- Return with confidence

### 4. evaluation.ts
Model evaluation:
- Accuracy metrics
- Confusion matrix
- Feature importance
- ROI calculation (backtesting)
- Performance over time

### 5. scripts/train-model.ts
CLI script to train model:
- Fetch historical data
- Generate labels
- Train model
- Save model
- Print metrics

## 🔒 Constraints

- ✅ Use Python (scikit-learn) or Node.js (ml-js)
- ✅ Follow TypeScript interfaces in `src/types/agent-contracts.ts`
- ✅ Train on minimum 1 year of data
- ✅ Features: MA20/50, RSI, MACD, BB, OBV, Ichimoku
- ✅ Output: buy/hold/sell with confidence
- ✅ Save/load model persistence
- ✅ No UI work (pure ML)
- ✅ No API routes (use existing)

## 📁 Location

Create files in:
- `src/models/` - Model code
- `scripts/` - Training script
- `public/models/` - Saved model files

## 🎓 Features to Use

**Mandatory** (already implemented):
1. MA20/MA50 ratio
2. RSI (14)
3. MACD (12, 26, 9)
4. Bollinger Bands (20, 2)
5. OBV
6. Ichimoku Cloud

**Optional** (you can add):
- Stochastic Oscillator
- Williams %R
- ATR
- Volume profile
- Price momentum
- Earnings surprises

## 🏷️ Labeling Strategy

Generate training labels using this logic:
```python
# Look ahead 5-20 trading days
future_return = (price_future - price_current) / price_current

if future_return > 0.05:  # >5% gain
    label = 'buy' (1)
elif future_return < -0.03:  # >3% loss
    label = 'sell' (-1)
else:
    label = 'hold' (0)
```

## 📊 Training Data Requirements

- **Minimum**: 1 year of historical data
- **Ideal**: 3+ years
- **Stocks**: Use screened stocks (passed Minervini)
- **Features**: All 6 mandatory features
- **Labels**: Generated using look-ahead returns
- **Split**: 80% train, 20% test

## 📈 Success Metrics

Target performance:
- **Accuracy**: >60% (better than random)
- **Precision (buy)**: >50%
- **Recall (buy)**: >40%
- **ROI**: Better than buy-and-hold SPY

## ✅ Integration Process

1. Implement model class
2. Create training pipeline
3. Train on historical data
4. Evaluate performance
5. Save best model
6. Submit for Ralph Loop review
7. Fix issues identified
8. Integration tested in signal generation

## 🧪 Testing

Test these scenarios:
- ✅ Model accuracy >60%
- ✅ Feature importance makes sense
- ✅ Predictions match interface
- ✅ Model saves/loads correctly
- ✅ Training completes in <30 minutes
- ✅ Prediction takes <100ms per stock
- ✅ Backtesting shows positive ROI

## 🔄 Integration Points

Replace rule-based signals in:
```typescript
// src/services/mlSignals.ts
// Current: Rule-based
// New: Your ML model

export class MLSignalService {
  async generateSignal(symbol: string) {
    // 1. Get features
    // 2. Call your model.predict()
    // 3. Return ModelPrediction
  }
}
```

## ⚠️ Important

- Ralph Loop will validate model quality
- Must beat baseline (rule-based)
- Must handle edge cases (insufficient data)
- Must log predictions for audit
- Must provide confidence scores
- Must be reproducible (same input = same output)
- Must document feature engineering

## 📦 Model Files

Save trained model to:
```
public/models/
├── stock-classifier-v1.pkl  (or .json)
├── scaler.pkl
├── feature-params.json
└── training-metadata.json
```

---

**Agent**: ML Engineer
**Mode**: Controlled (Ralph Loop orchestrates)
**Timeline**: ~2 weeks parallel work
**Review**: Continuous quality validation by Ralph Loop
