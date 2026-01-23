/**
 * Tiered Analysis System Types
 * Defines the structure for each analysis tier's input and output
 */

import type { StudentIntake, EssayAnalysisResult, Annotation, PrioritizedIssue } from '../types';
import type { AIDetectionResult } from '../ai-detection';
import type { BluntFeedback } from '../blunt-feedback';

// =============================================================================
// TIER DEFINITIONS
// =============================================================================

export type AnalysisTier = 'quick' | 'standard' | 'premium';

// =============================================================================
// INPUT TYPES
// =============================================================================

/**
 * Minimal intake for Quick tier ($9.99)
 */
export interface QuickIntake {
  targetSchool: string;
  essayType: string;
  // Optional - improves accuracy but not required
  isFirstGen?: boolean;
  intendedMajor?: string;
}

/**
 * Full intake for Standard ($79) and Premium ($249) tiers
 */
export type FullIntake = StudentIntake;

// =============================================================================
// OUTPUT TYPES - QUICK TIER ($9.99)
// =============================================================================

export interface QuickAnalysisResult {
  tier: 'quick';

  // What they see
  overallScore: number;
  scoreLabel: 'needs_work' | 'developing' | 'competitive' | 'strong' | 'exceptional';
  scoreSummary: string;

  // Top 3-5 actionable items with blunt feedback
  actionableItems: QuickActionableItem[];

  // AI detection (show if AI detected)
  aiDetection: {
    likelihood: 'low' | 'medium' | 'high';
    verdict: string;
    // Details hidden - upgrade to see
  };

  // Blurred/teaser content for upgrade
  teaser: {
    dimensionsBlurred: true;
    schoolFeedbackBlurred: true;
    message: string;
  };

  // Stats for paywall display
  hiddenInsights: {
    totalIssuesFound: number;
    schoolSpecificIssues: number;
    strengthsFound: number;
  };

  // Metadata
  metadata: {
    wordCount: number;
    processingTimeMs: number;
  };
}

export interface QuickActionableItem {
  priority: number;
  issue: string;
  location: string;  // "Paragraph 1, Line 1" or "Opening"
  bluntFeedback: string;
  severity: 'critical' | 'major' | 'minor';
  // NO fix provided - that's Standard tier
}

// =============================================================================
// OUTPUT TYPES - STANDARD TIER ($79)
// =============================================================================

export interface StandardAnalysisResult {
  tier: 'standard';

  // Full score breakdown
  overallScore: number;
  scoreLabel: 'needs_work' | 'developing' | 'competitive' | 'strong' | 'exceptional';
  scoreSummary: string;

  // Full dimension breakdown
  dimensions: EssayAnalysisResult['dimensions'];

  // Complete line-by-line annotations with fixes
  annotations: AnnotationWithFix[];

  // All issues with priority and fixes
  allIssues: PrioritizedIssueWithFix[];

  // AI detection full report
  aiDetection: AIDetectionResult;
  aiFeedback: BluntFeedback[];

  // School-specific deep dive
  schoolFeedback: StandardSchoolFeedback;

  // What AOs think
  aoInsights: AOInsights;

  // Strengths to keep
  strengths: IdentifiedStrengthWithDetail[];

  // Personalized based on intake
  personalizedTips: PersonalizedTip[];

  // Upgrade teaser for Premium
  premiumTeaser: {
    message: string;
    turnaround: string;
  };

  // Metadata
  metadata: {
    wordCount: number;
    sentenceCount: number;
    paragraphCount: number;
    readingLevel: number;
    processingTimeMs: number;
  };
}

export interface AnnotationWithFix extends Annotation {
  bluntFeedback: string;
  aoThought?: string;
  fixSuggestion?: string;
  exampleRewrite?: string;
}

export interface PrioritizedIssueWithFix extends PrioritizedIssue {
  bluntFeedback: BluntFeedback;
  lineNumbers?: number[];
}

export interface StandardSchoolFeedback {
  school: string;
  schoolDisplayName: string;
  fitScore: number;
  fitLabel: 'weak' | 'moderate' | 'strong' | 'excellent';

  // What they got right
  alignedElements: string[];

  // What's missing
  missingElements: {
    element: string;
    why: string;
    howToAdd: string;
  }[];

  // Red flags for this school
  redFlags: {
    flag: string;
    text: string;
    severity: 'warning' | 'critical';
  }[];

  // School-specific tips
  tips: string[];
}

export interface AOInsights {
  school: string;

  // What this school values
  whatTheyValue: {
    trait: string;
    description: string;
    yourEssayHas: boolean;
  }[];

  // First impression analysis
  firstImpression: {
    hookStrength: 'weak' | 'moderate' | 'strong';
    hookVerdict: string;
    timeToDecision: string;  // "AO will decide in first 30 seconds..."
  };

  // What AO thinks while reading
  aoThoughts: {
    location: string;  // "Paragraph 1", "Opening", etc.
    thought: string;
    sentiment: 'positive' | 'neutral' | 'negative';
  }[];

  // Overall AO verdict
  overallVerdict: string;
}

export interface IdentifiedStrengthWithDetail {
  element: string;
  location?: string;
  why: string;
  aoThought: string;
  keepThis: true;
}

export interface PersonalizedTip {
  context: string;  // "As a first-gen student..."
  tip: string;
  reason: string;
}

// =============================================================================
// OUTPUT TYPES - PREMIUM TIER ($249)
// =============================================================================

export interface PremiumAnalysisResult extends StandardAnalysisResult {
  tier: 'premium';

  // AI-generated rewrite suggestions for worst issues
  rewriteSuggestions: RewriteSuggestion[];

  // Human review status
  humanReview: HumanReviewStatus;
}

export interface RewriteSuggestion {
  issueId: string;
  issue: string;
  location: {
    paragraphNumber: number;
    lineStart: number;
    lineEnd: number;
  };
  original: string;
  suggestedRewrite: string;
  explanation: string;
}

export interface HumanReviewStatus {
  status: 'queued' | 'assigned' | 'in_progress' | 'completed';
  assignedTo?: string;  // Reviewer name
  credentials?: string; // "Former Yale AO, 8 years"
  estimatedCompletion: Date;
  message: string;
}

// =============================================================================
// ANALYSIS OPTIONS
// =============================================================================

export interface TieredAnalysisOptions {
  /** Session ID for tracking */
  sessionId?: string;
  /** User email for notifications */
  userEmail?: string;
  /** Tone embedding for consistency check */
  toneEmbedding?: number[];
  /** Skip RAG for faster analysis */
  skipRAG?: boolean;
}
