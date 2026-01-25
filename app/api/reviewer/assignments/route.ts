/**
 * Reviewer Assignments API
 * GET /api/reviewer/assignments - Get reviewer's assigned essays
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';

// =============================================================================
// MIDDLEWARE - Check Reviewer Access
// =============================================================================

async function checkReviewerAccess() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Unauthorized', status: 401 };
  }

  // Check if user is a reviewer
  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { id: true, role: true, email: true },
  });

  if (!dbUser) {
    return { error: 'User not found', status: 404 };
  }

  // Allow both REVIEWER and ADMIN roles
  if (!['REVIEWER', 'ADMIN'].includes(dbUser.role)) {
    return { error: 'Forbidden - Reviewer access required', status: 403 };
  }

  // Find the HumanReviewer record by email
  const reviewer = await prisma.humanReviewer.findUnique({
    where: { email: dbUser.email },
  });

  if (!reviewer && dbUser.role !== 'ADMIN') {
    return { error: 'No reviewer profile found', status: 403 };
  }

  return { user: dbUser, reviewer };
}

// =============================================================================
// GET - Get Reviewer's Assignments
// =============================================================================

export async function GET(request: NextRequest) {
  const auth = await checkReviewerAccess();

  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { reviewer, user } = auth;
  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status');

  try {
    // Build filter
    const where: any = {};

    // If user is ADMIN without a reviewer profile, show all
    // Otherwise, show only their assignments
    if (reviewer) {
      where.reviewerId = reviewer.id;
    }

    if (status) {
      where.status = status;
    }

    // Fetch assignments
    const assignments = await prisma.humanReviewAssignment.findMany({
      where,
      orderBy: [
        { status: 'asc' },
        { dueAt: 'asc' },
      ],
      select: {
        id: true,
        status: true,
        studentEmail: true,
        targetSchool: true,
        essayType: true,
        dueAt: true,
        assignedAt: true,
        completedAt: true,
        createdAt: true,
      },
    });

    // Get stats
    const statsQuery = reviewer
      ? { reviewerId: reviewer.id }
      : {};

    const stats = await prisma.humanReviewAssignment.groupBy({
      by: ['status'],
      where: statsQuery,
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
        createdAt: a.createdAt,
        isOverdue: a.dueAt < new Date() && a.status !== 'COMPLETED',
      })),
    });
  } catch (error) {
    console.error('Failed to fetch reviewer assignments:', error);
    return NextResponse.json(
      { error: 'Failed to fetch assignments' },
      { status: 500 }
    );
  }
}
