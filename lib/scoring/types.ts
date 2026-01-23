/**
 * Essay Scoring Engine Types
 * Comprehensive type definitions for the 5-dimension scoring system
 */

// =============================================================================
// INTAKE TYPES
// =============================================================================

export interface StudentIntake {
  // Demographics & Background
  demographics: {
    isFirstGen: boolean;
    familyEducationLevel: 'no_college' | 'some_college' | 'bachelors' | 'graduate';
    householdIncome?: '<30k' | '30-75k' | '75-150k' | '150k+' | 'prefer_not_say';
    isInternational: boolean;
    countryOfOrigin?: string;
    primaryLanguage?: string;
    immigrationStory?: 'citizen' | 'immigrant_self' | 'immigrant_parent' | 'visa' | 'undocumented' | 'prefer_not_say';
    geographicContext: 'rural' | 'suburban' | 'urban';
    schoolType: 'public' | 'private' | 'charter' | 'magnet' | 'homeschool' | 'international';
    familyResponsibilities: ('caregiving' | 'work_to_support' | 'sibling_care' | 'translation' | 'none')[];
  };

  // Academic Context
  academic: {
    intendedMajor: string;
    academicInterests: string[];
    intellectualPassion?: string;
    researchExperience?: {
      hasExperience: boolean;
      description?: string;
    };
    academicChallenges?: string;
  };

  // Activities & Experience
  activities: {
    spike: string;
    topActivities: Activity[];
    workExperience?: WorkExperience[];
    leadershipRoles: string[];
    summerExperiences?: string;
  };

  // Personal Identity & Story
  personal: {
    identityFactors: ('race_ethnicity' | 'gender' | 'lgbtq' | 'disability' | 'religion' | 'military' | 'other')[];
    significantChallenges?: string;
    uniquePerspective?: string;
    whatAOsShouldKnow?: string;
  };

  // Essay-Specific Context
  essayContext: {
    targetSchool: string;
    essayType: EssayTypeEnum;
    essayPrompt: string;
    wordLimit: number;
    biggestConcern: 'too_generic' | 'not_enough_depth' | 'wrong_tone' | 'school_fit' | 'grammar' | 'structure' | 'other';
    previousFeedback?: {
      hasBeenReviewed: boolean;
      feedback?: string;
    };
    draftNumber: 'first' | 'second' | 'third_plus' | 'final';
  };

  // Voice Calibration
  voice: {
    toneSample: string;
    writingStyle: 'formal' | 'conversational' | 'storytelling' | 'analytical';
    usesHumor: boolean;
  };
}

export interface Activity {
  name: string;
  role: string;
  hoursPerWeek: number;
  weeksPerYear: number;
  yearsInvolved: number;
  impact: string;
}

export interface WorkExperience {
  job: string;
  hoursPerWeek: number;
  reasonForWorking: 'financial_necessity' | 'career_exploration' | 'family_business' | 'personal_growth';
}

export type EssayTypeEnum =
  | 'personal_statement'
  | 'why_us'
  | 'supplemental'
  | 'activity'
  | 'diversity'
  | 'community'
  | 'intellectual'
  | 'short_answer';

// =============================================================================
// SCORING DIMENSION TYPES
// =============================================================================

/**
 * Dimension 1: Authenticity & Voice (25 points)
 */
export interface AuthenticityScore {
  totalScore: number;  // 0-25

  toneConsistency: {
    score: number;           // 0-5
    cosineSimilarity: number; // 0-1 with tone sample
    driftLocations: TextSpan[];
    feedback: string;
  };

  ageAppropriateness: {
    score: number;           // 0-5
    fleschKincaidGrade: number;
    thesaurusFlags: FlaggedPhrase[];
    feedback: string;
  };

  uniquePerspective: {
    score: number;           // 0-5
    uniqueElements: string[];
    genericElements: string[];
    feedback: string;
  };

  personalIdioms: {
    score: number;           // 0-5
    naturalPhrases: string[];
    corporateSpeak: FlaggedPhrase[];
    feedback: string;
  };

  clicheDensity: {
    score: number;           // 0-5
    clichesFound: FlaggedPhrase[];
    clichePercentage: number;
    feedback: string;
  };
}

/**
 * Dimension 2: Insight & Reflection (25 points)
 */
export interface InsightScore {
  totalScore: number;  // 0-25

  depthOfReflection: {
    score: number;           // 0-5
    surfaceStatements: TextSpan[];
    deepStatements: TextSpan[];
    depthRatio: number;
    feedback: string;
  };

  growthArc: {
    score: number;           // 0-5
    hasBeforeState: boolean;
    hasAfterState: boolean;
    transformationClarity: number;
    growthEvidence: TextSpan[];
    feedback: string;
  };

  selfAwareness: {
    score: number;           // 0-5
    strengthsAcknowledged: string[];
    weaknessesAcknowledged: string[];
    blindSpots: string[];
    feedback: string;
  };

