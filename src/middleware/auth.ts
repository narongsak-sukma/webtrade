/**
 * Authentication Middleware
 *
 * Provides JWT verification, role-based access control,
 * protected route wrappers, and token refresh logic.
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  verifyToken,
  extractTokenFromHeader,
  extractTokenFromCookie,
  type JWTPayload,
} from '@/lib/auth';

/**
 * Authenticated user context
 */
export interface AuthContext {
  user: {
    id: string;
    email: string;
    role: 'user' | 'admin';
  };
  token: string;
}

/**
 * Middleware options
 */
export interface AuthMiddlewareOptions {
  /** Required roles (if any) */
  roles?: ('user' | 'admin')[];
  /** Allow token from cookie */
  allowCookie?: boolean;
  /** Allow token from Authorization header */
  allowHeader?: boolean;
}

/**
 * Authentication error response
 */
interface AuthError {
  error: string;
  code: 'UNAUTHORIZED' | 'FORBIDDEN' | 'INVALID_TOKEN' | 'EXPIRED_TOKEN';
}

/**
 * Verify JWT token and extract user context
 *
 * @param request - Next.js request
 * @param options - Middleware options
 * @returns Auth context or error
 */
export async function getAuthContext(
  request: NextRequest,
  options: AuthMiddlewareOptions = {}
): Promise<AuthContext | AuthError> {
  const {
    allowCookie = true,
    allowHeader = true,
  } = options;

  let token: string | null = null;

  // Try to extract token from cookie
  if (allowCookie) {
    token = extractTokenFromCookie(request.headers.get('cookie'));
  }

  // Try to extract token from Authorization header
  if (allowHeader && !token) {
    token = extractTokenFromHeader(request.headers.get('authorization'));
  }

  // No token found
  if (!token) {
    return {
      error: 'No authentication token provided',
      code: 'UNAUTHORIZED',
    };
  }

  // Verify token
  const verification = await verifyToken(token);

  if (!verification.valid) {
    if (verification.error?.includes('expired')) {
      return {
        error: 'Token has expired',
        code: 'EXPIRED_TOKEN',
      };
    }

    return {
      error: 'Invalid token',
      code: 'INVALID_TOKEN',
    };
  }

  const payload = verification.payload!;

  // Check role requirements
  if (options.roles && options.roles.length > 0) {
    if (!options.roles.includes(payload.role)) {
      return {
        error: 'Insufficient permissions',
        code: 'FORBIDDEN',
      };
    }
  }

  return {
    user: {
      id: payload.userId,
      email: payload.email,
      role: payload.role,
    },
    token,
  };
}

/**
 * Check if user has required role
 *
 * @param user - User object
 * @param role - Required role
 * @returns True if user has the role
 */
export function hasRole(
  user: { role: 'user' | 'admin' },
  role: 'user' | 'admin'
): boolean {
  return user.role === role;
}

/**
 * Check if user is admin
 *
 * @param user - User object
 * @returns True if user is admin
 */
export function isAdmin(user: { role: 'user' | 'admin' }): boolean {
  return user.role === 'admin';
}

/**
 * Create a middleware wrapper to protect routes
 *
 * @param handler - Route handler function
 * @param options - Auth options
 * @returns Protected route handler
 */
export function withAuth(
  handler: (
    request: NextRequest,
    context: AuthContext
  ) => Promise<NextResponse> | NextResponse,
  options: AuthMiddlewareOptions = {}
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    const authContext = await getAuthContext(request, options);

    if ('error' in authContext) {
      return NextResponse.json(
        { error: authContext.error, code: authContext.code },
        { status: authContext.code === 'FORBIDDEN' ? 403 : 401 }
      );
    }

    return handler(request, authContext);
  };
}

/**
 * Create a middleware that requires admin role
 *
 * @param handler - Route handler function
 * @returns Protected route handler (admin only)
 */
export function withAdminAuth(
  handler: (
    request: NextRequest,
    context: AuthContext
  ) => Promise<NextResponse> | NextResponse
) {
  return withAuth(handler, { roles: ['admin'] });
}

/**
 * Refresh JWT token if close to expiration
 *
 * @param currentToken - Current JWT token
 * @returns New token or null if not needed
 */
export async function refreshTokenIfNeeded(
  currentToken: string
): Promise<string | null> {
  const verification = await verifyToken(currentToken);

  if (!verification.valid || !verification.payload) {
    return null;
  }

  const payload = verification.payload;
  const now = Math.floor(Date.now() / 1000);
  const timeUntilExpiry = payload.exp - now;

  // Refresh if less than 1 day remaining
  const ONE_DAY = 24 * 60 * 60;

  if (timeUntilExpiry < ONE_DAY) {
    // Import generateToken here to avoid circular dependency
    const { generateToken } = await import('@/lib/auth');

    const result = await generateToken({
      userId: payload.userId,
      email: payload.email,
      role: payload.role,
    });

    return result.token;
  }

  return null;
}

/**
 * Create a standardized auth error response
 *
 * @param error - Auth error
 * @returns NextResponse with error
 */
export function createAuthErrorResponse(error: AuthError): NextResponse {
  const statusMap = {
    'UNAUTHORIZED': 401,
    'FORBIDDEN': 403,
    'INVALID_TOKEN': 401,
    'EXPIRED_TOKEN': 401,
  };

  return NextResponse.json(
    { error: error.error, code: error.code },
    { status: statusMap[error.code] }
  );
}

/**
 * Validate session and return user data
 *
 * @param request - Next.js request
 * @returns User data or null
 */
export async function validateSession(
  request: NextRequest
): Promise<{ id: string; email: string; name?: string; role: 'user' | 'admin' } | null> {
  const authContext = await getAuthContext(request);

  if ('error' in authContext) {
    return null;
  }

  // Check if token needs refresh and set new cookie if needed
  const newToken = await refreshTokenIfNeeded(authContext.token);

  if (newToken) {
    // Note: In Next.js App Router, we can't directly set cookies from middleware
    // This would need to be handled in the route handler
  }

  return authContext.user;
}

/**
 * Extract auth context from API request
 * (Helper for route handlers)
 *
 * @param request - Request object
 * @returns Auth context or null
 */
export async function extractAuthFromRequest(
  request: Request
): Promise<AuthContext | null> {
  // Extract token from Authorization header
  const authHeader = request.headers.get('authorization');
  let token = extractTokenFromHeader(authHeader);

  // Try cookie if no header
  if (!token) {
    const cookieHeader = request.headers.get('cookie');
    token = extractTokenFromCookie(cookieHeader);
  }

  if (!token) {
    return null;
  }

  const verification = await verifyToken(token);

  if (!verification.valid || !verification.payload) {
    return null;
  }

  const payload = verification.payload;

  return {
    user: {
      id: payload.userId,
      email: payload.email,
      role: payload.role,
    },
    token,
  };
}
