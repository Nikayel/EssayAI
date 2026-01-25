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
  promptId: z.string(),
  essayText: z.string().min(50).max(10000),
});

const SchoolEssaysSchema = z.object({
  schoolId: z.string().refine(isIvyLeagueSchool, { message: 'Invalid Ivy League school' }),
  essays: z.array(EssayInputSchema).min(1).max(5),
});

const IvyAnalysisRequestSchema = z.object({
  tier: z.enum(['ivy_single', 'ivy_bundle_3', 'ivy_bundle_8']),
  schools: z.array(SchoolEssaysSchema),
  intake: z.any(), // FullIntake - validated at runtime
  sessionId: z.string().optional(), // Pre-paid session
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
