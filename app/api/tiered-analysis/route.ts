/**
 * Tiered Essay Analysis API
 * POST /api/tiered-analysis - Start a new analysis session
 * GET /api/tiered-analysis - Get pricing info and schema
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';
import { getTierConfig, config } from '@/lib/config';
import { runTieredAnalysis, validateIntakeForTier } from '@/lib/scoring/tiers';
import type { AnalysisTier, QuickIntake, FullIntake } from '@/lib/scoring/tiers/types';

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
  // Payment verification (for non-quick tiers)
  paymentIntentId: z.string().optional(),
  // Options
  runAsync: z.boolean().optional().default(false),
});

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

    const { essayText, tier, intake, userEmail, paymentIntentId, runAsync } = validation.data;

    // Get tier config
    const tierConfig = getTierConfig(tier as AnalysisTier);
    if (!tierConfig) {
      return NextResponse.json({ error: 'Invalid tier' }, { status: 400 });
    }

    // Get authenticated user (optional for quick tier)
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

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

    // For non-quick tiers, verify payment (simplified - in production, verify with Stripe)
    if (tier !== 'quick' && !paymentIntentId) {
      // Allow without payment for now - in production, require payment verification
      // return NextResponse.json({ error: 'Payment required for this tier' }, { status: 402 });
    }

    // Create analysis session
    const session = await prisma.analysisSession.create({
      data: {
        userId: user?.id,
        userEmail: effectiveEmail || 'anonymous@temp.com',
        tier,
        paidAmount: tierConfig.priceInCents,
        stripePaymentId: paymentIntentId,
        essayText,
        intakeData: intake,
        targetSchool: getTargetSchool(intake),
        essayType: getEssayType(intake),
        status: 'ANALYZING',
      },
    });

    // If async, return session ID immediately
    if (runAsync) {
      // Fire and forget the analysis
      runAnalysisAsync(session.id, essayText, tier as AnalysisTier, intake, effectiveEmail);

      return NextResponse.json({
        success: true,
        sessionId: session.id,
        status: 'analyzing',
        progressUrl: `/api/tiered-analysis/${session.id}/progress`,
        message: 'Analysis started. Use progressUrl to track progress via SSE.',
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

    return NextResponse.json({
      success: true,
      sessionId: session.id,
      tier,
      result,
      meta: {
        processingTimeMs: Date.now() - startTime,
      },
    });

  } catch (error) {
    console.error('Tiered analysis error:', error);

    return NextResponse.json(
      {
        error: 'Analysis failed',
        message: error instanceof Error ? error.message : 'Unknown error',
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
        price: '$9.99',
        priceInCents: config.pricing.tiers.quick.priceInCents,
        features: [
          'Overall score with label',
          '3-5 specific actionable items',
          'AI detection check',
          'Blurred preview of full analysis',
        ],
        turnaround: 'Instant',
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
        required: ['essayContext.targetSchool', 'essayContext.essayType'],
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
