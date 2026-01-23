/**
 * School-Specific Scoring Configurations
 * Tailored weights and criteria for each Ivy League school
 */

import type { SchoolScoringConfig } from './types';

// =============================================================================
// IVY LEAGUE SCHOOL CONFIGURATIONS
// =============================================================================

export const SCHOOL_CONFIGS: Record<string, SchoolScoringConfig> = {
  // ---------------------------------------------------------------------------
  // HARVARD
  // ---------------------------------------------------------------------------
  harvard: {
    id: 'harvard',
    name: 'Harvard University',

    weights: {
      authenticity: 0.25,
      insight: 0.25,
      schoolFit: 0.20,
      specificity: 0.20,
      risk: 0.10,
    },

    boostFor: [
      'intellectual_curiosity',
      'leadership_with_impact',
      'public_service_orientation',
      'original_thinking',
      'global_perspective_with_specifics',
      'interdisciplinary_interests',
      'house_system_understanding',
    ],

    penalizeFor: [
      'prestige_chasing',
      'name_dropping_without_substance',
      'generic_top_school_language',
      'career_outcomes_only_focus',
      'lacking_intellectual_depth',
    ],

    mustMention: [
      'specific_course_professor_or_program',
      'contribution_to_community',
      'intellectual_pursuit',
    ],

    redFlags: [
      'prestigious institution',
      'best school in the world',
      'networking opportunities',
      'Harvard name on my resume',
      'always dreamed of Harvard',
    ],

    valueKeywords: [
      'curiosity',
      'veritas',
      'truth',
      'integrity',
      'community',
      'impact',
      'growth',
      'collaboration',
      'excellence',
      'service',
    ],

    cultureKeywords: [
      'house system',
      'gen ed',
      'freshman seminars',
      'residential community',
      'liberal arts',
      'diversity of thought',
      'Q Guide',
      'PRISE',
      'Harvard Innovation Labs',
      'Radcliffe',
    ],
  },

  // ---------------------------------------------------------------------------
  // YALE
  // ---------------------------------------------------------------------------
  yale: {
    id: 'yale',
    name: 'Yale University',

    weights: {
      authenticity: 0.25,
      insight: 0.30,  // Yale values intellectual depth more
      schoolFit: 0.20,
      specificity: 0.15,
      risk: 0.10,
    },

    boostFor: [
      'intellectual_depth_and_passion',
      'quirky_unusual_interests',
      'artistic_creative_expression',
      'community_engagement',
      'residential_college_understanding',
      'genuine_curiosity',
      'interdisciplinary_exploration',
    ],

    penalizeFor: [
      'comparing_yale_to_harvard',
      'purely_pre_professional',
      'ignoring_community_aspect',
      'not_knowing_residential_colleges',
      'superficial_arts_mention',
    ],

    mustMention: [
      'residential_college_culture',
      'specific_academic_program',
      'community_contribution',
    ],

    redFlags: [
      'Yale is my backup',
      'second choice after Harvard',
      'networking in finance',
      'just academics',
    ],

    valueKeywords: [
      'creativity',
      'collaboration',
      'community',
      'intellectual depth',
      'artistic expression',
      'service',
      'lux et veritas',
    ],

    cultureKeywords: [
      'residential colleges',
      'Directed Studies',
      'Silliman',
      'Timothy Dwight',
      'Whiffenpoofs',
      'Yale Daily News',
      'Dwight Hall',
      'singing groups',
      'secret societies',
      'New Haven',
    ],
  },

  // ---------------------------------------------------------------------------
  // PRINCETON
  // ---------------------------------------------------------------------------
  princeton: {
    id: 'princeton',
    name: 'Princeton University',

    weights: {
      authenticity: 0.25,
      insight: 0.25,
      schoolFit: 0.25,  // Princeton service alignment is crucial
      specificity: 0.15,
      risk: 0.10,
    },

    boostFor: [
      'genuine_service_commitment',
      'honor_and_integrity',
      'independent_thinking',
      'undergraduate_focus_appreciation',
      'senior_thesis_excitement',
      'precept_discussion_interest',
      'intellectual_humility',
    ],

    penalizeFor: [
      'service_as_resume_padding',
      'lack_of_reflection_on_service',
      'ignoring_honor_code',
      'not_understanding_undergraduate_focus',
      'superficial_service_mention',
    ],

    mustMention: [
      'service_or_civic_engagement',
      'independent_work_interest',
      'community_contribution',
    ],

    redFlags: [
      'did service to look good',
      'helped others less fortunate',
      'volunteer trip changed me',
      'teaching children in Africa',
    ],

    valueKeywords: [
      'honor',
      'integrity',
      'service',
      'scholarship',
      'community',
      'independent thinking',
      'in the nation\'s service',
      'service of humanity',
    ],

    cultureKeywords: [
      'honor code',
      'senior thesis',
      'junior paper',
      'precepts',
      'residential colleges',
      'eating clubs',
      'Bridge Year',
      'Princeton Prizes',
      'independent work',
    ],
  },

  // ---------------------------------------------------------------------------
  // COLUMBIA
  // ---------------------------------------------------------------------------
  columbia: {
    id: 'columbia',
    name: 'Columbia University',

    weights: {
      authenticity: 0.20,
      insight: 0.25,
      schoolFit: 0.25,  // Core curriculum understanding is crucial
      specificity: 0.20,
      risk: 0.10,
    },

    boostFor: [
      'intellectual_rigor',
      'core_curriculum_engagement',
      'nyc_as_educational_resource',
      'global_perspective_depth',
      'debate_and_discourse',
      'interdisciplinary_thinking',
      'urban_engagement',
    ],

    penalizeFor: [
      'nyc_for_lifestyle_only',
      'no_core_curriculum_mention',
      'treating_as_backup',
      'superficial_city_mention',
      'ignoring_academic_rigor',
    ],

    mustMention: [
      'core_curriculum',
      'nyc_educational_value',
      'specific_academic_interest',
    ],

    redFlags: [
      'love New York nightlife',
      'the city that never sleeps',
      'Broadway and restaurants',
      'didn\'t get into my first choice',
    ],

    valueKeywords: [
      'intellectual rigor',
      'global citizenship',
      'engagement',
      'critical thinking',
      'debate',
      'urban life',
      'discourse',
    ],

    cultureKeywords: [
      'Core Curriculum',
      'Contemporary Civilization',
      'Literature Humanities',
      'Lit Hum',
      'CC',
      'Frontiers of Science',
      'Art Humanities',
      'Morningside Heights',
      'Columbia Spectator',
      'global city',
    ],
  },

  // ---------------------------------------------------------------------------
  // BROWN
  // ---------------------------------------------------------------------------
  brown: {
    id: 'brown',
    name: 'Brown University',

    weights: {
      authenticity: 0.30,  // Brown values authentic self-direction
      insight: 0.25,
      schoolFit: 0.20,
      specificity: 0.15,
      risk: 0.10,
    },

    boostFor: [
      'self_direction',
      'intellectual_risk_taking',
      'creative_thinking',
      'open_curriculum_understanding',
      'interdisciplinary_passion',
      'autonomy_in_learning',
      'unconventional_paths',
    ],

    penalizeFor: [
      'wanting_freedom_to_avoid_work',
      'no_demonstrated_self_direction',
      'purely_pre_professional',
      'lacking_intellectual_curiosity',
      'not_understanding_open_curriculum',
    ],

    mustMention: [
      'specific_use_of_open_curriculum',
      'self_directed_exploration',
      'intellectual_curiosity',
    ],

    redFlags: [
      'no requirements sounds easy',
      'can avoid subjects I don\'t like',
      'less stressful',
      'pass/fail to protect GPA',
    ],

    valueKeywords: [
      'autonomy',
      'curiosity',
      'creativity',
      'collaboration',
      'risk-taking',
      'self-direction',
      'exploration',
    ],

    cultureKeywords: [
      'Open Curriculum',
      'RISD',
      'Brown-RISD',
      'independent concentration',
      'shopping period',
      'Swearer Center',
      'engaged scholarship',
      'pass/fail',
      'S/NC',
    ],
  },

  // ---------------------------------------------------------------------------
  // DARTMOUTH
  // ---------------------------------------------------------------------------
  dartmouth: {
    id: 'dartmouth',
    name: 'Dartmouth College',

    weights: {
      authenticity: 0.25,
      insight: 0.20,
      schoolFit: 0.30,  // Dartmouth fit is very specific
      specificity: 0.15,
      risk: 0.10,
    },

    boostFor: [
      'community_orientation',
      'outdoor_appreciation',
      'close_knit_preference',
      'd_plan_understanding',
      'tradition_appreciation',
      'undergraduate_focus_interest',
      'rural_setting_excitement',
    ],

    penalizeFor: [
      'treating_rural_as_negative',
      'ignoring_outdoor_culture',
      'wanting_big_city',
      'not_understanding_d_plan',
      'dismissing_small_size',
    ],

    mustMention: [
      'community_or_belonging',
      'specific_dartmouth_program',
      'location_appreciation',
    ],

    redFlags: [
      'despite the location',
      'even though it\'s rural',
      'wish it were in a city',
      'small school but',
    ],

    valueKeywords: [
      'community',
      'tradition',
      'outdoors',
      'undergraduate focus',
      'accessibility',
      'collaboration',
      'belonging',
    ],

    cultureKeywords: [
      'D-Plan',
      'quarter system',
      'DOC',
      'Dartmouth Outing Club',
      'First-Year Trips',
      'Green Key',
      'Winter Carnival',
      'Hanover',
      'the Green',
      'Big Green',
      'Tucker Foundation',
      'Hopkins Center',
    ],
  },

  // ---------------------------------------------------------------------------
  // CORNELL
  // ---------------------------------------------------------------------------
  cornell: {
    id: 'cornell',
    name: 'Cornell University',

    weights: {
      authenticity: 0.20,
      insight: 0.20,
      schoolFit: 0.35,  // College-specific fit is paramount
      specificity: 0.15,
      risk: 0.10,
    },

    boostFor: [
      'college_specific_knowledge',
      'applied_learning_interest',
      'research_passion',
      'any_person_any_study_understanding',
      'project_team_interest',
      'land_grant_mission_appreciation',
      'program_specificity',
    ],

    penalizeFor: [
      'generic_cornell_essay',
      'wrong_college_focus',
      'not_understanding_differences',
      'ignoring_college_specific_programs',
      'confusing_college_missions',
    ],

    mustMention: [
      'specific_college_by_name',
      'college_specific_program',
      'why_that_college_not_others',
    ],

    redFlags: [
      'Cornell in general',
      'any of Cornell\'s colleges',
      'whichever college accepts me',
      'doesn\'t matter which school',
    ],

    valueKeywords: [
      'any person any study',
      'accessibility',
      'diversity',
      'applied learning',
      'research',
      'practical impact',
      'exploration',
      'land grant',
    ],

    cultureKeywords: [
      'College of Arts and Sciences',
      'Engineering',
      'Hotel School',
      'SHA',
      'ILR',
      'Human Ecology',
      'CALS',
      'AAP',
      'project teams',
      'Ithaca',
      'gorges',
      'Cornell Tech',
    ],
  },

  // ---------------------------------------------------------------------------
  // UPENN
  // ---------------------------------------------------------------------------
  upenn: {
    id: 'upenn',
    name: 'University of Pennsylvania',

    weights: {
      authenticity: 0.20,
      insight: 0.20,
      schoolFit: 0.30,
      specificity: 0.20,
      risk: 0.10,
    },

    boostFor: [
      'cross_school_collaboration',
      'practical_application',
      'entrepreneurship',
      'one_university_understanding',
      'civic_engagement',
      'philadelphia_integration',
      'interdisciplinary_practicality',
    ],

    penalizeFor: [
      'wharton_prestige_only',
      'ignoring_cross_school',
      'no_civic_engagement',
      'purely_theoretical',
      'confusing_penn_schools',
    ],

    mustMention: [
      'specific_school_college_or_program',
      'cross_school_opportunity',
      'practical_application',
    ],

    redFlags: [
      'Wharton for the name',
      'Wall Street connections',
      'most prestigious business school',
      'Penn for networking',
    ],

    valueKeywords: [
      'integration',
      'practical impact',
      'entrepreneurship',
      'collaboration',
      'innovation',
      'civic engagement',
      'one university',
    ],

    cultureKeywords: [
      'One University',
      'Wharton',
      'College of Arts and Sciences',
      'Engineering',
      'Nursing',
      'Huntsman',
      'Jerome Fisher M&T',
      'Civic House',
      'West Philadelphia',
      'Penn Center for Innovation',
      'Quakers',
    ],
  },
};

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Get configuration for a specific school
 */
