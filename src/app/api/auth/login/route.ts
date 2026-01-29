/**
 * POST /api/auth/login
 *
 * User login endpoint
 * - Validates credentials
 * - Compares password hash
 * - Generates JWT token
 * - Sets session cookie
 * - Returns user data + token
 * - Implements rate limiting with exponential backoff
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';
import {
  comparePassword,
  generateToken,
  setAuthCookie,
  sanitizeInput,
} from '@/lib/auth';
import { checkRateLimit, getClientIP } from '@/lib/rate-limiter';

const prisma = new PrismaClient();

/**
 * Login request schema
 */
const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Invalid email address')
    .toLowerCase()
    .transform((val) => sanitizeInput(val)),
  password: z.string().min(1, 'Password is required'),
});

/**
 * Login request type
 */
export type LoginRequest = z.infer<typeof loginSchema>;

/**
 * Track failed login attempts for exponential backoff
 */
interface FailedAttempt {
  count: number;
  lastAttempt: number;
}

const failedAttempts = new Map<string, FailedAttempt>();

/**
 * Calculate backoff delay based on failed attempts
 *
 * @param email - User email
 * @returns Delay in milliseconds
 */
function calculateBackoff(email: string): number {
  const attempt = failedAttempts.get(email);

  if (!attempt) {
    return 0;
  }

  // Exponential backoff: 2^count seconds, max 60 seconds
  const delay = Math.min(Math.pow(2, attempt.count) * 1000, 60000);
  const timeSinceLastAttempt = Date.now() - attempt.lastAttempt;

  return Math.max(0, delay - timeSinceLastAttempt);
}

/**
 * Record failed login attempt
 *
 * @param email - User email
 */
function recordFailedAttempt(email: string): void {
  const attempt = failedAttempts.get(email);

  if (attempt) {
    attempt.count++;
    attempt.lastAttempt = Date.now();
    failedAttempts.set(email, attempt);
  } else {
    failedAttempts.set(email, {
      count: 1,
      lastAttempt: Date.now(),
    });
  }
}

/**
 * Clear failed login attempts
 *
 * @param email - User email
 */
function clearFailedAttempts(email: string): void {
  failedAttempts.delete(email);
}

/**
 * POST handler for user login
 */
export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const ip = getClientIP(request.headers);
    const rateLimitResult = checkRateLimit(ip, {
      maxRequests: 5,
      windowMs: 60 * 1000, // 1 minute
    });

    if (!rateLimitResult.allowed) {
      const retryAfterSeconds = Math.ceil(
        (rateLimitResult.retryAfter || 0) / 1000
      );

      return NextResponse.json(
        {
          success: false,
          error: 'Too many login attempts. Please try again later.',
        },
        {
          status: 429,
          headers: {
            'Retry-After': retryAfterSeconds.toString(),
            'X-RateLimit-Limit': '5',
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': new Date(
              rateLimitResult.resetTime
            ).toISOString(),
          },
        }
      );
    }

    // Parse request body
    const body: unknown = await request.json();

    // Validate input
    const validationResult = loginSchema.safeParse(body);

    if (!validationResult.success) {
      const errors = validationResult.error.errors.map((e) => e.message).join('. ');

      return NextResponse.json(
        {
          success: false,
          error: errors,
        },
        { status: 400 }
      );
    }

    const { email, password } = validationResult.data;

    // Check for exponential backoff
    const backoffDelay = calculateBackoff(email);

    if (backoffDelay > 0) {
      const retryAfterSeconds = Math.ceil(backoffDelay / 1000);

      return NextResponse.json(
        {
          success: false,
          error: 'Too many failed login attempts. Please try again later.',
        },
        {
          status: 429,
          headers: {
            'Retry-After': retryAfterSeconds.toString(),
          },
        }
      );
    }

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      // Record failed attempt
      recordFailedAttempt(email);

      return NextResponse.json(
        {
          success: false,
          error: 'Invalid email or password',
        },
        { status: 401 }
      );
    }

    // Compare password
    const passwordMatch = await comparePassword(password, user.password);

    if (!passwordMatch) {
      // Record failed attempt
      recordFailedAttempt(email);

      return NextResponse.json(
        {
          success: false,
          error: 'Invalid email or password',
        },
        { status: 401 }
      );
    }

    // Clear failed attempts on successful login
    clearFailedAttempts(email);

    // Generate JWT token
    const { token } = await generateToken({
      userId: user.id,
      email: user.email,
      role: user.role as 'user' | 'admin',
    });

    // Set auth cookie
    const cookieHeader = setAuthCookie(token);

    // Return success response
    const response = NextResponse.json(
      {
        success: true,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role as 'user' | 'admin',
        },
        token,
      },
      { status: 200 }
    );

    // Set cookie in response
    response.headers.set('Set-Cookie', cookieHeader);

    // Add rate limit headers
    response.headers.set('X-RateLimit-Limit', '5');
    response.headers.set(
      'X-RateLimit-Remaining',
      rateLimitResult.remaining.toString()
    );
    response.headers.set(
      'X-RateLimit-Reset',
      new Date(rateLimitResult.resetTime).toISOString()
    );

    return response;
  } catch (error) {
    console.error('Login error:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'An error occurred during login',
      },
      { status: 500 }
    );
  } finally {
    // Cleanup Prisma connection
    await prisma.$disconnect();
  }
}

/**
 * OPTIONS handler for CORS
 */
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
