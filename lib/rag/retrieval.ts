/**
 * RAG Retrieval Module
 * Handles vector search and retrieval from all RAG indexes
 */

import { prisma } from '../prisma';
import { generateEmbedding, cosineSimilarity } from './embeddings';
import {
  DEFAULT_RETRIEVAL_CONFIG,
  type Embedding,
  type ExampleEssayMatch,
  type FeedbackPatternMatch,
  type SchoolInsightMatch,
  type RetrievedContext,
  type RetrievalConfig,
} from './types';
import { withTimeout, getErrorMessage } from './utils';

// =============================================================================
// CONFIGURATION
// =============================================================================

const RETRIEVAL_CONFIG = {
  // Timeout for individual retrieval operations
  retrievalTimeoutMs: 10000,
  // Timeout for embedding generation
  embeddingTimeoutMs: 15000,
  // Timeout for entire context retrieval
  totalTimeoutMs: 30000,
};

// =============================================================================
// TYPES
// =============================================================================

interface RetrieveExamplesParams {
  embedding: Embedding;
  schoolId?: string;
  essayType?: string;
  spikeCategory?: string;
  config?: Partial<RetrievalConfig>;
}

interface RetrievePatternsParams {
  embedding: Embedding;
  essayType?: string;
  schoolId?: string;
  issueCategory?: string;
  config?: Partial<RetrievalConfig>;
}

interface RetrieveInsightsParams {
  schoolId: string;
  essayType?: string;
  insightTypes?: string[];
  embedding?: Embedding;
  config?: Partial<RetrievalConfig>;
}

interface RetrieveAllParams {
  essayText: string;
  schoolId?: string;
  essayType?: string;
  spikeCategory?: string;
  insightTypes?: string[];
}

// =============================================================================
// EXAMPLE ESSAYS RETRIEVAL
// =============================================================================

/**
 * Retrieve similar example essays
 * Uses embedding similarity with metadata filtering
 */
export async function retrieveSimilarEssays(
  params: RetrieveExamplesParams
): Promise<ExampleEssayMatch[]> {
  const { embedding, schoolId, essayType, spikeCategory, config = {} } = params;

  const { topK, similarityThreshold } = {
    ...DEFAULT_RETRIEVAL_CONFIG.exampleEssays,
    ...config,
  };

  // Build filter conditions
  const where: Record<string, unknown> = { isActive: true };

  if (schoolId) {
    where.schoolId = schoolId;
  }
  if (essayType) {
    where.essayType = essayType;
  }

  // Fetch candidates with embeddings
  const candidates = await prisma.exampleEssay.findMany({
    where,
    select: {
      id: true,
      schoolId: true,
      essayType: true,
      contentSnippet: true,
      outcome: true,
      scoreRange: true,
      themeTags: true,
      spikeCategory: true,
      strengthNotes: true,
      keyTechniques: true,
      embedding: true,
    },
  });

  // Filter candidates with valid embeddings and calculate similarity
  const matches: ExampleEssayMatch[] = [];

  for (const candidate of candidates) {
    if (!candidate.embedding || !Array.isArray(candidate.embedding)) {
      continue;
    }

    const candidateEmbedding = candidate.embedding as Embedding;
    const similarity = cosineSimilarity(embedding, candidateEmbedding);

    if (similarity >= similarityThreshold) {
      // Boost score for matching spike category
      let adjustedSimilarity = similarity;
      if (spikeCategory && candidate.spikeCategory === spikeCategory) {
        adjustedSimilarity = Math.min(1, similarity * 1.1);
      }

      matches.push({
        id: candidate.id,
        schoolId: candidate.schoolId,
        essayType: candidate.essayType,
        contentSnippet: candidate.contentSnippet,
        outcome: candidate.outcome || undefined,
        scoreRange: candidate.scoreRange || undefined,
        themeTags: candidate.themeTags,
        spikeCategory: candidate.spikeCategory || undefined,
        strengthNotes: candidate.strengthNotes || undefined,
        keyTechniques: candidate.keyTechniques,
        similarity: adjustedSimilarity,
      });
    }
  }

  // Sort by similarity and take top K
  matches.sort((a, b) => b.similarity - a.similarity);
  return matches.slice(0, topK);
}

