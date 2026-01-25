import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';
import { sendEmail } from '@/lib/email/send';

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

    // Send notification to admin/reviewer
    try {
      // Get admin email from env or use default
      const adminEmail = process.env.ADMIN_NOTIFICATION_EMAIL || 'admin@ivyway.ai';
      const dashboardUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://ivyway.ai';

      await sendEmail({
        to: adminEmail,
        subject: `New Q&A Message - Order ${orderId.slice(0, 8)}`,
        html: `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #7c3aed; color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0; }
    .content { background: #f9fafb; padding: 20px; }
    .message-box { background: white; padding: 15px; border-left: 4px solid #7c3aed; margin: 15px 0; }
    .button { background: #7c3aed; color: white; padding: 12px 25px; text-decoration: none; border-radius: 6px; display: inline-block; margin-top: 15px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h2>New Q&A Message</h2>
    </div>
    <div class="content">
      <p>A student has sent a new message in their Q&A session.</p>

      <div class="message-box">
        <strong>Message:</strong>
        <p>${text.substring(0, 500)}${text.length > 500 ? '...' : ''}</p>
      </div>

      <p><strong>Package:</strong> ${isPremium ? 'Premium' : 'Standard'} Q&A</p>
      <p><strong>Expires:</strong> ${expiresAt.toLocaleDateString()} at ${expiresAt.toLocaleTimeString()}</p>

      <a href="${dashboardUrl}/admin/qa/${orderId}" class="button">
        View & Respond
      </a>
    </div>
  </div>
</body>
</html>
        `,
      });
    } catch (emailError) {
      // Don't fail the request if email fails
      console.error('[QA] Failed to send admin notification:', emailError);
    }

    return NextResponse.json({ success: true, message });
  } catch (error) {
    console.error('QA message error:', error);
    return NextResponse.json(
      { error: 'Failed to send message' },
      { status: 500 }
    );
  }
}
