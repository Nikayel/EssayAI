/**
 * Centralized Rubric Configuration
 * Single source of truth for scoring weights, anchors, and calibration
 *
 * PROMPT VERSION: 2.0.0
 * Last updated: 2026-01-24
 * Changes: Split ethics_originality into uniqueness (10%) and ethics (5%)
 */

// =============================================================================
// PROMPT VERSIONING
// =============================================================================

export const PROMPT_VERSION = '2.0.0';
export const PROMPT_VERSION_DATE = '2026-01-24';

/**
 * Version history for auditing and debugging
 */
export const PROMPT_VERSION_HISTORY = [
  { version: '2.0.0', date: '2026-01-24', changes: 'Split ethics_originality into uniqueness and ethics; add essay-type weights' },
  { version: '1.0.0', date: '2026-01-01', changes: 'Initial release' },
] as const;

// =============================================================================
// ESSAY TYPES
// =============================================================================

export type EssayType = 'personal_statement' | 'why_us' | 'activity' | 'supplemental' | 'other';

// =============================================================================
// SCORE ANCHORS - Universal definitions (0-6 scale)
// =============================================================================

export const SCORE_ANCHORS = {
  0: {
    label: 'Missing or fundamentally flawed',
    description: 'Major concerns that could hurt application. Missing key elements or serious red flags.',
    userFriendly: 'Needs significant work before submission',
  },
  1: {
    label: 'Significant weaknesses',
    description: 'Needs substantial revision. Core message is unclear or execution is poor.',
    userFriendly: 'Major revisions needed',
  },
  2: {
    label: 'Below expectations',
    description: 'Notable gaps that weaken impact. Some good elements but inconsistent quality.',
    userFriendly: 'Several areas need improvement',
  },
  3: {
    label: 'Meets minimum expectations',
    description: 'Acceptable but unremarkable. Won\'t hurt but won\'t help stand out.',
    userFriendly: 'Solid foundation, room to strengthen',
  },
  4: {
    label: 'Solid - competitive',
    description: 'Demonstrates competence. Would be competitive at most schools.',
    userFriendly: 'Good essay with minor refinements possible',
  },
  5: {
    label: 'Strong - memorable',
    description: 'Distinctive and memorable. Would stand out in applicant pool.',
    userFriendly: 'Strong essay that stands out',
  },
  6: {
    label: 'Exceptional - top 5%',
    description: 'The kind of essay AOs remember and advocate for. Rare.',
    userFriendly: 'Exceptional - ready to submit',
  },
} as const;

/**
 * Ivy-calibrated score anchors (higher bar)
 */
export const IVY_SCORE_ANCHORS = {
  0: {
    label: 'Would hurt application',
    description: 'Major issues that could actively harm candidacy.',
  },
  1: {
    label: 'Not competitive for Ivy',
    description: 'Below the threshold for serious consideration.',
  },
  2: {
    label: 'Would blend into pile',
    description: 'Forgettable among 50,000+ applications.',
  },
  3: {
    label: 'Won\'t stand out in Ivy pool',
    description: 'Acceptable but won\'t move the needle.',
  },
  4: {
    label: 'Competitive, shows fit',
    description: 'Demonstrates potential, worth committee discussion.',
  },
  5: {
    label: 'AO would advocate',
    description: 'Memorable enough that reader wants to champion.',
  },
  6: {
    label: 'Top 5% of Ivy applicants',
    description: 'Exceptional among an exceptional pool.',
  },
} as const;

// =============================================================================
// SCORE DIMENSIONS
// =============================================================================

/**
 * All scoring dimensions with their descriptions
 */
