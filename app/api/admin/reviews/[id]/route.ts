import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

type Params = Promise<{ id: string }>;

// Input validation schema
const ReviewUpdateSchema = z.object({
  summaryText: z.string().max(10000).optional(),
  status: z.enum(['PENDING', 'IN_PROGRESS', 'COMPLETED', 'REVISION_NEEDED']).optional(),
  reviewerId: z.string().optional(),
});

/**
 * PATCH /api/admin/reviews/[id]
 * Save review draft
 */
export async function PATCH(
  request: NextRequest,
  context: { params: Params }
) {
  try {
    const { id } = await context.params;
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin or reviewer
    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
    });

    if (!dbUser || (dbUser.role !== 'ADMIN' && dbUser.role !== 'REVIEWER')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Verify review exists first
    const existingReview = await prisma.review.findUnique({
      where: { id },
    });

    if (!existingReview) {
      return NextResponse.json({ error: 'Review not found' }, { status: 404 });
    }

    // If user is a reviewer (not admin), verify they own this review
    if (dbUser.role === 'REVIEWER' && existingReview.reviewerId !== user.id) {
      return NextResponse.json({ error: 'Forbidden - not your review' }, { status: 403 });
    }

    const body = await request.json();

    // Validate input
    const validated = ReviewUpdateSchema.parse(body);
    const { summaryText, status, reviewerId } = validated;

    // Update review
    const review = await prisma.review.update({
      where: { id },
      data: {
        summaryText,
        status: status || 'IN_PROGRESS',
        ...(dbUser.role === 'ADMIN' && reviewerId ? { reviewerId } : {}), // Only admin can reassign
      },
    });

    return NextResponse.json({ success: true, review });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.issues },
        { status: 400 }
      );
    }

    console.error('Review update error:', error);
    return NextResponse.json(
      { error: 'Failed to update review' },
      { status: 500 }
    );
  }
}
