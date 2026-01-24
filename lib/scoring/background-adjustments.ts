/**
 * Background-Aware Scoring Adjustments
 *
 * Adjusts how scoring heuristics are interpreted based on student background
 * to ensure equitable evaluation across diverse populations.
 *
 * Key principles:
 * - Never LOWER scores based on background (that's discrimination)
 * - Provide context that may BOOST or CONTEXTUALIZE scores
 * - Recognize that different backgrounds produce valid but different essay styles
 */

import type { StudentIntake } from './types';

// =============================================================================
// TYPES
// =============================================================================

export interface BackgroundContext {
  // Identifies which adjustments apply
  isInternational: boolean;
  isFirstGen: boolean;
  isMultilingual: boolean;
  isLowIncome: boolean;
  isRural: boolean;
  isHomeschooled: boolean;
  hasDisability: boolean;
  isUndocumented: boolean;
  isLGBTQ: boolean;
  isMilitaryFamily: boolean;
  isFosterCare: boolean;

  // Derived flags for scoring adjustments
  shouldAdjustVocabulary: boolean;      // Don't penalize ESL patterns
  shouldAdjustActivities: boolean;      // Work/family counts as activities
  shouldAdjustLeadership: boolean;      // Non-traditional leadership valid
  shouldAdjustSchoolFit: boolean;       // May not have visited campus
  shouldAdjustMechanics: boolean;       // ESL/learning differences
}

export interface ScoreAdjustment {
  dimension: string;
  originalScore: number;
  adjustedScore: number;
  reason: string;
  contextNote: string; // For feedback - explains the context
}

// =============================================================================
// EXTRACT BACKGROUND CONTEXT
// =============================================================================

export function extractBackgroundContext(intake: StudentIntake): BackgroundContext {
  const demographics = intake.demographics || {};
  const profile = intake as any; // May have extended profile fields

  const isInternational = demographics.isInternational === true;
  const isFirstGen = demographics.isFirstGen === true;
  const isMultilingual = demographics.primaryLanguage ?
    demographics.primaryLanguage.toLowerCase() !== 'english' : false;
  const isLowIncome = demographics.householdIncome === '<30k' ||
    demographics.householdIncome === '30-75k';
  const isRural = profile.isRural === true ||
    demographics.geographicContext?.toLowerCase().includes('rural');
  const isHomeschooled = profile.isHomeschooled === true ||
    demographics.schoolType?.toLowerCase().includes('home');
  const hasDisability = profile.hasDisability === true;
  const isUndocumented = profile.isUndocumented === true;
  const isLGBTQ = profile.isLGBTQ === true;
  const isMilitaryFamily = profile.isMilitaryFamily === true;
  const isFosterCare = profile.isFosterCare === true || profile.isSystemInvolved === true;

  return {
    isInternational,
    isFirstGen,
    isMultilingual,
    isLowIncome,
    isRural,
    isHomeschooled,
    hasDisability,
    isUndocumented,
    isLGBTQ,
    isMilitaryFamily,
    isFosterCare,

    // Derived adjustment flags
    shouldAdjustVocabulary: isInternational || isMultilingual,
    shouldAdjustActivities: isFirstGen || isLowIncome || isFosterCare || isMilitaryFamily,
    shouldAdjustLeadership: isFirstGen || isLowIncome || isRural || isFosterCare,
    shouldAdjustSchoolFit: isFirstGen || isLowIncome || isRural || isInternational,
    shouldAdjustMechanics: isMultilingual || hasDisability,
  };
}

// =============================================================================
// SCORING ADJUSTMENTS
// =============================================================================

/**
 * Adjust authenticity/voice scoring for multilingual students
 * Don't penalize ESL patterns that are authentic to their voice
 */
