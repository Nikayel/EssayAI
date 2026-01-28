/**
 * RAG System Module Index
 * Exports all RAG functionality for easy imports
 */

// Types
export * from './types';

// Embeddings
export {
  generateEmbedding,
  batchGenerateEmbeddings,
  cosineSimilarity,
  findTopKSimilar,
  averageSimilarity,
  validateEmbedding,
  chunkText,
  willTextBeTruncated,
  getCacheStats,
  cleanExpiredCache,
  type TextPrepareResult,
} from './embeddings';

// Guardrails (Input & Output)
export {
  runGuardrails,
  quickSafetyCheck,
  validateSchoolId,
  validateEssayType,
  GUARDRAIL_CONFIG,
  // Output validation (anti-hallucination)
  validateAnalysisOutput,
  verifyQuotedEvidence,
  type OutputValidationResult,
} from './guardrails';

// Retrieval
export {
  retrieveSimilarEssays,
  retrieveFeedbackPatterns,
  retrieveSchoolInsights,
  retrieveAllContext,
  findSimilarAnalyses,
  getBenchmarkStats,
  checkRAGDataAvailability,
} from './retrieval';

// Context Builder
export {
  buildEnhancedPrompt,
  buildMinimalContext,
  prioritizeSuggestions,
} from './context-builder';

// Feedback Loop
export {
  storeAnalysisHistory,
  updatePatternSuccess,
  processVersionImprovement,
  calculateScorePercentile,
  estimateImprovementPotential,
  getPatternEffectivenessReport,
  getUserImprovementHistory,
  cleanupOldHistory,
  recalculatePatternStats,
} from './feedback-loop';

// Seed Data
export {
  SEED_FEEDBACK_PATTERNS,
  SEED_SCHOOL_INSIGHTS,
  SEED_EXAMPLE_ESSAYS,
} from './seed-data';

// Output Sanitizer (Code-Level Anti-Hallucination)
export {
  sanitizeAnalysisOutput,
  quoteExistsInEssay,
  createSafeDefault,
  type SanitizationResult,
  type SanitizationModification,
  type SanitizationContext,
} from './output-sanitizer';

// RAG-Enhanced Analyzer
export {
  analyzeEssayWithRAG,
  runCommonsCheckWithRAG,
  type RAGAnalysisParams,
  type RAGAnalysisResponse,
} from './rag-analyzer';

// Score Messaging (Human-Friendly Feedback)
export {
  getScoreMessage,
  explainPercentile,
  explainImprovement,
  getDimensionContext,
  getStageExpectations,
  type ScoreContext,
  type ScoreMessage,
} from './score-messaging';
