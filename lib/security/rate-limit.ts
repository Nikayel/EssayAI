/**
 * API Rate Limiting Middleware
 * Provides configurable rate limiting for API routes
 */

import { NextRequest, NextResponse } from 'next/server';
import { getClientIP } from './index';

// =============================================================================
// TYPES
// =============================================================================

interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
  keyPrefix?: string;
}

interface RateLimitEntry {
  count: number;
  windowStart: number;
}

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
  headers: Record<string, string>;
}

// =============================================================================
// RATE LIMIT STORAGE
// =============================================================================

// In-memory storage (consider Redis for production at scale)
const rateLimitStore = new Map<string, RateLimitEntry>();

// Cleanup interval - every 2 minutes
setInterval(() => {
  const now = Date.now();
  const maxAge = 10 * 60 * 1000; // 10 minutes

  for (const [key, entry] of rateLimitStore.entries()) {
    if (now - entry.windowStart > maxAge) {
      rateLimitStore.delete(key);
    }
  }
}, 2 * 60 * 1000);

// =============================================================================
// RATE LIMIT PRESETS
// =============================================================================

export const RATE_LIMITS = {
  // Standard API endpoints
  standard: {
    maxRequests: 60,
    windowMs: 60 * 1000, // 60 requests per minute
  },

  // Authenticated user endpoints
  authenticated: {
    maxRequests: 100,
    windowMs: 60 * 1000, // 100 requests per minute
  },

  // Write operations (create, update, delete)
  write: {
    maxRequests: 30,
    windowMs: 60 * 1000, // 30 writes per minute
  },

  // Expensive operations (AI analysis, heavy queries)
  expensive: {
    maxRequests: 10,
    windowMs: 60 * 1000, // 10 per minute
  },

  // Admin endpoints
  admin: {
    maxRequests: 120,
    windowMs: 60 * 1000, // 120 per minute
  },

  // Public endpoints (no auth)
  public: {
    maxRequests: 30,
    windowMs: 60 * 1000, // 30 per minute
  },

  // Strict (sensitive operations)
  strict: {
    maxRequests: 5,
    windowMs: 60 * 1000, // 5 per minute
  },
} as const;

// =============================================================================
// RATE LIMIT FUNCTION
// =============================================================================

/**
 * Check rate limit for a request
 */
export function checkRateLimit(
  identifier: string,
  config: RateLimitConfig
): RateLimitResult {
  const key = config.keyPrefix ? `${config.keyPrefix}:${identifier}` : identifier;
  const now = Date.now();

  let entry = rateLimitStore.get(key);

  // Initialize or reset if window expired
  if (!entry || now - entry.windowStart >= config.windowMs) {
    entry = { count: 0, windowStart: now };
    rateLimitStore.set(key, entry);
  }

  entry.count++;
  const remaining = Math.max(0, config.maxRequests - entry.count);
  const resetAt = entry.windowStart + config.windowMs;

  const headers: Record<string, string> = {
    'X-RateLimit-Limit': String(config.maxRequests),
    'X-RateLimit-Remaining': String(remaining),
    'X-RateLimit-Reset': String(resetAt),
  };

  if (entry.count > config.maxRequests) {
    const retryAfter = Math.ceil((resetAt - now) / 1000);
    headers['Retry-After'] = String(retryAfter);
    return { allowed: false, remaining: 0, resetAt, headers };
  }

  return { allowed: true, remaining, resetAt, headers };
}

/**
 * Create rate limit response for blocked requests
 */
export function rateLimitResponse(retryAfter: number): NextResponse {
  return NextResponse.json(
    {
      error: 'Rate limit exceeded',
      message: 'Too many requests. Please try again later.',
      retryAfter,
    },
    {
      status: 429,
      headers: {
        'Retry-After': String(retryAfter),
      },
    }
  );
}

/**
 * Get rate limit identifier from request
 */
export function getRateLimitKey(
  request: NextRequest,
  userId?: string | null
): string {
  if (userId) {
    return `user:${userId}`;
  }
  return `ip:${getClientIP(request)}`;
}

// =============================================================================
// HIGHER-ORDER FUNCTION FOR ROUTES
// =============================================================================

/**
 * Wrap an API handler with rate limiting
 */
export function withRateLimit<T>(
  handler: (request: NextRequest) => Promise<NextResponse<T>>,
  config: RateLimitConfig | keyof typeof RATE_LIMITS,
  getKey?: (request: NextRequest) => string
) {
  const resolvedConfig = typeof config === 'string' ? RATE_LIMITS[config] : config;

  return async (request: NextRequest): Promise<NextResponse<T | { error: string }>> => {
    const key = getKey ? getKey(request) : `ip:${getClientIP(request)}`;
    const result = checkRateLimit(key, resolvedConfig);

    if (!result.allowed) {
      return rateLimitResponse(
        Math.ceil((result.resetAt - Date.now()) / 1000)
      ) as NextResponse<T | { error: string }>;
    }

    const response = await handler(request);

    // Add rate limit headers to successful response
    const newResponse = new NextResponse(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: new Headers(response.headers),
    });

    Object.entries(result.headers).forEach(([key, value]) => {
      newResponse.headers.set(key, value);
    });

    return newResponse as NextResponse<T | { error: string }>;
  };
}
