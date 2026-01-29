#!/bin/bash

# test-all.sh
# Run all tests with coverage report

set -e

echo "========================================"
echo "Running All Tests with Coverage"
echo "========================================"
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if vitest is installed
if ! command -v npx &> /dev/null; then
    echo -e "${RED}Error: npx not found. Please install Node.js and npm.${NC}"
    exit 1
fi

echo -e "${YELLOW}Running tests...${NC}"
echo ""

# Run tests with coverage
npx vitest run --coverage

# Check exit code
if [ $? -eq 0 ]; then
    echo ""
    echo -e "${GREEN}========================================"
    echo "All Tests Passed!"
    echo "========================================${NC}"
    echo ""
    echo "Coverage report available in: coverage/"
    echo "Open coverage/index.html in your browser to view"
else
    echo ""
    echo -e "${RED}========================================"
    echo "Some Tests Failed!"
    echo "========================================${NC}"
    exit 1
fi