export function adjustAuthenticityScore(
  originalScore: number,
  context: BackgroundContext,
  essayText: string
): ScoreAdjustment | null {
  if (!context.shouldAdjustVocabulary) return null;

  // Check for ESL patterns that might be penalized unfairly
  const eslPatterns = [
    /the\s+(?:a|an)\s+/gi,           // Article confusion
    /\b(?:since|because)\b.*,\s*so/gi, // Double causation
    /very\s+very/gi,                  // Intensifier repetition
  ];

  const eslPenaltyPatterns = eslPatterns.filter(p => p.test(essayText));

  if (eslPenaltyPatterns.length > 0) {
    // Give benefit of doubt - these may be authentic voice features
    const adjustment = Math.min(2, eslPenaltyPatterns.length * 0.5);

    return {
      dimension: 'authenticity',
      originalScore,
      adjustedScore: Math.min(25, originalScore + adjustment),
      reason: 'Multilingual student - ESL patterns may be authentic voice features',
      contextNote: 'As a multilingual student, certain phrases that might seem non-native are actually part of your authentic voice. We\'ve adjusted to not penalize these.',
    };
  }

  return null;
}

/**
 * Adjust "age-appropriate" vocabulary scoring
 * Don't flag sophisticated vocabulary as "not authentic" for multilingual students
 * who may have learned English formally
 */
export function adjustVocabularyAssessment(
  vocabularyScore: number,
  context: BackgroundContext
): ScoreAdjustment | null {
  if (!context.isMultilingual && !context.isInternational) return null;

  // International students often learn English formally and may have
  // more "academic" vocabulary - this is authentic for them
  return {
    dimension: 'vocabulary_authenticity',
    originalScore: vocabularyScore,
    adjustedScore: vocabularyScore, // Don't change score, just add context
    reason: 'International/multilingual background',
    contextNote: 'Your vocabulary choices reflect how you learned English - this is authentic to your background, not a sign of inauthenticity.',
  };
}

/**
 * Adjust school fit scoring for students with limited resources
 * First-gen, low-income, rural students may not have visited campus
 */
export function adjustSchoolFitScore(
  originalScore: number,
  context: BackgroundContext,
  schoolId: string
): ScoreAdjustment | null {
  if (!context.shouldAdjustSchoolFit) return null;

  // Check if score is being penalized for lack of "visit" language
  // or specific campus details
  if (originalScore < 15) { // Out of 20
    let contextNote = '';

    if (context.isFirstGen) {
      contextNote = 'As a first-gen student, you may not have had the chance to visit campus or access detailed info. Focus on what you CAN research online.';
    } else if (context.isLowIncome) {
      contextNote = 'Campus visits aren\'t always possible financially. Virtual tours and online research can show genuine interest too.';
    } else if (context.isInternational) {
      contextNote = 'International students often can\'t visit. AOs understand this - focus on showing genuine research effort.';
    } else if (context.isRural) {
      contextNote = 'Distance from elite schools doesn\'t mean less genuine interest. Show your research through specific program knowledge.';
    }

    return {
      dimension: 'school_fit',
      originalScore,
      adjustedScore: originalScore, // Don't inflate, just provide context
      reason: 'Limited campus access due to background',
      contextNote,
    };
  }

  return null;
}

/**
 * Adjust activity/leadership scoring for students with work/family obligations
 */
export function adjustActivityContext(
  activityScore: number,
  context: BackgroundContext
): ScoreAdjustment | null {
  if (!context.shouldAdjustActivities) return null;

  let contextNote = '';

  if (context.isFirstGen || context.isLowIncome) {
    contextNote = 'Work experience and family responsibilities ARE valid activities. AOs at top schools specifically value these as signs of maturity and responsibility.';
  } else if (context.isFosterCare) {
    contextNote = 'Navigating the foster care system while pursuing education is itself a significant achievement that demonstrates resilience.';
  } else if (context.isMilitaryFamily) {
    contextNote = 'Adapting to frequent moves and new environments shows flexibility and resilience that AOs value.';
  }

  return {
    dimension: 'activities',
    originalScore: activityScore,
    adjustedScore: activityScore,
    reason: 'Non-traditional activity context',
    contextNote,
  };
}

/**
 * Adjust mechanics/grammar scoring for students with learning differences or ESL
 */