  nonObviousConnections: {
    score: number;           // 0-5
    connections: InsightConnection[];
    feedback: string;
  };

  soWhatFactor: {
    score: number;           // 0-5
    readerTakeaway: string;
    memorability: number;    // 0-1
    feedback: string;
  };
}

export interface InsightConnection {
  elementA: string;
  elementB: string;
  insightLevel: 'surface' | 'moderate' | 'deep';
}

/**
 * Dimension 3: School Fit & Alignment (20 points)
 */
export interface SchoolFitScore {
  totalScore: number;  // 0-20

  specificProgramKnowledge: {
    score: number;           // 0-4
    programsMentioned: string[];
    correctReferences: boolean;
    feedback: string;
  };

  valueAlignment: {
    score: number;           // 0-4
    alignedValues: string[];
    missingValues: string[];
    feedback: string;
  };

  cultureFitSignals: {
    score: number;           // 0-4
    cultureReferences: string[];
    authenticSignals: boolean;
    feedback: string;
  };

  whyNotElsewhere: {
    score: number;           // 0-4
    uniqueToSchool: boolean;
    couldWorkForOther: string[];  // Which other schools
    feedback: string;
  };

  futureContribution: {
    score: number;           // 0-4
    contributionsPlanned: string[];
    specificEnough: boolean;
    feedback: string;
  };
}

/**
 * Dimension 4: Specificity & Craft (20 points)
 */
export interface SpecificityScore {
  totalScore: number;  // 0-20

  concreteDetails: {
    score: number;           // 0-4
    specificNouns: string[];
    vagueNouns: FlaggedPhrase[];
    sensoryDetails: string[];
    detailDensity: number;
    feedback: string;
  };

  sceneVsSummary: {
    score: number;           // 0-4
    sceneMoments: TextSpan[];
    summaryMoments: TextSpan[];
    showTellRatio: number;
    feedback: string;
  };

  dialogue: {
    score: number;           // 0-4
    dialogueInstances: TextSpan[];
    characterRevealed: boolean;
    natural: boolean;
    feedback: string;
  };

  structure: {
    score: number;           // 0-4
    hasHook: boolean;
    hasClearArc: boolean;
    transitionQuality: number;
    pacing: 'rushed' | 'balanced' | 'slow';
    feedback: string;
  };

  openingHook: {
    score: number;           // 0-4
    hookType: 'in_medias_res' | 'question' | 'statement' | 'scene' | 'weak';
    grabsAttention: boolean;
    firstSentence: string;
    feedback: string;
  };
}

/**
 * Dimension 5: Risk & Red Flags (10 points, deduction-based)
 */
export interface RiskScore {
  totalScore: number;  // 0-10 (starts at 10, deductions applied)

  ethicalConcerns: {
    deduction: number;       // 0-10
    issues: EthicalIssue[];
    feedback: string;
  };

  exaggerationSignals: {
    deduction: number;       // 0-3
    issues: ExaggerationIssue[];
    feedback: string;
  };

  culturalSensitivity: {
    deduction: number;       // 0-5
    issues: CulturalIssue[];
    feedback: string;
  };

  traumaWithoutAgency: {
    deduction: number;       // 0-3
    issues: TraumaIssue[];
    feedback: string;
  };

  negativeTone: {
    deduction: number;       // 0-2
    issues: ToneIssue[];
    feedback: string;
  };
}

export interface EthicalIssue {
  type: 'plagiarism_signal' | 'dishonesty' | 'illegal_activity' | 'academic_dishonesty';
  evidence: string;
  severity: 'minor' | 'moderate' | 'severe';
}

export interface ExaggerationIssue {
  claim: string;
  reason: string;
}

export interface CulturalIssue {
  type: 'savior_complex' | 'stereotyping' | 'privilege_blindness' | 'appropriation';
  text: string;
  suggestion: string;
}

export interface TraumaIssue {
  traumaElement: string;
  missingElement: 'growth' | 'agency' | 'reflection' | 'resolution';
}

export interface ToneIssue {
  type: 'complaining' | 'blaming' | 'arrogance' | 'entitlement';
  text: string;
}

// =============================================================================
// SHARED TYPES
// =============================================================================

export interface TextSpan {
  text: string;
  startLine: number;
  endLine: number;
  startChar?: number;
  endChar?: number;
}

export interface FlaggedPhrase {
  phrase: string;
  location: TextSpan;
  severity: 'hard' | 'soft';
  category: string;
  suggestion?: string;
}

// =============================================================================
// ANALYSIS RESULT TYPES
// =============================================================================

export interface EssayAnalysisResult {
  // Overall Score
  overallScore: number;  // 0-100
  scoreLabel: ScoreLabel;
  scoreSummary: string;

  // Dimension Breakdown
  dimensions: {
    authenticity: AuthenticityScore;
    insight: InsightScore;
    schoolFit: SchoolFitScore;
    specificity: SpecificityScore;
    risk: RiskScore;
  };

