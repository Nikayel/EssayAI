/**
 * Tiered Essay Analysis API
 * POST /api/tiered-analysis - Start a new analysis session
 * GET /api/tiered-analysis - Get pricing info and schema
 *
 * Security:
 * - Rate limiting per user/IP
 * - Payment verification for paid tiers
 * - Session access tokens for guest users
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';
import { getTierConfig, config } from '@/lib/config';
import { runTieredAnalysis, validateIntakeForTier } from '@/lib/scoring/tiers';
import { stripe } from '@/lib/stripe/config';
import { nanoid } from 'nanoid';
import type { AnalysisTier, QuickIntake, FullIntake } from '@/lib/scoring/tiers/types';

// =============================================================================
// RATE LIMITING
// =============================================================================

const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000; // 1 hour
const RATE_LIMITS = {
  quick: 10,      // 10 per hour
  standard: 5,    // 5 per hour
  premium: 5,     // 5 per hour
  anonymous: 3,   // 3 per hour for anonymous
};

function checkRateLimit(identifier: string, tier: string): { allowed: boolean; remaining: number; resetAt: number } {
  const now = Date.now();
  const key = `${identifier}:analysis`;
  const limit = RATE_LIMITS[tier as keyof typeof RATE_LIMITS] || RATE_LIMITS.anonymous;

  const record = rateLimitMap.get(key);

  if (!record || record.resetAt < now) {
    rateLimitMap.set(key, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return { allowed: true, remaining: limit - 1, resetAt: now + RATE_LIMIT_WINDOW_MS };
  }

  if (record.count >= limit) {
    return { allowed: false, remaining: 0, resetAt: record.resetAt };
  }

  record.count++;
  return { allowed: true, remaining: limit - record.count, resetAt: record.resetAt };
}

// =============================================================================
// REQUEST VALIDATION
// =============================================================================

const QuickIntakeSchema = z.object({
  targetSchool: z.string().min(1),
  essayType: z.string().min(1),
  isFirstGen: z.boolean().optional(),
  intendedMajor: z.string().optional(),
});

const EssayContextSchema = z.object({
  targetSchool: z.string().min(1),
  essayType: z.enum([
    'personal_statement',
    'why_us',
    'supplemental',
    'activity',
    'diversity',
    'community',
    'intellectual',
    'short_answer',
  ]),
  essayPrompt: z.string().optional(),
  wordLimit: z.number().min(50).max(5000).optional(),
  biggestConcern: z.enum([
    'too_generic',
    'not_enough_depth',
    'wrong_tone',
    'school_fit',
    'grammar',
    'structure',
    'other',
  ]).optional(),
  draftNumber: z.enum(['first', 'second', 'third_plus', 'final']).optional(),
});

const FullIntakeSchema = z.object({
  demographics: z.object({
    isFirstGen: z.boolean().optional(),
    familyEducationLevel: z.string().optional(),
    isInternational: z.boolean().optional(),
    countryOfOrigin: z.string().optional(),
    primaryLanguage: z.string().optional(),
    immigrationStory: z.string().optional(),
    geographicContext: z.string().optional(),
    schoolType: z.string().optional(),
    familyResponsibilities: z.array(z.string()).optional(),
  }).optional(),
  academic: z.object({
    intendedMajor: z.string().optional(),
    academicInterests: z.array(z.string()).optional(),
    intellectualPassion: z.string().optional(),
    hasResearchExperience: z.boolean().optional(),
    researchDescription: z.string().optional(),
    academicChallenges: z.string().optional(),
  }).optional(),
  activities: z.object({
    spike: z.string().optional(),
    topActivities: z.array(z.string()).optional(),
    activitiesStructured: z.any().optional(),
    workExperience: z.any().optional(),
    leadershipRoles: z.array(z.string()).optional(),
    summerExperiences: z.string().optional(),
  }).optional(),
  personal: z.object({
    identityFactors: z.array(z.string()).optional(),
    significantChallenges: z.string().optional(),
    uniquePerspective: z.string().optional(),
    whatAOsShouldKnow: z.string().optional(),
  }).optional(),
  essayContext: EssayContextSchema,
  voice: z.object({
    toneSample: z.string().optional(),
    writingStyle: z.string().optional(),
    usesHumor: z.boolean().optional(),
  }).optional(),
});

const AnalysisRequestSchema = z.object({
  essayText: z.string().min(50, 'Essay must be at least 50 characters').max(50000),
  tier: z.enum(['quick', 'standard', 'premium']),
  // Quick tier uses minimal intake
  intake: z.union([QuickIntakeSchema, FullIntakeSchema]),
  // User info
  userEmail: z.string().email().optional(),
  // Payment verification - Stripe checkout session ID (required for paid tiers)
  checkoutSessionId: z.string().optional(),
  // Options
  runAsync: z.boolean().optional().default(false),
});

// =============================================================================
// PAYMENT VERIFICATION
// =============================================================================

async function verifyPayment(checkoutSessionId: string, expectedTier: string): Promise<{
  verified: boolean;
  error?: string;
  paymentIntentId?: string;
}> {
  try {
    const session = await stripe.checkout.sessions.retrieve(checkoutSessionId);

    // Check payment status
    if (session.payment_status !== 'paid') {
      return { verified: false, error: 'Payment not completed' };
    }

    // Check tier matches
    if (session.metadata?.tier !== expectedTier) {
      return { verified: false, error: 'Payment tier mismatch' };
    }

    // Check session hasn't been used already
    const existingSession = await prisma.analysisSession.findFirst({
      where: { stripePaymentId: checkoutSessionId },
    });

    if (existingSession) {
      return { verified: false, error: 'Payment already used' };
    }

    return {
      verified: true,
      paymentIntentId: session.payment_intent as string,
    };
  } catch (error) {
    console.error('Payment verification failed:', error);
    return { verified: false, error: 'Payment verification failed' };
  }
}

// =============================================================================
// POST - Start Analysis
// =============================================================================

export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    // Parse request
    const body = await request.json();
    const validation = AnalysisRequestSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: validation.error.issues },
        { status: 400 }
      );
    }

    const { essayText, tier, intake, userEmail, checkoutSessionId, runAsync } = validation.data;

    // Get tier config
    const tierConfig = getTierConfig(tier as AnalysisTier);
    if (!tierConfig) {
      return NextResponse.json({ error: 'Invalid tier' }, { status: 400 });
    }

    // Get authenticated user
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    // Get client IP for rate limiting anonymous users
    const clientIp = request.headers.get('x-forwarded-for')?.split(',')[0] ||
                     request.headers.get('x-real-ip') ||
                     'unknown';
    const rateLimitId = user?.id || clientIp;

    // Check rate limit
    const rateLimit = checkRateLimit(rateLimitId, user ? tier : 'anonymous');
    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          error: 'Rate limit exceeded',
          message: 'Too many analysis requests. Please try again later.',
          retryAfter: Math.ceil((rateLimit.resetAt - Date.now()) / 1000),
        },
        {
          status: 429,
          headers: {
            'Retry-After': String(Math.ceil((rateLimit.resetAt - Date.now()) / 1000)),
            'X-RateLimit-Remaining': '0',
          },
        }
      );
    }

    // Email required for Standard/Premium
    const effectiveEmail = userEmail || user?.email;
    if (tier !== 'quick' && !effectiveEmail) {
      return NextResponse.json(
        { error: 'Email required for Standard and Premium tiers' },
        { status: 400 }
      );
    }

    // Validate intake has required fields for tier
    const intakeValidation = validateIntakeForTier(tier as AnalysisTier, intake as QuickIntake);
    if (!intakeValidation.valid) {
      return NextResponse.json(
        { error: 'Missing required intake fields', missingFields: intakeValidation.missingFields },
        { status: 400 }
      );
    }

    // PAYMENT VERIFICATION for paid tiers
    let verifiedPaymentId: string | undefined;

    if (tier !== 'quick') {
      // Standard and Premium require payment
      if (!checkoutSessionId) {
        return NextResponse.json(
          { error: 'Payment required', message: 'Please complete checkout first.' },
          { status: 402 }
        );
      }

      const paymentVerification = await verifyPayment(checkoutSessionId, tier);
      if (!paymentVerification.verified) {
        return NextResponse.json(
          { error: 'Payment verification failed', message: paymentVerification.error },
          { status: 402 }
        );
      }

      verifiedPaymentId = checkoutSessionId;
    }

    // Generate access token for guest sessions (security)
    const accessToken = !user ? nanoid(32) : undefined;

    // Create analysis session
    const session = await prisma.analysisSession.create({
      data: {
        userId: user?.id,
        userEmail: effectiveEmail || 'anonymous@temp.com',
        tier,
        paidAmount: tier === 'quick' ? 0 : tierConfig.priceInCents, // Quick is free preview
        stripePaymentId: verifiedPaymentId,
        essayText,
        intakeData: {
          ...intake,
          _accessToken: accessToken, // Store access token for guest sessions
        },
        targetSchool: getTargetSchool(intake),
        essayType: getEssayType(intake),
        status: 'ANALYZING',
      },
    });

    // Log audit event
    await prisma.auditLog.create({
      data: {
        userId: user?.id,
        action: 'ANALYSIS_STARTED',
        resource: 'ANALYSIS_SESSION',
        details: {
          sessionId: session.id,
          tier,
          targetSchool: getTargetSchool(intake),
        },
      },
    }).catch(console.error);

    // If async, return session ID immediately
    if (runAsync) {
      // Fire and forget the analysis
      runAnalysisAsync(session.id, essayText, tier as AnalysisTier, intake, effectiveEmail);

      const response: any = {
        success: true,
        sessionId: session.id,
        status: 'analyzing',
        progressUrl: `/api/tiered-analysis/${session.id}/progress`,
        message: 'Analysis started. Use progressUrl to track progress via SSE.',
      };

      // Include access token for guest users
      if (accessToken) {
        response.accessToken = accessToken;
        response.note = 'Save this accessToken - you need it to retrieve results.';
      }

      return NextResponse.json(response, {
        headers: {
          'X-RateLimit-Remaining': String(rateLimit.remaining),
        },
      });
    }

    // Run analysis synchronously
    const result = await runTieredAnalysis(
      essayText,
      tier as AnalysisTier,
      tier === 'quick' ? (intake as QuickIntake) : (intake as FullIntake),
      {
        sessionId: session.id,
        userEmail: effectiveEmail,
      }
    );

    // Update session with results
    await prisma.analysisSession.update({
      where: { id: session.id },
      data: {
        status: tier === 'premium' ? 'HUMAN_QUEUED' : 'COMPLETED',
        aiResult: result as any,
        aiScore: result.overallScore,
        aiCompletedAt: new Date(),
      },
    });

    // Track analytics
    if (user) {
      await prisma.analyticsEvent.create({
        data: {
          userId: user.id,
          event: 'tiered_analysis_complete',
          properties: {
            tier,
            sessionId: session.id,
            overallScore: result.overallScore,
            targetSchool: getTargetSchool(intake),
            processingTimeMs: Date.now() - startTime,
          },
        },
      }).catch(console.error);
    }

    const response: any = {
      success: true,
      sessionId: session.id,
      tier,
      result,
      meta: {
        processingTimeMs: Date.now() - startTime,
      },
    };

    // Include access token for guest users
    if (accessToken) {
      response.accessToken = accessToken;
    }

    return NextResponse.json(response, {
      headers: {
        'X-RateLimit-Remaining': String(rateLimit.remaining),
      },
    });

  } catch (error) {
    console.error('Tiered analysis error:', error);

    // Don't expose internal error details
    return NextResponse.json(
      {
        error: 'Analysis failed',
        message: 'An unexpected error occurred. Please try again.',
      },
      { status: 500 }
    );
  }
}

// =============================================================================
// GET - Pricing and Schema Info
// =============================================================================

export async function GET() {
  return NextResponse.json({
    endpoint: '/api/tiered-analysis',
    version: '2.0.0',
    tiers: {
      quick: {
        name: 'Essay Score',
        price: 'Free',
        priceInCents: 0,
        features: [
          'Overall score with label',
          '3-5 specific actionable items with blunt feedback',
          'AI detection check',
          'Critical issues identified (upgrade to see how to fix)',
        ],
        turnaround: 'Instant',
        note: 'Free preview - see your score and top issues before you pay',
      },
      standard: {
        name: 'Full Analysis',
        price: '$79',
        priceInCents: config.pricing.tiers.standard.priceInCents,
        features: [
          'Everything in Quick',
          'Full dimension breakdown',
          'Line-by-line annotations with fixes',
          'School-specific deep dive',
          'AO perspective insights',
          'Personalized tips',
        ],
        turnaround: 'Instant',
      },
      premium: {
        name: 'Expert Review',
        price: '$249',
        priceInCents: config.pricing.tiers.premium.priceInCents,
        features: [
          'Everything in Standard',
          'AI-generated rewrite suggestions',
          'Human expert review (Former AO or PhD)',
          'Direct email feedback',
          '48-hour turnaround',
        ],
        turnaround: '48 hours',
      },
    },
    inputSchema: {
      quickTier: {
        required: ['targetSchool', 'essayType'],
        optional: ['isFirstGen', 'intendedMajor'],
      },
      standardPremiumTier: {
        required: ['essayContext.targetSchool', 'essayContext.essayType', 'checkoutSessionId'],
        recommended: [
          'demographics',
          'academic.intendedMajor',
          'activities.spike',
          'personal.identityFactors',
          'voice.writingStyle',
        ],
      },
    },
    supportedSchools: [
      'harvard', 'yale', 'princeton', 'columbia',
      'brown', 'dartmouth', 'cornell', 'upenn',
    ],
  });
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

function getTargetSchool(intake: QuickIntake | FullIntake | any): string | undefined {
  if ('targetSchool' in intake) {
    return intake.targetSchool;
  }
  if (intake.essayContext?.targetSchool) {
    return intake.essayContext.targetSchool;
  }
  return undefined;
}

function getEssayType(intake: QuickIntake | FullIntake | any): string | undefined {
  if ('essayType' in intake && typeof intake.essayType === 'string') {
    return intake.essayType;
  }
  if (intake.essayContext?.essayType) {
    return intake.essayContext.essayType;
  }
  return undefined;
}

/**
 * Run analysis asynchronously (fire and forget)
 */
async function runAnalysisAsync(
  sessionId: string,
  essayText: string,
  tier: AnalysisTier,
  intake: QuickIntake | FullIntake | any,
  userEmail?: string
) {
  try {
    const result = await runTieredAnalysis(
      essayText,
      tier,
      tier === 'quick' ? (intake as QuickIntake) : (intake as FullIntake),
      {
        sessionId,
        userEmail,
      }
    );

    // Update session with results
    await prisma.analysisSession.update({
      where: { id: sessionId },
      data: {
        status: tier === 'premium' ? 'HUMAN_QUEUED' : 'COMPLETED',
        aiResult: result as any,
        aiScore: result.overallScore,
        aiCompletedAt: new Date(),
      },
    });
  } catch (error) {
    console.error('Async analysis failed:', error);

    await prisma.analysisSession.update({
      where: { id: sessionId },
      data: {
        status: 'FAILED',
      },
    });
  }
}
