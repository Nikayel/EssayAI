/**
 * Admin Reviewers API
 * GET /api/admin/reviewers - List all reviewers
 * POST /api/admin/reviewers - Add new reviewer
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
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

  // Check if user is admin
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
// GET - List Reviewers
// =============================================================================

export async function GET() {
  const auth = await checkAdmin();
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const reviewers = await prisma.humanReviewer.findMany({
      include: {
        _count: {
          select: {
            assignments: true,
          },
        },
        assignments: {
          where: {
            status: { in: ['QUEUED', 'ASSIGNED', 'IN_PROGRESS'] },
          },
          select: { id: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({
      success: true,
      reviewers: reviewers.map((r) => ({
        id: r.id,
        name: r.name,
        email: r.email,
        credentials: r.credentials,
        bio: r.bio,
        schoolExpertise: r.schoolExpertise,
        essayExpertise: r.essayExpertise,
        maxActiveReviews: r.maxActiveReviews,
        isActive: r.isActive,
        totalReviews: r.totalReviews,
        avgRating: r.avgRating,
        activeAssignments: r.assignments.length,
        totalAssignments: r._count.assignments,
        createdAt: r.createdAt,
      })),
    });
  } catch (error) {
    console.error('Failed to fetch reviewers:', error);
    return NextResponse.json({ error: 'Failed to fetch reviewers' }, { status: 500 });
  }
}

// =============================================================================
// POST - Add Reviewer
// =============================================================================

const CreateReviewerSchema = z.object({
  email: z.string().email(),
  name: z.string().min(2),
  credentials: z.string().min(5), // "Former Yale AO, 8 years"
  bio: z.string().optional(),
  schoolExpertise: z.array(z.string()).default([]),
  essayExpertise: z.array(z.string()).default([]),
  maxActiveReviews: z.number().min(1).max(20).default(5),
});

export async function POST(request: NextRequest) {
  const auth = await checkAdmin();
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const body = await request.json();
    const validated = CreateReviewerSchema.parse(body);

    // Check if reviewer already exists
    const existing = await prisma.humanReviewer.findUnique({
      where: { email: validated.email },
    });

    if (existing) {
      return NextResponse.json(
        { error: 'Reviewer with this email already exists' },
        { status: 400 }
      );
    }

    const reviewer = await prisma.humanReviewer.create({
      data: {
        email: validated.email,
        name: validated.name,
        credentials: validated.credentials,
        bio: validated.bio,
        schoolExpertise: validated.schoolExpertise,
        essayExpertise: validated.essayExpertise,
        maxActiveReviews: validated.maxActiveReviews,
        isActive: true,
      },
    });

    return NextResponse.json({
      success: true,
      reviewer: {
        id: reviewer.id,
        name: reviewer.name,
        email: reviewer.email,
        credentials: reviewer.credentials,
      },
    });
  } catch (error) {
    console.error('Failed to create reviewer:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json({ error: 'Failed to create reviewer' }, { status: 500 });
  }
}
