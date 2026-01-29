#!/bin/bash

# test-pipeline.sh
# Test data pipeline

set -e

echo "========================================"
echo "Testing Data Pipeline"
echo "========================================"
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Running Yahoo Finance Service Tests...${NC}"
echo ""

npx vitest run tests/services/yahoo-finance.test.ts

echo ""
echo -e "${YELLOW}Running Minervini Screener Tests...${NC}"
echo ""

npx vitest run tests/services/minervini-screener.test.ts

echo ""
echo -e "${YELLOW}Running Data Pipeline Integration Tests...${NC}"
echo ""

npx vitest run tests/integration/data-pipeline.test.ts

# Check exit code
if [ $? -eq 0 ]; then
    echo ""
    echo -e "${GREEN}========================================"
    echo "Data Pipeline Tests Passed!"
    echo "========================================${NC}"
    echo ""
    echo "Tested:"
    echo "  ✓ Yahoo Finance data fetching"
    echo "  ✓ Minervini screening"
    echo "  ✓ Price data storage"
    echo "  ✓ Complete data pipeline"
    echo "  ✓ Error handling"
    echo "  ✓ Performance"
else
    echo ""
    echo -e "${RED}========================================"
    echo "Data Pipeline Tests Failed!"
    echo "========================================${NC}"
    exit 1
fi