  // Line-by-Line Annotations
  annotations: Annotation[];

  // Top Issues (Prioritized)
  topIssues: PrioritizedIssue[];

  // Strengths
  strengths: IdentifiedStrength[];

  // School-Specific Feedback
  schoolFeedback?: SchoolSpecificFeedback;

  // Benchmark Comparison
  benchmark?: BenchmarkComparison;

  // Metadata
  metadata: AnalysisMetadata;
}

export type ScoreLabel = 'needs_work' | 'developing' | 'competitive' | 'strong' | 'exceptional';

export interface Annotation {
  lineNumber: number;
  text: string;
  type: 'strength' | 'issue' | 'suggestion';
  category: string;
  dimension: 'authenticity' | 'insight' | 'schoolFit' | 'specificity' | 'risk';
  message: string;
  severity?: 'low' | 'medium' | 'high';
  fix?: string;
}

export interface PrioritizedIssue {
  rank: number;
  issue: string;
  dimension: string;
  impact: string;
  howToFix: string;
  exampleBefore?: string;
  exampleAfter?: string;
}

export interface IdentifiedStrength {
  element: string;
  why: string;
  location?: TextSpan;
  keepThis: boolean;
}

export interface SchoolSpecificFeedback {
  school: string;
  fitScore: number;
  alignedElements: string[];
  missingElements: string[];
  opportunities: string[];
  schoolSpecificTips: string[];
}

export interface BenchmarkComparison {
  percentile: number;
  similarSuccessfulEssays: number;
  keyDifferences: string[];
  improvementPotential: number;
}

export interface AnalysisMetadata {
  wordCount: number;
  sentenceCount: number;
  paragraphCount: number;
  readingLevel: number;
  analysisModel: string;
  ragContextUsed: boolean;
  processingTimeMs: number;
  intakeComplete: boolean;
  analysisVersion: string;
}

// =============================================================================
// SCHOOL CONFIGURATION TYPES
// =============================================================================

export interface SchoolScoringConfig {
  id: string;
  name: string;

  // Weight adjustments (must sum to 1.0)
  weights: {
    authenticity: number;
    insight: number;
    schoolFit: number;
    specificity: number;
    risk: number;
  };

  // School-specific emphasis
  boostFor: string[];
  penalizeFor: string[];

  // Required elements for fit
  mustMention: string[];

  // Red flag keywords
  redFlags: string[];

  // Value keywords to detect
  valueKeywords: string[];

  // Culture keywords to detect
  cultureKeywords: string[];
}

// =============================================================================
// GENERIC PHRASE DATABASE TYPES
// =============================================================================

export interface GenericPhrase {
  id: string;
  phrase: string;
  pattern: RegExp;
  severity: 'hard' | 'soft';
  category: 'opening' | 'closing' | 'transition' | 'reflection' | 'jargon' | 'buzzword';
  suggestion: string;
  context?: string;  // When this is OK to use
}

export interface ClicheDetectionResult {
  found: FlaggedPhrase[];
  density: number;  // Percentage of sentences with cliches
  worstOffenders: string[];
  score: number;  // 0-5
}

// =============================================================================
// SCORING FUNCTIONS INTERFACE
// =============================================================================

export interface ScoringEngine {
  // Main analysis function
  analyzeEssay(
    essayText: string,
    intake: StudentIntake
  ): Promise<EssayAnalysisResult>;

  // Individual dimension scorers
  scoreAuthenticity(
    essayText: string,
    intake: StudentIntake
  ): Promise<AuthenticityScore>;

  scoreInsight(
    essayText: string,
    intake: StudentIntake
  ): Promise<InsightScore>;

  scoreSchoolFit(
    essayText: string,
    intake: StudentIntake
  ): Promise<SchoolFitScore>;

  scoreSpecificity(
    essayText: string,
    intake: StudentIntake
  ): Promise<SpecificityScore>;

  scoreRisk(
    essayText: string,
    intake: StudentIntake
  ): Promise<RiskScore>;

  // Utility functions
  detectGenericPhrases(essayText: string): ClicheDetectionResult;
  calculateOverallScore(dimensions: EssayAnalysisResult['dimensions']): number;
  getSchoolConfig(schoolId: string): SchoolScoringConfig;
}

// =============================================================================
// CONSTANTS
// =============================================================================

export const SCORE_THRESHOLDS = {
  needs_work: { min: 0, max: 39 },
  developing: { min: 40, max: 59 },
  competitive: { min: 60, max: 74 },
  strong: { min: 75, max: 89 },
  exceptional: { min: 90, max: 100 },
} as const;

export const DEFAULT_WEIGHTS = {
  authenticity: 0.25,
  insight: 0.25,
  schoolFit: 0.20,
  specificity: 0.20,
  risk: 0.10,
} as const;

export const DIMENSION_MAX_SCORES = {
  authenticity: 25,
  insight: 25,
  schoolFit: 20,
  specificity: 20,
  risk: 10,
} as const;
