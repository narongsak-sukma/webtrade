#!/bin/bash

# TradingWeb Docker Deployment Script
# This script handles the complete Docker deployment

set -e

echo "========================================"
echo "🚀 TradingWeb Docker Deployment"
echo "========================================"
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Step 1: Check Docker
echo -e "${BLUE}Step 1: Checking Docker installation...${NC}"
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    echo "   Visit: https://docs.docker.com/get-docker/"
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first."
    echo "   Visit: https://docs.docker.com/compose/install/"
    exit 1
fi

echo -e "${GREEN}✅ Docker and Docker Compose are installed${NC}"
echo ""

# Step 2: Check .env file
echo -e "${BLUE}Step 2: Checking environment configuration...${NC}"
if [ ! -f .env ]; then
    echo -e "${YELLOW}⚠️  .env file not found. Creating from .env.docker...${NC}"
    cp .env.docker .env
    echo -e "${YELLOW}⚠️  IMPORTANT: Edit .env and change JWT_SECRET to a secure value!${NC}"
    echo ""
    read -p "Press Enter after you've edited .env file..."
else
    echo -e "${GREEN}✅ .env file exists${NC}"
fi
echo ""

# Step 3: Stop existing containers
echo -e "${BLUE}Step 3: Stopping any existing containers...${NC}"
docker-compose down 2>/dev/null || true
echo -e "${GREEN}✅ Containers stopped${NC}"
echo ""

# Step 4: Build and start containers
echo -e "${BLUE}Step 4: Building and starting containers...${NC}"
echo -e "${YELLOW}⏳ This may take 5-10 minutes on first run...${NC}"
docker-compose up -d --build
echo -e "${GREEN}✅ Containers started${NC}"
echo ""

# Step 5: Wait for database to be ready
echo -e "${BLUE}Step 5: Waiting for database to be ready...${NC}"
until docker-compose exec -T postgres pg_isready -U tradingweb &> /dev/null; do
    echo -e "${YELLOW}⏳ Waiting for PostgreSQL...${NC}"
    sleep 2
done
echo -e "${GREEN}✅ Database is ready${NC}"
echo ""

# Step 6: Run database migrations
echo -e "${BLUE}Step 6: Running database migrations...${NC}"
docker-compose exec -T app npx prisma db push --skip-generate
echo -e "${GREEN}✅ Migrations complete${NC}"
echo ""

# Step 7: Seed database
echo -e "${BLUE}Step 7: Seeding database...${NC}"
docker-compose exec -T app npx prisma db seed
echo -e "${GREEN}✅ Database seeded${NC}"
echo ""

# Step 8: Check health
echo -e "${BLUE}Step 8: Checking application health...${NC}"
sleep 5
HEALTH_CHECK=$(curl -s http://localhost:3000/api/health || echo "failed")
if [[ $HEALTH_CHECK == *"healthy"* ]]; then
    echo -e "${GREEN}✅ Application is healthy${NC}"
else
    echo -e "${YELLOW}⚠️  Health check pending. Application may still be starting...${NC}"
    echo -e "${YELLOW}   Check logs with: docker-compose logs -f app${NC}"
fi
echo ""

# Step 9: Display success message
echo "========================================"
echo -e "${GREEN}✅ TradingWeb Deployment Complete!${NC}"
echo "========================================"
echo ""
echo "🌐 Application URL: http://localhost:3000"
echo "📊 Admin Panel:      http://localhost:3000/admin"
echo "🔐 Login:            http://localhost:3000/login"
echo "❤️  Health Check:    http://localhost:3000/api/health"
echo ""
echo "📝 Useful Commands:"
echo "  View logs:        docker-compose logs -f"
echo "  Stop app:         docker-compose down"
echo "  Restart app:      docker-compose restart"
echo "  Database shell:   docker-compose exec postgres psql -U tradingweb"
echo ""
echo -e "${YELLOW}⚠️  IMPORTANT:${NC}"
echo "  1. Register a user account at http://localhost:3000/register"
echo "  2. First user becomes admin automatically"
echo "  3. Go to Admin Panel to start background jobs"
echo ""
echo -e "${GREEN}Happy Trading! 🚀${NC}"
