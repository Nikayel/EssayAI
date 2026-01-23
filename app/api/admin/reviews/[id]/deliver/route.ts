import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';
import { sendEmail, reviewDeliveredEmail } from '@/lib/email/send';

type Params = Promise<{ id: string }>;

/**
 * POST /api/admin/reviews/[id]/deliver
 * Deliver review and notify student
 */
export async function POST(
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
    const { summaryText, reviewerId } = body;

    // Update review and mark as delivered
    const review = await prisma.review.update({
      where: { id },
      data: {
        summaryText,
        status: 'DELIVERED',
        reviewerId,
        deliveredAt: new Date(),
      },
      include: {
        order: {
          include: {
            user: {
              include: {
                profile: true,
              },
            },
          },
        },
        version: {
          include: {
            essay: true,
          },
        },
      },
    });

    // Send email notification
    const userName = review.order.user.profile?.name || review.order.user.email.split('@')[0];
    await sendEmail({
      to: review.order.user.email,
      subject: '🎉 Your Review is Complete!',
      html: reviewDeliveredEmail(userName, review.version.essay.type.replace(/_/g, ' ')),
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: review.order.userId,
        action: 'REVIEW_DELIVERED',
        resource: 'REVIEW',
        details: {
          reviewId: review.id,
          reviewerId: reviewerId,
        },
      },
    });

    return NextResponse.json({ success: true, review });
  } catch (error) {
    console.error('Review delivery error:', error);
    return NextResponse.json(
      { error: 'Failed to deliver review' },
      { status: 500 }
    );
  }
}
