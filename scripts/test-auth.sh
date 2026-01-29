#!/bin/bash

# test-auth.sh
# Test authentication system

set -e

echo "========================================"
echo "Testing Authentication System"
echo "========================================"
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Running Authentication Tests...${NC}"
echo ""

# Run auth tests
npx vitest run tests/api/auth.test.ts

# Run auth integration tests
echo ""
echo -e "${YELLOW}Running Authentication Integration Tests...${NC}"
echo ""

npx vitest run tests/integration/auth-flow.test.ts

# Check exit code
if [ $? -eq 0 ]; then
    echo ""
    echo -e "${GREEN}========================================"
    echo "Authentication Tests Passed!"
    echo "========================================${NC}"
    echo ""
    echo "Tested:"
    echo "  ✓ User registration"
    echo "  ✓ User login"
    echo "  ✓ Session management"
    echo "  ✓ Password security"
    echo "  ✓ Rate limiting"
    echo "  ✓ SQL injection prevention"
else
    echo ""
    echo -e "${RED}========================================"
    echo "Authentication Tests Failed!"
    echo "========================================${NC}"
    exit 1
fi
