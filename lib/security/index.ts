/**
 * Security Utilities
 * Centralized security functions following DRY and Single Responsibility principles
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

export async function verifyAdmin(): Promise<AuthenticatedUser | null> {
  try {
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) return null;

    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { role: true, email: true },
    });

    if (dbUser?.role !== 'ADMIN') return null;

    return { id: user.id, email: dbUser.email, role: dbUser.role };
  } catch {
    return null;
  }
}

export function withAdmin<T>(
  handler: (user: AuthenticatedUser, request: NextRequest) => Promise<NextResponse<T>>
) {
  return async (request: NextRequest): Promise<NextResponse<T | { error: string }>> => {
    const admin = await verifyAdmin();
    if (!admin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 }) as NextResponse<T | { error: string }>;
    }
    return handler(admin, request);
  };
}

// =============================================================================
// IP EXTRACTION
// =============================================================================

export function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    const ip = forwarded.split(',')[0].trim();
    if (isValidIP(ip)) return ip;
  }

  const realIP = request.headers.get('x-real-ip');
  if (realIP && isValidIP(realIP)) return realIP;

  return 'unknown';
}

function isValidIP(ip: string): boolean {
  // IPv4
  if (/^(\d{1,3}\.){3}\d{1,3}$/.test(ip)) {
    return ip.split('.').map(Number).every(n => n >= 0 && n <= 255);
  }
  // IPv6 (simplified)
  return /^([0-9a-fA-F]{0,4}:){2,7}[0-9a-fA-F]{0,4}$/.test(ip);
}

// =============================================================================
// WEBHOOK SIGNATURES (HMAC)
// =============================================================================

export function generateWebhookSignature(payload: string, secret: string): string {
  const timestamp = Math.floor(Date.now() / 1000);
  const signature = crypto
    .createHmac('sha256', secret)
    .update(`${timestamp}.${payload}`)
    .digest('hex');
  return `t=${timestamp},v1=${signature}`;
}

export function verifyWebhookSignature(
  signature: string,
  payload: string,
  secret: string,
  toleranceSec = 300
): boolean {
  try {
    const parts = signature.split(',');
    const timestamp = parseInt(parts.find(p => p.startsWith('t='))?.slice(2) || '', 10);
    const expected = parts.find(p => p.startsWith('v1='))?.slice(3);

    if (!timestamp || !expected) return false;
    if (Math.abs(Date.now() / 1000 - timestamp) > toleranceSec) return false;

    const actual = crypto
      .createHmac('sha256', secret)
      .update(`${timestamp}.${payload}`)
      .digest('hex');

    return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(actual));
  } catch {
    return false;
  }
}

// =============================================================================
// REQUEST IDENTIFIER
// =============================================================================

export function getRequestIdentifier(userId?: string | null, request?: NextRequest): string {
  if (userId) return `user:${userId}`;
  if (request) return `ip:${getClientIP(request)}`;
  return 'anonymous';
}
