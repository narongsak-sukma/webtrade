/**
 * Authentication Utilities
 *
 * Provides password hashing, JWT token generation/validation,
 * and session management helpers.
 */

import * as bcrypt from 'bcryptjs';
import { SignJWT, jwtVerify } from 'jose';

/**
 * JWT payload structure
 */
export interface JWTPayload {
  userId: string;
  email: string;
  role: 'user' | 'admin';
  iat: number;
  exp: number;
}

/**
 * Token generation result
 */
export interface TokenResult {
  token: string;
  expiresAt: Date;
}

/**
 * Token verification result
 */
export interface TokenVerificationResult {
  valid: boolean;
  payload?: JWTPayload;
  error?: string;
}

/**
 * Get JWT secret from environment
 */
function getJWTSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    throw new Error('JWT_SECRET environment variable is not set');
  }

  return new TextEncoder().encode(secret);
}

/**
 * Hash a password using bcrypt
 *
 * @param password - Plain text password
 * @returns Hashed password
 */
export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 12; // Cost factor as per requirements
  return bcrypt.hash(password, saltRounds);
}

/**
 * Compare a plain text password with a hash
 *
 * @param password - Plain text password
 * @param hash - Hashed password
 * @returns True if passwords match
 */
export async function comparePassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * Generate a JWT token
 *
 * @param payload - Token payload
 * @param expiresIn - Expiration time (default: 7 days)
 * @returns Token string and expiration date
 */
export async function generateToken(
  payload: Omit<JWTPayload, 'iat' | 'exp'>,
  expiresIn: string = '7d'
): Promise<TokenResult> {
  const secret = getJWTSecret();
  const now = Math.floor(Date.now() / 1000);

  // Calculate expiration
  const expInSeconds = parseExpiration(expiresIn);
  const expiresAt = new Date((now + expInSeconds) * 1000);

  const token = await new SignJWT({
    userId: payload.userId,
    email: payload.email,
    role: payload.role,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt(now)
    .setExpirationTime(now + expInSeconds)
    .sign(secret);

  return {
    token,
    expiresAt,
  };
}

/**
 * Verify a JWT token
 *
 * @param token - JWT token string
 * @returns Verification result with payload
 */
export async function verifyToken(token: string): Promise<TokenVerificationResult> {
  try {
    const secret = getJWTSecret();
    const { payload } = await jwtVerify(token, secret);

    return {
      valid: true,
      payload: payload as unknown as JWTPayload,
    };
  } catch (error) {
    if (error instanceof Error) {
      // Check for specific error types
      if (error.message.includes('expired')) {
        return {
          valid: false,
          error: 'Token has expired',
        };
      }
      if (error.message.includes('signature')) {
        return {
          valid: false,
          error: 'Invalid token signature',
        };
      }
    }

    return {
      valid: false,
      error: 'Invalid token',
    };
  }
}

/**
 * Parse expiration string to seconds
 *
 * @param expiration - Expiration string (e.g., '7d', '12h', '30m')
 * @returns Seconds
 */
function parseExpiration(expiration: string): number {
  const match = expiration.match(/^(\d+)([dhms])$/);

  if (!match) {
    throw new Error(`Invalid expiration format: ${expiration}`);
  }

  const value = parseInt(match[1], 10);
  const unit = match[2];

  switch (unit) {
    case 'd':
      return value * 24 * 60 * 60; // days to seconds
    case 'h':
      return value * 60 * 60; // hours to seconds
    case 'm':
      return value * 60; // minutes to seconds
    case 's':
      return value; // seconds
    default:
      throw new Error(`Invalid expiration unit: ${unit}`);
  }
}

/**
 * Extract token from Authorization header
 *
 * @param authHeader - Authorization header value
 * @returns Token string or null
 */
export function extractTokenFromHeader(authHeader: string | null): string | null {
  if (!authHeader) {
    return null;
  }

  // Expecting format: "Bearer <token>"
  const parts = authHeader.split(' ');

  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return null;
  }

  return parts[1];
}

/**
 * Extract token from cookies
 *
 * @param cookieHeader - Cookie header value
 * @returns Token string or null
 */
export function extractTokenFromCookie(cookieHeader: string | null): string | null {
  if (!cookieHeader) {
    return null;
  }

  // Parse cookies
  const cookies = cookieHeader.split(';').map((c) => c.trim());

  for (const cookie of cookies) {
    const [name, value] = cookie.split('=');

    if (name === 'auth_token') {
      return decodeURIComponent(value);
    }
  }

  return null;
}

/**
 * Set authentication cookie
 *
 * @param token - JWT token
 * @returns Set-Cookie header value
 */
export function setAuthCookie(token: string): string {
  const expires = new Date();
  expires.setDate(expires.getDate() + 7); // 7 days

  const cookieValue = `auth_token=${encodeURIComponent(token)}; ` +
    `Path=/; ` +
    `HttpOnly; ` +
    `Secure; ` +
    `SameSite=Lax; ` +
    `Expires=${expires.toUTCString()}`;

  return cookieValue;
}

/**
 * Clear authentication cookie
 *
 * @returns Set-Cookie header value
 */
export function clearAuthCookie(): string {
  const expires = new Date(0); // Set to past date to delete

  const cookieValue = `auth_token=; ` +
    `Path=/; ` +
    `HttpOnly; ` +
    `Secure; ` +
    `SameSite=Lax; ` +
    `Expires=${expires.toUTCString()}`;

  return cookieValue;
}

/**
 * Validate password strength
 *
 * Requirements:
 * - Minimum 8 characters
 * - At least one uppercase letter
 * - At least one lowercase letter
 * - At least one number
 * - At least one special character
 *
 * @param password - Password to validate
 * @returns True if password meets requirements
 */
export function validatePasswordStrength(password: string): boolean {
  // Minimum length
  if (password.length < 8) {
    return false;
  }

  // Uppercase letter
  if (!/[A-Z]/.test(password)) {
    return false;
  }

  // Lowercase letter
  if (!/[a-z]/.test(password)) {
    return false;
  }

  // Number
  if (!/[0-9]/.test(password)) {
    return false;
  }

  // Special character
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    return false;
  }

  return true;
}

/**
 * Sanitize user input to prevent XSS
 *
 * @param input - User input string
 * @returns Sanitized string
 */
export function sanitizeInput(input: string): string {
  return input
    .replace(/[<>]/g, '') // Remove angle brackets
    .trim();
}

/**
 * Generate a secure random token for password reset, etc.
 *
 * @param bytes - Number of bytes (default: 32)
 * @returns Hex-encoded random token
 */
export function generateSecureToken(bytes: number = 32): string {
  const array = new Uint8Array(bytes);

  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    crypto.getRandomValues(array);
  } else {
    // Fallback for Node.js environment
    for (let i = 0; i < array.length; i++) {
      array[i] = Math.floor(Math.random() * 256);
    }
  }

  return Array.from(array, (byte) => byte.toString(16).padStart(2, '0')).join('');
}