// =============================================================================
// FEEDBACK PATTERNS RETRIEVAL
// =============================================================================

/**
 * Retrieve relevant feedback patterns
 * Matches patterns that might apply to the essay's issues
 */
export async function retrieveFeedbackPatterns(
  params: RetrievePatternsParams
): Promise<FeedbackPatternMatch[]> {
  const { embedding, essayType, schoolId, issueCategory, config = {} } = params;

  const { topK, similarityThreshold } = {
    ...DEFAULT_RETRIEVAL_CONFIG.feedbackPatterns,
    ...config,
  };

  // Build filter conditions
  const where: Record<string, unknown> = { isActive: true };

  // For patterns, we want general patterns OR school-specific
  // So we use OR logic: (schoolId is null) OR (schoolId matches)
  if (essayType) {
    where.OR = [
      { essayType: null },
      { essayType: essayType },
    ];
  }

  if (issueCategory) {
    where.issueCategory = issueCategory;
  }

  // Fetch candidates
  const candidates = await prisma.feedbackPattern.findMany({
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
      schoolId: true,
      embedding: true,
    },
  });

  const matches: FeedbackPatternMatch[] = [];

  for (const candidate of candidates) {
    if (!candidate.embedding || !Array.isArray(candidate.embedding)) {
      continue;
    }

    const candidateEmbedding = candidate.embedding as Embedding;
    const similarity = cosineSimilarity(embedding, candidateEmbedding);

    if (similarity >= similarityThreshold) {
      // Boost score for school-specific patterns
      let adjustedSimilarity = similarity;
      if (schoolId && candidate.schoolId === schoolId) {
        adjustedSimilarity = Math.min(1, similarity * 1.15);
      }

      // Boost patterns with higher success rates
      if (candidate.successRate > 0.7) {
        adjustedSimilarity = Math.min(1, adjustedSimilarity * 1.05);
      }

      matches.push({
        id: candidate.id,
        issueType: candidate.issueType,
        issueCategory: candidate.issueCategory,
        patternName: candidate.patternName,
        description: candidate.description,
        exampleBefore: candidate.exampleBefore || undefined,
        exampleAfter: candidate.exampleAfter || undefined,
        fixStrategy: candidate.fixStrategy || undefined,
        avgScoreImprovement: candidate.avgScoreImprovement,
        frequency: candidate.frequency,
        successRate: candidate.successRate,
        severity: candidate.severity,
        similarity: adjustedSimilarity,
      });
    }
  }

  // Sort by combination of similarity and severity
  matches.sort((a, b) => {
    const scoreA = a.similarity * 0.7 + (a.severity / 5) * 0.3;
    const scoreB = b.similarity * 0.7 + (b.severity / 5) * 0.3;
    return scoreB - scoreA;
  });

  return matches.slice(0, topK);
}

// =============================================================================
// SCHOOL INSIGHTS RETRIEVAL
// =============================================================================

/**
 * Retrieve school-specific insights
 * Prioritizes by relevance score and optionally semantic similarity
 */
