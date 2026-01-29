# Authentication System - Quick Start Guide

## 🚀 Setup (5 minutes)

### 1. Install Dependencies
```bash
npm install
```

Already installed:
- bcryptjs (password hashing)
- jose (JWT tokens)
- zod (validation)
- @types/bcryptjs
- @types/jsonwebtoken

### 2. Configure Environment
Check that `.env` has:
```env
JWT_SECRET=your-secret-key-here
DATABASE_URL=postgresql://user:pass@localhost:5432/tradingweb
```

### 3. Setup Database
```bash
npm run db:push
```

This creates the `users` table in your database.

### 4. Start Development Server
```bash
npm run dev
```

The server starts on `http://localhost:3000`

## 🧪 Quick Test

### Test Registration
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test123!@#",
    "name": "Test User"
  }'
```

Expected response:
```json
{
  "success": true,
  "user": {
    "id": "...",
    "email": "test@example.com",
    "name": "Test User",
    "role": "user"
  },
  "token": "eyJhbGci..."
}
```

### Test Login
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test123!@#"
  }'
```

### Test Session
Replace `YOUR_TOKEN` with the token from registration/login:
```bash
curl -X GET http://localhost:3000/api/auth/session \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Test Logout
```bash
curl -X POST http://localhost:3000/api/auth/logout \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## 📁 Files Created

```
src/
├── lib/
│   ├── auth.ts                    # Auth utilities (hashing, JWT)
│   └── rate-limiter/
│       └── index.ts               # Rate limiting (5 req/min)
├── middleware/
│   └── auth.ts                    # Auth middleware (protect routes)
└── app/api/auth/
    ├── register/route.ts          # POST /api/auth/register
    ├── login/route.ts             # POST /api/auth/login
    ├── session/route.ts           # GET /api/auth/session
    └── logout/route.ts            # POST /api/auth/logout

scripts/
├── verify-auth.sh                 # Verify installation
└── test-auth.ts                   # Automated tests

examples/
└── auth-client-example.ts         # Frontend integration examples

docs/
└── AUTHENTICATION.md              # Full documentation
```

## 🔒 Security Features

✅ Password hashing (bcrypt, cost 12)
✅ JWT tokens (HS256, 7 day expiration)
✅ Rate limiting (5 req/min, exponential backoff)
✅ Input validation (Zod schemas)
✅ SQL injection prevention (Prisma)
✅ XSS prevention (input sanitization)
✅ Secure cookies (HttpOnly, Secure, SameSite)

## 📝 Password Requirements

- Minimum 8 characters
- At least one uppercase letter (A-Z)
- At least one lowercase letter (a-z)
- At least one number (0-9)
- At least one special character (!@#$%^&*...)

Example: `SecurePass123!@#`

## 🧪 Run Automated Tests

```bash
# Start dev server in background
npm run dev &

# Wait for server to start
sleep 5

# Run tests
ts-node scripts/test-auth.ts
```

Tests:
1. ✅ Register new user (valid data)
2. ✅ Register with invalid email (should fail)
3. ✅ Register with weak password (should fail)
4. ✅ Login with correct credentials
5. ✅ Login with wrong password (should fail)
6. ✅ Access protected route with token
7. ✅ Access protected route without token (should fail)
8. ✅ Logout clears session
9. ✅ Token expiration
10. ✅ Rate limiting enforced

## 🔍 Troubleshooting

### "JWT_SECRET not set"
Add to `.env`:
```env
JWT_SECRET=your-secret-key-here
```

### "User already exists"
Use a different email address or delete the user from the database.

### "Too many requests"
Wait for the rate limit to reset (1 minute) or check the `Retry-After` header.

### "Invalid password"
Ensure password meets all requirements:
- 8+ characters
- Uppercase + lowercase
- Number + special character

## 📚 Next Steps

1. **Read full documentation**: `docs/AUTHENTICATION.md`
2. **Check contracts**: `src/types/agent-contracts.ts`
3. **See examples**: `examples/auth-client-example.ts`
4. **Integrate with frontend**: Use the AuthClient class

## 💡 Integration Example

```typescript
import { AuthClient } from '@/examples/auth-client-example';

const auth = new AuthClient({ baseURL: 'http://localhost:3000' });

// Register
await auth.register('user@example.com', 'Test123!@#', 'John Doe');

// Login
await auth.login('user@example.com', 'Test123!@#');

// Get session
const session = await auth.getSession();

// Make authenticated request
const response = await auth.authenticatedFetch('/api/protected');

// Logout
await auth.logout();
```

## ✅ Checklist

- [x] Dependencies installed
- [x] Environment variables configured
- [x] Database schema updated (User table exists)
- [x] All API routes created
- [x] Rate limiting implemented
- [x] Password hashing secure (bcrypt)
- [x] JWT tokens working
- [x] Input validation with Zod
- [x] TypeScript strict mode passing
- [x] Documentation complete

## 🎯 Success Criteria

- ✅ All 4 API routes working
- ✅ Password hashing secure (bcrypt cost 12)
- ✅ JWT tokens working correctly
- ✅ Rate limiting implemented
- ✅ Input validation with Zod
- ✅ TypeScript strict mode passing
- ✅ All tests passing
- ✅ Security best practices followed
- ✅ Documentation complete

## 🚀 Ready to Use!

The authentication system is now fully functional and ready for integration into your TradingWeb application.

For detailed information, see:
- Full documentation: `docs/AUTHENTICATION.md`
- Contract definitions: `src/types/agent-contracts.ts`
- Integration examples: `examples/auth-client-example.ts`
