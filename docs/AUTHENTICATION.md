# Authentication System Documentation

## Overview

This document describes the complete authentication system built for TradingWeb using JWT tokens, bcrypt password hashing, and rate limiting.

## Architecture

### Components

1. **Authentication Utilities** (`src/lib/auth.ts`)
   - Password hashing and verification (bcrypt, cost factor 12)
   - JWT token generation and validation
   - Session management helpers
   - Cookie management

2. **Rate Limiter** (`src/lib/rate-limiter/index.ts`)
   - 5 requests per minute per IP
   - Exponential backoff on failures
   - In-memory storage
   - Automatic cleanup of expired entries

3. **Authentication Middleware** (`src/middleware/auth.ts`)
   - JWT verification
   - Role-based access control (user/admin)
   - Protected route wrappers
   - Token refresh logic

4. **API Routes** (`src/app/api/auth/`)
   - POST `/api/auth/register` - User registration
   - POST `/api/auth/login` - User login
   - GET `/api/auth/session` - Session validation
   - POST `/api/auth/logout` - User logout

## Security Features

### Password Security
- **Hashing**: bcrypt with cost factor 12
- **Requirements**:
  - Minimum 8 characters
  - At least one uppercase letter
  - At least one lowercase letter
  - At least one number
  - At least one special character
- Plain text passwords are never stored

### JWT Tokens
- **Algorithm**: HS256
- **Expiration**: 7 days
- **Payload**: { userId, email, role, iat, exp }
- **Token Refresh**: Automatic refresh when < 1 day remaining
- **Secret**: From environment variable `JWT_SECRET`

### Rate Limiting
- **Limit**: 5 requests per minute per IP
- **Exponential Backoff**: 2^n seconds for failed login attempts (max 60 seconds)
- **Headers**: Rate limit info included in responses
- **Storage**: In-memory with automatic cleanup

### Input Validation
- **Zod Schema**: All inputs validated against strict schemas
- **Sanitization**: XSS prevention through input sanitization
- **SQL Injection**: Prevented by using Prisma ORM

### Security Headers
- `HttpOnly`: Prevents XSS access to cookies
- `Secure`: HTTPS only (in production)
- `SameSite`: Lax to prevent CSRF
- `Set-Cookie`: Proper expiration handling

## API Endpoints

### 1. Register User

**Endpoint**: `POST /api/auth/register`

