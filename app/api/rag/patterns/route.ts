import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import {
  retrieveFeedbackPatterns,
  generateEmbedding,
} from '@/lib/rag';
import {
  checkRateLimit,
  getRequestIdentifier,
} from '@/lib/rag/rate-limiter';

// =============================================================================
// SCHEMAS
// =============================================================================

const GetPatternsSchema = z.object({
  essayText: z.string().optional(),
  essayType: z.string().optional(),
  schoolId: z.string().optional(),
  issueCategory: z.string().optional(),
  limit: z.number().min(1).max(20).default(10),
});

// =============================================================================
// POST /api/rag/patterns
// Retrieve relevant feedback patterns for an essay
// =============================================================================

export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check rate limit (rag_retrieve allows 30/min)
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
    const validated = GetPatternsSchema.parse(body);

    // If essay text provided, use semantic search
    if (validated.essayText) {
      const embeddingResult = await generateEmbedding(validated.essayText, 'essay');

      const patterns = await retrieveFeedbackPatterns({
        embedding: embeddingResult.embedding,
        essayType: validated.essayType,
        schoolId: validated.schoolId,
        issueCategory: validated.issueCategory,
        config: { topK: validated.limit },
      });

      return NextResponse.json({
        success: true,
        patterns,
        count: patterns.length,
      });
    }

    // Otherwise, return patterns by filter
    const where: Record<string, unknown> = { isActive: true };

    if (validated.essayType) {
      where.OR = [
        { essayType: null },
        { essayType: validated.essayType },
      ];
    }
    if (validated.schoolId) {
      where.OR = where.OR || [];
      (where.OR as unknown[]).push({ schoolId: null }, { schoolId: validated.schoolId });
    }
    if (validated.issueCategory) {
      where.issueCategory = validated.issueCategory;
    }

    const patterns = await prisma.feedbackPattern.findMany({
      where,
      select: {
        id: true,
        issueType: true,
        issueCategory: true,
        patternName: true,
        description: true,
        exampleBefore: true,
        exampleAfter: true,
        fixStrategy: true,
        avgScoreImprovement: true,
        frequency: true,
        successRate: true,
        severity: true,
      },
      orderBy: [
        { frequency: 'desc' },
        { severity: 'desc' },
      ],
      take: validated.limit,
    });

    return NextResponse.json({
      success: true,
      patterns,
      count: patterns.length,
    });

  } catch (error) {
    console.error('Patterns retrieval error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to retrieve patterns', details: (error as Error).message },
      { status: 500 }
    );
  }
}

// =============================================================================
// GET /api/rag/patterns
// Get all active patterns (for admin/debug)
// =============================================================================

export async function GET(request: NextRequest) {
  try {
    // Rate limit with default category (cheaper operation)
    const identifier = getRequestIdentifier(undefined, request);
    const rateLimit = checkRateLimit(identifier, 'default');

    if (!rateLimit.allowed) {
      return NextResponse.json(
        rateLimit.errorResponse,
        { status: 429, headers: rateLimit.headers }
      );
    }

    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const schoolId = searchParams.get('schoolId');

    const where: Record<string, unknown> = { isActive: true };

    if (category) where.issueCategory = category;
    if (schoolId) where.schoolId = schoolId;

    const patterns = await prisma.feedbackPattern.findMany({
      where,
      select: {
        id: true,
        issueType: true,
        issueCategory: true,
        patternName: true,
        description: true,
        severity: true,
        frequency: true,
        successRate: true,
        avgScoreImprovement: true,
      },
      orderBy: { frequency: 'desc' },
    });

    return NextResponse.json({
      success: true,
      patterns,
      count: patterns.length,
    });

  } catch (error) {
    console.error('Patterns fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch patterns' },
      { status: 500 }
    );
  }
}
