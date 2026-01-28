import { type NextRequest, NextResponse } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';

// =============================================================================
// GLOBAL RATE LIMITING (DDoS Protection)
// =============================================================================

const globalRateLimitMap = new Map<string, { count: number; windowStart: number }>();
const GLOBAL_RATE_LIMIT = {
  maxRequests: 1000, // 1000 requests per minute per IP
  windowMs: 60 * 1000,
};

function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  return request.headers.get('x-real-ip') || 'unknown';
}

function checkGlobalRateLimit(request: NextRequest): {
  allowed: boolean;
  retryAfter?: number;
} {
  // Only apply to API routes
  if (!request.nextUrl.pathname.startsWith('/api/')) {
    return { allowed: true };
  }

  const ip = getClientIP(request);
  const now = Date.now();

  let entry = globalRateLimitMap.get(ip);

  // Reset if window expired
  if (!entry || now - entry.windowStart >= GLOBAL_RATE_LIMIT.windowMs) {
    entry = { count: 0, windowStart: now };
    globalRateLimitMap.set(ip, entry);
  }

  entry.count++;

  if (entry.count > GLOBAL_RATE_LIMIT.maxRequests) {
    const resetAt = entry.windowStart + GLOBAL_RATE_LIMIT.windowMs;
    return {
      allowed: false,
      retryAfter: Math.ceil((resetAt - now) / 1000),
    };
  }

  return { allowed: true };
}

// Cleanup old entries periodically
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [ip, entry] of globalRateLimitMap.entries()) {
      if (now - entry.windowStart > GLOBAL_RATE_LIMIT.windowMs * 2) {
        globalRateLimitMap.delete(ip);
      }
    }
  }, 5 * 60 * 1000); // Every 5 minutes
}

// =============================================================================
// MAIN MIDDLEWARE
// =============================================================================

export async function middleware(request: NextRequest) {
  // Check global rate limit for API routes
  const rateLimitCheck = checkGlobalRateLimit(request);
  if (!rateLimitCheck.allowed) {
    return NextResponse.json(
      { error: 'Too many requests. Please try again later.' },
      {
        status: 429,
        headers: {
          'Retry-After': String(rateLimitCheck.retryAfter || 60),
        },
      }
    );
  }

  // Continue with session management
  return await updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