export const SCORE_DIMENSIONS = {
  authenticity: {
    label: 'Authenticity & Voice',
    description: 'Is this genuinely the student\'s voice? Does it sound like a 17-18 year old wrote it?',
    whatMatters: 'AOs can tell when essays are over-edited or AI-assisted. Authentic voice is paramount.',
  },
  reflection: {
    label: 'Reflection & Insight',
    description: 'Does it show growth, self-awareness, and how the student thinks?',
    whatMatters: 'Essays should reveal HOW you think, not just WHAT you did.',
  },
  structure: {
    label: 'Narrative Structure',
    description: 'Flow, organization, logical progression. Does it hook and sustain attention?',
    whatMatters: 'Good structure keeps readers engaged through thousands of essays.',
  },
  specificity_fit: {
    label: 'Specificity & School Fit',
    description: 'Concrete details vs. generic statements. For supplements: genuine school research.',
    whatMatters: 'Specific details make essays memorable. Generic language blends in.',
  },
  clarity_style: {
    label: 'Clarity & Style',
    description: 'Clear expression, readable prose, appropriate tone.',
    whatMatters: 'Clarity shows you can communicate effectively.',
  },
  mechanics: {
    label: 'Mechanics',
    description: 'Grammar, spelling, punctuation.',
    whatMatters: 'Competitive applicants rarely have issues here. Low weight.',
  },
  uniqueness: {
    label: 'Uniqueness ("So What?" Test)',
    description: 'Does this essay reveal something meaningful we couldn\'t learn from activities/transcript?',
    whatMatters: 'The #1 issue with essays: they don\'t reveal anything new about the student.',
  },
  ethics: {
    label: 'Ethics & Red Flags',
    description: 'Any ethical concerns, red flags, or content that could hurt the application.',
    whatMatters: 'Avoids sensitive topics handled poorly, exaggeration, or concerning attitudes.',
  },
} as const;

export type ScoreDimensionKey = keyof typeof SCORE_DIMENSIONS;

// =============================================================================
// RUBRIC WEIGHTS BY ESSAY TYPE
// =============================================================================

/**
 * Default weights (for general essays)
 * Total: 100%
 */
export const DEFAULT_RUBRIC_WEIGHTS = {
  authenticity: 0.20,     // 20% - Is this genuinely the student's voice?
  reflection: 0.20,       // 20% - Does it show growth and self-awareness?
  structure: 0.15,        // 15% - Flow, organization, logical progression
  specificity_fit: 0.15,  // 15% - Concrete details vs. generic statements
  clarity_style: 0.10,    // 10% - Clear expression, readable prose
  mechanics: 0.05,        // 5%  - Grammar, spelling (reduced - rarely an issue)
  uniqueness: 0.10,       // 10% - "So What?" test - what does this reveal?
  ethics: 0.05,           // 5%  - Ethical considerations, red flags
} as const;

/**
 * Essay-type specific weights
 * Different essay types have different priorities
 */
export const RUBRIC_WEIGHTS_BY_ESSAY_TYPE: Record<EssayType, typeof DEFAULT_RUBRIC_WEIGHTS> = {
  // Personal Statement (Common App, Coalition, etc.)
  // Focus: WHO you are, authentic voice, reflection
  personal_statement: {
    authenticity: 0.25,     // Higher - this is YOUR story
    reflection: 0.25,       // Higher - show growth and self-awareness
    structure: 0.12,        // Moderate
    specificity_fit: 0.10,  // Lower - school fit less relevant here
    clarity_style: 0.10,    // Moderate
    mechanics: 0.03,        // Low
    uniqueness: 0.12,       // Higher - must reveal something meaningful
    ethics: 0.03,           // Low unless red flags
  },

  // "Why Us" Supplemental Essays
  // Focus: School fit, demonstrated research, genuine connection
  why_us: {
    authenticity: 0.15,     // Important but less central
    reflection: 0.10,       // Some reflection on fit
    structure: 0.10,        // Good flow matters
    specificity_fit: 0.30,  // CRITICAL - must show real research
    clarity_style: 0.10,    // Clear expression
    mechanics: 0.03,        // Low
    uniqueness: 0.12,       // Why YOU at THIS school
    ethics: 0.10,           // Higher - name-dropping, generic praise = red flag
  },

  // Activity/Extracurricular Essays
  // Focus: Impact, growth, what you learned
  activity: {
    authenticity: 0.20,     // Your genuine experience
    reflection: 0.25,       // What you learned, how you grew
    structure: 0.12,        // Clear narrative
    specificity_fit: 0.18,  // Specific details about the activity
    clarity_style: 0.10,    // Clear expression
    mechanics: 0.03,        // Low
    uniqueness: 0.10,       // What this reveals beyond activities list
    ethics: 0.02,           // Low unless exaggeration concerns
  },

  // Other Supplemental Essays (diversity, community, challenge, etc.)
  supplemental: {
    authenticity: 0.22,     // Genuine voice
    reflection: 0.22,       // Self-awareness
    structure: 0.12,        // Clear organization
    specificity_fit: 0.15,  // Depends on prompt
    clarity_style: 0.10,    // Clear expression
    mechanics: 0.04,        // Low
    uniqueness: 0.10,       // What this reveals
    ethics: 0.05,           // Moderate - some topics need care
  },

  // Generic/Other
  other: DEFAULT_RUBRIC_WEIGHTS,
};

