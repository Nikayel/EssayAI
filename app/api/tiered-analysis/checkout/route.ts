/**
 * Tiered Analysis Checkout
 * POST /api/tiered-analysis/checkout - Create Stripe checkout session for analysis
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';
import { stripe, PRICING } from '@/lib/stripe/config';
import { getTierConfig, getIvyTierConfig, type AnalysisTier, type IvyTier, type AnyTier } from '@/lib/config';

// =============================================================================
// REQUEST VALIDATION
// =============================================================================

const CheckoutRequestSchema = z.object({
  tier: z.enum(['quick', 'standard', 'premium', 'ivy_single', 'ivy_bundle_3', 'ivy_bundle_8']),
  // Pass intake and essay in metadata for processing after payment
  essayText: z.string().min(50).max(50000),
  intake: z.any(),
  // Optional session ID (for pre-created sessions)
  sessionId: z.string().optional(),
  // Success/cancel URLs
  successUrl: z.string().url().optional(),
  cancelUrl: z.string().url().optional(),
  // Ivy-specific: schools to analyze (for bundles)
  schools: z.array(z.string()).optional(),
  // Ivy-specific: multiple essays per school
  essaysBySchool: z.record(z.string(), z.array(z.object({
    promptId: z.string(),
    essayText: z.string(),
  }))).optional(),
});

// =============================================================================
// POST - Create Checkout Session
// =============================================================================

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const body = await request.json();
    const validation = CheckoutRequestSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: validation.error.issues },
        { status: 400 }
      );
    }

    const { tier, essayText, intake, sessionId, successUrl, cancelUrl, schools, essaysBySchool } = validation.data;

    // Get pricing based on tier
    const priceMap: Record<string, number> = {
      quick: PRICING.ANALYSIS_QUICK,
      standard: PRICING.ANALYSIS_STANDARD,
      premium: PRICING.ANALYSIS_PREMIUM,
      ivy_single: PRICING.IVY_SINGLE,
      ivy_bundle_3: PRICING.IVY_BUNDLE_3,
      ivy_bundle_8: PRICING.IVY_BUNDLE_8,
    };

    const price = priceMap[tier];
    const isIvyTier = tier.startsWith('ivy_');
    const tierConfig = isIvyTier
      ? getIvyTierConfig(tier as IvyTier)
      : getTierConfig(tier as AnalysisTier);

    // Create or get analysis session
    let analysisSession: any;
    if (sessionId) {
      analysisSession = await prisma.analysisSession.findUnique({
        where: { id: sessionId },
      });
      if (!analysisSession) {
        return NextResponse.json({ error: 'Session not found' }, { status: 404 });
      }
    } else {
      // Create new session
      analysisSession = await prisma.analysisSession.create({
        data: {
          userId: user?.id,
          userEmail: user?.email || intake.email || 'pending@payment.com',
          tier,
          paidAmount: price,
          essayText: isIvyTier ? JSON.stringify(essaysBySchool || {}) : essayText,
          intakeData: {
            ...intake,
            // Ivy-specific metadata
            ...(isIvyTier && { ivySchools: schools, essaysBySchool }),
          },
          targetSchool: isIvyTier
            ? (schools?.[0] || intake.essayContext?.targetSchool)
            : (intake.targetSchool || intake.essayContext?.targetSchool),
          essayType: intake.essayType || intake.essayContext?.essayType,
          status: 'PENDING',
        },
      });
    }

    // Create Stripe checkout session
    const checkoutSession = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: tierConfig.displayName,
              description: getTierDescription(tier),
              metadata: {
                tier,
                analysisSessionId: analysisSession.id,
              },
            },
            unit_amount: price,
          },
          quantity: 1,
        },
      ],
      customer_email: user?.email || intake.email,
      metadata: {
        tier,
        analysisSessionId: analysisSession.id,
        userId: user?.id || 'guest',
      },
      success_url: successUrl || `${process.env.NEXT_PUBLIC_APP_URL}/analysis/${analysisSession.id}?payment=success`,
      cancel_url: cancelUrl || `${process.env.NEXT_PUBLIC_APP_URL}/pricing?payment=cancelled`,
    });

    // Update session with Stripe session ID
    await prisma.analysisSession.update({
      where: { id: analysisSession.id },
      data: { stripePaymentId: checkoutSession.id },
    });

    return NextResponse.json({
      success: true,
      checkoutUrl: checkoutSession.url,
      sessionId: analysisSession.id,
      stripeSessionId: checkoutSession.id,
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

// =============================================================================
// HELPERS
// =============================================================================

function getTierDescription(tier: string): string {
  switch (tier) {
    case 'quick':
      return 'Quick essay score with 3-5 actionable items. Instant results.';
    case 'standard':
      return 'Full analysis with line-by-line feedback, school-specific insights, and AO perspective.';
    case 'premium':
      return 'Complete analysis plus human expert review within 48 hours.';
    case 'ivy_single':
      return 'Complete Ivy analysis for ONE school. All essays analyzed as portfolio with school-specific AO perspective.';
    case 'ivy_bundle_3':
      return 'Complete Ivy analysis for THREE schools. Portfolio analysis per school plus cross-school narrative check.';
    case 'ivy_bundle_8':
      return 'Complete Ivy analysis for ALL 8 schools. Full portfolio analysis with master narrative tracking.';
    default:
      return 'Essay analysis';
  }
}
