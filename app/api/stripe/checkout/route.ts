import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';
import { stripe, PRICING } from '@/lib/stripe/config';
import { z } from 'zod';

const CheckoutRequestSchema = z.object({
  package: z.enum([
    'AI_LITE',
    'AI_PRO_SINGLE',
    'AI_PRO_MONTHLY',
    'HUMAN_LITE',
    'HUMAN_FULL_1',
    'HUMAN_FULL_3',
    'HUMAN_FULL_5',
  ]),
  essayId: z.string().optional(),
});

/**
 * POST /api/stripe/checkout
 * Create Stripe checkout session
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validated = CheckoutRequestSchema.parse(body);

    // Get price
    const price = PRICING[validated.package];

    // Create order in database
    const order = await prisma.order.create({
      data: {
        userId: user.id,
        package: validated.package,
        amount: price,
        status: 'PENDING',
        essayId: validated.essayId,
      },
    });

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      mode: validated.package === 'AI_PRO_MONTHLY' ? 'subscription' : 'payment',
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: validated.package.replace(/_/g, ' '),
              description: `EssayEdge AI - ${validated.package}`,
            },
            unit_amount: price,
            ...(validated.package === 'AI_PRO_MONTHLY' && {
              recurring: { interval: 'month' },
            }),
          },
          quantity: 1,
        },
      ],
      customer_email: user.email,
      metadata: {
        orderId: order.id,
        userId: user.id,
        package: validated.package,
      },
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?payment=success&order=${order.id}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/pricing?payment=cancelled`,
    });

    // Update order with Stripe session ID
    await prisma.order.update({
      where: { id: order.id },
      data: { stripeSessionId: session.id },
    });

    return NextResponse.json({
      success: true,
      sessionId: session.id,
      url: session.url,
    });
  } catch (error) {
    console.error('Checkout error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Checkout failed' },
      { status: 500 }
    );
  }
}