/**
 * Ivy League specific weights (higher bar for school fit)
 */
export const IVY_RUBRIC_WEIGHTS = {
  authenticity: 0.20,     // Is this genuinely the student?
  reflection: 0.15,       // Growth mindset, self-awareness
  structure: 0.12,        // Flow and organization
  specificity_fit: 0.20,  // Higher - demonstrated research critical
  clarity_style: 0.10,    // Clear expression
  mechanics: 0.03,        // Minimal - Ivy applicants rarely have issues
  uniqueness: 0.10,       // "So What?" test
  ethics: 0.10,           // Higher - more scrutiny at Ivy level
} as const;

// =============================================================================
// SCORE DISTRIBUTION CALIBRATION
// =============================================================================

/**
 * Expected score distributions for calibration
 * Helps Claude understand that 5s and 6s should be RARE
 */
export const SCORE_CALIBRATION = {
  general: {
    description: 'Expected distribution for general college applicant pool',
    distribution: {
      0: { percent: 2, note: 'Essays with fundamental problems' },
      1: { percent: 5, note: 'Significant issues requiring major revision' },
      2: { percent: 15, note: 'Below expectations, multiple gaps' },
      3: { percent: 35, note: 'Most essays land here - acceptable, unremarkable' },
      4: { percent: 30, note: 'Solid, competitive essays' },
      5: { percent: 10, note: 'Strong, memorable essays - should be selective' },
      6: { percent: 3, note: 'Exceptional - truly rare, maybe 1 in 30 essays' },
    },
    guidance: 'A "3" is not bad - it\'s the most common score. Reserve 5+ for essays that genuinely stand out.',
  },
  ivy: {
    description: 'Expected distribution among Ivy League applicant pool (higher bar)',
    distribution: {
      0: { percent: 5, note: 'Would hurt application' },
      1: { percent: 10, note: 'Not competitive at Ivy level' },
      2: { percent: 25, note: 'Would blend into the pile' },
      3: { percent: 35, note: 'Acceptable but won\'t help stand out' },
      4: { percent: 18, note: 'Competitive, worth committee discussion' },
      5: { percent: 5, note: 'Memorable, AO would advocate - very selective' },
      6: { percent: 2, note: 'Top 5% of an exceptional pool - extremely rare' },
    },
    guidance: 'At Ivy level, a "4" is a good essay. Reserve 5+ for truly exceptional writing that you\'d remember hours later.',
  },
} as const;

// =============================================================================
// COMMONS CHECK FLAGS (with renamed trauma flag)
// =============================================================================

/**
 * Commons check flag definitions
 * Note: "trauma_without_reflection" renamed to "reflection_depth_needed"
 * for more sensitive, actionable framing
 */
export const COMMONS_CHECK_FLAGS = {
  about_applicant: {
    label: 'About the Applicant',
    description: 'Essay is genuinely about the student, not others',
    isPositive: true, // Flag = good
  },
  jargon_overuse: {
    label: 'Jargon Overuse',
    description: 'Excessive use of buzzwords, field-specific jargon, or thesaurus-heavy vocabulary',
    isPositive: false,
  },
  goals_articulated: {
    label: 'Goals Articulated',
    description: 'Student clearly expresses their goals and motivations',
    isPositive: true,
  },
  school_alignment: {
    label: 'School Alignment',
    description: 'Essay demonstrates genuine connection to target school',
    isPositive: true,
  },
  buzzwords_cliches: {
    label: 'Buzzwords & Cliches',
    description: 'Overused phrases that weaken authenticity',
    isPositive: false,
  },
  genericness: {
    label: 'Genericness',
    description: 'Essay could apply to anyone - lacks specific, personal details',
    isPositive: false,
  },
  // RENAMED: was "trauma_without_reflection"
  reflection_depth_needed: {
    label: 'Deeper Reflection Needed',
    description: 'Essay discusses difficult experiences but would benefit from deeper exploration of growth and meaning',
    isPositive: false,
    userFriendlyMessage: 'Your experience is powerful - consider adding more about how it shaped you and what you learned.',
  },
  exaggeration: {
    label: 'Exaggeration',
    description: 'Claims that seem inflated or hard to believe',
    isPositive: false,
  },
  tone_drift: {
    label: 'Tone Drift',
    description: 'Inconsistent tone throughout the essay',
    isPositive: false,
  },
  ethics_risks: {
    label: 'Ethics Risks',
    description: 'Content that could raise ethical concerns',
    isPositive: false,
  },
} as const;

