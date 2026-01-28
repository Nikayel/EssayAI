/**
 * Tiered Analysis Runner
 * POST /api/tiered-analysis/[sessionId]/run - Run analysis for a session
 *
 * Called by webhook after payment confirmation to trigger async analysis
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { runTieredAnalysis, type AnalysisTier } from '@/lib/scoring/tiers';
import { analyzeIvyEssay } from '@/lib/ai/ivy-analyzer';
import type { StudentIntake } from '@/lib/scoring';

// =============================================================================
// POST - Run Analysis
// =============================================================================

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  const startTime = Date.now();
  const { sessionId } = await params;

  try {
    // SECURITY: Verify webhook secret - no bypass allowed
    const webhookSecret = request.headers.get('X-Webhook-Secret');
    const expectedSecret = process.env.WEBHOOK_SECRET;

    if (!expectedSecret) {
      console.error('[SECURITY] WEBHOOK_SECRET environment variable is not set');
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    if (webhookSecret !== expectedSecret) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get session
    const session = await prisma.analysisSession.findUnique({
      where: { id: sessionId },
    });

    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    // Check if already completed
    if (session.status === 'COMPLETED') {
      return NextResponse.json({
        success: true,
        message: 'Analysis already completed',
        sessionId,
      });
    }

    // Get tier from session or request
    const body = await request.json().catch(() => ({}));
    const tier = (body.tier || session.tier) as string;
    const isIvyTier = tier.startsWith('ivy_');

    // Update status to ANALYZING
    await prisma.analysisSession.update({
      where: { id: sessionId },
      data: { status: 'ANALYZING' },
    });

    let result: any;

    if (isIvyTier) {
      // Run Ivy-specific analysis
      const intakeData = session.intakeData as any;
      const essaysBySchool = intakeData?.essaysBySchool || {};
      const schools = intakeData?.ivySchools || [session.targetSchool];

      // For single school, use single analysis
      if (tier === 'ivy_single' || Object.keys(essaysBySchool).length === 1) {
        const schoolId = schools[0] || session.targetSchool;
        const essays = essaysBySchool[schoolId] || [];

        // Analyze each essay and combine results
        const essayResults = await Promise.all(
          essays.map((essay: { promptId: string; essayText: string }) =>
            analyzeIvyEssay({
              essayText: essay.essayText,
              schoolId,
              essayType: 'supplemental',
              promptText: 'Write about something meaningful to you.',
            })
          )
        );

        // Combine results into portfolio analysis
        const overallScore = essayResults.length > 0
          ? essayResults.reduce((sum, r) => sum + r.overall.score_100, 0) / essayResults.length
          : 0;

        result = {
          schoolId,
          overallScore,
          essays: essayResults,
          portfolioAnalysis: {
            essayCount: essays.length,
            averageScore: overallScore,
          },
        };
      } else {
        // For bundles, analyze each school
        const schoolResults: Record<string, any> = {};
        for (const schoolId of schools) {
          const essays = essaysBySchool[schoolId] || [];
          if (essays.length > 0) {
            const essayResults = await Promise.all(
              essays.map((essay: { promptId: string; essayText: string }) =>
                analyzeIvyEssay({
                  essayText: essay.essayText,
                  schoolId,
                  essayType: 'supplemental',
                  promptText: 'Write about something meaningful to you.',
                })
              )
            );

            const overallScore = essayResults.reduce((sum, r) => sum + r.overall.score_100, 0) / essayResults.length;

            schoolResults[schoolId] = {
              schoolId,
              overallScore,
              essays: essayResults,
            };
          }
        }
        result = {
          schools: schoolResults,
          crossSchoolAnalysis: {
            // TODO: Add cross-school narrative checking
            narrativeConsistency: 'pending',
          },
        };
      }
    } else {
      // Run standard tiered analysis
      const validTier = tier as AnalysisTier;
      const intake = session.intakeData as unknown as StudentIntake;

      result = await runTieredAnalysis(
        session.essayText,
        validTier,
        intake,
        {
          sessionId,
        }
      );
    }

    // Calculate score
    const score = isIvyTier
      ? (result.schools
          ? Object.values(result.schools).reduce((sum: number, r: any) => sum + (r.overallScore || 0), 0) / Object.keys(result.schools).length
          : result.overallScore)
      : result.overallScore;

    // Update session with results
    await prisma.analysisSession.update({
      where: { id: sessionId },
      data: {
        status: tier === 'premium' ? 'HUMAN_QUEUED' : 'COMPLETED',
        aiResult: result as any,
        aiScore: score,
        aiCompletedAt: new Date(),
      },
    });

    // Track analytics
    await prisma.analyticsEvent.create({
      data: {
        userId: session.userId || undefined,
        event: 'analysis_completed',
        properties: {
          sessionId,
          tier,
          score,
          durationMs: Date.now() - startTime,
        },
      },
    });

    console.log(`✅ Analysis completed: ${sessionId} (${tier}) - Score: ${score} in ${Date.now() - startTime}ms`);

    return NextResponse.json({
      success: true,
      sessionId,
      tier,
      score,
      status: tier === 'premium' ? 'HUMAN_QUEUED' : 'COMPLETED',
    });

  } catch (error) {
    console.error(`Analysis failed for session ${sessionId}:`, error);

    // Update session with error
    await prisma.analysisSession.update({
      where: { id: sessionId },
      data: {
        status: 'FAILED',
        aiResult: { error: error instanceof Error ? error.message : 'Analysis failed' } as any,
      },
    }).catch(console.error);

    return NextResponse.json(
      { error: 'Analysis failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
