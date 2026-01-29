#!/bin/bash

# TradingWeb Production Startup Script
# This script verifies the environment and starts the production server

set -e

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  TradingWeb Production Startup"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check functions
check_command() {
    if ! command -v $1 &> /dev/null; then
        echo -e "${RED}✗ $1 is not installed${NC}"
        exit 1
    else
        echo -e "${GREEN}✓ $1 is installed${NC}"
    fi
}

check_env_var() {
    if [ -z "${!1}" ]; then
        echo -e "${RED}✗ $1 is not set${NC}"
        exit 1
    else
        echo -e "${GREEN}✓ $1 is set${NC}"
    fi
}

# 1. Check prerequisites
echo "Step 1: Checking prerequisites..."
check_command "node"
check_command "npm"
check_command "psql"
check_command "python3"

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo -e "${RED}✗ Node.js version must be 18 or higher (current: $(node -v))${NC}"
    exit 1
fi

echo ""

# 2. Check environment variables
echo "Step 2: Checking environment variables..."
if [ ! -f .env ]; then
    echo -e "${RED}✗ .env file not found${NC}"
    echo "Please copy .env.example to .env and configure it"
    exit 1
fi

# Load environment variables
export $(cat .env | grep -v '^#' | xargs)

check_env_var "DATABASE_URL"
check_env_var "JWT_SECRET"
check_env_var "NEXT_PUBLIC_APP_URL"
check_env_var "NODE_ENV"

if [ "$NODE_ENV" != "production" ]; then
    echo -e "${YELLOW}⚠ NODE_ENV is not set to 'production'${NC}"
fi

echo ""

# 3. Check database connection
echo "Step 3: Checking database connection..."
if psql "$DATABASE_URL" -c "SELECT 1" &> /dev/null; then
    echo -e "${GREEN}✓ Database connection successful${NC}"
else
    echo -e "${RED}✗ Cannot connect to database${NC}"
    echo "Please check your DATABASE_URL"
    exit 1
fi
echo ""

# 4. Check if database is migrated
echo "Step 4: Checking database migrations..."
MIGRATION_STATUS=$(npx prisma migrate status 2>&1 || echo "failed")
if echo "$MIGRATION_STATUS" | grep -q "Can't reach database server"; then
    echo -e "${RED}✗ Database migration check failed${NC}"
    exit 1
else
    echo -e "${GREEN}✓ Database migrations checked${NC}"
fi
echo ""

# 5. Check if ML model exists
echo "Step 5: Checking ML model..."
if [ -f "public/models/stock-classifier.joblib" ]; then
    echo -e "${GREEN}✓ ML model found${NC}"
else
    echo -e "${YELLOW}⚠ ML model not found${NC}"
    echo "Training ML model..."
    npm run train:model
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ ML model trained successfully${NC}"
    else
        echo -e "${YELLOW}⚠ ML model training failed, but continuing...${NC}"
    fi
fi
echo ""

# 6. Build the application (if not already built)
echo "Step 6: Checking build..."
if [ ! -d ".next" ]; then
    echo "Building application..."
    npm run build
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ Build successful${NC}"
    else
        echo -e "${RED}✗ Build failed${NC}"
        exit 1
    fi
else
    echo -e "${GREEN}✓ Build directory exists${NC}"
fi
echo ""

# 7. Start the application
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  All checks passed! Starting production server..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Start with PM2 if available, otherwise use npm start
if command -v pm2 &> /dev/null; then
    echo "Starting with PM2..."
    pm2 start ecosystem.config.js --env production
    pm2 save
    echo ""
    echo -e "${GREEN}✓ Application started with PM2${NC}"
    echo "View logs: pm2 logs tradingweb"
    echo "View status: pm2 status"
else
    echo "Starting with npm start..."
    npm start
fi
