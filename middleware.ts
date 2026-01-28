import { type NextRequest, NextResponse } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';

// =============================================================================
// TYPES
// =============================================================================

interface RateLimitEntry {
  count: number;
  windowStart: number;
}

interface RateLimitResult {
  allowed: boolean;
  retryAfter?: number;
}

// =============================================================================
// CONFIGURATION
// =============================================================================

const RATE_LIMIT_CONFIG = {
  maxRequests: 1000,    // Max requests per window
  windowMs: 60 * 1000,  // 1 minute window
  cleanupMs: 5 * 60 * 1000, // Cleanup every 5 minutes
} as const;

// =============================================================================
// RATE LIMITER
// =============================================================================

const rateLimitStore = new Map<string, RateLimitEntry>();

function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  return request.headers.get('x-real-ip') || 'unknown';
}

function checkRateLimit(request: NextRequest): RateLimitResult {
  // Only apply to API routes
  if (!request.nextUrl.pathname.startsWith('/api/')) {
    return { allowed: true };
  }

  const ip = getClientIP(request);
  const now = Date.now();
  let entry = rateLimitStore.get(ip);

  // Reset window if expired
  if (!entry || now - entry.windowStart >= RATE_LIMIT_CONFIG.windowMs) {
    entry = { count: 0, windowStart: now };
    rateLimitStore.set(ip, entry);
  }

  entry.count++;

  if (entry.count > RATE_LIMIT_CONFIG.maxRequests) {
    const resetAt = entry.windowStart + RATE_LIMIT_CONFIG.windowMs;
    return { allowed: false, retryAfter: Math.ceil((resetAt - now) / 1000) };
  }

  return { allowed: true };
}

// Periodic cleanup to prevent memory leaks
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    const maxAge = RATE_LIMIT_CONFIG.windowMs * 2;
    for (const [ip, entry] of rateLimitStore.entries()) {
      if (now - entry.windowStart > maxAge) {
        rateLimitStore.delete(ip);
      }
    }
  }, RATE_LIMIT_CONFIG.cleanupMs);
}

// =============================================================================
// MIDDLEWARE
// =============================================================================

export async function middleware(request: NextRequest) {
  // DDoS protection: check global rate limit
  const rateLimit = checkRateLimit(request);
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: 'Too many requests. Please try again later.' },
      { status: 429, headers: { 'Retry-After': String(rateLimit.retryAfter || 60) } }
    );
  }

  // Session management
  return await updateSession(request);
}

export const config = {
  matcher: [
    // Match all paths except static files
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
