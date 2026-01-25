/**
 * Default Configuration Values
 * These are fallbacks when no database override exists
 *
 * IMPORTANT: Time-sensitive values are calculated dynamically
 * Static values can be overridden via admin dashboard
 */

import type {
  AppConfig,
  PricingConfig,
  AdmissionsCycleConfig,
  ScoringConfig,
  AIModelConfig,
  AIDetectionConfig,
  GuardrailsConfig,
  TierConfig,
  AnalysisTier,
  IvyTierConfig,
  IvyTier,
} from './types';
import { PRICING } from '@/lib/stripe/config';

// =============================================================================
// DYNAMIC CALCULATIONS (Auto-update based on current date)
// =============================================================================

/**
 * Calculate current admissions cycle based on date
 * Aug-Dec = applying for next fall (e.g., Aug 2024 = "2024-2025" cycle)
 * Jan-Jul = still in current cycle (e.g., Jan 2025 = "2024-2025" cycle)
 */
export function calculateCurrentCycle(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth(); // 0-indexed

  // Aug (7) through Dec (11) = next year's cycle
  if (month >= 7) {
    return `${year}-${year + 1}`;
  }
  // Jan through Jul = current cycle
  return `${year - 1}-${year}`;
}

/**
 * Calculate valid graduation years for intake forms
 * Always show current year + next 3 years
 */
export function calculateGraduationYears(): number[] {
  const now = new Date();
  const currentYear = now.getFullYear();
  const month = now.getMonth();

  // After August, start with next year's graduates
  const baseYear = month >= 7 ? currentYear + 1 : currentYear;

  return [baseYear, baseYear + 1, baseYear + 2, baseYear + 3];
}

/**
 * Calculate deadlines for current cycle
 * Early deadlines: Nov 1 of cycle start year
 * Regular deadlines: Jan 1-5 of cycle end year
 */
export function calculateDefaultDeadlines(cycle: string): Record<string, { ed: string; rd: string }> {
  const [startYear, endYear] = cycle.split('-').map(Number);

  return {
    harvard: { ed: `${startYear}-11-01`, rd: `${endYear}-01-01` },
    yale: { ed: `${startYear}-11-01`, rd: `${endYear}-01-02` },
    princeton: { ed: `${startYear}-11-01`, rd: `${endYear}-01-01` },
    columbia: { ed: `${startYear}-11-01`, rd: `${endYear}-01-01` },
    upenn: { ed: `${startYear}-11-01`, rd: `${endYear}-01-05` },
    dartmouth: { ed: `${startYear}-11-01`, rd: `${endYear}-01-02` },
    brown: { ed: `${startYear}-11-01`, rd: `${endYear}-01-05` },
    cornell: { ed: `${startYear}-11-01`, rd: `${endYear}-01-02` },
  };
}

// =============================================================================
// STATIC DEFAULTS
// =============================================================================

export const DEFAULT_PRICING: PricingConfig = {
  tiers: {
    quick: 999,       // $9.99
    standard: 7900,   // $79.00
    premium: 24900,   // $249.00
  },
  humanReviewTurnaround: 48, // hours
};

export const DEFAULT_SCORING: ScoringConfig = {
  thresholds: {
    needs_work: { min: 0, max: 39 },
    developing: { min: 40, max: 59 },
    competitive: { min: 60, max: 74 },
    strong: { min: 75, max: 89 },
    exceptional: { min: 90, max: 100 },
  },
  defaultWeights: {
    authenticity: 0.25,
    insight: 0.25,
    schoolFit: 0.20,
    specificity: 0.20,
    risk: 0.10,
  },
  dimensionMaxScores: {
    authenticity: 25,
    insight: 25,
    schoolFit: 20,
    specificity: 20,
    risk: 10,
  },
};

export const DEFAULT_AI_MODELS: AIModelConfig = {
  claude: {
    fast: 'claude-3-5-haiku-20241022',
    balanced: 'claude-3-5-sonnet-20241022',
    premium: 'claude-3-5-sonnet-20241022',
  },
  embedding: {
    model: 'text-embedding-3-small',
    dimensions: 1536,
  },
};

