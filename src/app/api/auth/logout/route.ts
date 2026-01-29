/**
 * POST /api/auth/logout
 *
 * User logout endpoint
 * - Clears session cookie
 * - Invalidates token (client-side)
 * - Returns success response
 */

import { NextRequest, NextResponse } from 'next/server';
import { clearAuthCookie } from '@/lib/auth';

/**
 * POST handler for user logout
 */
export async function POST(request: NextRequest) {
  try {
    // Clear auth cookie
    const cookieHeader = clearAuthCookie();

    // Return success response
    const response = NextResponse.json(
      {
        success: true,
        message: 'Logged out successfully',
      },
      { status: 200 }
    );

    // Set cookie to expire
    response.headers.set('Set-Cookie', cookieHeader);

    return response;
  } catch (error) {
    console.error('Logout error:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'An error occurred during logout',
      },
      { status: 500 }
    );
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
