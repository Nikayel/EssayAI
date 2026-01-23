import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import {
  retrieveSchoolInsights,
  generateEmbedding,
} from '@/lib/rag';
import {
  checkRateLimit,
  getRequestIdentifier,
} from '@/lib/rag/rate-limiter';

// =============================================================================
// SCHEMAS
// =============================================================================

const GetInsightsSchema = z.object({
  schoolId: z.string(),
  essayType: z.string().optional(),
  insightTypes: z.array(z.string()).optional(),
  essayText: z.string().optional(), // For semantic relevance
  limit: z.number().min(1).max(20).default(10),
});

// =============================================================================
// POST /api/rag/insights
// Retrieve school-specific insights
// =============================================================================

export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check rate limit
    const identifier = getRequestIdentifier(user.id, request);
    const rateLimit = checkRateLimit(identifier, 'rag_retrieve');

    if (!rateLimit.allowed) {
      return NextResponse.json(
        rateLimit.errorResponse,
        { status: 429, headers: rateLimit.headers }
      );
    }

    // Parse request
    const body = await request.json();
    const validated = GetInsightsSchema.parse(body);

    // Generate embedding if essay text provided
    let embedding;
    if (validated.essayText) {
      const embeddingResult = await generateEmbedding(validated.essayText, 'essay');
      embedding = embeddingResult.embedding;
    }

    const insights = await retrieveSchoolInsights({
      schoolId: validated.schoolId,
      essayType: validated.essayType,
      insightTypes: validated.insightTypes,
      embedding,
      config: { topK: validated.limit },
    });

    return NextResponse.json({
      success: true,
      schoolId: validated.schoolId,
      insights,
      count: insights.length,
    });

  } catch (error) {
    console.error('Insights retrieval error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to retrieve insights', details: (error as Error).message },
      { status: 500 }
    );
  }
}

// =============================================================================
// GET /api/rag/insights
// Get insights for a school
// =============================================================================

export async function GET(request: NextRequest) {
  try {
    // Rate limit with default category
    const identifier = getRequestIdentifier(undefined, request);
    const rateLimit = checkRateLimit(identifier, 'default');

    if (!rateLimit.allowed) {
      return NextResponse.json(
        rateLimit.errorResponse,
        { status: 429, headers: rateLimit.headers }
      );
    }

    const { searchParams } = new URL(request.url);
    const schoolId = searchParams.get('schoolId');
    const insightType = searchParams.get('type');

    if (!schoolId) {
      return NextResponse.json(
        { error: 'schoolId is required' },
        { status: 400 }
      );
    }

    const where: Record<string, unknown> = {
      schoolId,
      isActive: true,
    };

    if (insightType) where.insightType = insightType;

    const insights = await prisma.schoolInsight.findMany({
      where,
      select: {
        id: true,
        schoolId: true,
        insightType: true,
        content: true,
        source: true,
        essayTypes: true,
        relevanceScore: true,
      },
      orderBy: { relevanceScore: 'desc' },
    });

    // Group by type for easier consumption
    const grouped = insights.reduce((acc, insight) => {
      if (!acc[insight.insightType]) {
        acc[insight.insightType] = [];
      }
      acc[insight.insightType].push(insight);
      return acc;
    }, {} as Record<string, typeof insights>);

    return NextResponse.json({
      success: true,
      schoolId,
      insights,
      grouped,
      count: insights.length,
    });

  } catch (error) {
    console.error('Insights fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch insights' },
      { status: 500 }
    );
  }
}
