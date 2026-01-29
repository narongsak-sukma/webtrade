# Agent 2: Backend Specialist - Authentication System

## 🎯 Your Mission

Build a complete authentication system using NextAuth.js for TradingWeb.

## 📋 Deliverables

### 1. API Routes

#### POST /api/auth/register
Register new user account
- Validates email format
- Hashes password with bcrypt
- Creates user in database
- Returns JWT token
- Sends verification email (optional)

**Request**:
```typescript
{
  email: string;
  password: string;
  name: string;
}
```

**Response**:
```typescript
{
  success: boolean;
  user?: { id, email, name, role };
  token?: string;
  error?: string;
}
```

#### POST /api/auth/login
Authenticate existing user
- Validates credentials
- Returns JWT token
- Sets session cookie

#### GET /api/auth/session
Get current session
- Validates JWT token
- Returns user data if authenticated

#### POST /api/auth/logout
Logout user
- Clears session/cookie
- Invalidates token

### 2. Middleware

#### src/middleware/auth.ts
- JWT verification
- Role-based access control
- Protected route wrapper

### 3. Utilities

#### src/lib/auth.ts
- Password hashing
- Token generation
- Token validation
- Session management

### 4. Database

#### Prisma Schema Updates
- Add User table (if not exists)
- Add Session table (optional)

## 🔒 Constraints

- ✅ Use NextAuth.js v5 or custom JWT
- ✅ Follow TypeScript interfaces in `src/types/agent-contracts.ts`
- ✅ Password hashing with bcrypt (cost: 12)
- ✅ JWT tokens expire after 7 days
- ✅ Role-based access (user, admin)
- ✅ Input validation (Zod)
- ✅ Rate limiting on login/register
- ✅ Secure headers (CORS, etc.)

## 📁 Location

Create files in:
- `src/app/api/auth/` - API routes
- `src/middleware/auth.ts` - Middleware
- `src/lib/auth.ts` - Utilities

## 🔐 Security Requirements

1. **Passwords**
   - Hash with bcrypt (cost factor 12)
   - Never store plain text
   - Minimum 8 characters
   - Require uppercase, lowercase, number

2. **Tokens**
   - JWT with HS256 or RS256
   - Secret in .env file
   - Expire after 7 days
   - Include user role in payload

3. **API Security**
   - Rate limiting: 5 requests/minute per IP
   - SQL injection prevention (Prisma)
   - XSS prevention (input sanitization)
   - CSRF tokens on forms

4. **Headers**
   ```
   X-Content-Type-Options: nosniff
   X-Frame-Options: DENY
   X-XSS-Protection: 1; mode=block
   ```

## ✅ Integration Process

1. Create API routes following contracts
2. Implement middleware
3. Write utility functions
4. Test all endpoints
5. Submit for Ralph Loop security review
6. Fix any vulnerabilities identified
7. Integration tested in pages

## 🧪 Testing

Test these scenarios:
- ✅ Register new user
- ✅ Login with correct credentials
- ✅ Login with wrong password (fails)
- ✅ Access protected route with token
- ✅ Access protected route without token (fails)
- ✅ Token expiration
- ✅ Admin vs user role access
- ✅ Rate limiting enforcement

## 📊 Database Schema

```prisma
model User {
  id        String   @id @default(cuid())
  email     String   @unique
  password  String   // bcrypt hash
  name      String?
  role      String   @default("user") // "user" or "admin"
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

## ⚠️ Important

- Ralph Loop will review ALL security aspects
- Must pass security audit
- Must handle edge cases
- Must have comprehensive error messages
- Must log all auth attempts
- Never expose sensitive data in errors

---

**Agent**: Backend Specialist
**Mode**: Controlled (Ralph Loop orchestrates)
**Timeline**: ~2 weeks parallel work
**Review**: Continuous security validation by Ralph Loop
