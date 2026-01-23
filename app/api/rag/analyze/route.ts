import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import {
  analyzeEssayWithRAG,
  runCommonsCheckWithRAG,
} from '@/lib/rag';
import {
  checkRateLimit,
  getRequestIdentifier,
} from '@/lib/rag/rate-limiter';

// =============================================================================
// SCHEMAS
// =============================================================================

const RAGAnalyzeRequestSchema = z.object({
  versionId: z.string(),
  analysisType: z.enum(['commons_check', 'full', 'rag_enhanced']),
  toneSample: z.string().optional(),
  includeProfile: z.boolean().default(true),
  skipRAG: z.boolean().default(false), // For A/B testing
});

// =============================================================================
// POST /api/rag/analyze
// RAG-enhanced essay analysis
// =============================================================================

export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    // Authenticate user
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check rate limit (rag_analyze is the most expensive, 10/min)
    const identifier = getRequestIdentifier(user.id, request);
    const rateLimit = checkRateLimit(identifier, 'rag_analyze');

    if (!rateLimit.allowed) {
      return NextResponse.json(
        rateLimit.errorResponse,
        { status: 429, headers: rateLimit.headers }
      );
    }

    // Parse and validate request
    const body = await request.json();
    const validated = RAGAnalyzeRequestSchema.parse(body);

    // Fetch version and verify ownership
    const version = await prisma.essayVersion.findFirst({
      where: { id: validated.versionId },
      include: {
        essay: {
          include: {
            targetSchoolRef: true,
          },
        },
      },
    });

    if (!version || version.essay.userId !== user.id) {
      return NextResponse.json(
        { error: 'Version not found or unauthorized' },
        { status: 404 }
      );
    }

    // Get user profile if requested
    let profile = null;
    if (validated.includeProfile) {
      profile = await prisma.profile.findUnique({
        where: { userId: user.id },
        select: {
          spike: true,
          topActivities: true,
          biggestWorry: true,
          toneSample: true,
          toneEmbedding: true,
          graduationYear: true,
          applicationCycle: true,
        },
      });
    }

    // Determine school ID
    const schoolId = version.essay.targetSchoolRef?.schoolName?.toLowerCase()
      || version.essay.targetSchool?.toLowerCase()
      || undefined;

    // Quick commons check
    if (validated.analysisType === 'commons_check') {
      const result = await runCommonsCheckWithRAG(
        version.content,
        schoolId
      );

      return NextResponse.json({
        success: true,
        type: 'commons_check',
        result,
        processingTime: Date.now() - startTime,
      });
    }

    // Full RAG-enhanced analysis
    const analysisResult = await analyzeEssayWithRAG({
      essayText: version.content,
      essayType: version.essay.type,
      schoolId,
      promptText: version.essay.promptText,
      wordLimit: version.essay.wordLimit || undefined,
      profile: profile ? {
        spike: profile.spike || undefined,
        topActivities: profile.topActivities || undefined,
        biggestWorry: profile.biggestWorry || undefined,
        toneSample: validated.toneSample || profile.toneSample || undefined,
        toneEmbedding: profile.toneEmbedding as number[] | undefined,
        graduationYear: profile.graduationYear || undefined,
        applicationCycle: profile.applicationCycle || undefined,
      } : undefined,
      versionId: version.id,
      userId: user.id,
      skipRAG: validated.skipRAG,
    });

    // Store analysis in database
    const analysis = await prisma.aIAnalysis.create({
      data: {
        versionId: version.id,
        analysisJson: JSON.parse(JSON.stringify(analysisResult)),
        overallScore: analysisResult.overall.score_100,
        modelRef: 'claude-3-5-sonnet-20241022-rag',
        commonsFlags: {
          create: Object.entries(analysisResult.commons_check).map(([key, value]) => ({
            key,
            flag: (value as { flag: boolean }).flag,
            evidence: ((value as { evidence?: string[] }).evidence ||
              (value as { phrases?: string[] }).phrases ||
              ((value as { notes?: string }).notes ? [(value as { notes: string }).notes] : [])),
          })),
        },
      },
      include: {
        commonsFlags: true,
      },
    });

    return NextResponse.json({
      success: true,
      type: validated.analysisType,
      analysisId: analysis.id,
      result: analysisResult,
      rag_enhanced: analysisResult.rag_enhanced,
      benchmarks: analysisResult.benchmarks,
      pattern_matches: analysisResult.pattern_matches,
      processingTime: Date.now() - startTime,
    });

  } catch (error) {
    console.error('RAG Analysis error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Analysis failed', details: (error as Error).message },
      { status: 500 }
    );
  }
}
