/**
 * Admin Single Reviewer API
 * GET /api/admin/reviewers/[reviewerId] - Get reviewer details
 * PATCH /api/admin/reviewers/[reviewerId] - Update reviewer
 * DELETE /api/admin/reviewers/[reviewerId] - Deactivate reviewer
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';

interface RouteParams {
  params: Promise<{ reviewerId: string }>;
}

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
// GET - Get Reviewer Details
// =============================================================================

export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  const auth = await checkAdmin();
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { reviewerId } = await params;

  try {
    const reviewer = await prisma.humanReviewer.findUnique({
      where: { id: reviewerId },
      include: {
        assignments: {
          orderBy: { createdAt: 'desc' },
          take: 20,
          select: {
            id: true,
            status: true,
            studentEmail: true,
            targetSchool: true,
            essayType: true,
            dueAt: true,
            assignedAt: true,
            completedAt: true,
          },
        },
      },
    });

    if (!reviewer) {
      return NextResponse.json({ error: 'Reviewer not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      reviewer: {
        id: reviewer.id,
        name: reviewer.name,
        email: reviewer.email,
        credentials: reviewer.credentials,
        bio: reviewer.bio,
        schoolExpertise: reviewer.schoolExpertise,
        essayExpertise: reviewer.essayExpertise,
        maxActiveReviews: reviewer.maxActiveReviews,
        isActive: reviewer.isActive,
        totalReviews: reviewer.totalReviews,
        avgRating: reviewer.avgRating,
        createdAt: reviewer.createdAt,
        updatedAt: reviewer.updatedAt,
        recentAssignments: reviewer.assignments,
      },
    });
  } catch (error) {
    console.error('Failed to fetch reviewer:', error);
    return NextResponse.json({ error: 'Failed to fetch reviewer' }, { status: 500 });
  }
}

// =============================================================================
// PATCH - Update Reviewer
// =============================================================================

const UpdateReviewerSchema = z.object({
  name: z.string().min(2).optional(),
  credentials: z.string().min(5).optional(),
  bio: z.string().optional(),
  schoolExpertise: z.array(z.string()).optional(),
  essayExpertise: z.array(z.string()).optional(),
  maxActiveReviews: z.number().min(1).max(20).optional(),
  isActive: z.boolean().optional(),
});

export async function PATCH(
  request: NextRequest,
  { params }: RouteParams
) {
  const auth = await checkAdmin();
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { reviewerId } = await params;

  try {
    const body = await request.json();
    const validated = UpdateReviewerSchema.parse(body);

    const reviewer = await prisma.humanReviewer.update({
      where: { id: reviewerId },
      data: validated,
    });

    return NextResponse.json({
      success: true,
      reviewer: {
        id: reviewer.id,
        name: reviewer.name,
        email: reviewer.email,
        credentials: reviewer.credentials,
        isActive: reviewer.isActive,
      },
    });
  } catch (error) {
    console.error('Failed to update reviewer:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json({ error: 'Failed to update reviewer' }, { status: 500 });
  }
}

// =============================================================================
// DELETE - Deactivate Reviewer (soft delete)
// =============================================================================

export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
) {
  const auth = await checkAdmin();
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { reviewerId } = await params;

  try {
    // Soft delete - just deactivate
    await prisma.humanReviewer.update({
      where: { id: reviewerId },
      data: { isActive: false },
    });

    return NextResponse.json({
      success: true,
      message: 'Reviewer deactivated',
    });
  } catch (error) {
    console.error('Failed to deactivate reviewer:', error);
    return NextResponse.json({ error: 'Failed to deactivate reviewer' }, { status: 500 });
  }
}