export type CommonsCheckFlagKey = keyof typeof COMMONS_CHECK_FLAGS;

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Get rubric weights for a specific essay type
 */
export function getRubricWeights(essayType: EssayType): typeof DEFAULT_RUBRIC_WEIGHTS {
  return RUBRIC_WEIGHTS_BY_ESSAY_TYPE[essayType] || DEFAULT_RUBRIC_WEIGHTS;
}

/**
 * Calculate weighted overall score from dimension scores
 * @param scores - Object with score for each dimension (0-6 scale)
 * @param essayType - Type of essay to determine weights
 * @returns Score on 0-100 scale
 */
export function calculateOverallScore(
  scores: Record<ScoreDimensionKey, number>,
  essayType: EssayType = 'other'
): number {
  const weights = getRubricWeights(essayType);

  const weightedSum =
    scores.authenticity * weights.authenticity +
    scores.reflection * weights.reflection +
    scores.structure * weights.structure +
    scores.specificity_fit * weights.specificity_fit +
    scores.clarity_style * weights.clarity_style +
    scores.mechanics * weights.mechanics +
    scores.uniqueness * weights.uniqueness +
    scores.ethics * weights.ethics;

  // Convert from 0-6 scale to 0-100 scale
  return Math.round((weightedSum / 6) * 100);
}

/**
 * Get score anchor information for user display
 */
export function getScoreAnchor(score: number, isIvy = false): {
  label: string;
  description: string;
  userFriendly?: string;
} {
  const anchors = isIvy ? IVY_SCORE_ANCHORS : SCORE_ANCHORS;
  const roundedScore = Math.round(Math.max(0, Math.min(6, score))) as 0 | 1 | 2 | 3 | 4 | 5 | 6;
  return anchors[roundedScore];
}

/**
 * Get calibration guidance for a score level
 */
export function getCalibrationGuidance(score: number, isIvy = false): {
  expectedPercent: number;
  note: string;
} {
  const calibration = isIvy ? SCORE_CALIBRATION.ivy : SCORE_CALIBRATION.general;
  const roundedScore = Math.round(Math.max(0, Math.min(6, score))) as 0 | 1 | 2 | 3 | 4 | 5 | 6;
  return calibration.distribution[roundedScore];
}

/**
 * Format score anchors for prompt inclusion
 */
export function formatScoreAnchorsForPrompt(isIvy = false): string {
  const anchors = isIvy ? IVY_SCORE_ANCHORS : SCORE_ANCHORS;
  const calibration = isIvy ? SCORE_CALIBRATION.ivy : SCORE_CALIBRATION.general;

  return Object.entries(anchors)
    .map(([score, data]) => {
      const dist = calibration.distribution[Number(score) as keyof typeof calibration.distribution];
      return `- ${score}: ${data.label} (~${dist.percent}% of essays)`;
    })
    .join('\n');
}

/**
 * Format weights for prompt inclusion
 */
export function formatWeightsForPrompt(essayType: EssayType = 'other'): string {
  const weights = getRubricWeights(essayType);

  return Object.entries(weights)
    .map(([dim, weight]) => {
      const dimension = SCORE_DIMENSIONS[dim as ScoreDimensionKey];
      return `- ${dimension?.label || dim}: ${Math.round(weight * 100)}%`;
    })
    .join('\n');
}
