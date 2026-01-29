#!/bin/bash

# test-ml.sh
# Test ML model and signals

set -e

echo "========================================"
echo "Testing ML Model and Signals"
echo "========================================"
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Running ML Signal Service Tests...${NC}"
echo ""

npx vitest run tests/services/ml-signals.test.ts

echo ""
echo -e "${YELLOW}Running Signal API Tests...${NC}"
echo ""

npx vitest run tests/api/signals.test.ts

echo ""
echo -e "${YELLOW}Running Stock API Tests...${NC}"
echo ""

npx vitest run tests/api/stocks.test.ts

echo ""
echo -e "${YELLOW}Running Job API Tests...${NC}"
echo ""

npx vitest run tests/api/jobs.test.ts

# Check exit code
if [ $? -eq 0 ]; then
    echo ""
    echo -e "${GREEN}========================================"
    echo "ML Model Tests Passed!"
    echo "========================================${NC}"
    echo ""
    echo "Tested:"
    echo "  ✓ RSI calculation"
    echo "  ✓ MACD calculation"
    echo "  ✓ Bollinger Bands"
    echo "  ✓ Signal generation"
    echo "  ✓ ML model integration"
    echo "  ✓ Feature calculation"
    echo "  ✓ API endpoints"
else
    echo ""
    echo -e "${RED}========================================"
    echo "ML Model Tests Failed!"
    echo "========================================${NC}"
    exit 1
fi