export function getSchoolConfig(schoolId: string): SchoolScoringConfig | null {
  return SCHOOL_CONFIGS[schoolId.toLowerCase()] || null;
}

/**
 * Get all school IDs
 */
export function getAllSchoolIds(): string[] {
  return Object.keys(SCHOOL_CONFIGS);
}

/**
 * Check if text contains school-specific keywords
 */
export function detectSchoolKeywords(
  text: string,
  schoolId: string
): {
  valueMatches: string[];
  cultureMatches: string[];
  redFlagMatches: string[];
  fitScore: number;
} {
  const config = getSchoolConfig(schoolId);
  if (!config) {
    return { valueMatches: [], cultureMatches: [], redFlagMatches: [], fitScore: 0 };
  }

  const textLower = text.toLowerCase();

  const valueMatches = config.valueKeywords.filter(kw =>
    textLower.includes(kw.toLowerCase())
  );

  const cultureMatches = config.cultureKeywords.filter(kw =>
    textLower.includes(kw.toLowerCase())
  );

  const redFlagMatches = config.redFlags.filter(rf =>
    textLower.includes(rf.toLowerCase())
  );

  // Calculate fit score
  let fitScore = 0;

  // Positive points for good matches
  fitScore += valueMatches.length * 2;
  fitScore += cultureMatches.length * 3;

  // Heavy penalty for red flags
  fitScore -= redFlagMatches.length * 5;

  // Normalize to 0-20 scale
  fitScore = Math.max(0, Math.min(20, fitScore));

  return { valueMatches, cultureMatches, redFlagMatches, fitScore };
}

