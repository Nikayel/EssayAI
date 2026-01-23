/**
 * RAG Feedback Loop Module
 * Stores analyses and updates pattern/example effectiveness metrics
 */

import { prisma } from '../prisma';
import { Prisma } from '@prisma/client';
import { generateEmbedding } from './embeddings';
import type {
  AnalysisHistoryEntry,
  PatternUpdateData,
  Embedding,
} from './types';

// =============================================================================
// ANALYSIS HISTORY STORAGE
// =============================================================================

/**
 * Store analysis in history for future retrieval and learning
 */
export async function storeAnalysisHistory(
  entry: AnalysisHistoryEntry
): Promise<string> {
  // Get previous version's score if exists
  let previousVersionScore: number | undefined;
  let scoreDelta: number | undefined;

  if (entry.essayVersionId) {
    // Find the essay and check for previous versions
    const currentVersion = await prisma.essayVersion.findUnique({
      where: { id: entry.essayVersionId },
      include: {
        essay: {
          include: {
            versions: {
              orderBy: { versionIndex: 'desc' },
              take: 2,
              include: {
                analysisHistory: {
                  orderBy: { createdAt: 'desc' },
                  take: 1,
                },
              },
            },
          },
        },
      },
    });

    if (currentVersion?.essay?.versions) {
      // Get the version before current
      const previousVersion = currentVersion.essay.versions.find(
        v => v.versionIndex < currentVersion.versionIndex
      );

      if (previousVersion?.analysisHistory?.[0]) {
        previousVersionScore = previousVersion.analysisHistory[0].overallScore;
        scoreDelta = entry.overallScore - previousVersionScore;
      }
    }
  }

  // Generate embedding for the essay if not provided
  let essayEmbedding = entry.essayEmbedding;
  if (!essayEmbedding && entry.essayVersionId) {
    try {
      const version = await prisma.essayVersion.findUnique({
        where: { id: entry.essayVersionId },
        select: { content: true },
      });
      if (version?.content) {
        const result = await generateEmbedding(version.content, 'essay');
        essayEmbedding = result.embedding;
      }
    } catch (error) {
      console.error('Failed to generate embedding for analysis history:', error);
    }
  }

  // Store the analysis
  const history = await prisma.analysisHistory.create({
    data: {
      essayVersionId: entry.essayVersionId,
      userId: entry.userId,
      schoolId: entry.schoolId || null,
      essayType: entry.essayType,
      overallScore: entry.overallScore,
      dimensionScores: entry.dimensionScores,
      issuesIdentified: entry.issuesIdentified,
      patternsMatched: entry.patternsMatched,
      suggestionsGiven: entry.suggestionsGiven || Prisma.DbNull,
      previousVersionScore: previousVersionScore ?? entry.previousVersionScore ?? null,
      scoreDelta: scoreDelta ?? entry.scoreDelta ?? null,
      essayEmbedding: essayEmbedding || Prisma.DbNull,
      ragContextUsed: entry.ragContextUsed || Prisma.DbNull,
    },
  });

  // Update pattern frequencies if patterns were matched
  if (entry.patternsMatched && entry.patternsMatched.length > 0) {
    await updatePatternFrequencies(entry.patternsMatched);
  }

  return history.id;
}

// =============================================================================
// PATTERN LEARNING
// =============================================================================

/**
 * Update pattern frequencies when detected in an essay
 */
async function updatePatternFrequencies(patternIds: string[]): Promise<void> {
  for (const patternId of patternIds) {
    try {
      await prisma.feedbackPattern.update({
        where: { id: patternId },
        data: {
          frequency: { increment: 1 },
          updatedAt: new Date(),
        },
      });
    } catch (error) {
      // Pattern might not exist - log and continue
      console.warn(`Failed to update frequency for pattern ${patternId}:`, error);
    }
  }
}

/**
 * Update pattern success rate when student improves
 * Called when a student revises their essay and improves
 */
export async function updatePatternSuccess(
  updates: PatternUpdateData[]
): Promise<void> {
  for (const update of updates) {
    try {
      const pattern = await prisma.feedbackPattern.findUnique({
        where: { id: update.patternId },
        select: { frequency: true, successRate: true, avgScoreImprovement: true },
      });

      if (!pattern) continue;

      // Calculate new metrics
      const newData: Record<string, unknown> = {};

      if (update.studentImproved !== undefined) {
        // Update success rate using running average
        const currentSuccesses = pattern.successRate * pattern.frequency;
        const newSuccesses = update.studentImproved
          ? currentSuccesses + 1
          : currentSuccesses;
        newData.successRate = pattern.frequency > 0
          ? newSuccesses / (pattern.frequency + 1)
          : (update.studentImproved ? 1 : 0);
      }

      if (update.scoreImprovement !== undefined && update.studentImproved) {
        // Update average score improvement using running average
        const totalImprovement =
          pattern.avgScoreImprovement * pattern.frequency + update.scoreImprovement;
        newData.avgScoreImprovement = totalImprovement / (pattern.frequency + 1);
      }

      if (Object.keys(newData).length > 0) {
        await prisma.feedbackPattern.update({
          where: { id: update.patternId },
          data: {
            ...newData,
            updatedAt: new Date(),
          },
        });
      }
    } catch (error) {
      console.error(`Failed to update pattern ${update.patternId}:`, error);
    }
  }
}

