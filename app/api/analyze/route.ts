import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';
import { analyzeEssay, runCommonsCheck, countWords } from '@/lib/ai/analyzer';
import { z } from 'zod';

const AnalyzeRequestSchema = z.object({
  versionId: z.string(),
  analysisType: z.enum(['commons_check', 'full']),
  toneSample: z.string().optional(),
});

/**
 * POST /api/analyze
 * Run AI analysis on an essay version
 */
export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse and validate request
    const body = await request.json();
    const validated = AnalyzeRequestSchema.parse(body);

    // Fetch version and verify ownership
    const version = await prisma.essayVersion.findFirst({
      where: {
        id: validated.versionId,
      },
      include: {
        essay: true,
      },
    });

    if (!version || version.essay.userId !== user.id) {
      return NextResponse.json(
        { error: 'Version not found or unauthorized' },
        { status: 404 }
      );
    }

    // Check if user has credits/subscription for this analysis type
    // TODO: Implement package/payment check based on analysisType
    // For now, we'll allow free tier for commons_check

    if (validated.analysisType === 'commons_check') {
      // Run fast commons check
      const result = await runCommonsCheck(version.content);

      // Don't store commons check results in DB for free tier
      return NextResponse.json({
        success: true,
        type: 'commons_check',
        result,
      });
    } else {
      // Run full analysis
      const profile = await prisma.profile.findUnique({
        where: { userId: user.id },
      });

      const analysisResult = await analyzeEssay({
        essayText: version.content,
        essayType: version.essay.type.toLowerCase().replace('_', ' '),
        school: version.essay.targetSchool || undefined,
        prompt: version.essay.promptText,
        wordLimit: version.essay.wordLimit || undefined,
        hasPreviousDraft: version.versionIndex > 1,
        toneSample: validated.toneSample || profile?.toneSample || undefined,
      });

      // Store analysis in database
      const analysis = await prisma.aIAnalysis.create({
        data: {
          versionId: version.id,
          analysisJson: analysisResult as any,
          overallScore: analysisResult.overall.score_100,
          modelRef: 'claude-3-5-sonnet-20241022',
          commonsFlags: {
            create: Object.entries(analysisResult.commons_check).map(([key, value]) => ({
              key,
              flag: value.flag,
              evidence: value.evidence || value.phrases || (value.notes ? [value.notes] : []),
            })),
          },
        },
        include: {
          commonsFlags: true,
        },
      });

      return NextResponse.json({
        success: true,
        type: 'full',
        analysisId: analysis.id,
        result: analysisResult,
      });
    }
  } catch (error) {
    console.error('Analysis error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Analysis failed', details: (error as Error).message },
      { status: 500 }
    );
  }
}

/**
 * GET /api/analyze/[id]
 * Get analysis results
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const analysisId = searchParams.get('id');

    if (!analysisId) {
      return NextResponse.json({ error: 'Analysis ID required' }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const analysis = await prisma.aIAnalysis.findFirst({
      where: {
        id: analysisId,
        version: {
          essay: {
            userId: user.id,
          },
        },
      },
      include: {
        commonsFlags: true,
      },
    });

    if (!analysis) {
      return NextResponse.json({ error: 'Analysis not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      analysis: {
        id: analysis.id,
        result: analysis.analysisJson,
        overallScore: analysis.overallScore,
        createdAt: analysis.createdAt,
      },
    });
  } catch (error) {
    console.error('Analysis fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analysis' },
      { status: 500 }
    );
  }
}
