#!/bin/bash

# Pre-Installation Check Script
# This script checks your environment before running npm install

echo "🔍 TradingWeb - Environment Check"
echo "=================================="
echo ""

# Color codes
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

ISSUES_FOUND=0

# Check Node.js version
echo "📦 Checking Node.js version..."
if command -v node &> /dev/null; then
    NODE_VERSION=$(node -v)
    NODE_MAJOR=$(echo $NODE_VERSION | cut -d'.' -f1 | sed 's/v//')
    echo -e "  ✅ Found: $NODE_VERSION"

    if [ "$NODE_MAJOR" -lt 18 ]; then
        echo -e "  ${RED}❌ Issue: Node.js 18+ required${NC}"
        ISSUES_FOUND=$((ISSUES_FOUND + 1))
    fi
else
    echo -e "  ${RED}❌ Issue: Node.js not found${NC}"
    ISSUES_FOUND=$((ISSUES_FOUND + 1))
fi
echo ""

# Check npm version
echo "📦 Checking npm version..."
if command -v npm &> /dev/null; then
    NPM_VERSION=$(npm -v)
    echo -e "  ✅ Found: npm $NPM_VERSION"
else
    echo -e "  ${RED}❌ Issue: npm not found${NC}"
    ISSUES_FOUND=$((ISSUES_FOUND + 1))
fi
echo ""

# Check npm cache permissions
echo "🔐 Checking npm cache permissions..."
NPM_CACHE_DIR=$(npm config get cache)
if [ -d "$NPM_CACHE_DIR" ]; then
    CACHE_PERMS=$(stat -f "%Lp" "$NPM_CACHE_DIR" 2>/dev/null || stat -c "%a" "$NPM_CACHE_DIR" 2>/dev/null)
    CACHE_OWNER=$(stat -f "%u:%g" "$NPM_CACHE_DIR" 2>/dev/null || stat -c "%U:%G" "$NPM_CACHE_DIR" 2>/dev/null)
    CURRENT_USER=$(id -u):$(id -g)

    echo "  Cache directory: $NPM_CACHE_DIR"
    echo "  Permissions: $CACHE_PERMS"
    echo "  Owner: $CACHE_OWNER"
    echo "  Current user: $CURRENT_USER"

    if [ ! -w "$NPM_CACHE_DIR" ]; then
        echo -e "  ${RED}❌ Issue: No write permission to cache${NC}"
        echo -e "  ${YELLOW}💡 Fix: sudo chown -R \$(whoami) ~/.npm${NC}"
        ISSUES_FOUND=$((ISSUES_FOUND + 1))
    else
        echo -e "  ✅ Cache permissions OK"
    fi
else
    echo -e "  ${YELLOW}⚠️  Cache directory doesn't exist yet (will be created)${NC}"
fi
echo ""

# Check disk space
echo "💾 Checking disk space..."
DISK_AVAILABLE=$(df -h . | tail -1 | awk '{print $4}')
DISK_AVAILABLE_GB=$(df -h . | tail -1 | awk '{print $4}' | sed 's/G//')
echo "  Available space: $DISK_AVAILABLE"

if (( $(echo "$DISK_AVAILABLE_GB < 2" | bc -l) )); then
    echo -e "  ${RED}❌ Issue: Less than 2GB available${NC}"
    ISSUES_FOUND=$((ISSUES_FOUND + 1))
else
    echo -e "  ✅ Sufficient disk space"
fi
echo ""

# Check for PostgreSQL
echo "🐘 Checking PostgreSQL..."
if command -v psql &> /dev/null; then
    PSQL_VERSION=$(psql --version | head -n1)
    echo -e "  ✅ Found: $PSQL_VERSION"
else
    echo -e "  ${YELLOW}⚠️  PostgreSQL not found locally${NC}"
    echo -e "  ${YELLOW}💡 Note: You can use Docker (recommended) or remote database${NC}"
fi
echo ""

# Check Docker (alternative)
echo "🐳 Checking Docker..."
if command -v docker &> /dev/null; then
    DOCKER_VERSION=$(docker --version)
    echo -e "  ✅ Found: $DOCKER_VERSION"

    if docker info &> /dev/null; then
        echo -e "  ✅ Docker is running"
    else
        echo -e "  ${YELLOW}⚠️  Docker is installed but not running${NC}"
    fi
else
    echo -e "  ${YELLOW}⚠️  Docker not found${NC}"
    echo -e "  ${YELLOW}💡 Install Docker for easier setup: https://docs.docker.com/get-docker/${NC}"
fi
echo ""

# Check git
echo "📚 Checking git..."
if command -v git &> /dev/null; then
    GIT_VERSION=$(git --version)
    echo -e "  ✅ Found: $GIT_VERSION"
else
    echo -e "  ${RED}❌ Issue: git not found${NC}"
    ISSUES_FOUND=$((ISSUES_FOUND + 1))
fi
echo ""

# Summary
echo "=================================="
if [ $ISSUES_FOUND -eq 0 ]; then
    echo -e "${GREEN}✅ All checks passed! Ready to install.${NC}"
    echo ""
    echo "Next steps:"
    echo "  1. Copy environment: cp .env.example .env"
    echo "  2. Edit .env with your database credentials"
    echo "  3. Install dependencies: npm install"
    echo "  4. Set up database: npm run db:push"
    echo "  5. Seed database: npm run db:seed"
    echo "  6. Start development: npm run dev"
    exit 0
else
    echo -e "${RED}❌ Found $ISSUES_FOUND issue(s) that need attention${NC}"
    echo ""
    echo "Please fix the issues above before continuing."
    echo ""
    echo "Quick fixes:"
    echo "  npm permissions: sudo chown -R \$(whoami) ~/.npm"
    echo "  Install Node.js: https://docs.npmjs.com/downloading-and-installing-node-js-and-npm"
    echo "  Install Docker: https://docs.docker.com/get-docker/"
    exit 1
fi
