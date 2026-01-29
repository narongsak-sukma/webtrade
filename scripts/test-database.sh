#!/bin/bash

# Database Validation Script
# Tests database connection and Prisma setup

echo "🗄️  TradingWeb - Database Validation"
echo "===================================="
echo ""

# Color codes
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

ISSUES_FOUND=0

# Check if .env exists
echo -e "${BLUE}Step 1: Checking environment file...${NC}"
if [ -f ".env" ]; then
    echo -e "${GREEN}✅ .env file exists${NC}"

    # Load DATABASE_URL
    if grep -q "DATABASE_URL" .env; then
        export $(grep -v '^#' .env | xargs)
        if [ -n "$DATABASE_URL" ]; then
            echo -e "${GREEN}✅ DATABASE_URL is set${NC}"
            # Mask password for display
            MASKED_URL=$(echo $DATABASE_URL | sed 's/:[^:@]*@/:****@/')
            echo "  $MASKED_URL"
        else
            echo -e "${RED}❌ DATABASE_URL is empty${NC}"
            ISSUES_FOUND=$((ISSUES_FOUND + 1))
        fi
    else
        echo -e "${RED}❌ DATABASE_URL not found in .env${NC}"
        ISSUES_FOUND=$((ISSUES_FOUND + 1))
    fi
else
    echo -e "${RED}❌ .env file not found${NC}"
    echo -e "${YELLOW}💡 Run: cp .env.example .env${NC}"
    ISSUES_FOUND=$((ISSUES_FOUND + 1))
fi
echo ""

if [ $ISSUES_FOUND -gt 0 ]; then
    echo -e "${RED}Please fix the environment issues first${NC}"
    exit 1
fi

# Check Prisma schema
echo -e "${BLUE}Step 2: Checking Prisma schema...${NC}"
if [ -f "prisma/schema.prisma" ]; then
    echo -e "${GREEN}✅ Prisma schema file exists${NC}"

    # Validate schema
    if npx prisma validate &> /dev/null; then
        echo -e "${GREEN}✅ Prisma schema is valid${NC}"
    else
        echo -e "${RED}❌ Prisma schema has errors${NC}"
        echo "Run: npx prisma validate"
        ISSUES_FOUND=$((ISSUES_FOUND + 1))
    fi
else
    echo -e "${RED}❌ Prisma schema not found${NC}"
    ISSUES_FOUND=$((ISSUES_FOUND + 1))
fi
echo ""

# Check Prisma Client
echo -e "${BLUE}Step 3: Checking Prisma Client...${NC}"
if [ -d "node_modules/.prisma" ] || [ -d "node_modules/@prisma" ]; then
    echo -e "${GREEN}✅ Prisma Client is installed${NC}"
else
    echo -e "${YELLOW}⚠️  Prisma Client not found${NC}"
    echo "Generating..."
    npm run db:generate
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Prisma Client generated${NC}"
    else
        echo -e "${RED}❌ Failed to generate Prisma Client${NC}"
        ISSUES_FOUND=$((ISSUES_FOUND + 1))
    fi
fi
echo ""

# Test database connection
echo -e "${BLUE}Step 4: Testing database connection...${NC}"
echo "Attempting to connect to database..."

if npx prisma db push --accept-data-loss --skip-generate &> /dev/null; then
    echo -e "${GREEN}✅ Database connection successful${NC}"
else
    echo -e "${RED}❌ Cannot connect to database${NC}"
    echo ""
    echo "Troubleshooting:"
    echo "1. Check if PostgreSQL is running:"
    echo "   docker ps | grep postgres"
    echo "   or: brew services list | grep postgresql"
    echo ""
    echo "2. Verify DATABASE_URL format:"
    echo "   postgresql://user:password@host:port/database?schema=public"
    echo ""
    echo "3. Test connection manually:"
    echo "   psql \$DATABASE_URL"
    ISSUES_FOUND=$((ISSUES_FOUND + 1))
fi
echo ""

# Check database tables
echo -e "${BLUE}Step 5: Checking database tables...${NC}"
if command -v psql &> /dev/null; then
    TABLES=$(psql $DATABASE_URL -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';" 2>/dev/null | tr -d ' ')

    if [ -n "$TABLES" ] && [ "$TABLES" -gt 0 ]; then
        echo -e "${GREEN}✅ Database has $TABLES tables${NC}"

        # List expected tables
        EXPECTED_TABLES=("stocks" "stock_prices" "screened_stocks" "signals" "jobs" "job_logs" "users" "watchlists")
        MISSING_TABLES=()

        for table in "${EXPECTED_TABLES[@]}"; do
            EXISTS=$(psql $DATABASE_URL -t -c "SELECT to_regclass('public.$table');" 2>/dev/null | tr -d ' ')
            if [ "$EXISTS" != "$table" ]; then
                MISSING_TABLES+=("$table")
            fi
        done

        if [ ${#MISSING_TABLES[@]} -eq 0 ]; then
            echo -e "${GREEN}✅ All expected tables exist${NC}"
        else
            echo -e "${YELLOW}⚠️  Missing tables: ${MISSING_TABLES[*]}${NC}"
            echo "Run: npm run db:push"
        fi
    else
        echo -e "${YELLOW}⚠️  No tables found in database${NC}"
        echo "Run: npm run db:push"
    fi
else
    echo -e "${YELLOW}⚠️  psql not available, skipping table check${NC}"
fi
echo ""

# Check seed data
echo -e "${BLUE}Step 6: Checking seed data...${NC}"
if command -v psql &> /dev/null; then
    JOB_COUNT=$(psql $DATABASE_URL -t -c "SELECT COUNT(*) FROM jobs;" 2>/dev/null | tr -d ' ')

    if [ -n "$JOB_COUNT" ] && [ "$JOB_COUNT" -gt 0 ]; then
        echo -e "${GREEN}✅ Seed data exists ($JOB_COUNT jobs)${NC}"
    else
        echo -e "${YELLOW}⚠️  No seed data found${NC}"
        echo "Run: npm run db:seed"
    fi
fi
echo ""

# Summary
echo "===================================="
if [ $ISSUES_FOUND -eq 0 ]; then
    echo -e "${GREEN}✅ All database checks passed!${NC}"
    echo ""
    echo "Database is ready to use!"
    exit 0
else
    echo -e "${RED}❌ Found $ISSUES_FOUND issue(s)${NC}"
    echo ""
    echo "Quick fix commands:"
    echo "  1. Generate Prisma Client: npm run db:generate"
    echo "  2. Push schema: npm run db:push"
    echo "  3. Seed database: npm run db:seed"
    echo ""
    echo "Or use Docker:"
    echo "  docker-compose up -d"
    exit 1
fi
