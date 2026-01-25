/**
 * Tiered Analysis Upgrade
 * POST /api/tiered-analysis/upgrade - Upgrade from one tier to another
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';
import { stripe, PRICING } from '@/lib/stripe/config';
import { getUpgradePrice, TIER_CONFIG, type AllTiers } from '@/lib/pricing';

// =============================================================================
// REQUEST VALIDATION
// =============================================================================

const UpgradeRequestSchema = z.object({
  sessionId: z.string(),
  fromTier: z.enum(['quick', 'standard', 'premium', 'ivy_single', 'ivy_bundle_3', 'ivy_bundle_8']),
  toTier: z.enum(['quick', 'standard', 'premium', 'ivy_single', 'ivy_bundle_3', 'ivy_bundle_8']),
  // Optional: Additional schools for bundle upgrades
  additionalSchools: z.array(z.string()).optional(),
});

// =============================================================================
// POST - Create Upgrade Checkout
// =============================================================================

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const body = await request.json();
    const validation = UpgradeRequestSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: validation.error.issues },
        { status: 400 }
      );
    }

    const { sessionId, fromTier, toTier, additionalSchools } = validation.data;

    // Get the original session
    const session = await prisma.analysisSession.findUnique({
      where: { id: sessionId },
    });

    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    // Verify user owns this session (if logged in)
    if (user && session.userId && session.userId !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Calculate upgrade price
    const upgradePrice = getUpgradePrice(fromTier as AllTiers, toTier as AllTiers);

    if (upgradePrice <= 0) {
      return NextResponse.json(
        { error: 'Invalid upgrade path - target tier must be higher value' },
        { status: 400 }
      );
    }

    const toTierConfig = TIER_CONFIG[toTier as AllTiers];

    // Create Stripe checkout for the upgrade difference
    const checkoutSession = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `Upgrade to ${toTierConfig.name}`,
              description: getUpgradeDescription(fromTier, toTier),
              metadata: {
                upgradeFrom: fromTier,
                upgradeTo: toTier,
                originalSessionId: sessionId,
              },
            },
            unit_amount: upgradePrice,
          },
          quantity: 1,
        },
      ],
      customer_email: user?.email || session.userEmail,
      metadata: {
        type: 'upgrade',
        fromTier,
        toTier,
        originalSessionId: sessionId,
        userId: user?.id || session.userId || 'guest',
        additionalSchools: additionalSchools?.join(',') || '',
      },
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/ivy/results/${sessionId}?upgrade=success&tier=${toTier}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/ivy/results/${sessionId}?upgrade=cancelled`,
    });

    // Store pending upgrade info in intakeData
    const existingIntake = session.intakeData as object || {};
    await prisma.analysisSession.update({
      where: { id: sessionId },
      data: {
        intakeData: {
          ...existingIntake,
          pendingUpgrade: {
            toTier,
            stripeSessionId: checkoutSession.id,
            createdAt: new Date().toISOString(),
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      checkoutUrl: checkoutSession.url,
      upgradePrice,
      fromTier,
      toTier,
    });

  } catch (error) {
    console.error('Upgrade checkout error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Upgrade checkout failed' },
      { status: 500 }
    );
  }
}

// =============================================================================
// HELPERS
// =============================================================================

function getUpgradeDescription(fromTier: string, toTier: string): string {
  const upgrades: Record<string, Record<string, string>> = {
    quick: {
      ivy_single: 'Upgrade from Quick Feedback to full Ivy Single School analysis with AO perspective and portfolio analysis.',
      ivy_bundle_3: 'Upgrade from Quick Feedback to Ivy 3-School Bundle with cross-school narrative checking.',
      ivy_bundle_8: 'Upgrade from Quick Feedback to Complete Ivy Coverage for all 8 schools.',
      standard: 'Upgrade from Quick Feedback to Full Analysis with line-by-line feedback.',
    },
    ivy_single: {
      ivy_bundle_3: 'Add 2 more schools to your analysis with cross-school narrative checking.',
      ivy_bundle_8: 'Upgrade to complete coverage for all 8 Ivy League schools.',
    },
    ivy_bundle_3: {
      ivy_bundle_8: 'Add 5 more schools for complete Ivy League coverage with master narrative tracking.',
    },
    standard: {
      premium: 'Add human expert review with detailed margin comments and direct messaging.',
      ivy_single: 'Upgrade to Ivy-specific analysis with AO perspective and portfolio analysis.',
    },
  };

  return upgrades[fromTier]?.[toTier] || `Upgrade from ${fromTier} to ${toTier}`;
}
