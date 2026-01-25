/**
 * Ivy Portfolio Analysis API
 * POST /api/ivy/portfolio - Analyze essays for Ivy League schools
 *
 * Supports:
 * - ivy_single ($39): One school, all essays
 * - ivy_bundle_3 ($79): Three schools
 * - ivy_bundle_8 ($149): All 8 Ivies
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';
import {
  runIvySingleSchoolAnalysis,
  runIvyThreeSchoolAnalysis,
  runIvyAllSchoolsAnalysis,
} from '@/lib/scoring/tiers/ivy-analysis';
import { isIvyLeagueSchool, getIvyTierConfig, type IvyTier } from '@/lib/config';

// =============================================================================
// REQUEST VALIDATION
// =============================================================================

const EssayInputSchema = z.object({
  promptId: z.string().min(1, 'Prompt ID required'),
  essayText: z.string().min(50, 'Essay must be at least 50 characters').max(10000),
});

const SchoolEssaysSchema = z.object({
  schoolId: z.string().refine(isIvyLeagueSchool, { message: 'Invalid Ivy League school' }),
  essays: z.array(EssayInputSchema).min(1, 'At least one essay required').max(5),
});

// Intake validation - require essential fields, make others optional
const IntakeSchema = z.object({
  // Essay context is required
  essayContext: z.object({
    targetSchool: z.string().optional(),
    essayType: z.string().optional(),
    essayPrompt: z.string().optional(),
    wordLimit: z.number().optional(),
    draftNumber: z.string().optional(),
    biggestConcern: z.string().optional(),
  }).optional(),

  // Activities - optional but structured if provided
  activities: z.object({
    spike: z.string().optional(),
    topActivities: z.array(z.any()).optional(),
    leadershipRoles: z.array(z.string()).optional(),
    summerExperiences: z.string().optional(),
  }).optional(),

  // Academic - optional
  academic: z.object({
    intendedMajor: z.string().optional(),
    academicInterests: z.array(z.string()).optional(),
    intellectualPassion: z.string().optional(),
    researchExperience: z.object({
      hasExperience: z.boolean(),
      description: z.string().optional(),
    }).optional(),
    academicChallenges: z.string().optional(),
  }).optional(),

  // Demographics - optional
  demographics: z.object({
    isFirstGen: z.boolean().optional(),
    familyEducationLevel: z.string().optional(),
    isInternational: z.boolean().optional(),
    geographicContext: z.string().optional(),
    schoolType: z.string().optional(),
    familyResponsibilities: z.array(z.string()).optional(),
  }).optional(),

  // Personal - optional
  personal: z.object({
    identityFactors: z.array(z.string()).optional(),
    significantChallenges: z.string().optional(),
    uniquePerspective: z.string().optional(),
    whatAOsShouldKnow: z.string().optional(),
  }).optional(),

  // Voice - optional
  voice: z.object({
    toneSample: z.string().optional(),
    writingStyle: z.string().optional(),
    usesHumor: z.boolean().optional(),
  }).optional(),
}).passthrough(); // Allow additional fields

const IvyAnalysisRequestSchema = z.object({
  tier: z.enum(['ivy_single', 'ivy_bundle_3', 'ivy_bundle_8']),
  schools: z.array(SchoolEssaysSchema).min(1, 'At least one school required'),
  intake: IntakeSchema,
  sessionId: z.string().optional(),
});

// =============================================================================
// POST - Run Ivy Analysis
// =============================================================================

export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const body = await request.json();
    const validation = IvyAnalysisRequestSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: validation.error.issues },
        { status: 400 }
      );
    }

    const { tier, schools, intake, sessionId } = validation.data;
    const tierConfig = getIvyTierConfig(tier as IvyTier);

    // Validate school count matches tier
    if (!validateSchoolCount(tier, schools.length)) {
      return NextResponse.json({
        error: `${tier} tier supports ${tierConfig.features.schoolsIncluded} school(s), got ${schools.length}`,
      }, { status: 400 });
    }

    // Verify payment if sessionId provided
    if (sessionId) {
      const session = await prisma.analysisSession.findUnique({
        where: { id: sessionId },
      });

      if (!session) {
        return NextResponse.json({ error: 'Session not found' }, { status: 404 });
      }

      if (session.status !== 'PAID' && session.status !== 'ANALYZING') {
        return NextResponse.json({ error: 'Payment not completed' }, { status: 402 });
      }

      // Mark as analyzing
      await prisma.analysisSession.update({
        where: { id: sessionId },
        data: { status: 'ANALYZING' },
      });
    }

    // Run analysis based on tier
    let result;

    switch (tier) {
      case 'ivy_single':
        result = await runIvySingleSchoolAnalysis(
          schools[0].schoolId,
          schools[0].essays,
          intake
        );
        break;

      case 'ivy_bundle_3':
        result = await runIvyThreeSchoolAnalysis(
          schools.map(s => ({ schoolId: s.schoolId, essays: s.essays })),
          intake
        );
        break;

      case 'ivy_bundle_8':
        result = await runIvyAllSchoolsAnalysis(
          schools.map(s => ({ schoolId: s.schoolId, essays: s.essays })),
          intake
        );
        break;
    }

    // Update session with results
    if (sessionId) {
      await prisma.analysisSession.update({
        where: { id: sessionId },
        data: {
          status: 'COMPLETED',
          aiResult: result as any,
          aiScore: getOverallScore(result),
          aiCompletedAt: new Date(),
        },
      });
    }

    return NextResponse.json({
      success: true,
      tier,
      result,
      metadata: {
        schoolsAnalyzed: schools.length,
        totalEssays: schools.reduce((sum, s) => sum + s.essays.length, 0),
        processingTimeMs: Date.now() - startTime,
      },
    });

  } catch (error) {
    console.error('Ivy analysis error:', error);

    return NextResponse.json(
      { error: 'Analysis failed', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// =============================================================================
// HELPERS
// =============================================================================

function validateSchoolCount(tier: string, count: number): boolean {
  switch (tier) {
    case 'ivy_single':
      return count === 1;
    case 'ivy_bundle_3':
      return count >= 1 && count <= 3;
    case 'ivy_bundle_8':
      return count >= 1 && count <= 8;
    default:
      return false;
  }
}

function getOverallScore(result: any): number {
  // For single school analysis
  if (result.overallFitScore !== undefined) {
    return result.overallFitScore;
  }

  // For bundle analysis - average across schools
  if (result.schools && Array.isArray(result.schools)) {
    const scores = result.schools.map((s: any) => s.overallFitScore || 0);
    return Math.round(scores.reduce((a: number, b: number) => a + b, 0) / scores.length);
  }

  return 0;
}