/**
 * Get weight adjustments based on what essay demonstrates
 */
export function getScoreAdjustment(
  schoolId: string,
  demonstratedTraits: string[]
): number {
  const config = getSchoolConfig(schoolId);
  if (!config) return 0;

  let adjustment = 0;

  // Boost for aligned traits
  for (const trait of demonstratedTraits) {
    if (config.boostFor.some(b => b.includes(trait.toLowerCase()))) {
      adjustment += 2;
    }
    if (config.penalizeFor.some(p => p.includes(trait.toLowerCase()))) {
      adjustment -= 3;
    }
  }

  // Cap adjustment at +/- 10 points
  return Math.max(-10, Math.min(10, adjustment));
}

/**
 * Generate school-specific feedback based on analysis
 */
export function generateSchoolFeedback(
  schoolId: string,
  detectedElements: {
    valueMatches: string[];
    cultureMatches: string[];
    redFlagMatches: string[];
  }
): string[] {
  const config = getSchoolConfig(schoolId);
  if (!config) return [];

  const feedback: string[] = [];

  // Positive feedback
  if (detectedElements.cultureMatches.length > 0) {
    feedback.push(
      `Good: You referenced ${config.name}-specific elements: ${detectedElements.cultureMatches.join(', ')}`
    );
  }

  // Missing elements
  const missingMustMention = config.mustMention.filter(m =>
    !detectedElements.cultureMatches.some(c =>
      m.toLowerCase().includes(c.toLowerCase())
    )
  );

  if (missingMustMention.length > 0) {
    feedback.push(
      `Consider adding: ${config.name} values essays that mention ${missingMustMention.join(', ')}`
    );
  }

  // Red flag warnings
  if (detectedElements.redFlagMatches.length > 0) {
    feedback.push(
      `Warning: Avoid phrases like "${detectedElements.redFlagMatches[0]}" - this is a red flag for ${config.name} admissions`
    );
  }

  return feedback;
}
