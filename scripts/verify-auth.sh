#!/bin/bash

# Quick verification script for authentication endpoints
# This script checks if the auth API routes are properly configured

echo "🔍 Verifying Authentication System"
echo "==================================="
echo ""

# Check if required files exist
echo "📁 Checking file structure..."

files=(
  "src/lib/auth.ts"
  "src/lib/rate-limiter/index.ts"
  "src/middleware/auth.ts"
  "src/app/api/auth/register/route.ts"
  "src/app/api/auth/login/route.ts"
  "src/app/api/auth/session/route.ts"
  "src/app/api/auth/logout/route.ts"
)

for file in "${files[@]}"; do
  if [ -f "$file" ]; then
    echo "✅ $file"
  else
    echo "❌ $file - NOT FOUND"
  fi
done

echo ""
echo "📦 Checking dependencies..."

deps=(
  "bcryptjs"
  "jsonwebtoken"
  "jose"
  "zod"
  "@types/bcryptjs"
  "@types/jsonwebtoken"
)

for dep in "${deps[@]}"; do
  if npm list "$dep" --depth=0 2>/dev/null | grep -q "$dep"; then
    echo "✅ $dep"
  else
    echo "❌ $dep - NOT INSTALLED"
  fi
done

echo ""
echo "🔐 Checking environment variables..."

if [ -f ".env" ]; then
  if grep -q "JWT_SECRET" .env; then
    echo "✅ JWT_SECRET is set"
  else
    echo "❌ JWT_SECRET not found in .env"
  fi
else
  echo "❌ .env file not found"
fi

echo ""
echo "🔍 Checking Prisma schema..."

if prisma validate 2>/dev/null; then
  echo "✅ Prisma schema is valid"
else
  echo "❌ Prisma schema validation failed"
fi

echo ""
echo "✅ Verification complete!"
echo ""
echo "Next steps:"
echo "1. Ensure DATABASE_URL is set in .env"
echo "2. Run: npm run db:push (to create User table)"
echo "3. Run: npm run dev (to start the development server)"
echo "4. Test the endpoints using curl, Postman, or the test script"
