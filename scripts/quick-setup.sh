#!/bin/bash

# Quick Setup Script - Automated installation
# This script sets up the entire project

echo "🚀 TradingWeb - Quick Setup"
echo "============================"
echo ""

# Color codes
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Step 1: Environment check
echo -e "${BLUE}Step 1: Checking environment...${NC}"
if [ -f "scripts/check-environment.sh" ]; then
    bash scripts/check-environment.sh
    if [ $? -ne 0 ]; then
        echo -e "${RED}❌ Environment check failed${NC}"
        echo "Please fix the issues above first"
        exit 1
    fi
else
    echo -e "${YELLOW}⚠️  Check script not found, continuing...${NC}"
fi
echo ""

# Step 2: Fix npm permissions if needed
echo -e "${BLUE}Step 2: Ensuring npm permissions...${NC}"
if [ -f "scripts/fix-npm-permissions.sh" ]; then
    bash scripts/fix-npm-permissions.sh
fi
echo ""

# Step 3: Environment file
echo -e "${BLUE}Step 3: Setting up environment...${NC}"
if [ ! -f ".env" ]; then
    if [ -f ".env.example" ]; then
        cp .env.example .env
        echo -e "${GREEN}✅ Created .env file${NC}"
        echo -e "${YELLOW}⚠️  Please edit .env with your database credentials${NC}"
        echo ""
        read -p "Press Enter to continue after editing .env (or skip for now)..."
    else
        echo -e "${RED}❌ .env.example not found${NC}"
        exit 1
    fi
else
    echo -e "${GREEN}✅ .env file exists${NC}"
fi
echo ""

# Step 4: Install dependencies
echo -e "${BLUE}Step 4: Installing dependencies...${NC}"
echo "This may take a few minutes..."
if npm install --prefer-offline --no-audit; then
    echo -e "${GREEN}✅ Dependencies installed${NC}"
else
    echo -e "${RED}❌ npm install failed${NC}"
    echo ""
    echo "Try running: bash scripts/fix-npm-permissions.sh"
    echo "Or use Docker: docker-compose up -d"
    exit 1
fi
echo ""

# Step 5: Generate Prisma Client
echo -e "${BLUE}Step 5: Generating Prisma Client...${NC}"
if npm run db:generate; then
    echo -e "${GREEN}✅ Prisma Client generated${NC}"
else
    echo -e "${YELLOW}⚠️  Prisma generation failed (may need DATABASE_URL)${NC}"
fi
echo ""

# Step 6: Check database connection
echo -e "${BLUE}Step 6: Checking database connection...${NC}"
source .env 2>/dev/null
if [ -n "$DATABASE_URL" ]; then
    echo "DATABASE_URL is set"
    echo ""
    read -p "Do you want to set up the database now? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo "Running: npm run db:push"
        npm run db:push
        echo ""
        read -p "Do you want to seed the database? (y/n) " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            echo "Running: npm run db:seed"
            npm run db:seed
        fi
    fi
else
    echo -e "${YELLOW}⚠️  DATABASE_URL not set in .env${NC}"
    echo "You'll need to set it up manually:"
    echo "  1. Edit .env file"
    echo "  2. Add DATABASE_URL=\"postgresql://user:password@localhost:5432/tradingweb\""
    echo "  3. Run: npm run db:push"
    echo "  4. Run: npm run db:seed"
fi
echo ""

# Step 7: Success!
echo -e "${GREEN}============================${NC}"
echo -e "${GREEN}✅ Setup complete!${NC}"
echo ""
echo "Next steps:"
echo "  1. Make sure .env is configured correctly"
echo "  2. If database not set up: npm run db:push && npm run db:seed"
echo "  3. Start development server: npm run dev"
echo ""
echo "Or use Docker (recommended):"
echo "  docker-compose up -d"
echo ""
echo "📚 Documentation:"
echo "  - README.md - Full setup guide"
echo "  - docs/REMAINING_TASKS.md - Development roadmap"
echo "  - docs/PRD.md - Product specifications"