export const DEFAULT_AI_DETECTION: AIDetectionConfig = {
  emDashThreshold: 3,
  aiTransitionThreshold: 2,
  aiVocabularyThreshold: 2,
  balancedClauseThreshold: 2,
  highConfidenceThreshold: 60,
  mediumConfidenceThreshold: 30,
};

export const DEFAULT_GUARDRAILS: GuardrailsConfig = {
  essay: {
    minLength: 50,
    maxLength: 10000,
    minWordCount: 10,
    maxWordCount: 2000,
  },
  regexFirst: true,
  semanticOnlyWhenUncertain: true,
  uncertaintyThreshold: 0.4,
};

// Acceptance rates - updated after each admissions cycle
// These are from 2024 cycle - should be updated via admin dashboard
export const DEFAULT_ACCEPTANCE_RATES: Record<string, number> = {
  harvard: 3.2,
  yale: 3.7,
  princeton: 4.4,
  columbia: 3.9,
  brown: 5.1,
  dartmouth: 5.4,
  cornell: 7.9,
  upenn: 5.8,
};

// =============================================================================
// TIER CONFIGURATIONS
// =============================================================================

export const TIER_CONFIGS: Record<AnalysisTier, TierConfig> = {
  preview: {
    id: 'preview',
    name: 'preview',
    displayName: 'Free Preview',
    priceInCents: 0,
    features: {
      overallScore: true,               // Show score (the hook)
      dimensionBreakdown: false,        // Blurred
      lineByLineAnnotations: false,     // Blurred
      actionableItemsLimit: 0,          // Show count only, not details
      schoolSpecificFeedback: false,    // Blurred
      aoInsights: false,                // Blurred
      aiDetectionReport: false,         // Just warning, no details
      strengthHighlights: false,        // Blurred
      rewriteSuggestions: false,
      humanReview: false,
      humanTurnaroundHours: null,
    },
  },
  quick: {
    id: 'quick',
    name: 'quick',
    displayName: 'Essay Feedback',
    priceInCents: DEFAULT_PRICING.tiers.quick, // $9.99
    features: {
      overallScore: true,
      dimensionBreakdown: false,        // Still blurred - upgrade to Standard
      lineByLineAnnotations: false,     // Still blurred - upgrade to Standard
      actionableItemsLimit: 5,          // 5 specific issues with feedback
      schoolSpecificFeedback: false,    // Teaser only
      aoInsights: false,
      aiDetectionReport: true,          // Full AI detection details
      strengthHighlights: false,
      rewriteSuggestions: false,
      humanReview: false,
      humanTurnaroundHours: null,
    },
  },
  standard: {
    id: 'standard',
    name: 'standard',
    displayName: 'Full Analysis',
    priceInCents: DEFAULT_PRICING.tiers.standard,
    features: {
      overallScore: true,
      dimensionBreakdown: true,
      lineByLineAnnotations: true,
      actionableItemsLimit: -1,         // Unlimited
      schoolSpecificFeedback: true,
      aoInsights: true,
      aiDetectionReport: true,
      strengthHighlights: true,
      rewriteSuggestions: false,
      humanReview: false,
      humanTurnaroundHours: null,
    },
  },
  premium: {
    id: 'premium',
    name: 'premium',
    displayName: 'Expert Review',
    priceInCents: DEFAULT_PRICING.tiers.premium,
    features: {
      overallScore: true,
      dimensionBreakdown: true,
      lineByLineAnnotations: true,
      actionableItemsLimit: -1,
      schoolSpecificFeedback: true,
      aoInsights: true,
      aiDetectionReport: true,
      strengthHighlights: true,
      rewriteSuggestions: true,
      humanReview: true,
      humanTurnaroundHours: 48,
    },
  },
};

// =============================================================================
// IVY LEAGUE TIER CONFIGURATIONS
// =============================================================================

