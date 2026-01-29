/**
 * POST /api/auth/register
 *
 * User registration endpoint
 * - Validates email and password with Zod
 * - Hashes password with bcrypt (cost 12)
 * - Creates user in database
 * - Returns JWT token
 * - Enforces rate limiting (5 req/min)
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';
import {
  hashPassword,
  generateToken,
  setAuthCookie,
  sanitizeInput,
  validatePasswordStrength,
} from '@/lib/auth';
import { checkRateLimit, getClientIP } from '@/lib/rate-limiter';

const prisma = new PrismaClient();

/**
 * Request validation schema
 */
const registerSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Invalid email address')
    .toLowerCase()
    .transform((val) => sanitizeInput(val)),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .refine(
      (val) => validatePasswordStrength(val),
      'Password must contain uppercase, lowercase, number, and special character'
    ),
  name: z
    .string()
    .min(1, 'Name is required')
    .max(100, 'Name must be less than 100 characters')
    .transform((val) => sanitizeInput(val)),
});

/**
 * Register request type
 */
export type RegisterRequest = z.infer<typeof registerSchema>;

/**
 * POST handler for user registration
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
          error: 'Too many registration attempts. Please try again later.',
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
    const validationResult = registerSchema.safeParse(body);

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

    const { email, password, name } = validationResult.data;

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        {
          success: false,
          error: 'User with this email already exists',
        },
        { status: 409 }
      );
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        role: 'user',
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
      },
    });

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
      { status: 201 }
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
    console.error('Registration error:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'An error occurred during registration',
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