export async function retrieveSchoolInsights(
  params: RetrieveInsightsParams
): Promise<SchoolInsightMatch[]> {
  const { schoolId, essayType, insightTypes, embedding, config = {} } = params;

  const { topK } = {
    ...DEFAULT_RETRIEVAL_CONFIG.schoolInsights,
    ...config,
  };

  // Build filter conditions
  const where: Record<string, unknown> = {
    schoolId,
    isActive: true,
  };

  if (insightTypes && insightTypes.length > 0) {
    where.insightType = { in: insightTypes };
  }

  // Fetch insights
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
      embedding: true,
    },
    orderBy: {
      relevanceScore: 'desc',
    },
  });

  const matches: SchoolInsightMatch[] = [];

  for (const insight of insights) {
    // Filter by essay type if specified
    if (essayType && insight.essayTypes.length > 0) {
      if (!insight.essayTypes.includes(essayType)) {
        continue;
      }
    }

    let similarity = insight.relevanceScore / 5; // Normalize to 0-1

    // If we have an embedding, use semantic similarity
    if (embedding && insight.embedding && Array.isArray(insight.embedding)) {
      const insightEmbedding = insight.embedding as Embedding;
      const semanticSimilarity = cosineSimilarity(embedding, insightEmbedding);
      // Weight: 60% relevance, 40% semantic
      similarity = insight.relevanceScore / 5 * 0.6 + semanticSimilarity * 0.4;
    }

    matches.push({
      id: insight.id,
      schoolId: insight.schoolId,
      insightType: insight.insightType,
      content: insight.content,
      source: insight.source || undefined,
      essayTypes: insight.essayTypes,
      relevanceScore: insight.relevanceScore,
      similarity,
    });
  }

  // Sort by combined score
  matches.sort((a, b) => b.similarity - a.similarity);
  return matches.slice(0, topK);
}

// =============================================================================
// COMBINED RETRIEVAL
// =============================================================================

/**
 * Retrieve all context in parallel with timeout handling
 * This is the main entry point for RAG retrieval
 */
