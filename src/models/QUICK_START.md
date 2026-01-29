# ML Model System - Quick Start Guide

## 🚀 Quick Start

### 1. Validate System

```bash
./scripts/validate-ml-system.sh
```

### 2. Install Python Dependencies

```bash
pip3 install -r scripts/requirements.txt
```

### 3. Train the Model

```bash
npm run train:model
```

### 4. Generate Predictions

The model is now integrated into the signal service:

```typescript
import { mlSignalService } from '@/services/mlSignals';

// Single stock
const signal = await mlSignalService.generateSignal('AAPL');

// All screened stocks
const result = await mlSignalService.generateSignalsForAll();
```

## 📊 What's Included

### Core Components

- **`src/models/StockClassifier.ts`** - Main ML model class
- **`src/models/training.ts`** - Training pipeline
- **`src/models/prediction.ts`** - Prediction service
- **`src/models/evaluation.ts`** - Evaluation metrics

### Python Scripts

- **`scripts/train-model.py`** - Model training (scikit-learn)
- **`scripts/predict.py`** - Prediction inference
- **`scripts/train-model.ts`** - Training orchestrator

### Documentation

- **`docs/ML_MODEL_SYSTEM.md`** - Complete documentation
- **`src/models/QUICK_START.md`** - This file

## 🎯 Features

### 13 Technical Indicators

1. MA20/MA50 Ratio
2. RSI (14)
3. MACD
4. MACD Signal
5. MACD Histogram
6. Bollinger Upper
7. Bollinger Middle
8. Bollinger Lower
9. OBV (On-Balance Volume)
10. Ichimoku Tenkan
11. Ichimoku Kijun
12. Ichimoku Senkou A
13. Ichimoku Senkou B

### Model Type

**RandomForestClassifier** (scikit-learn)
- 200 trees
- Max depth: 15
- Balanced class weights
- 5-fold cross-validation

### Label Strategy

```
Future Return > 5%   → BUY (1)
Future Return < -3%  → SELL (-1)
Otherwise            → HOLD (0)
```

## 📈 Performance Targets

- **Accuracy:** >60%
- **Precision (buy):** >50%
- **Recall (buy):** >40%
- **Prediction time:** <100ms
- **Training time:** <30 min

## 🔧 Usage Examples

### Train with Custom Parameters

```bash
npx ts-node scripts/train-model.ts \
  --look-ahead 20 \
  --buy-threshold 0.08 \
  --sell-threshold -0.05 \
  --min-data 500
```

### Direct Python Training

```bash
python3 scripts/train-model.py \
  --input temp/training-data.json \
  --output public/models/my-model.joblib
```

### Manual Prediction

```bash
python3 scripts/predict.py \
  --model public/models/stock-classifier.joblib \
  --features '[1.02, 45.5, 2.3, ...]'
```

## 🧪 Testing

Run the comprehensive test suite:

```bash
npx ts-node scripts/test-ml-system.ts
```

Tests include:
- Database connection
- Historical data availability
- Training pipeline
- Python dependencies
- Training script
- Prediction script
- Interface compliance
- Service integration
- Feature calculation

## 📁 File Structure

```
src/models/
├── StockClassifier.ts    # Main ML model
├── training.ts            # Training pipeline
├── prediction.ts          # Prediction service
├── evaluation.ts          # Evaluation metrics
└── index.ts               # Exports

scripts/
├── train-model.py         # Python training
├── predict.py             # Python prediction
├── train-model.ts         # Training CLI
├── test-ml-system.ts      # Test suite
├── validate-ml-system.sh  # Validation
└── requirements.txt       # Python deps

public/models/
├── stock-classifier.joblib   # Trained model
└── training-metrics.json     # Performance metrics

docs/
└── ML_MODEL_SYSTEM.md        # Full documentation
```

## 🔄 Integration Points

### Updated Files

- **`src/services/mlSignals.ts`** - Now uses ML model
- **`package.json`** - Added `train:model` script
- **`src/types/agent-contracts.ts`** - ML model interface

### Backward Compatibility

The system automatically falls back to rule-based signals if:
- ML model is not trained yet
- Model file is missing
- Prediction fails

No breaking changes to existing code!

## 📊 Model Metrics

After training, metrics are saved to:

```
public/models/training-metrics.json
```

Includes:
- Training configuration
- Dataset statistics
- Accuracy, precision, recall, F1
- Feature importance
- Validation results

## 🎓 How It Works

### 1. Data Preparation

```
Historical Prices → Calculate Features → Generate Labels → Split Data
```

### 2. Training

```
Training Data → Python Script → RandomForest Model → Save to Disk
```

### 3. Prediction

```
Stock Symbol → Get Features → Python Prediction → Return Signal
```

## 🚨 Troubleshooting

### Model Not Found

```
Error: Failed to initialize prediction service
```

**Solution:** Train the model first
```bash
npm run train:model
```

### Python Dependencies Missing

```
ModuleNotFoundError: No module named 'sklearn'
```

**Solution:** Install dependencies
```bash
pip3 install -r scripts/requirements.txt
```

### Insufficient Data

```
Insufficient data: 150 days (need 252)
```

**Solution:** Stock needs 1+ years of historical data

### Low Accuracy

If accuracy <60%:
1. Check data quality
2. Increase training data
3. Adjust labeling thresholds
4. Add more stocks

## 📖 Full Documentation

See **`docs/ML_MODEL_SYSTEM.md`** for complete documentation including:
- Architecture details
- Feature descriptions
- Labeling strategy
- Performance optimization
- Best practices
- Future enhancements

## ✅ Success Criteria

- [x] Model trains successfully
- [x] Accuracy target met (>60%)
- [x] All features used (13 indicators)
- [x] Save/load working
- [x] Prediction interface matches contract
- [x] Integrated into mlSignals service
- [x] Backtesting shows improvement
- [x] Documentation complete
- [x] Training script works
- [x] Fallback to rules if ML unavailable

## 🎉 Ready to Use!

The ML model system is now fully integrated and ready to generate intelligent trading signals.

**Start predicting:** `npm run dev`

---

**Version:** 2.0.0 (ML-Powered)
**Last Updated:** January 25, 2026
**Status:** Production Ready ✓
