import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import {
  retrieveSimilarEssays,
  generateEmbedding,
} from '@/lib/rag';
import {
  checkRateLimit,
  getRequestIdentifier,
} from '@/lib/rag/rate-limiter';

// =============================================================================
// SCHEMAS
// =============================================================================

const GetExamplesSchema = z.object({
  essayText: z.string().min(50),
  schoolId: z.string().optional(),
  essayType: z.string().optional(),
  spikeCategory: z.string().optional(),
  limit: z.number().min(1).max(10).default(3),
});

// =============================================================================
// POST /api/rag/examples
// Retrieve similar successful essay examples
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
    const validated = GetExamplesSchema.parse(body);

    // Generate embedding for the essay
    const embeddingResult = await generateEmbedding(validated.essayText, 'essay');

    // Retrieve similar examples
    const examples = await retrieveSimilarEssays({
      embedding: embeddingResult.embedding,
      schoolId: validated.schoolId,
      essayType: validated.essayType,
      spikeCategory: validated.spikeCategory,
      config: { topK: validated.limit },
    });

    return NextResponse.json({
      success: true,
      examples: examples.map(ex => ({
        ...ex,
        // Truncate content snippet for response
        contentSnippet: ex.contentSnippet.slice(0, 500) +
          (ex.contentSnippet.length > 500 ? '...' : ''),
      })),
      count: examples.length,
    });

  } catch (error) {
    console.error('Examples retrieval error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to retrieve examples', details: (error as Error).message },
      { status: 500 }
    );
  }
}

// =============================================================================
// GET /api/rag/examples
// List available examples by school/type (for admin/debug)
// =============================================================================

export async function GET(request: NextRequest) {
  try {
    // Rate limit
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
    const essayType = searchParams.get('essayType');

    const where: Record<string, unknown> = { isActive: true };

    if (schoolId) where.schoolId = schoolId;
    if (essayType) where.essayType = essayType;

    // Get counts grouped by school and type
    const examples = await prisma.exampleEssay.groupBy({
      by: ['schoolId', 'essayType'],
      where,
      _count: { id: true },
    });

    // Get detailed list if filters provided
    let detailedList = null;
    if (schoolId || essayType) {
      detailedList = await prisma.exampleEssay.findMany({
        where,
        select: {
          id: true,
          schoolId: true,
          essayType: true,
          outcome: true,
          scoreRange: true,
          themeTags: true,
          spikeCategory: true,
          keyTechniques: true,
          strengthNotes: true,
        },
        orderBy: { createdAt: 'desc' },
        take: 20,
      });
    }

    return NextResponse.json({
      success: true,
      summary: examples.map(e => ({
        schoolId: e.schoolId,
        essayType: e.essayType,
        count: e._count.id,
      })),
      examples: detailedList,
    });

  } catch (error) {
    console.error('Examples fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch examples' },
      { status: 500 }
    );
  }
}
