/**
 * Authentication API Tests
 *
 * Tests for authentication endpoints:
 * - POST /api/auth/register
 * - POST /api/auth/login
 * - GET /api/auth/session
 * - POST /api/auth/logout
 */

import { describe, it, expect, beforeAll, afterEach } from 'vitest';
import { PrismaClient } from '@prisma/client';
import { POST as registerPOST } from '@/app/api/auth/register/route';
import { POST as loginPOST } from '@/app/api/auth/login/route';
import { GET as sessionGET } from '@/app/api/auth/session/route';
import { POST as logoutPOST } from '@/app/api/auth/logout/route';
import { hashPassword } from '@/lib/auth';

const prisma = new PrismaClient();

describe('Authentication API', () => {
  // Cleanup database before tests
  beforeAll(async () => {
    await prisma.user.deleteMany({});
  });

  // Cleanup after each test
  afterEach(async () => {
    await prisma.user.deleteMany({});
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user with valid data', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'Test123!@#',
        name: 'Test User',
      };

      const request = new Request('http://localhost:3000/api/auth/register', {
        method: 'POST',
        body: JSON.stringify(userData),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const response = await registerPOST(request as any);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.success).toBe(true);
      expect(data.user.email).toBe(userData.email);
      expect(data.user.name).toBe(userData.name);
      expect(data.user.role).toBe('user');
      expect(data.token).toBeDefined();

      // Verify user was created in database
      const user = await prisma.user.findUnique({
        where: { email: userData.email },
      });
      expect(user).toBeDefined();
      expect(user?.email).toBe(userData.email);
    });

    it('should reject registration with invalid email', async () => {
      const userData = {
        email: 'invalid-email',
        password: 'Test123!@#',
        name: 'Test User',
      };

      const request = new Request('http://localhost:3000/api/auth/register', {
        method: 'POST',
        body: JSON.stringify(userData),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const response = await registerPOST(request as any);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toContain('email');
    });

    it('should reject registration with weak password', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'weak',
        name: 'Test User',
      };

      const request = new Request('http://localhost:3000/api/auth/register', {
        method: 'POST',
        body: JSON.stringify(userData),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const response = await registerPOST(request as any);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toContain('Password');
    });

    it('should reject registration with duplicate email', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'Test123!@#',
        name: 'Test User',
      };

      // First registration
      const request1 = new Request('http://localhost:3000/api/auth/register', {
        method: 'POST',
        body: JSON.stringify(userData),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      await registerPOST(request1 as any);

      // Second registration with same email
      const request2 = new Request('http://localhost:3000/api/auth/register', {
        method: 'POST',
        body: JSON.stringify(userData),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const response = await registerPOST(request2 as any);
      const data = await response.json();

      expect(response.status).toBe(409);
      expect(data.success).toBe(false);
      expect(data.error).toContain('already exists');
    });

    it('should hash password securely', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'Test123!@#',
        name: 'Test User',
      };

      const request = new Request('http://localhost:3000/api/auth/register', {
        method: 'POST',
        body: JSON.stringify(userData),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      await registerPOST(request as any);

      const user = await prisma.user.findUnique({
        where: { email: userData.email },
      });

      expect(user?.password).not.toBe(userData.password);
      expect(user?.password).toMatch(/^\$2[ayb]\$/); // bcrypt hash format
    });

    it('should enforce rate limiting', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'Test123!@#',
        name: 'Test User',
      };

      // Make 6 requests (limit is 5)
      const requests = [];
      for (let i = 0; i < 6; i++) {
        const request = new Request('http://localhost:3000/api/auth/register', {
          method: 'POST',
          body: JSON.stringify({
            ...userData,
            email: `test${i}@example.com`,
          }),
          headers: {
            'Content-Type': 'application/json',
          },
        });
        requests.push(registerPOST(request as any));
      }

      const responses = await Promise.all(requests);
      const lastResponse = responses[5];
      const data = await lastResponse.json();

      expect(lastResponse.status).toBe(429);
      expect(data.success).toBe(false);
      expect(data.error).toContain('Too many');
    });
  });

  describe('POST /api/auth/login', () => {
    it('should login with correct credentials', async () => {
      // First register a user
      const userData = {
        email: 'test@example.com',
        password: 'Test123!@#',
        name: 'Test User',
      };

      const hashedPassword = await hashPassword(userData.password);
      await prisma.user.create({
        data: {
          email: userData.email,
          password: hashedPassword,
          name: userData.name,
          role: 'user',
        },
      });

      // Now login
      const loginData = {
        email: userData.email,
        password: userData.password,
      };

      const request = new Request('http://localhost:3000/api/auth/login', {
        method: 'POST',
        body: JSON.stringify(loginData),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const response = await loginPOST(request as any);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.user.email).toBe(userData.email);
      expect(data.token).toBeDefined();
    });

    it('should reject login with wrong password', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'Test123!@#',
        name: 'Test User',
      };

      const hashedPassword = await hashPassword(userData.password);
      await prisma.user.create({
        data: {
          email: userData.email,
          password: hashedPassword,
          name: userData.name,
          role: 'user',
        },
      });

      const loginData = {
        email: userData.email,
        password: 'WrongPassword123!@#',
      };

      const request = new Request('http://localhost:3000/api/auth/login', {
        method: 'POST',
        body: JSON.stringify(loginData),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const response = await loginPOST(request as any);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
      expect(data.error).toContain('Invalid');
    });

    it('should reject login with non-existent email', async () => {
      const loginData = {
        email: 'nonexistent@example.com',
        password: 'Test123!@#',
      };

      const request = new Request('http://localhost:3000/api/auth/login', {
        method: 'POST',
        body: JSON.stringify(loginData),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const response = await loginPOST(request as any);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
    });

    it('should implement exponential backoff on failed attempts', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'Test123!@#',
        name: 'Test User',
      };

      const hashedPassword = await hashPassword(userData.password);
      await prisma.user.create({
        data: {
          email: userData.email,
          password: hashedPassword,
          name: userData.name,
          role: 'user',
        },
      });

      // Make multiple failed login attempts
      const loginData = {
        email: userData.email,
        password: 'WrongPassword123!@#',
      };

      for (let i = 0; i < 3; i++) {
        const request = new Request('http://localhost:3000/api/auth/login', {
          method: 'POST',
          body: JSON.stringify(loginData),
          headers: {
            'Content-Type': 'application/json',
          },
        });
        await loginPOST(request as any);
      }

      // Next attempt should trigger backoff
      const request = new Request('http://localhost:3000/api/auth/login', {
        method: 'POST',
        body: JSON.stringify(loginData),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const response = await loginPOST(request as any);
      const data = await response.json();

      expect(response.status).toBe(429);
      expect(data.success).toBe(false);
      expect(data.error).toContain('Too many failed');
    });
  });

  describe('GET /api/auth/session', () => {
    it('should return session data for authenticated user', async () => {
      // Create a user
      const userData = {
        email: 'test@example.com',
        password: 'Test123!@#',
        name: 'Test User',
      };

      const hashedPassword = await hashPassword(userData.password);
      const user = await prisma.user.create({
        data: {
          email: userData.email,
          password: hashedPassword,
          name: userData.name,
          role: 'user',
        },
      });

      // Create request with valid token
      const { generateToken } = await import('@/lib/auth');
      const { token } = await generateToken({
        userId: user.id,
        email: user.email,
        role: user.role as 'user' | 'admin',
      });

      const request = new Request('http://localhost:3000/api/auth/session', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const response = await sessionGET(request as any);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.authenticated).toBe(true);
      expect(data.user.email).toBe(userData.email);
    });

    it('should return unauthenticated for no token', async () => {
      const request = new Request('http://localhost:3000/api/auth/session');

      const response = await sessionGET(request as any);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.authenticated).toBe(false);
    });
  });

  describe('POST /api/auth/logout', () => {
    it('should clear session cookie', async () => {
      const request = new Request('http://localhost:3000/api/auth/logout', {
        method: 'POST',
      });

      const response = await logoutPOST(request as any);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(response.headers.get('Set-Cookie')).toContain('token=;');
    });
  });
});