export function adjustMechanicsScore(
  originalScore: number,
  context: BackgroundContext
): ScoreAdjustment | null {
  if (!context.shouldAdjustMechanics) return null;

  // For students with documented disabilities or ESL, reduce weight of mechanics
  // in overall impression (but still flag for their awareness)

  if (context.hasDisability) {
    return {
      dimension: 'mechanics',
      originalScore,
      adjustedScore: originalScore,
      reason: 'Student has documented accommodations',
      contextNote: 'Mechanics matter less than your story and ideas. Top schools look at the whole application, and accommodations are factored in.',
    };
  }

  if (context.isMultilingual) {
    return {
      dimension: 'mechanics',
      originalScore,
      adjustedScore: originalScore,
      reason: 'Multilingual student',
      contextNote: 'Minor ESL patterns won\'t hurt you if your meaning is clear. AOs read applications from around the world and understand language variation.',
    };
  }

  return null;
}

// =============================================================================
// MASTER ADJUSTMENT FUNCTION
// =============================================================================

export interface BackgroundAdjustmentResult {
  context: BackgroundContext;
  adjustments: ScoreAdjustment[];
  personalizedNotes: string[];
  shouldReduceMechanicsWeight: boolean;
}

/**
 * Apply all relevant background adjustments and return context for feedback
 */
export function applyBackgroundAdjustments(
  intake: StudentIntake,
  scores: {
    authenticity: number;
    insight: number;
    schoolFit: number;
    specificity: number;
    risk: number;
  },
  essayText: string
): BackgroundAdjustmentResult {
  const context = extractBackgroundContext(intake);
  const adjustments: ScoreAdjustment[] = [];
  const personalizedNotes: string[] = [];

  // Apply authenticity adjustment
  const authAdj = adjustAuthenticityScore(scores.authenticity, context, essayText);
  if (authAdj) {
    adjustments.push(authAdj);
    personalizedNotes.push(authAdj.contextNote);
  }

  // Apply vocabulary assessment context
  const vocabAdj = adjustVocabularyAssessment(scores.authenticity, context);
  if (vocabAdj) {
    adjustments.push(vocabAdj);
    if (!personalizedNotes.includes(vocabAdj.contextNote)) {
      personalizedNotes.push(vocabAdj.contextNote);
    }
  }

  // Apply school fit context
  const schoolId = intake.essayContext?.targetSchool || '';
  const fitAdj = adjustSchoolFitScore(scores.schoolFit, context, schoolId);
  if (fitAdj) {
    adjustments.push(fitAdj);
    personalizedNotes.push(fitAdj.contextNote);
  }

  // Apply activity context
  const actAdj = adjustActivityContext(scores.specificity, context);
  if (actAdj) {
    adjustments.push(actAdj);
    personalizedNotes.push(actAdj.contextNote);
  }

  // Apply mechanics context
  const mechAdj = adjustMechanicsScore(scores.risk, context);
  if (mechAdj) {
    adjustments.push(mechAdj);
    personalizedNotes.push(mechAdj.contextNote);
  }

  // Add general personalized notes based on background
  if (context.isFirstGen) {
    personalizedNotes.push(
      'As a first-gen student, your perspective is valuable. Don\'t try to sound like what you think AOs want - your authentic voice is an asset.'
    );
  }

  if (context.isFosterCare || context.isSystemInvolved) {
    personalizedNotes.push(
      'Your resilience in navigating challenging circumstances is itself noteworthy. Many top schools actively seek students who have overcome adversity.'
    );
  }

  if (context.isUndocumented) {
    personalizedNotes.push(
      'Your status adds important context to your achievements. Many schools have support for undocumented students and value your perspective.'
    );
  }

  if (context.isLGBTQ) {
    personalizedNotes.push(
      'If you choose to discuss your identity, do so authentically. Many schools actively value diverse perspectives and have strong LGBTQ+ communities.'
    );
  }

  return {
    context,
    adjustments,
    personalizedNotes: [...new Set(personalizedNotes)], // Dedupe
    shouldReduceMechanicsWeight: context.shouldAdjustMechanics,
  };
}

// =============================================================================
// EXPORTS
// =============================================================================

export {
  extractBackgroundContext,
  adjustAuthenticityScore,
  adjustVocabularyAssessment,
  adjustSchoolFitScore,
  adjustActivityContext,
  adjustMechanicsScore,
  applyBackgroundAdjustments,
};
