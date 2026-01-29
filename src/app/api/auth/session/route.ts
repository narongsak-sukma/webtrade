/**
 * GET /api/auth/session
 *
 * Session validation endpoint
 * - Validates JWT token
 * - Returns current user data
 * - Handles expired tokens gracefully
 */

import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import {
  verifyToken,
  extractTokenFromHeader,
  extractTokenFromCookie,
} from '@/lib/auth';

const prisma = new PrismaClient();

/**
 * GET handler for session validation
 */
export async function GET(request: NextRequest) {
  try {
    // Extract token from Authorization header
    let token = extractTokenFromHeader(request.headers.get('authorization'));

    // Try cookie if no header
    if (!token) {
      token = extractTokenFromCookie(request.headers.get('cookie'));
    }

    // No token found
    if (!token) {
      return NextResponse.json(
        {
          authenticated: false,
          error: 'No authentication token provided',
        },
        { status: 401 }
      );
    }

    // Verify token
    const verification = await verifyToken(token);

    if (!verification.valid) {
      const isExpired = verification.error?.includes('expired');

      return NextResponse.json(
        {
          authenticated: false,
          error: verification.error || 'Invalid token',
          expired: isExpired,
        },
        { status: isExpired ? 401 : 401 }
      );
    }

    const payload = verification.payload!;

    // Fetch user from database to ensure they still exist
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    // User not found (may have been deleted)
    if (!user) {
      return NextResponse.json(
        {
          authenticated: false,
          error: 'User not found',
        },
        { status: 401 }
      );
    }

    // Check if token is close to expiration and needs refresh
    const now = Math.floor(Date.now() / 1000);
    const timeUntilExpiry = payload.exp - now;
    const ONE_DAY = 24 * 60 * 60;

    let newToken = token;
    let shouldRefresh = false;

    // Refresh if less than 1 day remaining
    if (timeUntilExpiry < ONE_DAY) {
      const { generateToken, setAuthCookie } = await import('@/lib/auth');

      const tokenResult = await generateToken({
        userId: user.id,
        email: user.email,
        role: user.role as 'user' | 'admin',
      });

      newToken = tokenResult.token;
      shouldRefresh = true;
    }

    // Return success response
    const response = NextResponse.json(
      {
        authenticated: true,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role as 'user' | 'admin',
        },
        tokenRefreshed: shouldRefresh,
      },
      { status: 200 }
    );

    // Set new cookie if token was refreshed
    if (shouldRefresh) {
      const { setAuthCookie } = await import('@/lib/auth');
      const cookieHeader = setAuthCookie(newToken);
      response.headers.set('Set-Cookie', cookieHeader);
    }

    return response;
  } catch (error) {
    console.error('Session validation error:', error);

    return NextResponse.json(
      {
        authenticated: false,
        error: 'An error occurred while validating session',
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
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
