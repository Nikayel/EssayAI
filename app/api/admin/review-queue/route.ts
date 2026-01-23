/**
 * Admin Review Queue API
 * GET /api/admin/review-queue - Get all pending/active reviews
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';

// =============================================================================
// MIDDLEWARE - Check Admin
// =============================================================================

async function checkAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Unauthorized', status: 401 };
  }

  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { role: true },
  });

  if (dbUser?.role !== 'ADMIN') {
    return { error: 'Forbidden - Admin access required', status: 403 };
  }

  return { user };
}

// =============================================================================
// GET - Get Review Queue
// =============================================================================

export async function GET(request: NextRequest) {
  const auth = await checkAdmin();
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status');
  const reviewerId = searchParams.get('reviewerId');

  try {
    // Build filter
    const where: any = {};

    if (status) {
      where.status = status;
    } else {
      // Default: show non-completed
      where.status = { in: ['QUEUED', 'ASSIGNED', 'IN_PROGRESS', 'OVERDUE'] };
    }

    if (reviewerId) {
      where.reviewerId = reviewerId;
    }

    const assignments = await prisma.humanReviewAssignment.findMany({
      where,
      include: {
        reviewer: {
          select: {
            id: true,
            name: true,
            email: true,
            credentials: true,
          },
        },
      },
      orderBy: [
        { status: 'asc' },
        { dueAt: 'asc' },
      ],
    });

    // Get stats
    const stats = await prisma.humanReviewAssignment.groupBy({
      by: ['status'],
      _count: { id: true },
    });

    const statsMap = stats.reduce((acc, s) => {
      acc[s.status] = s._count.id;
      return acc;
    }, {} as Record<string, number>);

    return NextResponse.json({
      success: true,
      stats: {
        queued: statsMap['QUEUED'] || 0,
        assigned: statsMap['ASSIGNED'] || 0,
        inProgress: statsMap['IN_PROGRESS'] || 0,
        completed: statsMap['COMPLETED'] || 0,
        overdue: statsMap['OVERDUE'] || 0,
      },
      assignments: assignments.map((a) => ({
        id: a.id,
        status: a.status,
        studentEmail: a.studentEmail,
        targetSchool: a.targetSchool,
        essayType: a.essayType,
        dueAt: a.dueAt,
        assignedAt: a.assignedAt,
        completedAt: a.completedAt,
        isOverdue: a.dueAt < new Date() && a.status !== 'COMPLETED',
        reviewer: a.reviewer,
        createdAt: a.createdAt,
      })),
    });
  } catch (error) {
    console.error('Failed to fetch review queue:', error);
    return NextResponse.json({ error: 'Failed to fetch review queue' }, { status: 500 });
  }
}
