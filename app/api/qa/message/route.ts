import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';

/**
 * POST /api/qa/message
 * Send a message in a Q&A session
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { orderId, text } = body;

    if (!orderId || !text) {
      return NextResponse.json(
        { error: 'Order ID and message text are required' },
        { status: 400 }
      );
    }

    // Verify order belongs to user and is a Q&A package
    const order = await prisma.order.findUnique({
      where: { id: orderId, userId: user.id },
    });

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    const isQAPackage = ['EXPERT_QA_PREMIUM', 'EXPERT_QA_STANDARD'].includes(order.package);
    if (!isQAPackage) {
      return NextResponse.json(
        { error: 'This order is not a Q&A package' },
        { status: 400 }
      );
    }

    // Check if session is still active
    const isPremium = order.package === 'EXPERT_QA_PREMIUM';
    const hoursRemaining = isPremium ? 48 : 24;
    const expiresAt = new Date(order.createdAt.getTime() + hoursRemaining * 60 * 60 * 1000);

    if (new Date() > expiresAt) {
      return NextResponse.json(
        { error: 'Q&A session has expired' },
        { status: 400 }
      );
    }

    // Create message
    const message = await prisma.message.create({
      data: {
        orderId,
        senderId: user.id,
        text,
      },
    });

    // TODO: Send notification to admin/reviewer

    return NextResponse.json({ success: true, message });
  } catch (error) {
    console.error('QA message error:', error);
    return NextResponse.json(
      { error: 'Failed to send message' },
      { status: 500 }
    );
  }
}