**Request Body**:
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!@#",
  "name": "John Doe"
}
```

**Success Response** (201):
```json
{
  "success": true,
  "user": {
    "id": "clx1234567890",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "user"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Error Responses**:
- 400: Invalid input (validation errors)
- 409: User already exists
- 429: Rate limit exceeded

**Rate Limit Headers**:
```
X-RateLimit-Limit: 5
X-RateLimit-Remaining: 4
X-RateLimit-Reset: 2024-01-25T12:00:00.000Z
```

### 2. Login

**Endpoint**: `POST /api/auth/login`

**Request Body**:
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!@#"
}
```

**Success Response** (200):
```json
{
  "success": true,
  "user": {
    "id": "clx1234567890",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "user"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Error Responses**:
- 400: Invalid input
- 401: Invalid credentials
- 429: Rate limit exceeded

**Rate Limiting**:
- 5 requests per minute
- Exponential backoff on failed attempts
- Blocked for 2^n seconds (max 60s)

### 3. Get Session

**Endpoint**: `GET /api/auth/session`

**Headers**:
```
Authorization: Bearer <token>
```

or

```
Cookie: auth_token=<token>
```

**Success Response** (200):
```json
{
  "authenticated": true,
  "user": {
    "id": "clx1234567890",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "user"
  },
  "tokenRefreshed": false
}
```

**Error Responses**:
- 401: Not authenticated
- 401: Token expired
- 401: Invalid token

**Token Refresh**:
- Automatically refreshes if < 1 day remaining
- Sets new cookie via `Set-Cookie` header
- Returns `tokenRefreshed: true` when refreshed

### 4. Logout

**Endpoint**: `POST /api/auth/logout`

**Headers**:
```
Authorization: Bearer <token>
```

or

```
Cookie: auth_token=<token>
```

**Success Response** (200):
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

**Cookie**:
- Clears `auth_token` cookie
- Sets expiration to past date

## Usage Examples

### Frontend Integration

```typescript
// Register
async function register(email: string, password: string, name: string) {
  const response = await fetch('/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, name }),
  });

  const data = await response.json();

  if (data.success) {
    // Store token or use cookie (automatically set)
    localStorage.setItem('token', data.token);
  }

  return data;
}

// Login
async function login(email: string, password: string) {
  const response = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  const data = await response.json();

  if (data.success) {
    localStorage.setItem('token', data.token);
  }

  return data;
}

// Get Session
async function getSession() {
  const token = localStorage.getItem('token');

  const response = await fetch('/api/auth/session', {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  return await response.json();
}

// Logout
async function logout() {
  const response = await fetch('/api/auth/logout', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  });

  localStorage.removeItem('token');

  return await response.json();
}
```

### Middleware Usage (Server-Side)

```typescript
import { withAuth, withAdminAuth, extractAuthFromRequest } from '@/middleware/auth';
import { NextRequest, NextResponse } from 'next/server';

// Protect a route
export const GET = withAuth(
  async (request, context) => {
    // Access authenticated user
    const { user } = context;

    return NextResponse.json({
      message: `Hello ${user.email}`,
    });
  },
  { roles: ['user', 'admin'] }
);

// Admin-only route
export const POST = withAdminAuth(async (request, context) => {
  // Only accessible by admins
  return NextResponse.json({
    message: 'Admin access granted',
  });
});

// In route handlers
export async function GET(request: Request) {
  const authContext = await extractAuthFromRequest(request);

  if (!authContext) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  // User is authenticated
  const { user } = authContext;

  return NextResponse.json({ user });
}
```

## Environment Variables

```env
# Required
JWT_SECRET=your-super-secret-jwt-key-change-in-production
DATABASE_URL=postgresql://user:password@localhost:5432/tradingweb

# Optional
NEXTAUTH_URL=http://localhost:3000
NODE_ENV=development
```

## Database Schema

```prisma
model User {
  id        String   @id @default(cuid())
  email     String   @unique
  password  String   // bcrypt hash
  name      String?
  role      String   @default("user") // 'user', 'admin'
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@map("users")
}
```

## Testing

### Manual Testing with cURL

```bash
# Register
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test123!@#","name":"Test User"}'

# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test123!@#"}'

# Get Session
curl -X GET http://localhost:3000/api/auth/session \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"

# Logout
curl -X POST http://localhost:3000/api/auth/logout \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### Automated Testing

Run the test script:

```bash
npm run dev &
sleep 5
ts-node scripts/test-auth.ts
```

## Contract Compliance

This implementation follows the contracts defined in `src/types/agent-contracts.ts`:

```typescript
interface RegisterRequest {
  email: string;
  password: string;
  name: string;
}

interface LoginRequest {
  email: string;
  password: string;
}

interface AuthResponse {
  success: boolean;
  user?: { id, email, name, role };
  token?: string;
  error?: string;
}

interface SessionResponse {
  authenticated: boolean;
  user?: { id, email, name, role };
}
```

## Troubleshooting

### Common Issues

1. **Token verification fails**
   - Ensure `JWT_SECRET` is set in `.env`
   - Check that token hasn't expired
   - Verify token format: `Bearer <token>`

2. **Rate limiting too aggressive**
   - Default: 5 requests per minute
   - Wait for `Retry-After` header value
   - Failed logins trigger exponential backoff

3. **Password validation fails**
   - Must be 8+ characters
   - Must contain uppercase, lowercase, number, special char
   - Example: `SecurePass123!@#`

4. **Database errors**
   - Ensure `DATABASE_URL` is correct
   - Run `npm run db:push` to create User table
   - Check Prisma client is generated: `npm run db:generate`

## Security Best Practices

### Production Deployment

1. **Environment Variables**
   - Use strong, random `JWT_SECRET` (min 32 characters)
   - Never commit `.env` to version control
   - Use different secrets for dev/staging/prod

2. **HTTPS Only**
   - Always use HTTPS in production
   - Set `Secure` flag on cookies
   - Configure proper CORS headers

3. **Token Management**
   - Consider shorter expiration in production (e.g., 1 hour)
   - Implement refresh token rotation
   - Store tokens securely (HttpOnly cookies preferred)

4. **Rate Limiting**
   - Consider using Redis for distributed rate limiting
   - Adjust limits based on your needs
   - Monitor for abuse patterns

5. **Monitoring**
   - Log failed login attempts
   - Set up alerts for suspicious activity
   - Track rate limit violations

## Future Enhancements

- [ ] Email verification on registration
- [ ] Password reset functionality
- [ ] Two-factor authentication (2FA)
- [ ] OAuth integration (Google, GitHub)
- [ ] Session management dashboard
- [ ] Token blacklist for logout
- [ ] IP-based whitelisting/blacklisting
- [ ] Multi-factor authentication for admin routes

## Support

For issues or questions:
1. Check this documentation
2. Review the contract definitions in `src/types/agent-contracts.ts`
3. Examine the implementation files
4. Check environment variables
5. Review database schema
