#!/bin/bash

# Fix npm permissions script
# This script fixes common npm permission issues

echo "🔧 TradingWeb - Fix npm Permissions"
echo "===================================="
echo ""

# Color codes
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if running as root
if [ "$EUID" -eq 0 ]; then
    echo -e "${RED}❌ Please don't run this script as root (sudo)${NC}"
    echo "Run it as your regular user"
    exit 1
fi

echo -e "${BLUE}Step 1: Clear npm cache${NC}"
npm cache clean --force
echo ""

echo -e "${BLUE}Step 2: Fix npm cache directory ownership${NC}"
NPM_CACHE_DIR=$(npm config get cache)
if [ -d "$NPM_CACHE_DIR" ]; then
    echo "Fixing: $NPM_CACHE_DIR"
    sudo chown -R $(whoami) "$NPM_CACHE_DIR"
    echo -e "${GREEN}✅ Fixed ownership${NC}"
else
    echo -e "${YELLOW}⚠️  Cache directory doesn't exist yet${NC}"
fi
echo ""

echo -e "${BLUE}Step 3: Create .npm directory if needed${NC}"
mkdir -p ~/.npm
sudo chown -R $(whoami) ~/.npm
echo -e "${GREEN}✅ Created and fixed .npm directory${NC}"
echo ""

echo -e "${BLUE}Step 4: Set npm prefix to user directory${NC}"
mkdir -p ~/.npm-global
npm config set prefix '~/.npm-global'
echo -e "${GREEN}✅ Set npm prefix${NC}"
echo ""

echo -e "${BLUE}Step 5: Verify fix${NC}"
TEST_FILE="$NPM_CACHE_DIR/test-write-$$"
if mkdir -p "$TEST_FILE" 2>/dev/null; then
    rmdir "$TEST_FILE"
    echo -e "${GREEN}✅ Success! You can now write to npm cache${NC}"
else
    echo -e "${RED}❌ Still having issues${NC}"
    echo ""
    echo "Alternative solutions:"
    echo "1. Use Docker (recommended):"
    echo "   docker-compose up -d"
    echo ""
    echo "2. Use nvm (Node Version Manager):"
    echo "   curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash"
    echo "   nvm install 20"
    echo ""
    echo "3. Reinstall Node.js with official installer:"
    echo "   https://nodejs.org/"
    exit 1
fi
echo ""

echo -e "${GREEN}====================================${NC}"
echo -e "${GREEN}✅ npm permissions fixed!${NC}"
echo ""
echo "You can now run: npm install"