export async function retrieveAllContext(
  params: RetrieveAllParams
): Promise<RetrievedContext> {
  const startTime = Date.now();

  const { essayText, schoolId, essayType, spikeCategory, insightTypes } = params;

  try {
    // Generate essay embedding with timeout
    const embeddingResult = await withTimeout(
      generateEmbedding(essayText, 'essay'),
      RETRIEVAL_CONFIG.embeddingTimeoutMs,
      'Embedding generation'
    );
    const embedding = embeddingResult.embedding;

    // Run all retrievals in parallel with individual timeouts
    const retrievalPromises = [
      withTimeout(
        retrieveSimilarEssays({
          embedding,
          schoolId,
          essayType,
          spikeCategory,
        }),
        RETRIEVAL_CONFIG.retrievalTimeoutMs,
        'Example essays retrieval'
      ).catch(error => {
        console.warn('Example essays retrieval failed:', getErrorMessage(error));
        return [] as ExampleEssayMatch[];
      }),

      withTimeout(
        retrieveFeedbackPatterns({
          embedding,
          essayType,
          schoolId,
        }),
        RETRIEVAL_CONFIG.retrievalTimeoutMs,
        'Feedback patterns retrieval'
      ).catch(error => {
        console.warn('Feedback patterns retrieval failed:', getErrorMessage(error));
        return [] as FeedbackPatternMatch[];
      }),

      schoolId
        ? withTimeout(
            retrieveSchoolInsights({
              schoolId,
              essayType,
              insightTypes,
              embedding,
            }),
            RETRIEVAL_CONFIG.retrievalTimeoutMs,
            'School insights retrieval'
          ).catch(error => {
            console.warn('School insights retrieval failed:', getErrorMessage(error));
            return [] as SchoolInsightMatch[];
          })
        : Promise.resolve([] as SchoolInsightMatch[]),
    ];

    const results = await Promise.all(retrievalPromises);
    const exampleEssays = results[0] as ExampleEssayMatch[];
    const feedbackPatterns = results[1] as FeedbackPatternMatch[];
    const schoolInsights = results[2] as SchoolInsightMatch[];

    const totalTimeMs = Date.now() - startTime;

    return {
      exampleEssays,
      feedbackPatterns,
      schoolInsights,
      retrievalMetadata: {
        totalTimeMs,
        exampleEssaysCount: exampleEssays.length,
        feedbackPatternsCount: feedbackPatterns.length,
        schoolInsightsCount: schoolInsights.length,
      },
    };
  } catch (error) {
    // If embedding generation fails, return empty context
    console.error('RAG context retrieval failed:', getErrorMessage(error));

    return {
      exampleEssays: [],
      feedbackPatterns: [],
      schoolInsights: [],
      retrievalMetadata: {
        totalTimeMs: Date.now() - startTime,
        exampleEssaysCount: 0,
        feedbackPatternsCount: 0,
        schoolInsightsCount: 0,
        error: getErrorMessage(error),
      },
    };
  }
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Find similar analyses for benchmarking
 */
export async function findSimilarAnalyses(
  embedding: Embedding,
  schoolId?: string,
  essayType?: string,
  limit: number = 10
): Promise<Array<{
  id: string;
  overallScore: number;
  similarity: number;
}>> {
  const where: Record<string, unknown> = {};

  if (schoolId) {
    where.schoolId = schoolId;
  }
  if (essayType) {
    where.essayType = essayType;
  }

  const analyses = await prisma.analysisHistory.findMany({
    where,
    select: {
      id: true,
      overallScore: true,
      essayEmbedding: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
    take: 100, // Get recent analyses
  });

  const results: Array<{
    id: string;
    overallScore: number;
    similarity: number;
  }> = [];

  for (const analysis of analyses) {
    if (!analysis.essayEmbedding || !Array.isArray(analysis.essayEmbedding)) {
      continue;
    }

    const analysisEmbedding = analysis.essayEmbedding as Embedding;
    const similarity = cosineSimilarity(embedding, analysisEmbedding);

    if (similarity >= 0.5) {
      results.push({
        id: analysis.id,
        overallScore: analysis.overallScore,
        similarity,
      });
    }
  }

  results.sort((a, b) => b.similarity - a.similarity);
  return results.slice(0, limit);
}

/**
 * Get benchmarking statistics for a school/essay type
 */
export async function getBenchmarkStats(
  schoolId?: string,
  essayType?: string
): Promise<{
  averageScore: number;
  medianScore: number;
  topQuartileScore: number;
  sampleSize: number;
}> {
  const where: Record<string, unknown> = {};

  if (schoolId) {
    where.schoolId = schoolId;
  }
  if (essayType) {
    where.essayType = essayType;
  }

  const analyses = await prisma.analysisHistory.findMany({
    where,
    select: {
      overallScore: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
    take: 500, // Recent analyses for stats
  });

  if (analyses.length === 0) {
    return {
      averageScore: 0,
      medianScore: 0,
      topQuartileScore: 0,
      sampleSize: 0,
    };
  }

  const scores = analyses.map(a => a.overallScore).sort((a, b) => a - b);
  const sum = scores.reduce((a, b) => a + b, 0);

  return {
    averageScore: Math.round(sum / scores.length),
    medianScore: Math.round(scores[Math.floor(scores.length / 2)]),
    topQuartileScore: Math.round(scores[Math.floor(scores.length * 0.75)]),
    sampleSize: scores.length,
  };
}

/**
 * Check if RAG data is populated for a school
 * Includes timeout handling for database queries
 */
export async function checkRAGDataAvailability(
  schoolId: string
): Promise<{
  hasExamples: boolean;
  hasInsights: boolean;
  hasPatterns: boolean;
  exampleCount: number;
  insightCount: number;
  patternCount: number;
}> {
  try {
    const [exampleCount, insightCount, patternCount] = await withTimeout(
      Promise.all([
        prisma.exampleEssay.count({
          where: { schoolId, isActive: true },
        }),
        prisma.schoolInsight.count({
          where: { schoolId, isActive: true },
        }),
        prisma.feedbackPattern.count({
          where: { isActive: true },
        }),
      ]),
      RETRIEVAL_CONFIG.retrievalTimeoutMs,
      'RAG data availability check'
    );

    return {
      hasExamples: exampleCount > 0,
      hasInsights: insightCount > 0,
      hasPatterns: patternCount > 0,
      exampleCount,
      insightCount,
      patternCount,
    };
  } catch (error) {
    console.error('Failed to check RAG data availability:', getErrorMessage(error));
    // Return defaults indicating no data
    return {
      hasExamples: false,
      hasInsights: false,
      hasPatterns: false,
      exampleCount: 0,
      insightCount: 0,
      patternCount: 0,
    };
  }
}
