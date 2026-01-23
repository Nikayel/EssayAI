import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Cached response for performance
let cachedStats: any = null;
let cacheTime = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export async function GET() {
  // Return cached response if fresh
  if (cachedStats && Date.now() - cacheTime < CACHE_DURATION) {
    return NextResponse.json(cachedStats);
  }

  try {
    // Count total essays analyzed
    const essayCount = await prisma.aIAnalysis.count();

    // Calculate average score improvement (users with multiple versions)
    // This requires comparing v1 to latest version scores
    const improvements = await prisma.$queryRaw<{ avg_improvement: number }[]>`
      SELECT AVG(improvement) as avg_improvement FROM (
        SELECT
          e.id,
          MAX(a."overallScore") - MIN(a."overallScore") as improvement
        FROM essays e
        JOIN essay_versions v ON v."essayId" = e.id
        JOIN ai_analyses a ON a."versionId" = v.id
        GROUP BY e.id
        HAVING COUNT(DISTINCT v.id) > 1
      ) subq
      WHERE improvement > 0
    `;

    const avgImprovement = improvements[0]?.avg_improvement || 0;

    // For now, we don't track acceptance rate - would need to add outcome tracking
    // This would be added when students report their results

    const stats = {
      essaysAnalyzed: essayCount,
      avgScoreImprovement: Math.round(avgImprovement),
      acceptanceRate: 0, // Placeholder - implement outcome tracking
    };

    // Cache the result
    cachedStats = stats;
    cacheTime = Date.now();

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Error fetching public stats:', error);
    return NextResponse.json({
      essaysAnalyzed: 0,
      avgScoreImprovement: 0,
      acceptanceRate: 0,
    });
  }
}