export const IVY_TIER_CONFIGS: Record<IvyTier, IvyTierConfig> = {
  ivy_single: {
    id: 'ivy_single',
    name: 'ivy_single',
    displayName: 'Ivy Single School',
    priceInCents: PRICING.IVY_SINGLE,
    features: {
      overallScore: true,
      dimensionBreakdown: true,
      lineByLineAnnotations: true,
      actionableItemsLimit: -1,
      schoolSpecificFeedback: true,
      aoInsights: true,
      aiDetectionReport: true,
      strengthHighlights: true,
      rewriteSuggestions: false,
      humanReview: false,
      humanTurnaroundHours: null,
      // Ivy-specific
      schoolsIncluded: 1,
      portfolioAnalysis: true,
      resumeEssayDetection: true,
      leveragePointsAnalysis: true,
      crossSchoolAnalysis: false,
      instantRejectDetection: true,
      committeePitchAssessment: true,
    },
  },
  ivy_bundle_3: {
    id: 'ivy_bundle_3',
    name: 'ivy_bundle_3',
    displayName: 'Ivy 3-School Bundle',
    priceInCents: PRICING.IVY_BUNDLE_3,
    features: {
      overallScore: true,
      dimensionBreakdown: true,
      lineByLineAnnotations: true,
      actionableItemsLimit: -1,
      schoolSpecificFeedback: true,
      aoInsights: true,
      aiDetectionReport: true,
      strengthHighlights: true,
      rewriteSuggestions: false,
      humanReview: false,
      humanTurnaroundHours: null,
      // Ivy-specific
      schoolsIncluded: 3,
      portfolioAnalysis: true,
      resumeEssayDetection: true,
      leveragePointsAnalysis: true,
      crossSchoolAnalysis: true,
      instantRejectDetection: true,
      committeePitchAssessment: true,
    },
  },
  ivy_bundle_8: {
    id: 'ivy_bundle_8',
    name: 'ivy_bundle_8',
    displayName: 'Complete Ivy Coverage',
    priceInCents: PRICING.IVY_BUNDLE_8,
    features: {
      overallScore: true,
      dimensionBreakdown: true,
      lineByLineAnnotations: true,
      actionableItemsLimit: -1,
      schoolSpecificFeedback: true,
      aoInsights: true,
      aiDetectionReport: true,
      strengthHighlights: true,
      rewriteSuggestions: false,
      humanReview: false,
      humanTurnaroundHours: null,
      // Ivy-specific
      schoolsIncluded: 8,
      portfolioAnalysis: true,
      resumeEssayDetection: true,
      leveragePointsAnalysis: true,
      crossSchoolAnalysis: true,
      instantRejectDetection: true,
      committeePitchAssessment: true,
    },
  },
};

// =============================================================================
// BUILD FULL DEFAULT CONFIG
// =============================================================================

export function buildDefaultConfig(): AppConfig {
  const currentCycle = calculateCurrentCycle();
  const deadlines = calculateDefaultDeadlines(currentCycle);

  return {
    pricing: DEFAULT_PRICING,
    cycle: {
      current: currentCycle,
      graduationYears: calculateGraduationYears(),
      deadlines: Object.fromEntries(
        Object.entries(deadlines).map(([school, d]) => [
          school,
          {
            earlyDecision: d.ed,
            regularDecision: d.rd,
          },
        ])
      ),
      acceptanceRates: DEFAULT_ACCEPTANCE_RATES,
    },
    scoring: DEFAULT_SCORING,
    models: DEFAULT_AI_MODELS,
    aiDetection: DEFAULT_AI_DETECTION,
    guardrails: DEFAULT_GUARDRAILS,
  };
}

// =============================================================================
// IVY LEAGUE SCHOOLS (Static list - schools don't change)
// =============================================================================

export const IVY_LEAGUE_SCHOOLS = [
  'harvard',
  'yale',
  'princeton',
  'columbia',
  'upenn',
  'dartmouth',
  'brown',
  'cornell',
] as const;

export type IvyLeagueSchool = (typeof IVY_LEAGUE_SCHOOLS)[number];

export const IVY_LEAGUE_DISPLAY_NAMES: Record<IvyLeagueSchool, string> = {
  harvard: 'Harvard University',
  yale: 'Yale University',
  princeton: 'Princeton University',
  columbia: 'Columbia University',
  upenn: 'University of Pennsylvania',
  dartmouth: 'Dartmouth College',
  brown: 'Brown University',
  cornell: 'Cornell University',
};
