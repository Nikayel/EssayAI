import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { checkRAGDataAvailability, getCacheStats } from '@/lib/rag';
import {
  checkRateLimit,
  getRequestIdentifier,
} from '@/lib/rag/rate-limiter';

// =============================================================================
// GET /api/rag/status
// Check RAG system status and data availability
// =============================================================================

export async function GET(request: NextRequest) {
  try {
    // Rate limit (status is public-ish but still limit abuse)
    const identifier = getRequestIdentifier(undefined, request);
    const rateLimit = checkRateLimit(identifier, 'rag_benchmark');

    if (!rateLimit.allowed) {
      return NextResponse.json(
        rateLimit.errorResponse,
        { status: 429, headers: rateLimit.headers }
      );
    }

    const { searchParams } = new URL(request.url);
    const schoolId = searchParams.get('schoolId');

    // Get overall stats
    const [
      totalPatterns,
      totalInsights,
      totalExamples,
      totalHistory,
    ] = await Promise.all([
      prisma.feedbackPattern.count({ where: { isActive: true } }),
      prisma.schoolInsight.count({ where: { isActive: true } }),
      prisma.exampleEssay.count({ where: { isActive: true } }),
      prisma.analysisHistory.count(),
    ]);

    // Get per-school breakdown
    const schools = ['harvard', 'yale', 'princeton', 'columbia', 'brown', 'dartmouth', 'cornell', 'upenn'];
    const schoolStats: Record<string, {
      hasExamples: boolean;
      hasInsights: boolean;
      exampleCount: number;
      insightCount: number;
    }> = {};

    for (const school of schools) {
      const availability = await checkRAGDataAvailability(school);
      schoolStats[school] = {
        hasExamples: availability.hasExamples,
        hasInsights: availability.hasInsights,
        exampleCount: availability.exampleCount,
        insightCount: availability.insightCount,
      };
    }

    // Get specific school if requested
    let specificSchool = null;
    if (schoolId) {
      specificSchool = await checkRAGDataAvailability(schoolId);
    }

    // Get cache stats
    const cacheStats = getCacheStats();

    // Determine overall health
    const isHealthy = totalPatterns >= 10 && totalInsights >= 20;

    return NextResponse.json({
      success: true,
      healthy: isHealthy,
      totals: {
        patterns: totalPatterns,
        insights: totalInsights,
        examples: totalExamples,
        analysisHistory: totalHistory,
      },
      cache: cacheStats,
      schools: schoolStats,
      specificSchool,
      recommendations: [
        totalPatterns < 20 && 'Add more feedback patterns for better coverage',
        totalExamples < 10 && 'Add example essays for retrieval',
        !isHealthy && 'Run seed script: npm run seed:rag',
      ].filter(Boolean),
    });

  } catch (error) {
    console.error('RAG status check error:', error);
    return NextResponse.json(
      { error: 'Failed to check RAG status', details: (error as Error).message },
      { status: 500 }
    );
  }
}
