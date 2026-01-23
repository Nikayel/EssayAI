/**
 * RAG System Type Definitions
 * Comprehensive types for embeddings, retrieval, and context building
 */

import { z } from 'zod';

// =============================================================================
// EMBEDDING TYPES
// =============================================================================

export const EMBEDDING_DIMENSIONS = 1536;
export const EMBEDDING_MODEL = 'text-embedding-3-small';

export type Embedding = number[];

export interface EmbeddingRequest {
  text: string;
  type: 'essay' | 'pattern' | 'insight' | 'spike' | 'query';
}

export interface BatchEmbeddingRequest {
  texts: string[];
  type: EmbeddingRequest['type'];
}

export interface EmbeddingResult {
  embedding: Embedding;
  tokenCount: number;
  cached: boolean;
}

export interface BatchEmbeddingResult {
  embeddings: Embedding[];
  totalTokens: number;
  cached: number;
}

// =============================================================================
// RETRIEVAL TYPES
// =============================================================================

export interface RetrievalConfig {
  topK: number;
  similarityThreshold: number;
  filters?: Record<string, string | string[]>;
}

export const DEFAULT_RETRIEVAL_CONFIG: Record<string, RetrievalConfig> = {
  exampleEssays: {
    topK: 3,
    similarityThreshold: 0.70,
  },
  feedbackPatterns: {
    topK: 5,
    similarityThreshold: 0.65,
  },
  schoolInsights: {
    topK: 3,
    similarityThreshold: 0.60,
  },
};

// Example Essay retrieval result
export interface ExampleEssayMatch {
  id: string;
  schoolId: string;
  essayType: string;
  contentSnippet: string;
  outcome?: string;
  scoreRange?: string;
  themeTags: string[];
  spikeCategory?: string;
  strengthNotes?: string;
  keyTechniques: string[];
  similarity: number;
}

// Feedback Pattern retrieval result
export interface FeedbackPatternMatch {
  id: string;
  issueType: string;
  issueCategory: string;
  patternName: string;
  description: string;
  exampleBefore?: string;
  exampleAfter?: string;
  fixStrategy?: string;
  avgScoreImprovement: number;
  frequency: number;
  successRate: number;
  severity: number;
  similarity: number;
}

// School Insight retrieval result
export interface SchoolInsightMatch {
  id: string;
  schoolId: string;
  insightType: string;
  content: string;
  source?: string;
  essayTypes: string[];
  relevanceScore: number;
  similarity: number;
}

// Combined retrieval result
export interface RetrievedContext {
  exampleEssays: ExampleEssayMatch[];
  feedbackPatterns: FeedbackPatternMatch[];
  schoolInsights: SchoolInsightMatch[];
  retrievalMetadata: {
    totalTimeMs: number;
    exampleEssaysCount: number;
    feedbackPatternsCount: number;
    schoolInsightsCount: number;
    error?: string; // Set if retrieval failed
  };
}

// =============================================================================
// CONTEXT BUILDER TYPES
// =============================================================================

export interface StudentProfile {
  spike?: string;
  topActivities?: string[];
  biggestWorry?: string;
  toneSample?: string;
  toneEmbedding?: Embedding;
  graduationYear?: number;
  applicationCycle?: string;

  // Diversity & inclusion context (optional, self-reported)
  isInternational?: boolean;
  countryOfOrigin?: string;
  isFirstGen?: boolean;
  primaryLanguage?: string;
  culturalContext?: string; // e.g., "Indian immigrant family", "rural community"
  socioeconomicContext?: 'low-income' | 'middle-income' | 'high-income';
}

export interface EnhancedPromptInput {
  essayText: string;
  essayType: string;
  schoolId?: string;
  promptText: string;
  wordLimit?: number;
  profile?: StudentProfile;
  retrievedContext: RetrievedContext;
}

export interface EnhancedPromptOutput {
  systemPrompt: string;
  userPrompt: string;
  contextSummary: {
    examplesUsed: number;
    patternsUsed: number;
    insightsUsed: number;
  };
}

