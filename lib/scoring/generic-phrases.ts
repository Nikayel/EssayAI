/**
 * Generic Phrase Database
 * Master list of cliches, jargon, and red flags for essay analysis
 */

import type { GenericPhrase } from './types';

// =============================================================================
// HARD FLAGS - Auto-penalize heavily
// =============================================================================

export const HARD_FLAG_PHRASES: GenericPhrase[] = [
  // Opening cliches
  {
    id: 'opening-young-age',
    phrase: 'from a young age',
    pattern: /from a young age/i,
    severity: 'hard',
    category: 'opening',
    suggestion: 'Start with a specific moment or scene instead of summarizing your whole life',
  },
  {
    id: 'opening-ever-since',
    phrase: 'ever since I can remember',
    pattern: /ever since I can remember/i,
    severity: 'hard',
    category: 'opening',
    suggestion: 'Begin with a concrete recent moment, then flash back if needed',
  },
  {
    id: 'opening-always-passionate',
    phrase: 'I have always been passionate about',
    pattern: /I have always been passionate about/i,
    severity: 'hard',
    category: 'opening',
    suggestion: 'Show your passion through a specific story or action instead',
  },
  {
    id: 'opening-always-wanted',
    phrase: 'I have always wanted to',
    pattern: /I have always wanted to/i,
    severity: 'hard',
    category: 'opening',
    suggestion: 'Demonstrate your interest through a moment of action or discovery',
  },
  {
    id: 'opening-growing-up',
    phrase: 'growing up, I learned',
    pattern: /growing up,? I learned/i,
    severity: 'hard',
    category: 'opening',
    suggestion: 'Start in the present tense with a specific scene',
  },
  {
    id: 'opening-when-i-was',
    phrase: 'when I was [age] years old',
    pattern: /when I was \d+ years old/i,
    severity: 'hard',
    category: 'opening',
    suggestion: 'Avoid age-markers; drop us into the scene directly',
  },
  {
    id: 'opening-webster',
    phrase: 'Webster\'s dictionary defines',
    pattern: /(?:webster'?s?|the dictionary|merriam-webster) defines?/i,
    severity: 'hard',
    category: 'opening',
    suggestion: 'Never start with a dictionary definition - AOs see this constantly',
  },

  // Reflection cliches
  {
    id: 'reflection-learned-importance',
    phrase: 'I learned the importance of',
    pattern: /I learned the importance of/i,
    severity: 'hard',
    category: 'reflection',
    suggestion: 'Show the learning through changed behavior or thinking, not a statement',
  },
  {
    id: 'reflection-experience-taught',
    phrase: 'this experience taught me',
    pattern: /this experience taught me/i,
    severity: 'hard',
    category: 'reflection',
    suggestion: 'Demonstrate what you learned through how you changed, not by telling',
  },
  {
    id: 'reflection-realized-that',
    phrase: 'I realized that',
    pattern: /I (?:then )?realized that/i,
    severity: 'hard',
    category: 'reflection',
    suggestion: 'Show the moment of realization through action or thought process',
  },
  {
    id: 'reflection-opened-eyes',
    phrase: 'opened my eyes to',
    pattern: /opened my eyes to/i,
    severity: 'hard',
    category: 'reflection',
    suggestion: 'Describe what you now see differently with specific examples',
  },
  {
    id: 'reflection-turning-point',
    phrase: 'this was a turning point',
    pattern: /(?:this|it) was a turning point/i,
    severity: 'hard',
    category: 'reflection',
    suggestion: 'Show the before and after contrast; let readers infer the turning point',
  },
  {
    id: 'reflection-changed-life',
    phrase: 'changed my life',
    pattern: /changed my life/i,
    severity: 'hard',
    category: 'reflection',
    suggestion: 'Show HOW your life changed through concrete details',
  },

  // Comfort zone / growth cliches
  {
    id: 'growth-comfort-zone',
    phrase: 'step outside my comfort zone',
    pattern: /step(?:ped)? outside (?:my|of my) comfort zone/i,
    severity: 'hard',
    category: 'reflection',
    suggestion: 'Describe the discomfort specifically; what did it feel like?',
  },
  {
    id: 'growth-broaden-horizons',
    phrase: 'broaden my horizons',
    pattern: /broaden(?:ed)? (?:my|our) horizons/i,
    severity: 'hard',
    category: 'reflection',
    suggestion: 'Be specific about what new perspectives you gained',
  },
  {
    id: 'growth-think-outside-box',
    phrase: 'think outside the box',
    pattern: /think(?:ing)? outside the box/i,
    severity: 'hard',
    category: 'jargon',
    suggestion: 'Show creative thinking through a specific example',
  },
  {
    id: 'growth-pushed-limits',
    phrase: 'pushed my limits',
    pattern: /pushed (?:my|the) limits/i,
    severity: 'hard',
    category: 'reflection',
    suggestion: 'Describe the specific challenge and how you overcame it',
  },

  // Why school cliches
  {
    id: 'why-always-dreamed',
    phrase: 'I have always dreamed of attending',
    pattern: /I have always dreamed of attending/i,
    severity: 'hard',
    category: 'jargon',
    suggestion: 'Focus on specific reasons, not childhood fantasies about prestige',
  },
  {
    id: 'why-prestigious',
    phrase: 'prestigious institution',
    pattern: /prestigious (?:institution|university|school|college)/i,
    severity: 'hard',
    category: 'jargon',
    suggestion: 'Avoid prestige language; focus on specific programs and fit',
  },
  {
    id: 'why-top-ranked',
    phrase: 'top-ranked program',
    pattern: /top[- ]ranked (?:program|school|university)/i,
    severity: 'hard',
    category: 'jargon',
    suggestion: 'Rankings don\'t show fit; discuss specific appeal',
  },
  {
    id: 'why-best-school',
    phrase: 'the best school for',
    pattern: /the best (?:school|university|college|program) for/i,
    severity: 'hard',
    category: 'jargon',
    suggestion: 'Explain why it\'s the best fit for YOU specifically',
  },

  // Ending cliches
  {
    id: 'ending-excited-opportunity',
    phrase: 'I am excited for the opportunity',
    pattern: /I am excited for the opportunity/i,
    severity: 'hard',
    category: 'closing',
    suggestion: 'End with forward-looking specificity, not generic enthusiasm',
  },
  {
    id: 'ending-look-forward',
    phrase: 'I look forward to',
    pattern: /I look forward to/i,
    severity: 'hard',
    category: 'closing',
    suggestion: 'Be specific about what you\'ll do and contribute',
  },
  {
    id: 'ending-make-difference',
    phrase: 'make a difference in the world',
    pattern: /make a difference (?:in the world|in society)/i,
    severity: 'hard',
    category: 'closing',
    suggestion: 'Specify HOW you plan to make a difference',
  },
  {
    id: 'ending-follow-dreams',
    phrase: 'follow my dreams',
    pattern: /follow (?:my|our) dreams/i,
    severity: 'hard',
    category: 'closing',
    suggestion: 'Name the specific dream and path to achieve it',
  },
];

// =============================================================================
// SOFT FLAGS - Warn but don't auto-penalize
// =============================================================================

export const SOFT_FLAG_PHRASES: GenericPhrase[] = [
  // Buzzwords
  {
    id: 'buzz-diverse-community',
    phrase: 'diverse community',
    pattern: /diverse community/i,
    severity: 'soft',
    category: 'buzzword',
    suggestion: 'Be specific about what kind of diversity and why it matters to you',
    context: 'OK if followed by specific examples',
  },
  {
    id: 'buzz-global-perspective',
    phrase: 'global perspective',
    pattern: /global perspective/i,
    severity: 'soft',
    category: 'buzzword',
    suggestion: 'Give a concrete example of what global perspective means to you',
  },
  {
    id: 'buzz-holistic-education',
    phrase: 'holistic education',
    pattern: /holistic (?:education|approach|learning)/i,
    severity: 'soft',
    category: 'buzzword',
    suggestion: 'Describe specific aspects of the education that appeal to you',
  },
  {
    id: 'buzz-well-rounded',
    phrase: 'well-rounded',
    pattern: /well[- ]rounded/i,
    severity: 'soft',
    category: 'buzzword',
    suggestion: 'Show your range through examples, don\'t claim it',
  },
  {
    id: 'buzz-unique-opportunity',
    phrase: 'unique opportunity',
    pattern: /unique opportunity/i,
    severity: 'soft',
    category: 'buzzword',
    suggestion: 'Explain what makes it unique specifically',
  },
  {
    id: 'buzz-make-impact',
    phrase: 'make an impact',
    pattern: /make an impact/i,
    severity: 'soft',
    category: 'buzzword',
    suggestion: 'Describe the specific impact you want to make',
  },
  {
    id: 'buzz-leadership-skills',
    phrase: 'leadership skills',
    pattern: /leadership skills/i,
    severity: 'soft',
    category: 'buzzword',
    suggestion: 'Show leadership through a specific story, don\'t label it',
  },
  {
    id: 'buzz-critical-thinking',
    phrase: 'critical thinking',
    pattern: /critical thinking/i,
    severity: 'soft',
    category: 'buzzword',
    suggestion: 'Demonstrate critical thinking through your analysis, don\'t name it',
  },
  {
    id: 'buzz-passionate',
    phrase: 'passionate',
    pattern: /\bpassionate\b/i,
    severity: 'soft',
    category: 'buzzword',
    suggestion: 'Show passion through actions and commitment, not the word itself',
  },
  {
    id: 'buzz-driven',
    phrase: 'driven',
    pattern: /\bdriven\b/i,
    severity: 'soft',
    category: 'buzzword',
    suggestion: 'Demonstrate drive through examples of persistence',
  },
  {
    id: 'buzz-dedicated',
    phrase: 'dedicated',
    pattern: /\bdedicated\b/i,
    severity: 'soft',
    category: 'buzzword',
    suggestion: 'Show dedication through time invested and sacrifices made',
  },

  // Vague reflection
  {
    id: 'vague-learned-lot',
    phrase: 'I learned a lot',
    pattern: /I learned a lot/i,
    severity: 'soft',
    category: 'reflection',
    suggestion: 'Specify exactly what you learned with concrete examples',
  },
  {
    id: 'vague-meaningful',
    phrase: 'meaningful experience',
    pattern: /meaningful experience/i,
    severity: 'soft',
    category: 'reflection',
    suggestion: 'Show why it was meaningful through specific impact',
  },
  {
    id: 'vague-rewarding',
    phrase: 'rewarding experience',
    pattern: /rewarding (?:experience|opportunity)/i,
    severity: 'soft',
    category: 'reflection',
    suggestion: 'Describe the specific reward or outcome',
  },
  {
    id: 'vague-eye-opening',
    phrase: 'eye-opening',
    pattern: /eye[- ]opening/i,
    severity: 'soft',
    category: 'reflection',
    suggestion: 'Describe what you now see that you didn\'t before',
  },

  // Common transitions
  {
    id: 'transition-in-conclusion',
    phrase: 'in conclusion',
    pattern: /in conclusion/i,
    severity: 'soft',
    category: 'transition',
    suggestion: 'Your essay should flow naturally to its end without announcing it',
  },
  {
    id: 'transition-todays-society',
    phrase: 'in today\'s society',
    pattern: /in today'?s (?:society|world)/i,
    severity: 'soft',
    category: 'transition',
    suggestion: 'Be specific about what aspect of the current moment you\'re referencing',
  },
  {
    id: 'transition-furthermore',
    phrase: 'furthermore',
    pattern: /\bfurthermore\b/i,
    severity: 'soft',
    category: 'transition',
    suggestion: 'Use natural transitions or restructure for better flow',
  },

  // Generic descriptions
  {
    id: 'generic-amazing',
    phrase: 'amazing',
    pattern: /\bamazing\b/i,
    severity: 'soft',
    category: 'jargon',
    suggestion: 'Use specific, descriptive language instead of vague superlatives',
  },
  {
    id: 'generic-incredible',
    phrase: 'incredible',
    pattern: /\bincredible\b/i,
    severity: 'soft',
    category: 'jargon',
    suggestion: 'Describe what made it noteworthy specifically',
  },
  {
    id: 'generic-life-changing',
    phrase: 'life-changing',
    pattern: /life[- ]changing/i,
    severity: 'soft',
    category: 'jargon',
    suggestion: 'Show the before and after to demonstrate the change',
  },
];

// =============================================================================
// THESAURUS ABUSE - Over-complicated vocabulary
// =============================================================================

export const THESAURUS_ABUSE_PATTERNS: GenericPhrase[] = [
  {
    id: 'thesaurus-utilize',
    phrase: 'utilize',
    pattern: /\butilize[ds]?\b/i,
    severity: 'soft',
    category: 'jargon',
    suggestion: 'Just say "use" - it\'s clearer and more authentic',
  },
  {
    id: 'thesaurus-endeavor',
    phrase: 'endeavor',
    pattern: /\bendeavou?r(?:ed|s|ing)?\b/i,
    severity: 'soft',
    category: 'jargon',
    suggestion: 'Try "try" or "attempt" - simpler is better',
  },
  {
    id: 'thesaurus-plethora',
    phrase: 'plethora',
    pattern: /\bplethora\b/i,
    severity: 'hard',
    category: 'jargon',
    suggestion: 'Say "many" or "a lot of" - "plethora" is a red flag for coached essays',
  },
  {
    id: 'thesaurus-myriad',
    phrase: 'myriad',
    pattern: /\bmyriad\b/i,
    severity: 'soft',
    category: 'jargon',
    suggestion: 'Use "many" or be specific about the number',
  },
  {
    id: 'thesaurus-facilitate',
    phrase: 'facilitate',
    pattern: /\bfacilitate[ds]?\b/i,
    severity: 'soft',
    category: 'jargon',
    suggestion: 'Try "help," "enable," or "make easier"',
  },
  {
    id: 'thesaurus-implement',
    phrase: 'implement',
    pattern: /\bimplement(?:ed|s|ing|ation)?\b/i,
    severity: 'soft',
    category: 'jargon',
    suggestion: 'Use "start," "create," or "put in place" for clearer writing',
  },
  {
    id: 'thesaurus-leverage',
    phrase: 'leverage',
    pattern: /\bleverage[ds]?\b/i,
    severity: 'hard',
    category: 'jargon',
    suggestion: 'Corporate jargon - say "use" or "take advantage of"',
  },
  {
    id: 'thesaurus-synergy',
    phrase: 'synergy',
    pattern: /\bsynergy\b/i,
    severity: 'hard',
    category: 'jargon',
    suggestion: 'Business buzzword - describe the collaboration specifically',
  },
  {
    id: 'thesaurus-paradigm',
    phrase: 'paradigm',
    pattern: /\bparadigm\b/i,
    severity: 'hard',
    category: 'jargon',
    suggestion: 'Overused academic term - use "model," "pattern," or explain directly',
  },
  {
    id: 'thesaurus-multifaceted',
    phrase: 'multifaceted',
    pattern: /\bmultifaceted\b/i,
    severity: 'soft',
    category: 'jargon',
    suggestion: 'Describe the specific facets instead',
  },
  {
    id: 'thesaurus-dichotomy',
    phrase: 'dichotomy',
    pattern: /\bdichotomy\b/i,
    severity: 'soft',
    category: 'jargon',
    suggestion: 'Describe the contrast or tension directly',
  },
  {
    id: 'thesaurus-juxtaposition',
    phrase: 'juxtaposition',
    pattern: /\bjuxtaposition\b/i,
    severity: 'soft',
    category: 'jargon',
    suggestion: 'Show the contrast rather than naming it',
  },
  {
    id: 'thesaurus-albeit',
    phrase: 'albeit',
    pattern: /\balbeit\b/i,
    severity: 'soft',
    category: 'jargon',
    suggestion: 'Use "although" or "even though" for natural flow',
  },
  {
    id: 'thesaurus-whilst',
    phrase: 'whilst',
    pattern: /\bwhilst\b/i,
    severity: 'soft',
    category: 'jargon',
    suggestion: 'Use "while" unless you\'re British',
  },
  {
    id: 'thesaurus-henceforth',
    phrase: 'henceforth',
    pattern: /\bhenceforth\b/i,
    severity: 'hard',
    category: 'jargon',
    suggestion: 'Too formal - use "from then on" or restructure',
  },
  {
    id: 'thesaurus-aforementioned',
    phrase: 'aforementioned',
    pattern: /\baforementioned\b/i,
    severity: 'hard',
    category: 'jargon',
    suggestion: 'Legal/academic jargon - just reference the thing directly',
  },
];

// =============================================================================
// VAGUE LANGUAGE PATTERNS
// =============================================================================

export const VAGUE_LANGUAGE_PATTERNS: GenericPhrase[] = [
  {
    id: 'vague-things',
    phrase: 'things',
    pattern: /\bthings\b/i,
    severity: 'soft',
    category: 'jargon',
    suggestion: 'What things specifically? Name them.',
  },
  {
    id: 'vague-stuff',
    phrase: 'stuff',
    pattern: /\bstuff\b/i,
    severity: 'soft',
    category: 'jargon',
    suggestion: 'What stuff? Be specific.',
  },
  {
    id: 'vague-people',
    phrase: 'people',
    pattern: /\bpeople\b(?! (?:of color|with disabilities|who))/i,
    severity: 'soft',
    category: 'jargon',
    suggestion: 'Which people? Name or describe them.',
    context: 'OK when followed by specific descriptors',
  },
  {
    id: 'vague-interesting',
    phrase: 'interesting',
    pattern: /\binteresting\b/i,
    severity: 'soft',
    category: 'jargon',
    suggestion: 'What made it interesting? Be specific.',
  },
  {
    id: 'vague-important',
    phrase: 'important',
    pattern: /\bimportant\b/i,
    severity: 'soft',
    category: 'jargon',
    suggestion: 'Why important? Show the stakes.',
  },
  {
    id: 'vague-good',
    phrase: 'good',
    pattern: /\bgood\b/i,
    severity: 'soft',
    category: 'jargon',
    suggestion: 'Good how? Use specific descriptors.',
  },
  {
    id: 'vague-nice',
    phrase: 'nice',
    pattern: /\bnice\b/i,
    severity: 'soft',
    category: 'jargon',
    suggestion: 'Nice is vague - describe the quality specifically.',
  },
  {
    id: 'vague-really',
    phrase: 'really',
    pattern: /\breally\b/i,
    severity: 'soft',
    category: 'jargon',
    suggestion: 'Weak intensifier - cut it or use a stronger word.',
  },
  {
    id: 'vague-very',
    phrase: 'very',
    pattern: /\bvery\b/i,
    severity: 'soft',
    category: 'jargon',
    suggestion: 'Mark Twain: "Substitute \'damn\' every time you\'re inclined to write \'very.\'"',
  },
];

// =============================================================================
// SURFACE-LEVEL EPIPHANIES
// =============================================================================

export const SURFACE_EPIPHANY_PATTERNS: GenericPhrase[] = [
  {
    id: 'epiphany-hard-work',
    phrase: 'hard work pays off',
    pattern: /hard work pays off/i,
    severity: 'hard',
    category: 'reflection',
    suggestion: 'This is universally known - show a specific, non-obvious insight instead',
  },
  {
    id: 'epiphany-teamwork',
    phrase: 'value of teamwork',
    pattern: /(?:value|importance) of teamwork/i,
    severity: 'hard',
    category: 'reflection',
    suggestion: 'What specifically did you learn about collaboration that surprised you?',
  },
  {
    id: 'epiphany-stronger',
    phrase: 'I was stronger than I thought',
    pattern: /I was stronger than I thought/i,
    severity: 'hard',
    category: 'reflection',
    suggestion: 'Show the strength through action, don\'t declare it',
  },
  {
    id: 'epiphany-perseverance',
    phrase: 'taught me perseverance',
    pattern: /taught me (?:perseverance|persistence|to persevere)/i,
    severity: 'hard',
    category: 'reflection',
    suggestion: 'Demonstrate perseverance through your story, don\'t name it',
  },
  {
    id: 'epiphany-confidence',
    phrase: 'gained confidence',
    pattern: /(?:gained|found|discovered) (?:my )?confidence/i,
    severity: 'soft',
    category: 'reflection',
    suggestion: 'Show confident actions; readers will infer the confidence',
  },
  {
    id: 'epiphany-believe',
    phrase: 'believe in myself',
    pattern: /believe in myself/i,
    severity: 'hard',
    category: 'reflection',
    suggestion: 'Show self-belief through decisions and actions',
  },
  {
    id: 'epiphany-discovered-passion',
    phrase: 'discovered my passion',
    pattern: /discovered (?:my|a) passion/i,
    severity: 'soft',
    category: 'reflection',
    suggestion: 'Describe the moment of discovery with sensory detail',
  },
  {
    id: 'epiphany-failure-success',
    phrase: 'failure is a stepping stone to success',
    pattern: /failure is a (?:stepping stone|path) to success/i,
    severity: 'hard',
    category: 'reflection',
    suggestion: 'Show how YOUR specific failure led to YOUR specific success',
  },
  {
    id: 'epiphany-everything-happens',
    phrase: 'everything happens for a reason',
    pattern: /everything happens for a reason/i,
    severity: 'hard',
    category: 'reflection',
    suggestion: 'Avoid platitudes - share your actual, specific perspective',
  },
];

// =============================================================================
// EXTENDED PHRASES IMPORT
// =============================================================================

import { ALL_EXTENDED_PHRASES } from './extended-phrases';

// =============================================================================
// COMBINED EXPORT
// =============================================================================

export const ALL_GENERIC_PHRASES: GenericPhrase[] = [
  ...HARD_FLAG_PHRASES,
  ...SOFT_FLAG_PHRASES,
  ...THESAURUS_ABUSE_PATTERNS,
  ...VAGUE_LANGUAGE_PATTERNS,
  ...SURFACE_EPIPHANY_PATTERNS,
  ...ALL_EXTENDED_PHRASES,
];

export const HARD_FLAGS = ALL_GENERIC_PHRASES.filter(p => p.severity === 'hard');
export const SOFT_FLAGS = ALL_GENERIC_PHRASES.filter(p => p.severity === 'soft');

// Total phrase count for reference
export const TOTAL_PHRASE_COUNT = ALL_GENERIC_PHRASES.length;

/**
 * Check essay text against all generic phrase patterns
 */
export function detectGenericPhrases(text: string): {
  hardFlags: Array<{ phrase: GenericPhrase; match: string; index: number }>;
  softFlags: Array<{ phrase: GenericPhrase; match: string; index: number }>;
  totalFound: number;
  clicheDensity: number;
} {
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const sentencesWithCliche = new Set<number>();

  const hardFlags: Array<{ phrase: GenericPhrase; match: string; index: number }> = [];
  const softFlags: Array<{ phrase: GenericPhrase; match: string; index: number }> = [];

  for (const phrase of ALL_GENERIC_PHRASES) {
    const matches = text.matchAll(new RegExp(phrase.pattern, 'gi'));
    for (const match of matches) {
      const result = {
        phrase,
        match: match[0],
        index: match.index || 0,
      };

      if (phrase.severity === 'hard') {
        hardFlags.push(result);
      } else {
        softFlags.push(result);
      }

      // Find which sentence contains this match
      let charCount = 0;
      for (let i = 0; i < sentences.length; i++) {
        charCount += sentences[i].length + 1; // +1 for period
        if (charCount > (match.index || 0)) {
          sentencesWithCliche.add(i);
          break;
        }
      }
    }
  }

  return {
    hardFlags,
    softFlags,
    totalFound: hardFlags.length + softFlags.length,
    clicheDensity: sentences.length > 0
      ? sentencesWithCliche.size / sentences.length
      : 0,
  };
}

/**
 * Get score deduction based on cliche density
 */
export function calculateClicheScore(density: number, hardFlagCount: number): number {
  // Start at 5, deduct based on findings
  let score = 5;

  // Hard penalty for each hard flag (up to -3)
  score -= Math.min(hardFlagCount * 0.5, 3);

  // Density penalty
  if (density > 0.3) score -= 2;      // >30% of sentences have cliches
  else if (density > 0.2) score -= 1.5;
  else if (density > 0.1) score -= 1;
  else if (density > 0.05) score -= 0.5;

  return Math.max(0, Math.round(score * 10) / 10);
}
