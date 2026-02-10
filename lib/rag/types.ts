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
  /** True if the input text was truncated to fit token limits */
  truncated?: boolean;
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
  // Core narrative
  spike?: string;
  topActivities?: string[];
  biggestWorry?: string;
  toneSample?: string;
  toneEmbedding?: Embedding;
  graduationYear?: number;
  applicationCycle?: string;

  // Demographics & Background
  isInternational?: boolean;
  countryOfOrigin?: string;
  isFirstGen?: boolean;
  primaryLanguage?: string;
  culturalContext?: string; // e.g., "Indian immigrant family", "rural community"
  socioeconomicContext?: 'low-income' | 'middle-income' | 'high-income';
  familyEducationLevel?: 'no_college' | 'some_college' | 'bachelors' | 'graduate' | string;
  immigrationStatus?: 'citizen' | 'permanent_resident' | 'visa' | 'undocumented' | 'daca' | 'prefer_not_say';
  immigrationStory?: string; // Prisma field alias for immigration context
  geographicContext?: 'rural' | 'suburban' | 'urban' | string;
  schoolType?: 'public' | 'private' | 'charter' | 'magnet' | 'homeschool' | 'international' | string;
  familyResponsibilities?: string[];

  // Additional Identity Contexts (for comprehensive cultural sensitivity)
  isRural?: boolean;           // Small-town/rural background
  isHomeschooled?: boolean;    // Homeschool or alternative education
  hasDisability?: boolean;     // Physical, learning, or mental health disability
  accommodations?: string;     // e.g., "extended time", "screen reader"
  isUndocumented?: boolean;    // Undocumented or DACA status
  isLGBTQ?: boolean;          // LGBTQ+ identity
  isMilitaryFamily?: boolean;  // Military family background
  isFosterCare?: boolean;      // Foster care experience
  isSystemInvolved?: boolean;  // Juvenile justice, child welfare system involvement

  // Academic Context
  intendedMajor?: string;
  academicInterests?: string[];
  intellectualPassion?: string;
  hasResearchExperience?: boolean;
  researchDescription?: string;
  academicChallenges?: string;

  // Activities & Experience
  activitiesStructured?: Array<{
    name: string;
    role: string;
    hoursPerWeek: number;
    weeksPerYear: number;
    yearsInvolved: number;
    impact: string;
  }>;
  workExperience?: Array<{
    job: string;
    hoursPerWeek: number;
    reasonForWorking: string;
  }>;
  leadershipRoles?: string[];
  summerExperiences?: string;

  // Personal Identity & Story
  identityFactors?: string[];
  significantChallenges?: string;
  uniquePerspective?: string;
  whatAOsShouldKnow?: string;

  // Voice Calibration
  writingStyle?: 'formal' | 'conversational' | 'storytelling' | 'analytical';
  usesHumor?: boolean;
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
// ADMIN FULL ANALYSIS TYPES (3-Tier Evaluation Framework)
// =============================================================================

/** Text position reference for annotations */
export interface TextPosition {
  text: string;
  start_index: number;
  end_index: number;
}

/** Tier 1: Structural Requirements (pass/fail) */
export interface Tier1Structural {
  word_count_compliant: { pass: boolean; detail: string };
  prompt_fully_addressed: { pass: boolean; detail: string };
  school_name_correct: { pass: boolean; detail: string };
  grammar_spelling: { pass: boolean; detail: string };
  formatting: { pass: boolean; detail: string };
  all_passed: boolean;
  flags: string[];
}

/** Tier 2: Content Quality dimension with evidence */
export interface ContentDimensionScore {
  score: number;
  rationales: string[];
  evidence_quotes?: Array<TextPosition>;
}

/** Tier 2: Specificity dimension with vague/strong detail tracking */
export interface SpecificityScore extends ContentDimensionScore {
  vague_claims?: Array<TextPosition & { what_to_ask: string }>;
  strong_details?: Array<TextPosition & { why_it_works: string }>;
}

/** Tier 2: Voice dimension with authenticity tracking */
export interface VoiceScore extends ContentDimensionScore {
  authentic_moments?: Array<TextPosition>;
  inauthenticity_signals?: Array<TextPosition & { signal: string }>;
}

/** Tier 2: Insight dimension with depth tracking */
export interface InsightScore extends ContentDimensionScore {
  reveals_thinking?: boolean;
  growth_demonstrated?: boolean;
  surface_vs_deep?: 'surface' | 'moderate' | 'deep';
}

/** Tier 2: Program Fit dimension */
export interface ProgramFitScore extends ContentDimensionScore {
  specific_references?: Array<TextPosition & { reference_type: string }>;
  missing_elements?: string[];
  contribution_mentioned?: boolean;
}

/** Tier 2: Structure dimension */
export interface StructureScore extends ContentDimensionScore {
  opening_type?: string;
  opening_strength?: 'weak' | 'moderate' | 'strong';
  conclusion_resonates?: boolean;
  transitions_quality?: 'poor' | 'adequate' | 'smooth';
  redundancy_with_resume?: boolean;
}

/** Tier 2: All content quality dimensions */
export interface Tier2Content {
  thesis_focus?: ContentDimensionScore & { one_sentence_summary?: string };
  specificity_evidence?: SpecificityScore;
  personal_voice?: VoiceScore;
  insight_reflection?: InsightScore;
  program_fit?: ProgramFitScore;
  structure_flow?: StructureScore;
}

/** Tier 3: Red flag entry */
export interface RedFlagEntry {
  type: string;
  severity: 'critical' | 'warning';
  description: string;
  evidence?: TextPosition;
  recommendation: string;
}

/** Tier 3: AI content detection signals */
export interface AIContentSignals {
  likelihood: 'low' | 'medium' | 'high';
  signals_detected: string[];
  evidence?: Array<TextPosition & { signal: string }>;
  recommendation?: string;
}

/** Tier 3: Red Flags & Deal Breakers */
export interface Tier3RedFlags {
  has_red_flags: boolean;
  flags: RedFlagEntry[];
  ai_content_signals?: AIContentSignals;
}

/** Text annotation for highlighted display */
export interface TextAnnotation {
  type: 'strength' | 'issue' | 'red_flag' | 'ai_signal' | 'suggestion';
  severity: 'critical' | 'major' | 'minor' | 'positive';
  text: string;
  start_index: number;
  end_index: number;
  category: string;
  message: string;
  suggestion?: string;
}

/** Feedback section for structured response */
export interface FeedbackSection {
  overall_assessment: string;
  whats_working: Array<{
    passage: string;
    start_index?: number;
    end_index?: number;
    why: string;
  }>;
  priority_improvements: Array<{
    rank: number;
    issue: string;
    why_it_matters: string;
    coaching_suggestion: string;
    affected_text?: TextPosition;
  }>;
  questions_for_writer: Array<{
    question: string;
    context: string;
    related_text?: string;
  }>;
  prompt_compliance: string;
}

/** Complete admin analysis response extending the RAG response */
export interface AdminAnalysisData {
  tier1_structural?: Tier1Structural;
  tier2_content?: Tier2Content;
  tier3_red_flags?: Tier3RedFlags;
  text_annotations?: TextAnnotation[];
  feedback?: FeedbackSection;
}

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
