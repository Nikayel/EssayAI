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
const essayHashMap = new Map<string, { count: number; resetAt: number }>(); // Prevent same essay spam

const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000; // 1 hour
const RATE_LIMITS = {
  // Free preview - more restrictive to prevent abuse
  preview: 5,           // 5 free previews per hour per IP
  preview_anonymous: 3, // Anonymous users even more restricted
  // Paid tiers - more generous since they paid
  quick: 20,            // 20 per hour (they paid $9.99)
  standard: 15,         // 15 per hour (they paid $79)
  premium: 15,          // 15 per hour (they paid $249)
  anonymous: 3,         // Fallback for unknown tier
};

function checkRateLimit(identifier: string, tier: string, isAuthenticated: boolean): { allowed: boolean; remaining: number; resetAt: number } {
  const now = Date.now();
  const key = `${identifier}:analysis`;

  // For free preview, use more restrictive limit for anonymous users
  let effectiveTier = tier;
  if (tier === 'preview' && !isAuthenticated) {
    effectiveTier = 'preview_anonymous';
  }

  const limit = RATE_LIMITS[effectiveTier as keyof typeof RATE_LIMITS] || RATE_LIMITS.anonymous;

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

/**
 * Check if the same essay has been submitted too many times (prevent gaming)
 * Uses simple hash of first 500 chars + length
 */
function checkEssaySpam(essayText: string, identifier: string): { allowed: boolean; message?: string } {
  const now = Date.now();
  const essayKey = `${identifier}:${simpleHash(essayText.slice(0, 500) + essayText.length)}`;

  const record = essayHashMap.get(essayKey);
  const MAX_SAME_ESSAY = 3; // Max 3 analyses of same essay per hour

  if (!record || record.resetAt < now) {
    essayHashMap.set(essayKey, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return { allowed: true };
  }

  if (record.count >= MAX_SAME_ESSAY) {
    return {
      allowed: false,
      message: 'You\'ve already analyzed this essay multiple times. Make changes before re-submitting.',
    };
  }

  record.count++;
  return { allowed: true };
}

function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return hash.toString(36);
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
  tier: z.enum(['preview', 'quick', 'standard', 'premium']),
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

    // Get client IP for rate limiting
    const clientIp = request.headers.get('x-forwarded-for')?.split(',')[0] ||
                     request.headers.get('x-real-ip') ||
                     'unknown';
    const rateLimitId = user?.id || clientIp;
    const isAuthenticated = !!user;

    // Check rate limit (pass authentication status for preview tier limits)
    const rateLimit = checkRateLimit(rateLimitId, tier, isAuthenticated);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          error: 'Rate limit exceeded',
          message: tier === 'preview'
            ? 'You\'ve used your free previews for this hour. Upgrade to $9.99 for unlimited feedback.'
            : 'Too many analysis requests. Please try again later.',
          retryAfter: Math.ceil((rateLimit.resetAt - Date.now()) / 1000),
          upgradeHint: tier === 'preview' ? 'Pay $9.99 to unlock full feedback with no limits' : undefined,
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

    // Check essay spam (prevent gaming by submitting same essay repeatedly)
    const essaySpamCheck = checkEssaySpam(essayText, rateLimitId);
    if (!essaySpamCheck.allowed) {
      return NextResponse.json(
        {
          error: 'Duplicate submission',
          message: essaySpamCheck.message,
        },
        { status: 429 }
      );
    }

    // Email required for Standard/Premium (not for preview or quick)
    const effectiveEmail = userEmail || user?.email;
    if (tier !== 'preview' && tier !== 'quick' && !effectiveEmail) {
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
    // Preview = FREE, Quick/Standard/Premium = PAID
    let verifiedPaymentId: string | undefined;

    if (tier !== 'preview') {
      // Quick ($9.99), Standard ($79), and Premium ($249) require payment
      if (!checkoutSessionId) {
        return NextResponse.json(
          { error: 'Payment required', message: `Please complete checkout first. ${tier === 'quick' ? '$9.99' : tier === 'standard' ? '$79' : '$249'} to unlock.` },
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
        paidAmount: tier === 'preview' ? 0 : tierConfig?.priceInCents || 0, // Only preview is free
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
    // Note: Using 'as unknown as' because intake data from client may not exactly match type definition
    const result = await runTieredAnalysis(
      essayText,
      tier as AnalysisTier,
      tier === 'quick' ? (intake as unknown as QuickIntake) : (intake as unknown as FullIntake),
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
    version: '2.1.0',
    tiers: {
      preview: {
        name: 'Free Preview',
        price: 'Free',
        priceInCents: 0,
        features: [
          'Overall score with encouraging context',
          'Issue counts (X critical, Y major problems found)',
          'AI detection warning (flagged or not)',
          'Upgrade teaser showing what you\'ll unlock',
        ],
        turnaround: 'Instant',
        note: 'See your score and how many issues we found - pay $9.99 to see the details',
      },
      quick: {
        name: 'Essay Feedback',
        price: '$9.99',
        priceInCents: 999,
        features: [
          'Everything in Preview PLUS:',
          '3-5 specific issues with blunt, consultant-level feedback',
          'Exact locations of problems in your essay',
          'AI detection details and verdict',
          'Severity ratings (critical/major/minor)',
        ],
        turnaround: 'Instant',
        note: 'Unlock the details - see exactly what\'s wrong and where',
      },
      standard: {
        name: 'Full Analysis',
        price: '$79',
        priceInCents: 7900,
        features: [
          'Everything in Quick PLUS:',
          'Full dimension breakdown (authenticity, reflection, etc.)',
          'Line-by-line annotations with HOW TO FIX each issue',
          'School-specific deep dive with AO perspectives',
          'Your essay\'s strengths to preserve',
          'Personalized tips based on your background',
        ],
        turnaround: 'Instant',
      },
      premium: {
        name: 'Expert Review',
        price: '$249',
        priceInCents: 24900,
        features: [
          'Everything in Standard PLUS:',
          'AI-generated rewrite suggestions for critical issues',
          'Human expert review (Former AO or PhD)',
          'Direct email feedback',
          '48-hour turnaround',
        ],
        turnaround: '48 hours',
      },
    },
    inputSchema: {
      previewAndQuickTier: {
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
