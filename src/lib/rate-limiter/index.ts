/**
 * Rate Limiter Utility
 *
 * Implements rate limiting for API endpoints with:
 * - 5 requests per minute per IP
 * - Exponential backoff on failures
 * - In-memory storage
 */

interface RateLimitEntry {
  count: number;
  resetTime: number;
  blockedUntil?: number;
}

// In-memory storage for rate limiting
const rateLimitStore = new Map<string, RateLimitEntry>();

/**
 * Rate limit configuration
 */
export interface RateLimitConfig {
  /** Maximum requests allowed */
  maxRequests: number;
  /** Time window in milliseconds */
  windowMs: number;
  /** Exponential backoff multiplier */
  backoffMultiplier?: number;
  /** Maximum block time in milliseconds */
  maxBlockTime?: number;
}

/**
 * Rate limit result
 */
export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetTime: number;
  retryAfter?: number;
}

/**
 * Default rate limit: 5 requests per minute
 */
const DEFAULT_CONFIG: RateLimitConfig = {
  maxRequests: 5,
  windowMs: 60 * 1000, // 1 minute
  backoffMultiplier: 2,
  maxBlockTime: 15 * 60 * 1000, // 15 minutes max
};

/**
 * Check if a request should be rate limited
 *
 * @param identifier - Unique identifier (IP address, user ID, etc.)
 * @param config - Rate limit configuration
 * @returns Rate limit result
 */
export function checkRateLimit(
  identifier: string,
  config: RateLimitConfig = DEFAULT_CONFIG
): RateLimitResult {
  const now = Date.now();
  const entry = rateLimitStore.get(identifier);

  // If no entry exists, allow the request
  if (!entry) {
    rateLimitStore.set(identifier, {
      count: 1,
      resetTime: now + config.windowMs,
    });

    return {
      allowed: true,
      remaining: config.maxRequests - 1,
      resetTime: now + config.windowMs,
    };
  }

  // Check if currently blocked (exponential backoff)
  if (entry.blockedUntil && entry.blockedUntil > now) {
    return {
      allowed: false,
      remaining: 0,
      resetTime: entry.resetTime,
      retryAfter: entry.blockedUntil - now,
    };
  }

  // Check if the window has expired
  if (now > entry.resetTime) {
    // Reset the window
    const newEntry: RateLimitEntry = {
      count: 1,
      resetTime: now + config.windowMs,
    };

    rateLimitStore.set(identifier, newEntry);

    return {
      allowed: true,
      remaining: config.maxRequests - 1,
      resetTime: newEntry.resetTime,
    };
  }

  // Increment the counter
  entry.count++;

  // Check if limit exceeded
  if (entry.count > config.maxRequests) {
    // Calculate exponential backoff
    const overBy = entry.count - config.maxRequests;
    const multiplier = config.backoffMultiplier || 2;
    const blockTime = Math.min(
      config.windowMs * Math.pow(multiplier, overBy - 1),
      config.maxBlockTime || Infinity
    );

    entry.blockedUntil = now + blockTime;
    entry.resetTime = now + config.windowMs; // Extend reset time

    rateLimitStore.set(identifier, entry);

    return {
      allowed: false,
      remaining: 0,
      resetTime: entry.resetTime,
      retryAfter: blockTime,
    };
  }

  // Update the entry
  rateLimitStore.set(identifier, entry);

  return {
    allowed: true,
    remaining: config.maxRequests - entry.count,
    resetTime: entry.resetTime,
  };
}

/**
 * Reset rate limit for an identifier
 *
 * @param identifier - Unique identifier to reset
 */
export function resetRateLimit(identifier: string): void {
  rateLimitStore.delete(identifier);
}

/**
 * Clean up expired entries (call periodically)
 *
 * @param maxAge - Maximum age in milliseconds (default: 1 hour)
 */
export function cleanupExpiredEntries(maxAge: number = 60 * 60 * 1000): void {
  const now = Date.now();

  for (const [identifier, entry] of rateLimitStore.entries()) {
    // Remove entries that are well past their reset time
    if (now - entry.resetTime > maxAge) {
      rateLimitStore.delete(identifier);
    }
  }
}

// Clean up expired entries every 10 minutes
if (typeof window === 'undefined') {
  setInterval(
    () => cleanupExpiredEntries(),
    10 * 60 * 1000
  );
}

/**
 * Get client IP address from request headers
 *
 * @param headers - Request headers
 * @returns IP address
 */
export function getClientIP(headers: Headers): string {
  // Check various headers for IP address
  const forwardedFor = headers.get('x-forwarded-for');
  const realIP = headers.get('x-real-ip');
  const cfConnectingIP = headers.get('cf-connecting-ip');

  if (forwardedFor) {
    // x-forwarded-for can contain multiple IPs, take the first one
    return forwardedFor.split(',')[0].trim();
  }

  if (realIP) {
    return realIP;
  }

  if (cfConnectingIP) {
    return cfConnectingIP;
  }

  // Fallback to a generic identifier
  return 'unknown';
}

/**
 * Express/Next.js middleware helper
 *
 * @param config - Rate limit configuration
 * @returns Middleware function
 */
export function createRateLimitMiddleware(config?: RateLimitConfig) {
  return async (request: Request): Promise<{ allowed: boolean; error?: string }> => {
    const headers = new Headers(request.headers);
    const identifier = getClientIP(headers);
    const result = checkRateLimit(identifier, config);

    if (!result.allowed) {
      const retryAfterSeconds = Math.ceil((result.retryAfter || 0) / 1000);

      return {
        allowed: false,
        error: `Too many requests. Try again in ${retryAfterSeconds} seconds.`,
      };
    }

    return { allowed: true };
  };
}
