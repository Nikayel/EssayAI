import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';
import {
  calculateScorePercentile,
  estimateImprovementPotential,
  getBenchmarkStats,
  getUserImprovementHistory,
} from '@/lib/rag';
import {
  checkRateLimit,
  getRequestIdentifier,
} from '@/lib/rag/rate-limiter';

// =============================================================================
// SCHEMAS
// =============================================================================

const BenchmarkRequestSchema = z.object({
  score: z.number().min(0).max(100),
  schoolId: z.string().optional(),
  essayType: z.string().optional(),
  patternsMatched: z.array(z.string()).optional(),
});

// =============================================================================
// POST /api/rag/benchmarks
// Calculate benchmarks for a score
// =============================================================================

export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check rate limit (benchmark is cheaper, use higher limit)
    const identifier = getRequestIdentifier(user.id, request);
    const rateLimit = checkRateLimit(identifier, 'rag_benchmark');

    if (!rateLimit.allowed) {
      return NextResponse.json(
        rateLimit.errorResponse,
        { status: 429, headers: rateLimit.headers }
      );
    }

    // Parse request
    const body = await request.json();
    const validated = BenchmarkRequestSchema.parse(body);

    // Calculate percentile
    const percentileData = await calculateScorePercentile(
      validated.score,
      validated.schoolId,
      validated.essayType
    );

    // Estimate improvement if patterns provided
    let improvementData = null;
    if (validated.patternsMatched && validated.patternsMatched.length > 0) {
      improvementData = await estimateImprovementPotential(validated.patternsMatched);
    }

    return NextResponse.json({
      success: true,
      score: validated.score,
      percentile: percentileData.percentile,
      sampleSize: percentileData.sampleSize,
      averageScore: percentileData.averageScore,
      acceptedAverage: percentileData.acceptedAverage,
      vsAverage: validated.score - percentileData.averageScore,
      improvement: improvementData ? {
        estimated: improvementData.estimatedImprovement,
        topAreas: improvementData.topImprovementAreas,
      } : null,
    });

  } catch (error) {
    console.error('Benchmark calculation error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to calculate benchmarks', details: (error as Error).message },
      { status: 500 }
    );
  }
}

// =============================================================================
// GET /api/rag/benchmarks
// Get benchmark stats for a school/type
// =============================================================================

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check rate limit
    const identifier = getRequestIdentifier(user.id, request);
    const rateLimit = checkRateLimit(identifier, 'rag_benchmark');

    if (!rateLimit.allowed) {
      return NextResponse.json(
        rateLimit.errorResponse,
        { status: 429, headers: rateLimit.headers }
      );
    }

    const { searchParams } = new URL(request.url);
    const schoolId = searchParams.get('schoolId') || undefined;
    const essayType = searchParams.get('essayType') || undefined;
    const includeHistory = searchParams.get('includeHistory') === 'true';

    // Get benchmark stats
    const stats = await getBenchmarkStats(schoolId, essayType);

    // Get user's improvement history if requested
    let history = null;
    if (includeHistory) {
      history = await getUserImprovementHistory(user.id);
    }

    return NextResponse.json({
      success: true,
      filters: { schoolId, essayType },
      stats,
      userHistory: history,
    });

  } catch (error) {
    console.error('Benchmark stats error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch benchmark stats' },
      { status: 500 }
    );
  }
}