// =============================================================================
// GUARDRAILS TYPES
// =============================================================================

export type GuardrailSeverity = 'block' | 'warn' | 'info';

export interface GuardrailViolation {
  type: string;
  severity: GuardrailSeverity;
  message: string;
  evidence?: string;
}

export interface GuardrailResult {
  passed: boolean;
  violations: GuardrailViolation[];
  sanitizedText?: string;
  riskScore: number; // 0-100, higher = more risky
}

export type GuardrailCategory =
  | 'prompt_injection'
  | 'pii_detection'
  | 'plagiarism_signal'
  | 'ai_generated'
  | 'harmful_content'
  | 'length_violation'
  | 'quality_check';

// =============================================================================
// FEEDBACK LOOP TYPES
// =============================================================================

export interface AnalysisHistoryEntry {
  essayVersionId: string;
  userId: string;
  schoolId?: string;
  essayType: string;
  overallScore: number;
  dimensionScores: Record<string, number>;
  issuesIdentified: string[];
  patternsMatched: string[];
  suggestionsGiven?: unknown;
  previousVersionScore?: number;
  scoreDelta?: number;
  essayEmbedding?: Embedding;
  ragContextUsed?: {
    exampleIds: string[];
    patternIds: string[];
    insightIds: string[];
  };
}

export interface PatternUpdateData {
  patternId: string;
  matched: boolean;
  studentImproved?: boolean;
  scoreImprovement?: number;
}

// =============================================================================
// ZOD SCHEMAS FOR VALIDATION
// =============================================================================

export const ExampleEssaySchema = z.object({
  id: z.string(),
  schoolId: z.string(),
  essayType: z.string(),
  contentSnippet: z.string().min(100).max(3000),
  outcome: z.string().optional(),
  scoreRange: z.string().optional(),
  themeTags: z.array(z.string()),
  spikeCategory: z.string().optional(),
  strengthNotes: z.string().optional(),
  keyTechniques: z.array(z.string()),
});

export const FeedbackPatternSchema = z.object({
  id: z.string(),
  issueType: z.string(),
  issueCategory: z.enum(['structure', 'content', 'style', 'fit', 'voice', 'mechanics']),
  patternName: z.string(),
  description: z.string(),
  exampleBefore: z.string().optional(),
  exampleAfter: z.string().optional(),
  fixStrategy: z.string().optional(),
  avgScoreImprovement: z.number().min(0).max(50),
  frequency: z.number().min(0),
  successRate: z.number().min(0).max(1),
  severity: z.number().min(1).max(5),
});

export const SchoolInsightSchema = z.object({
  id: z.string(),
  schoolId: z.string(),
  insightType: z.enum(['ao_quote', 'student_tip', 'common_mistake', 'what_works', 'program_detail']),
  content: z.string(),
  source: z.string().optional(),
  essayTypes: z.array(z.string()),
  relevanceScore: z.number().min(1).max(5),
});

export const StudentProfileSchema = z.object({
  spike: z.string().optional(),
  topActivities: z.array(z.string()).optional(),
  biggestWorry: z.string().optional(),
  toneSample: z.string().optional(),
  graduationYear: z.number().optional(),
  applicationCycle: z.string().optional(),
});

// =============================================================================
// PERFORMANCE TARGETS
// =============================================================================

export const PERFORMANCE_TARGETS = {
  embeddingGeneration: 200, // ms
  totalRetrieval: 500, // ms
  fullAnalysisWithRAG: 45000, // ms (45s)
  costPerAnalysis: 0.15, // dollars
};

// =============================================================================
// CACHE CONFIGURATION
// =============================================================================

export const CACHE_CONFIG = {
  schoolInsights: 24 * 60 * 60 * 1000, // 24 hours
  feedbackPatterns: 60 * 60 * 1000, // 1 hour
  exampleEssays: 24 * 60 * 60 * 1000, // 24 hours
  userEmbeddings: 7 * 24 * 60 * 60 * 1000, // 7 days
  queryEmbeddings: 5 * 60 * 1000, // 5 minutes
};
