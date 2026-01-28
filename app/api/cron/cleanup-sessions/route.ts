/**
 * Session Cleanup Cron Job
 * POST /api/cron/cleanup-sessions
 *
 * This endpoint should be called by a cron job (e.g., Vercel Cron, Railway Cron)
 * to clean up expired analysis sessions and maintain database hygiene.
 *
 * Cleanup rules:
 * - Guest sessions without payment: expire after 24 hours
 * - Failed sessions: expire after 7 days
 * - Completed guest sessions: anonymize essay text after 30 days
 * - Rate limit records: clean up expired entries
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// =============================================================================
// AUTHENTICATION
// =============================================================================

const CRON_SECRET = process.env.CRON_SECRET;

/**
 * Verify cron authorization - DRY helper
 * Returns error response if unauthorized, null if authorized
 */
function verifyCronAuth(request: NextRequest): NextResponse | null {
  const authHeader = request.headers.get('authorization');
  const token = authHeader?.replace('Bearer ', '');

  if (!CRON_SECRET) {
    console.error('[SECURITY] CRON_SECRET environment variable is not set');
    return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
  }

  if (token !== CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  return null; // Authorized
}

// =============================================================================
// CONFIGURATION
// =============================================================================

const TTL = {
  UNPAID_GUEST_SESSION: 24 * 60 * 60 * 1000,      // 24 hours
  FAILED_SESSION: 7 * 24 * 60 * 60 * 1000,        // 7 days
  GUEST_ESSAY_RETENTION: 30 * 24 * 60 * 60 * 1000, // 30 days
  ANALYZING_TIMEOUT: 30 * 60 * 1000,              // 30 minutes (stuck sessions)
};

export async function POST(request: NextRequest) {
  const authError = verifyCronAuth(request);
  if (authError) return authError;

  const now = new Date();
  const stats = {
    expiredUnpaidSessions: 0,
    expiredFailedSessions: 0,
    anonymizedGuestEssays: 0,
    unstuckSessions: 0,
    errors: [] as string[],
  };

  try {
    // 1. Delete unpaid guest sessions older than 24 hours
    const unpaidCutoff = new Date(now.getTime() - TTL.UNPAID_GUEST_SESSION);
    const unpaidResult = await prisma.analysisSession.deleteMany({
      where: {
        userId: null, // Guest sessions
        stripePaymentId: null, // No payment
        createdAt: { lt: unpaidCutoff },
      },
    });
    stats.expiredUnpaidSessions = unpaidResult.count;

    // 2. Delete failed sessions older than 7 days
    const failedCutoff = new Date(now.getTime() - TTL.FAILED_SESSION);
    const failedResult = await prisma.analysisSession.deleteMany({
      where: {
        status: 'FAILED',
        createdAt: { lt: failedCutoff },
      },
    });
    stats.expiredFailedSessions = failedResult.count;

    // 3. Anonymize guest essay text after 30 days (for completed sessions)
    const anonymizeCutoff = new Date(now.getTime() - TTL.GUEST_ESSAY_RETENTION);
    const anonymizeResult = await prisma.analysisSession.updateMany({
      where: {
        userId: null, // Guest sessions only
        status: 'COMPLETED',
        createdAt: { lt: anonymizeCutoff },
        essayText: { not: '[ANONYMIZED]' }, // Not already anonymized
      },
      data: {
        essayText: '[ANONYMIZED]',
        intakeData: {}, // Clear intake data too
      },
    });
    stats.anonymizedGuestEssays = anonymizeResult.count;

    // 4. Mark stuck "ANALYZING" sessions as failed after 30 minutes
    const stuckCutoff = new Date(now.getTime() - TTL.ANALYZING_TIMEOUT);
    const stuckResult = await prisma.analysisSession.updateMany({
      where: {
        status: 'ANALYZING',
        createdAt: { lt: stuckCutoff },
      },
      data: {
        status: 'FAILED',
      },
    });
    stats.unstuckSessions = stuckResult.count;

    // 5. Clean up overdue human review assignments
    const overdueAssignments = await prisma.humanReviewAssignment.updateMany({
      where: {
        status: { in: ['QUEUED', 'ASSIGNED', 'IN_PROGRESS'] },
        dueAt: { lt: now },
      },
      data: {
        status: 'OVERDUE',
      },
    });

    // Log cleanup results
    await prisma.auditLog.create({
      data: {
        action: 'CRON_SESSION_CLEANUP',
        resource: 'ANALYSIS_SESSION',
        details: {
          ...stats,
          overdueAssignments: overdueAssignments.count,
          timestamp: now.toISOString(),
        },
      },
    }).catch(console.error);

    return NextResponse.json({
      success: true,
      stats: {
        ...stats,
        overdueAssignments: overdueAssignments.count,
      },
      message: `Cleaned up ${stats.expiredUnpaidSessions + stats.expiredFailedSessions} expired sessions, anonymized ${stats.anonymizedGuestEssays} guest essays`,
    });

  } catch (error) {
    console.error('Session cleanup error:', error);

    await prisma.auditLog.create({
      data: {
        action: 'CRON_SESSION_CLEANUP_FAILED',
        resource: 'ANALYSIS_SESSION',
        details: {
          error: String(error),
          stats,
          timestamp: now.toISOString(),
        },
      },
    }).catch(console.error);

    return NextResponse.json(
      { error: 'Cleanup failed', stats },
      { status: 500 }
    );
  }
}

// GET for manual testing (requires auth)
export async function GET(request: NextRequest) {
  const authError = verifyCronAuth(request);
  if (authError) return authError;

  return NextResponse.json({
    endpoint: '/api/cron/cleanup-sessions',
    description: 'Session cleanup cron job',
    ttl: {
      unpaidGuestSession: '24 hours',
      failedSession: '7 days',
      guestEssayRetention: '30 days',
      analyzingTimeout: '30 minutes',
    },
    usage: 'POST with Authorization: Bearer <CRON_SECRET>',
  });
}
