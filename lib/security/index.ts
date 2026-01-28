/**
 * Security Utilities
 * Centralized security functions for authentication, authorization, and rate limiting
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';
import crypto from 'crypto';

// =============================================================================
// TYPES
// =============================================================================

export interface AuthenticatedUser {
  id: string;
  email?: string;
  role?: string;
}

// =============================================================================
// ADMIN AUTHENTICATION
// =============================================================================

/**
 * Verify admin access - centralized admin check
 * Returns user if admin, null otherwise
 */
export async function verifyAdmin(): Promise<AuthenticatedUser | null> {
  try {
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
      return null;
    }

    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { role: true, email: true },
    });

    if (dbUser?.role !== 'ADMIN') {
      return null;
    }

    return {
      id: user.id,
      email: dbUser.email,
      role: dbUser.role,
    };
  } catch {
    return null;
  }
}

/**
 * Admin-only route wrapper
 */
export function withAdmin<T>(
  handler: (user: AuthenticatedUser, request: NextRequest) => Promise<NextResponse<T>>
) {
  return async (request: NextRequest): Promise<NextResponse<T | { error: string }>> => {
    const admin = await verifyAdmin();
    if (!admin) {
      return NextResponse.json(
        { error: 'Forbidden - Admin access required' },
        { status: 403 }
      ) as NextResponse<T | { error: string }>;
    }
    return handler(admin, request);
  };
}

// =============================================================================
// GLOBAL RATE LIMITING
// =============================================================================

interface GlobalRateLimitEntry {
  count: number;
  windowStart: number;
}

const globalRateLimitMap = new Map<string, GlobalRateLimitEntry>();

// Global rate limit: 1000 requests per minute per IP (DDoS protection)
const GLOBAL_RATE_LIMIT = {
  maxRequests: 1000,
  windowMs: 60 * 1000, // 1 minute
};

/**
 * Check global rate limit (DDoS protection)
 */
export function checkGlobalRateLimit(request: NextRequest): {
  allowed: boolean;
  remaining: number;
  headers: Record<string, string>;
} {
  const ip = getClientIP(request);
  const now = Date.now();

  let entry = globalRateLimitMap.get(ip);

  // Reset if window expired
  if (!entry || now - entry.windowStart >= GLOBAL_RATE_LIMIT.windowMs) {
    entry = { count: 0, windowStart: now };
    globalRateLimitMap.set(ip, entry);
  }

  entry.count++;
  const remaining = Math.max(0, GLOBAL_RATE_LIMIT.maxRequests - entry.count);
  const resetAt = entry.windowStart + GLOBAL_RATE_LIMIT.windowMs;

  const headers: Record<string, string> = {
    'X-RateLimit-Limit': String(GLOBAL_RATE_LIMIT.maxRequests),
    'X-RateLimit-Remaining': String(remaining),
    'X-RateLimit-Reset': String(resetAt),
  };

  if (entry.count > GLOBAL_RATE_LIMIT.maxRequests) {
    headers['Retry-After'] = String(Math.ceil((resetAt - now) / 1000));
    return { allowed: false, remaining: 0, headers };
  }

  return { allowed: true, remaining, headers };
}

// Cleanup old entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [ip, entry] of globalRateLimitMap.entries()) {
    if (now - entry.windowStart > GLOBAL_RATE_LIMIT.windowMs * 2) {
      globalRateLimitMap.delete(ip);
    }
  }
}, 5 * 60 * 1000);

// =============================================================================
// IP EXTRACTION
// =============================================================================

/**
 * Safely extract client IP from request headers
 */
export function getClientIP(request: NextRequest): string {
  // x-forwarded-for can be comma-separated list; take the first (client) IP
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    const ip = forwarded.split(',')[0].trim();
    // Basic validation - IPv4 or IPv6
    if (isValidIP(ip)) {
      return ip;
    }
  }

  const realIP = request.headers.get('x-real-ip');
  if (realIP && isValidIP(realIP)) {
    return realIP;
  }

  return 'unknown';
}

/**
 * Basic IP validation
 */
function isValidIP(ip: string): boolean {
  // IPv4
  const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
  if (ipv4Regex.test(ip)) {
    const parts = ip.split('.').map(Number);
    return parts.every(part => part >= 0 && part <= 255);
  }

  // IPv6 (simplified check)
  const ipv6Regex = /^([0-9a-fA-F]{0,4}:){2,7}[0-9a-fA-F]{0,4}$/;
  return ipv6Regex.test(ip);
}

// =============================================================================
// WEBHOOK SECURITY
// =============================================================================

/**
 * Generate HMAC signature for internal webhook calls
 */
export function generateWebhookSignature(payload: string, secret: string): string {
  const timestamp = Math.floor(Date.now() / 1000);
  const signedPayload = `${timestamp}.${payload}`;
  const signature = crypto
    .createHmac('sha256', secret)
    .update(signedPayload)
    .digest('hex');

  return `t=${timestamp},v1=${signature}`;
}

/**
 * Verify HMAC signature for internal webhook calls
 */
export function verifyWebhookSignature(
  signature: string,
  payload: string,
  secret: string,
  toleranceSeconds: number = 300 // 5 minutes
): boolean {
  try {
    // Parse signature
    const parts = signature.split(',');
    const timestampPart = parts.find(p => p.startsWith('t='));
    const signaturePart = parts.find(p => p.startsWith('v1='));

    if (!timestampPart || !signaturePart) {
      return false;
    }

    const timestamp = parseInt(timestampPart.substring(2), 10);
    const expectedSignature = signaturePart.substring(3);

    // Check timestamp tolerance
    const now = Math.floor(Date.now() / 1000);
    if (Math.abs(now - timestamp) > toleranceSeconds) {
      return false;
    }

    // Verify signature
    const signedPayload = `${timestamp}.${payload}`;
    const actualSignature = crypto
      .createHmac('sha256', secret)
      .update(signedPayload)
      .digest('hex');

    return crypto.timingSafeEqual(
      Buffer.from(expectedSignature),
      Buffer.from(actualSignature)
    );
  } catch {
    return false;
  }
}

// =============================================================================
// REQUEST IDENTIFIER
// =============================================================================

/**
 * Get a consistent identifier for rate limiting
 * Prefers authenticated user ID, falls back to IP
 */
export function getRequestIdentifier(
  userId?: string | null,
  request?: NextRequest
): string {
  if (userId) {
    return `user:${userId}`;
  }

  if (request) {
    const ip = getClientIP(request);
    return `ip:${ip}`;
  }

  return 'anonymous';
}
