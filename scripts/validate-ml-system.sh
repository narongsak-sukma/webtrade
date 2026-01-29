#!/bin/bash
# Quick validation script for ML model system

echo "╔════════════════════════════════════════════════════════════╗"
echo "║     TradingWeb - ML System Validation                    ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# Check Python
echo "Checking Python..."
if command -v python3 &> /dev/null; then
    PYTHON_VERSION=$(python3 --version 2>&1 | awk '{print $2}')
    echo "  ✓ Python $PYTHON_VERSION found"
else
    echo "  ✗ Python3 not found"
    exit 1
fi

# Check ML libraries
echo ""
echo "Checking ML libraries..."
if python3 -c "import sklearn" 2>/dev/null; then
    SKLEARN_VERSION=$(python3 -c "import sklearn; print(sklearn.__version__)")
    echo "  ✓ scikit-learn $SKLEARN_VERSION"
else
    echo "  ✗ scikit-learn not installed"
    echo "    Run: pip3 install -r scripts/requirements.txt"
    exit 1
fi

if python3 -c "import joblib" 2>/dev/null; then
    echo "  ✓ joblib installed"
else
    echo "  ✗ joblib not installed"
    exit 1
fi

# Check Node.js
echo ""
echo "Checking Node.js..."
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    echo "  ✓ Node $NODE_VERSION found"
else
    echo "  ✗ Node not found"
    exit 1
fi

# Check TypeScript
echo ""
echo "Checking TypeScript..."
if npx tsc --version &> /dev/null; then
    TSC_VERSION=$(npx tsc --version)
    echo "  ✓ TypeScript $TSC_VERSION found"
else
    echo "  ✗ TypeScript not found"
    exit 1
fi

# Check required files
echo ""
echo "Checking required files..."

FILES=(
    "src/models/StockClassifier.ts"
    "src/models/training.ts"
    "src/models/prediction.ts"
    "src/models/evaluation.ts"
    "scripts/train-model.py"
    "scripts/predict.py"
    "scripts/train-model.ts"
    "scripts/requirements.txt"
)

ALL_FILES_OK=true
for FILE in "${FILES[@]}"; do
    if [ -f "$FILE" ]; then
        echo "  ✓ $FILE"
    else
        echo "  ✗ $FILE missing"
        ALL_FILES_OK=false
    fi
done

if [ "$ALL_FILES_OK" = false ]; then
    exit 1
fi

# Check directories
echo ""
echo "Checking directories..."

DIRS=(
    "src/models"
    "public/models"
    "scripts"
)

for DIR in "${DIRS[@]}"; do
    if [ -d "$DIR" ]; then
        echo "  ✓ $DIR/"
    else
        echo "  ✗ $DIR/ missing"
        mkdir -p "$DIR"
        echo "    Created: $DIR/"
    fi
done

# Check Python scripts are executable
echo ""
echo "Checking Python script permissions..."

if [ -x "scripts/train-model.py" ]; then
    echo "  ✓ train-model.py executable"
else
    echo "  ⚠ train-model.py not executable (fixing...)"
    chmod +x scripts/train-model.py
fi

if [ -x "scripts/predict.py" ]; then
    echo "  ✓ predict.py executable"
else
    echo "  ⚠ predict.py not executable (fixing...)"
    chmod +x scripts/predict.py
fi

# Summary
echo ""
echo "╔════════════════════════════════════════════════════════════╗"
echo "║                    ✓ SYSTEM READY                         ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""
echo "Next steps:"
echo "  1. Ensure database has historical stock data"
echo "  2. Run: npm run train:model"
echo "  3. Or run tests: npx ts-node scripts/test-ml-system.ts"
echo ""

exit 0
