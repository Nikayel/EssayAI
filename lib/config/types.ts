/**
 * Configuration System Types
 * Single source of truth for all configurable values
 *
 * Design Principles:
 * - DRY: No value defined in multiple places
 * - Scalable: Auto-calculates time-sensitive values
 * - Override-able: DB overrides take precedence over defaults
 */

// =============================================================================
// PRICING CONFIGURATION
// =============================================================================

export interface PricingConfig {
  // Analysis tiers (in cents)
  tiers: {
    quick: number;      // $9.99 = 999
    standard: number;   // $79 = 7900
    premium: number;    // $249 = 24900
  };
  // Human review add-on timing
  humanReviewTurnaround: number; // hours
}

// =============================================================================
// ADMISSIONS CYCLE CONFIGURATION
// =============================================================================

export interface AdmissionsCycleConfig {
  // Current cycle (e.g., "2025-2026")
  current: string;
  // Valid graduation years for intake forms
  graduationYears: number[];
  // School deadlines for current cycle
  deadlines: Record<string, SchoolDeadlines>;
  // Acceptance rates (updated after each cycle)
  acceptanceRates: Record<string, number>;
}

export interface SchoolDeadlines {
  earlyDecision?: string;   // ISO date
  earlyAction?: string;
  restrictiveEA?: string;
  regularDecision: string;
}

// =============================================================================
// SCORING CONFIGURATION
// =============================================================================

export interface ScoringConfig {
  // Score label thresholds
  thresholds: {
    needs_work: { min: number; max: number };
    developing: { min: number; max: number };
    competitive: { min: number; max: number };
    strong: { min: number; max: number };
    exceptional: { min: number; max: number };
  };
  // Default dimension weights (school-specific override in school-configs)
  defaultWeights: {
    authenticity: number;
    insight: number;
    schoolFit: number;
    specificity: number;
    risk: number;
  };
  // Maximum scores per dimension
  dimensionMaxScores: {
    authenticity: number;
    insight: number;
    schoolFit: number;
    specificity: number;
    risk: number;
  };
}

// =============================================================================
// AI MODEL CONFIGURATION
// =============================================================================

export interface AIModelConfig {
  // Model identifiers (update when Anthropic releases new versions)
  claude: {
    fast: string;      // For quick operations
    balanced: string;  // Default for most operations
    premium: string;   // For premium tier analysis
  };
  // Embedding model
  embedding: {
    model: string;
    dimensions: number;
  };
}

// =============================================================================
// AI DETECTION CONFIGURATION
// =============================================================================

export interface AIDetectionConfig {
  // Thresholds for flagging
  emDashThreshold: number;           // Max em-dashes before flagging
  aiTransitionThreshold: number;     // Max AI-style transitions
  aiVocabularyThreshold: number;     // Max AI-favorite words
  balancedClauseThreshold: number;   // Max perfectly balanced clauses
  // Overall AI score thresholds
  highConfidenceThreshold: number;   // Score above this = high AI likelihood
  mediumConfidenceThreshold: number; // Score above this = medium AI likelihood
}

// =============================================================================
// GUARDRAILS CONFIGURATION
// =============================================================================

export interface GuardrailsConfig {
  essay: {
    minLength: number;        // Minimum characters
    maxLength: number;        // Maximum characters
    minWordCount: number;
    maxWordCount: number;
  };
  // Regex vs semantic balance
  regexFirst: boolean;              // Run regex before semantic
  semanticOnlyWhenUncertain: boolean;
  uncertaintyThreshold: number;     // 0-1, below this run semantic
}

// =============================================================================
// FULL CONFIGURATION
// =============================================================================

export interface AppConfig {
  pricing: PricingConfig;
  cycle: AdmissionsCycleConfig;
  scoring: ScoringConfig;
  models: AIModelConfig;
  aiDetection: AIDetectionConfig;
  guardrails: GuardrailsConfig;
}

// =============================================================================
// CONFIG OVERRIDE (from database)
// =============================================================================

export interface ConfigOverride {
  key: string;        // Dot notation: "pricing.tiers.quick"
  value: unknown;     // JSON value
  updatedAt: Date;
  updatedBy?: string;
}

// =============================================================================
// ANALYSIS TIER TYPES
// =============================================================================

export type AnalysisTier = 'quick' | 'standard' | 'premium';

export interface TierFeatures {
  overallScore: boolean;
  dimensionBreakdown: boolean;
  lineByLineAnnotations: boolean;
  actionableItemsLimit: number;    // -1 = unlimited
  schoolSpecificFeedback: boolean;
  aoInsights: boolean;
  aiDetectionReport: boolean;
  strengthHighlights: boolean;
  rewriteSuggestions: boolean;
  humanReview: boolean;
  humanTurnaroundHours: number | null;
}

export interface TierConfig {
  id: AnalysisTier;
  name: string;
  displayName: string;
  priceInCents: number;
  features: TierFeatures;
}