/**
 * Check for improvement across essay versions and update patterns
 * Called when a new analysis is created
 */
export async function processVersionImprovement(
  userId: string,
  essayId: string
): Promise<void> {
  // Get all versions with their analyses
  const essay = await prisma.essay.findUnique({
    where: { id: essayId },
    include: {
      versions: {
        orderBy: { versionIndex: 'asc' },
        include: {
          analysisHistory: {
            orderBy: { createdAt: 'desc' },
            take: 1,
          },
        },
      },
    },
  });

  if (!essay || essay.versions.length < 2) return;

  // Compare consecutive versions
  for (let i = 1; i < essay.versions.length; i++) {
    const prevVersion = essay.versions[i - 1];
    const currVersion = essay.versions[i];

    const prevAnalysis = prevVersion.analysisHistory[0];
    const currAnalysis = currVersion.analysisHistory[0];

    if (!prevAnalysis || !currAnalysis) continue;

    const improvement = currAnalysis.overallScore - prevAnalysis.overallScore;

    // If student improved by at least 5 points
    if (improvement >= 5 && prevAnalysis.patternsMatched.length > 0) {
      const updates: PatternUpdateData[] = prevAnalysis.patternsMatched.map(
        patternId => ({
          patternId,
          matched: true,
          studentImproved: true,
          scoreImprovement: improvement,
        })
      );

      await updatePatternSuccess(updates);
    }
  }
}

// =============================================================================
// BENCHMARKING
// =============================================================================

/**
 * Calculate percentile for a score within similar essays
 */
export async function calculateScorePercentile(
  score: number,
  schoolId?: string,
  essayType?: string
): Promise<{
  percentile: number;
  sampleSize: number;
  averageScore: number;
  acceptedAverage: number | null;
}> {
  const where: Record<string, unknown> = {};

  if (schoolId) where.schoolId = schoolId;
  if (essayType) where.essayType = essayType;

  const analyses = await prisma.analysisHistory.findMany({
    where,
    select: { overallScore: true },
    orderBy: { createdAt: 'desc' },
    take: 500,
  });

  if (analyses.length === 0) {
    return {
      percentile: 50,
      sampleSize: 0,
      averageScore: 0,
      acceptedAverage: null,
    };
  }

  const scores = analyses.map(a => a.overallScore).sort((a, b) => a - b);
  const belowCount = scores.filter(s => s < score).length;
  const percentile = Math.round((belowCount / scores.length) * 100);

  const averageScore = Math.round(
    scores.reduce((a, b) => a + b, 0) / scores.length
  );

  // Get average from accepted essays (examples)
  let acceptedAverage: number | null = null;
  if (schoolId) {
    const accepted = await prisma.exampleEssay.findMany({
      where: {
        schoolId,
        outcome: 'ACCEPTED',
        scoreRange: { not: null },
      },
      select: { scoreRange: true },
    });

    if (accepted.length > 0) {
      // Parse score ranges and average
      const acceptedScores = accepted
        .map(e => {
          const match = e.scoreRange?.match(/(\d+)-(\d+)/);
          if (match) {
            return (parseInt(match[1]) + parseInt(match[2])) / 2;
          }
          return null;
        })
        .filter((s): s is number => s !== null);

      if (acceptedScores.length > 0) {
        acceptedAverage = Math.round(
          acceptedScores.reduce((a, b) => a + b, 0) / acceptedScores.length
        );
      }
    }
  }

  return {
    percentile,
    sampleSize: scores.length,
    averageScore,
    acceptedAverage,
  };
}

/**
 * Estimate improvement potential based on patterns
 */
export async function estimateImprovementPotential(
  patternsMatched: string[]
): Promise<{
  estimatedImprovement: number;
  topImprovementAreas: Array<{
    patternId: string;
    patternName: string;
    avgImprovement: number;
  }>;
}> {
  if (patternsMatched.length === 0) {
    return {
      estimatedImprovement: 0,
      topImprovementAreas: [],
    };
  }

  const patterns = await prisma.feedbackPattern.findMany({
    where: {
      id: { in: patternsMatched },
      isActive: true,
    },
    select: {
      id: true,
      patternName: true,
      avgScoreImprovement: true,
      successRate: true,
    },
  });

  // Sort by potential impact (improvement * success rate)
  const sortedPatterns = patterns
    .map(p => ({
      patternId: p.id,
      patternName: p.patternName,
      avgImprovement: p.avgScoreImprovement,
      expectedImprovement: p.avgScoreImprovement * p.successRate,
    }))
    .sort((a, b) => b.expectedImprovement - a.expectedImprovement);

  // Sum expected improvements (with diminishing returns)
  let totalImprovement = 0;
  for (let i = 0; i < sortedPatterns.length; i++) {
    // Each subsequent fix has 70% of the expected impact
    totalImprovement +=
      sortedPatterns[i].expectedImprovement * Math.pow(0.7, i);
  }

  return {
    estimatedImprovement: Math.round(totalImprovement),
    topImprovementAreas: sortedPatterns.slice(0, 3).map(p => ({
      patternId: p.patternId,
      patternName: p.patternName,
      avgImprovement: p.avgImprovement,
    })),
  };
}

