/**
 * Essay Scoring Engine
 * Main entry point for the 5-dimension scoring system
 */

// Types
export type {
  StudentIntake,
  Activity,
  WorkExperience,
  EssayTypeEnum,
  AuthenticityScore,
  InsightScore,
  SchoolFitScore,
  SpecificityScore,
  RiskScore,
  EssayAnalysisResult,
  ScoreLabel,
  Annotation,
  PrioritizedIssue,
  IdentifiedStrength,
  SchoolSpecificFeedback,
  BenchmarkComparison,
  AnalysisMetadata,
  SchoolScoringConfig,
  GenericPhrase,
  ClicheDetectionResult,
  ScoringEngine,
  TextSpan,
  FlaggedPhrase,
} from './types';

// Constants
export {
  SCORE_THRESHOLDS,
  DEFAULT_WEIGHTS,
  DIMENSION_MAX_SCORES,
} from './types';

// Generic Phrase Detection
export {
  HARD_FLAG_PHRASES,
  SOFT_FLAG_PHRASES,
  THESAURUS_ABUSE_PATTERNS,
  VAGUE_LANGUAGE_PATTERNS,
  SURFACE_EPIPHANY_PATTERNS,
  ALL_GENERIC_PHRASES,
  HARD_FLAGS,
  SOFT_FLAGS,
  detectGenericPhrases,
  calculateClicheScore,
} from './generic-phrases';

// School Configurations
export {
  SCHOOL_CONFIGS,
  getSchoolConfig,
  getAllSchoolIds,
  detectSchoolKeywords,
  getScoreAdjustment,
  generateSchoolFeedback,
} from './school-configs';

// Utility functions

/**
 * Calculate overall score from dimension scores
 */
export function calculateOverallScore(dimensions: {
  authenticity: { totalScore: number };
  insight: { totalScore: number };
  schoolFit: { totalScore: number };
  specificity: { totalScore: number };
  risk: { totalScore: number };
}): number {
  return (
    dimensions.authenticity.totalScore +
    dimensions.insight.totalScore +
    dimensions.schoolFit.totalScore +
    dimensions.specificity.totalScore +
    dimensions.risk.totalScore
  );
}

/**
 * Get score label from numeric score
 */
export function getScoreLabel(score: number): 'needs_work' | 'developing' | 'competitive' | 'strong' | 'exceptional' {
  if (score >= 90) return 'exceptional';
  if (score >= 75) return 'strong';
  if (score >= 60) return 'competitive';
  if (score >= 40) return 'developing';
  return 'needs_work';
}

/**
 * Format score for display
 */
export function formatScoreDisplay(score: number, maxScore: number): string {
  const percentage = Math.round((score / maxScore) * 100);
  return `${score}/${maxScore} (${percentage}%)`;
}

/**
 * Get score color for UI
 */
export function getScoreColor(score: number, maxScore: number): 'red' | 'orange' | 'yellow' | 'green' | 'blue' {
  const percentage = (score / maxScore) * 100;
  if (percentage >= 90) return 'blue';
  if (percentage >= 75) return 'green';
  if (percentage >= 60) return 'yellow';
  if (percentage >= 40) return 'orange';
  return 'red';
}

/**
 * Prioritize issues by impact
 */
export function prioritizeIssues(
  issues: Array<{
    issue: string;
    dimension: string;
    severity: 'low' | 'medium' | 'high';
    impact: string;
  }>
): Array<{
  rank: number;
  issue: string;
  dimension: string;
  impact: string;
  howToFix: string;
}> {
  const severityOrder = { high: 0, medium: 1, low: 2 };

  return issues
    .sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity])
    .slice(0, 5)  // Top 5 issues
    .map((issue, index) => ({
      rank: index + 1,
      issue: issue.issue,
      dimension: issue.dimension,
      impact: issue.impact,
      howToFix: '', // To be filled by specific scorer
    }));
}
