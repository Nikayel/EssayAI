import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';

type Params = Promise<{ id: string }>;

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

    // Check if user is admin
    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
    });

    if (!dbUser || dbUser.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { summaryText, status, reviewerId } = body;

    // Update review
    const review = await prisma.review.update({
      where: { id },
      data: {
        summaryText,
        status: status || 'IN_PROGRESS',
        reviewerId,
      },
    });

    return NextResponse.json({ success: true, review });
  } catch (error) {
    console.error('Review update error:', error);
    return NextResponse.json(
      { error: 'Failed to update review' },
      { status: 500 }
    );
  }
}
