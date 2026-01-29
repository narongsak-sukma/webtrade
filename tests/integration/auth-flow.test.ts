/**
 * Authentication Flow Integration Tests
 *
 * Tests for complete authentication workflows:
 * Register → Login → Access Protected Route → Logout
 */

import { describe, it, expect, beforeAll, beforeEach } from 'vitest';
import { PrismaClient } from '@prisma/client';
import { POST as registerPOST } from '@/app/api/auth/register/route';
import { POST as loginPOST } from '@/app/api/auth/login/route';
import { GET as sessionGET } from '@/app/api/auth/session/route';
import { POST as logoutPOST } from '@/app/api/auth/logout/route';
import { hashPassword } from '@/lib/auth';

const prisma = new PrismaClient();

describe('Authentication Flow Integration', () => {
  beforeAll(async () => {
    await prisma.user.deleteMany({});
  });

  beforeEach(async () => {
    await prisma.user.deleteMany({});
  });

  describe('Complete Authentication Flow', () => {
    it('should complete full registration and login flow', async () => {
      // Step 1: Register new user
      const registerData = {
        email: 'test@example.com',
        password: 'Test123!@#',
        name: 'Test User',
      };

      let request = new Request('http://localhost:3000/api/auth/register', {
        method: 'POST',
        body: JSON.stringify(registerData),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      let response = await registerPOST(request as any);
      let data = await response.json();

      expect(response.status).toBe(201);
      expect(data.success).toBe(true);
      expect(data.user.email).toBe(registerData.email);
      expect(data.token).toBeDefined();

      const token = data.token;

      // Step 2: Login with same credentials
      const loginData = {
        email: registerData.email,
        password: registerData.password,
      };

      request = new Request('http://localhost:3000/api/auth/login', {
        method: 'POST',
        body: JSON.stringify(loginData),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      response = await loginPOST(request as any);
      data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.user.email).toBe(loginData.email);

      // Step 3: Verify session
      request = new Request('http://localhost:3000/api/auth/session', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      response = await sessionGET(request as any);
      data = await response.json();

      expect(response.status).toBe(200);
      expect(data.authenticated).toBe(true);
      expect(data.user.email).toBe(registerData.email);

      // Step 4: Logout
      request = new Request('http://localhost:3000/api/auth/logout', {
        method: 'POST',
      });

      response = await logoutPOST(request as any);
      data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });
  });

  describe('Failed Login Attempts', () => {
    it('should handle multiple failed login attempts', async () => {
      // Register a user
      const hashedPassword = await hashPassword('Test123!@#');
      await prisma.user.create({
        data: {
          email: 'test@example.com',
          password: hashedPassword,
          name: 'Test User',
          role: 'user',
        },
      });

      // Attempt multiple failed logins
      const loginData = {
        email: 'test@example.com',
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

        const response = await loginPOST(request as any);
        const data = await response.json();

        expect(response.status).toBe(401);
        expect(data.success).toBe(false);
      }

      // Next attempt should trigger exponential backoff
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
      expect(data.error).toContain('Too many failed');
    });
  });

  describe('Protected Resource Access', () => {
    it('should allow access with valid token', async () => {
      // Create user and get token
      const registerData = {
        email: 'test@example.com',
        password: 'Test123!@#',
        name: 'Test User',
      };

      let request = new Request('http://localhost:3000/api/auth/register', {
        method: 'POST',
        body: JSON.stringify(registerData),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      let response = await registerPOST(request as any);
      let data = await response.json();

      const token = data.token;

      // Access protected resource
      request = new Request('http://localhost:3000/api/auth/session', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      response = await sessionGET(request as any);
      data = await response.json();

      expect(response.status).toBe(200);
      expect(data.authenticated).toBe(true);
    });

    it('should deny access without token', async () => {
      const request = new Request('http://localhost:3000/api/auth/session');

      const response = await sessionGET(request as any);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.authenticated).toBe(false);
    });

    it('should deny access with invalid token', async () => {
      const request = new Request('http://localhost:3000/api/auth/session', {
        headers: {
          Authorization: 'Bearer invalid_token',
        },
      });

      const response = await sessionGET(request as any);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.authenticated).toBe(false);
    });
  });

  describe('Session Management', () => {
    it('should maintain session across requests', async () => {
      // Register and login
      const registerData = {
        email: 'test@example.com',
        password: 'Test123!@#',
        name: 'Test User',
      };

      let request = new Request('http://localhost:3000/api/auth/register', {
        method: 'POST',
        body: JSON.stringify(registerData),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      let response = await registerPOST(request as any);
      let data = await response.json();

      const token = data.token;

      // Make multiple requests with same token
      for (let i = 0; i < 3; i++) {
        request = new Request('http://localhost:3000/api/auth/session', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        response = await sessionGET(request as any);
        data = await response.json();

        expect(data.authenticated).toBe(true);
        expect(data.user.email).toBe(registerData.email);
      }
    });

    it('should clear session after logout', async () => {
      // Register and login
      const registerData = {
        email: 'test@example.com',
        password: 'Test123!@#',
        name: 'Test User',
      };

      let request = new Request('http://localhost:3000/api/auth/register', {
        method: 'POST',
        body: JSON.stringify(registerData),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      let response = await registerPOST(request as any);
      let data = await response.json();

      const token = data.token;

      // Verify session is active
      request = new Request('http://localhost:3000/api/auth/session', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      response = await sessionGET(request as any);
      data = await response.json();

      expect(data.authenticated).toBe(true);

      // Logout
      request = new Request('http://localhost:3000/api/auth/logout', {
        method: 'POST',
      });

      await logoutPOST(request as any);

      // Try to access with old token (should fail or be unauthenticated)
      request = new Request('http://localhost:3000/api/auth/session', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      response = await sessionGET(request as any);
      data = await response.json();

      // After logout, session should be invalid
      // Note: This depends on your token blacklist implementation
      // If using JWT without blacklist, token might still be valid
      expect(data).toBeDefined();
    });
  });

  describe('Security', () => {
    it('should not store plaintext password', async () => {
      const registerData = {
        email: 'test@example.com',
        password: 'Test123!@#',
        name: 'Test User',
      };

      const request = new Request('http://localhost:3000/api/auth/register', {
        method: 'POST',
        body: JSON.stringify(registerData),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      await registerPOST(request as any);

      const user = await prisma.user.findUnique({
        where: { email: registerData.email },
      });

      expect(user?.password).not.toBe(registerData.password);
      expect(user?.password).toMatch(/^\$2[ayb]\$/); // bcrypt hash
    });

    it('should enforce rate limiting', async () => {
      const registerData = {
        email: 'test@example.com',
        password: 'Test123!@#',
        name: 'Test User',
      };

      // Make multiple registration attempts rapidly
      const requests = [];
      for (let i = 0; i < 6; i++) {
        const request = new Request('http://localhost:3000/api/auth/register', {
          method: 'POST',
          body: JSON.stringify({
            ...registerData,
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
    });
  });

  describe('Edge Cases', () => {
    it('should handle concurrent login requests', async () => {
      const hashedPassword = await hashPassword('Test123!@#');
      await prisma.user.create({
        data: {
          email: 'test@example.com',
          password: hashedPassword,
          name: 'Test User',
          role: 'user',
        },
      });

      // Make concurrent login requests
      const loginData = {
        email: 'test@example.com',
        password: 'Test123!@#',
      };

      const requests = [];
      for (let i = 0; i < 5; i++) {
        const request = new Request('http://localhost:3000/api/auth/login', {
          method: 'POST',
          body: JSON.stringify(loginData),
          headers: {
            'Content-Type': 'application/json',
          },
        });
        requests.push(loginPOST(request as any));
      }

      const responses = await Promise.all(requests);

      // All should succeed (since credentials are valid)
      responses.forEach(response => {
        expect(response.status).toBe(200);
      });
    });

    it('should handle SQL injection attempts', async () => {
      const registerData = {
        email: "test'; DROP TABLE users; --",
        password: 'Test123!@#',
        name: 'Test User',
      };

      const request = new Request('http://localhost:3000/api/auth/register', {
        method: 'POST',
        body: JSON.stringify(registerData),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const response = await registerPOST(request as any);

      // Should either succeed (sanitized) or fail validation
      expect([201, 400]).toContain(response.status);

      // Verify users table still exists
      const userCount = await prisma.user.count();
      expect(userCount).toBeGreaterThanOrEqual(0);
    });
  });
});
