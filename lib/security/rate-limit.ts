/**
 * API Rate Limiting
 * Reusable rate limiting for API routes (separate from global middleware rate limiting)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getClientIP } from './index';

// =============================================================================
// TYPES
// =============================================================================

interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
}

interface RateLimitEntry {
  count: number;
  windowStart: number;
}

// =============================================================================
// STORAGE
// =============================================================================

const store = new Map<string, RateLimitEntry>();

// Cleanup every 2 minutes
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of store.entries()) {
      if (now - entry.windowStart > 10 * 60 * 1000) store.delete(key);
    }
  }, 2 * 60 * 1000);
}

// =============================================================================
// PRESETS
// =============================================================================

export const RATE_LIMITS = {
  standard: { maxRequests: 60, windowMs: 60_000 },
  authenticated: { maxRequests: 100, windowMs: 60_000 },
  write: { maxRequests: 30, windowMs: 60_000 },
  expensive: { maxRequests: 10, windowMs: 60_000 },
  strict: { maxRequests: 5, windowMs: 60_000 },
} as const;

// =============================================================================
// CORE FUNCTION
// =============================================================================

export function checkRateLimit(key: string, config: RateLimitConfig) {
  const now = Date.now();
  let entry = store.get(key);

  if (!entry || now - entry.windowStart >= config.windowMs) {
    entry = { count: 0, windowStart: now };
    store.set(key, entry);
  }

  entry.count++;
  const remaining = Math.max(0, config.maxRequests - entry.count);
  const resetAt = entry.windowStart + config.windowMs;

  return {
    allowed: entry.count <= config.maxRequests,
    remaining,
    resetAt,
    retryAfter: entry.count > config.maxRequests ? Math.ceil((resetAt - now) / 1000) : undefined,
  };
}

// =============================================================================
// HELPERS
// =============================================================================

export function getRateLimitKey(request: NextRequest, userId?: string | null): string {
  return userId ? `user:${userId}` : `ip:${getClientIP(request)}`;
}

export function rateLimitResponse(retryAfter: number): NextResponse {
  return NextResponse.json(
    { error: 'Rate limit exceeded', retryAfter },
    { status: 429, headers: { 'Retry-After': String(retryAfter) } }
  );
}

// =============================================================================
// HIGHER-ORDER WRAPPER
// =============================================================================

export function withRateLimit<T>(
  handler: (request: NextRequest) => Promise<NextResponse<T>>,
  preset: keyof typeof RATE_LIMITS = 'standard',
  getKey?: (request: NextRequest) => string
) {
  return async (request: NextRequest): Promise<NextResponse<T | { error: string }>> => {
    const key = getKey?.(request) ?? `ip:${getClientIP(request)}`;
    const result = checkRateLimit(key, RATE_LIMITS[preset]);

    if (!result.allowed) {
      return rateLimitResponse(result.retryAfter!) as NextResponse<T | { error: string }>;
    }

    return handler(request);
  };
}