// =============================================================================
// ANALYTICS
// =============================================================================

/**
 * Get pattern effectiveness report
 */
export async function getPatternEffectivenessReport(): Promise<
  Array<{
    patternId: string;
    patternName: string;
    issueType: string;
    frequency: number;
    successRate: number;
    avgImprovement: number;
    effectiveness: number;
  }>
> {
  const patterns = await prisma.feedbackPattern.findMany({
    where: {
      isActive: true,
      frequency: { gt: 5 }, // Only patterns seen at least 5 times
    },
    select: {
      id: true,
      patternName: true,
      issueType: true,
      frequency: true,
      successRate: true,
      avgScoreImprovement: true,
    },
    orderBy: { frequency: 'desc' },
  });

  return patterns.map(p => ({
    patternId: p.id,
    patternName: p.patternName,
    issueType: p.issueType,
    frequency: p.frequency,
    successRate: p.successRate,
    avgImprovement: p.avgScoreImprovement,
    effectiveness: p.successRate * p.avgScoreImprovement, // Combined metric
  }));
}

/**
 * Get user's improvement history
 */
export async function getUserImprovementHistory(
  userId: string
): Promise<
  Array<{
    essayType: string;
    schoolId: string | null;
    versions: number;
    initialScore: number;
    finalScore: number;
    totalImprovement: number;
    patternsAddressed: string[];
  }>
> {
  const userEssays = await prisma.essay.findMany({
    where: { userId },
    include: {
      versions: {
        orderBy: { versionIndex: 'asc' },
        include: {
          analysisHistory: {
            orderBy: { createdAt: 'desc' },
            take: 1,
          },
        },
      },
    },
  });

  return userEssays
    .filter(essay => essay.versions.length >= 2)
    .map(essay => {
      const firstVersion = essay.versions[0];
      const lastVersion = essay.versions[essay.versions.length - 1];

      const initialScore = firstVersion.analysisHistory[0]?.overallScore || 0;
      const finalScore = lastVersion.analysisHistory[0]?.overallScore || 0;

      // Collect all patterns addressed
      const allPatterns = new Set<string>();
      for (const version of essay.versions) {
        const analysis = version.analysisHistory[0];
        if (analysis?.patternsMatched) {
          for (const pattern of analysis.patternsMatched) {
            allPatterns.add(pattern);
          }
        }
      }

      return {
        essayType: essay.type,
        schoolId: essay.targetSchool,
        versions: essay.versions.length,
        initialScore,
        finalScore,
        totalImprovement: finalScore - initialScore,
        patternsAddressed: Array.from(allPatterns),
      };
    })
    .filter(r => r.totalImprovement !== 0);
}

// =============================================================================
// MAINTENANCE
// =============================================================================

/**
 * Cleanup old analysis history (run periodically)
 * Keep last 18 months of data
 */
export async function cleanupOldHistory(): Promise<number> {
  const cutoffDate = new Date();
  cutoffDate.setMonth(cutoffDate.getMonth() - 18);

  const result = await prisma.analysisHistory.deleteMany({
    where: {
      createdAt: { lt: cutoffDate },
    },
  });

  return result.count;
}

/**
 * Recalculate pattern statistics from analysis history
 * Run periodically to keep stats accurate
 */
export async function recalculatePatternStats(): Promise<void> {
  const patterns = await prisma.feedbackPattern.findMany({
    where: { isActive: true },
    select: { id: true },
  });

  for (const pattern of patterns) {
    // Count how many times this pattern was matched
    const matchedAnalyses = await prisma.analysisHistory.count({
      where: {
        patternsMatched: { has: pattern.id },
      },
    });

    // Find improvements after pattern was addressed
    const improvements = await prisma.analysisHistory.findMany({
      where: {
        patternsMatched: { has: pattern.id },
        scoreDelta: { gt: 0 },
      },
      select: { scoreDelta: true },
    });

    const successCount = improvements.length;
    const successRate = matchedAnalyses > 0
      ? successCount / matchedAnalyses
      : 0;

    const avgImprovement = improvements.length > 0
      ? improvements.reduce((sum, a) => sum + (a.scoreDelta || 0), 0) /
        improvements.length
      : 0;

    await prisma.feedbackPattern.update({
      where: { id: pattern.id },
      data: {
        frequency: matchedAnalyses,
        successRate,
        avgScoreImprovement: avgImprovement,
        updatedAt: new Date(),
      },
    });
  }
}
