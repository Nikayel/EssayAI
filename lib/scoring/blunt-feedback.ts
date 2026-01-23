/**
 * Blunt Feedback Generator
 * Provides direct, honest feedback without sugar coating
 *
 * Philosophy:
 * - Say what consultants who charge $10k+ actually say
 * - No "consider" or "you might want to" - be direct
 * - Focus on what AOs actually think when reading
 * - Help students, don't coddle them
 */

import type { AIDetectionResult } from './ai-detection';

// =============================================================================
// TYPES
// =============================================================================

export interface BluntFeedback {
  category: FeedbackCategory;
  severity: 'critical' | 'major' | 'minor' | 'info';
  headline: string;
  explanation: string;
  aoThought: string;  // What an AO thinks when they see this
  fix: string;
  example?: {
    before: string;
    after: string;
  };
}

export type FeedbackCategory =
  | 'opening'
  | 'cliche'
  | 'reflection'
  | 'school_fit'
  | 'structure'
  | 'voice'
  | 'ai_detection'
  | 'specificity'
  | 'risk';

// =============================================================================
// BLUNT FEEDBACK TEMPLATES
// =============================================================================

export const BLUNT_TEMPLATES = {
  // -------------------------------------------------------------------------
  // OPENING ISSUES
  // -------------------------------------------------------------------------
  opening: {
    generic: {
      headline: 'Your opening is forgettable',
      explanation: 'AOs read thousands of essays. Yours starts exactly like hundreds of others.',
      aoThought: '"Here we go again..."',
      fix: 'Start with action, dialogue, or a specific moment. Drop the reader into a scene.',
    },

    'i_have_always': {
      headline: '"I have always..." is the #1 rejected opening',
      explanation: 'This exact phrase appears in 40%+ of essays. It screams "I didn\'t try."',
      aoThought: '"Copy-paste from a template. Next."',
      fix: 'Delete the first paragraph. Your real essay probably starts in paragraph 2.',
    },

    'webster_defines': {
      headline: 'Dictionary definitions are instant rejection',
      explanation: 'No admissions officer has ever been impressed by Merriam-Webster.',
      aoThought: '"Did they really think this was clever? Skip."',
      fix: 'Delete it. Start with your actual story.',
    },

    'question_opening': {
      headline: 'Starting with a question is risky',
      explanation: 'Unless it\'s genuinely thought-provoking, it feels like a writing class trick.',
      aoThought: '"Middle school essay technique."',
      fix: 'Answer your own question in a bold statement, or start with action instead.',
    },
  },

  // -------------------------------------------------------------------------
  // CLICHE ISSUES
  // -------------------------------------------------------------------------
  cliche: {
    generic: {
      headline: 'This cliché makes your essay invisible',
      explanation: 'AOs have read this exact phrase thousands of times. It signals you didn\'t put thought into your words.',
      aoThought: '"Nothing original here."',
      fix: 'Delete it. Say something only YOU would say.',
    },

    'passionate_about': (topic: string) => ({
      headline: `"Passionate about ${topic}" is meaningless`,
      explanation: 'Everyone claims to be passionate. It\'s the most overused word in college essays.',
      aoThought: '"Passion is shown, not declared."',
      fix: `Show your passion through actions and specific moments, don't announce it.`,
    }),

    'changed_my_life': {
      headline: '"Changed my life" means nothing without proof',
      explanation: 'This phrase is so overused it\'s become background noise.',
      aoThought: '"HOW did it change your life? Show me."',
      fix: 'Delete the phrase. Describe the specific before and after.',
    },

    'learned_importance': {
      headline: '"I learned the importance of X" is lazy writing',
      explanation: 'This tells us nothing about what you actually learned or how.',
      aoThought: '"This could apply to literally anyone."',
      fix: 'Show the moment of realization. What specific insight did you gain?',
    },
  },

  // -------------------------------------------------------------------------
  // REFLECTION ISSUES
  // -------------------------------------------------------------------------
  reflection: {
    missing_so_what: {
      headline: 'You describe but never explain why it matters',
      explanation: 'This is the #1 reason competitive essays get rejected. You tell us WHAT happened but not WHY it matters.',
      aoThought: '"So what? Why should I care?"',
      fix: 'After each major event, add 2-3 sentences: What did you realize? How did it change you?',
    },

    surface_level: {
      headline: 'Your reflection stays on the surface',
      explanation: 'You\'re reporting events like a journalist instead of reflecting like a thinker.',
      aoThought: '"This student doesn\'t seem very self-aware."',
      fix: 'Go deeper. Ask yourself "why" three times. The third answer is usually the interesting one.',
    },

    telling_not_showing: {
      headline: 'You\'re telling us you grew instead of showing it',
      explanation: '"I became more confident" or "I learned to be resilient" is telling. Show us the moment.',
      aoThought: '"Claims without evidence."',
      fix: 'Show us a specific scene where you demonstrated this growth. Actions speak.',
    },
  },

  // -------------------------------------------------------------------------
  // SCHOOL FIT ISSUES
  // -------------------------------------------------------------------------
  school_fit: {
    could_be_anywhere: (school: string) => ({
      headline: `This essay could be sent to any school`,
      explanation: `You mention ${school} but say nothing specific. AOs can tell when you copy-paste.`,
      aoThought: '"We're clearly their backup school."',
      fix: `Name a specific program, professor, course, or tradition at ${school}. Research for 30 minutes.`,
    }),

    name_dropping: (school: string) => ({
      headline: `Name-dropping ${school} programs without substance`,
      explanation: 'Mentioning programs isn\'t enough. Anyone can Google a list.',
      aoThought: '"Surface-level research. Not genuinely interested."',
      fix: 'Explain WHY that specific program matters to YOUR story. Connect it to your experience.',
    }),

    prestige_focused: (school: string) => ({
      headline: `You sound like you want ${school} for prestige, not fit`,
      explanation: 'Phrases like "best school," "prestigious," or "world-renowned" are red flags.',
      aoThought: '"This student wants our name, not our education."',
      fix: 'Focus on what you\'ll DO at the school, not what the school\'s reputation will do for you.',
    }),
  },

  // -------------------------------------------------------------------------
  // VOICE ISSUES
  // -------------------------------------------------------------------------
  voice: {
    sounds_coached: {
      headline: 'This doesn\'t sound like a teenager wrote it',
      explanation: 'The vocabulary and sentence structure feel adult-coached or AI-generated.',
      aoThought: '"Did they really write this themselves?"',
      fix: 'Read it out loud. If you wouldn\'t say it in conversation, rewrite it.',
    },

    thesaurus_abuse: (word: string, suggestion: string) => ({
      headline: `"${word}" feels forced and unnatural`,
      explanation: 'Using fancy words incorrectly is worse than using simple words correctly.',
      aoThought: '"Trying too hard to sound smart."',
      fix: `Just say "${suggestion}" — simple and clear beats pretentious and awkward.`,
    }),

    inconsistent_tone: {
      headline: 'Your tone shifts suspiciously between sections',
      explanation: 'Parts sound formal and academic, others casual. This suggests multiple authors.',
      aoThought: '"Different people wrote different sections."',
      fix: 'Pick one voice and stick with it. Your voice. Throughout.',
    },
  },

  // -------------------------------------------------------------------------
  // AI DETECTION ISSUES
  // -------------------------------------------------------------------------
  ai: {
    high_likelihood: {
      headline: 'This reads like ChatGPT wrote it',
      explanation: 'Multiple AI writing patterns detected. AOs are trained to spot these.',
      aoThought: '"Definitely AI-generated. Reject."',
      fix: 'Rewrite the entire essay in your own voice. From scratch.',
    },

    medium_likelihood: {
      headline: 'Several AI writing patterns detected',
      explanation: 'Even if you wrote this yourself, it has ChatGPT signatures that will raise flags.',
      aoThought: '"This feels fake. Something\'s off."',
      fix: 'Review the flagged sections. Remove AI-style transitions and vocabulary.',
    },

    em_dash_overuse: (count: number) => ({
      headline: `${count} em-dashes is a ChatGPT signature`,
      explanation: 'ChatGPT overuses em-dashes — like this — in ways real teenagers don\'t.',
      aoThought: '"AI-generated punctuation pattern."',
      fix: 'Remove most em-dashes. Use commas or periods instead.',
    }),

    ai_vocabulary: (words: string[]) => ({
      headline: `Words like "${words.slice(0, 2).join(', ')}" scream AI`,
      explanation: 'These words appear disproportionately in AI text. Teenagers rarely use them naturally.',
      aoThought: '"ChatGPT vocabulary."',
      fix: 'Use simpler words. If you wouldn\'t say it to a friend, don\'t write it.',
    }),
  },

  // -------------------------------------------------------------------------
  // SPECIFICITY ISSUES
  // -------------------------------------------------------------------------
  specificity: {
    too_vague: {
      headline: 'Your essay is full of vague generalizations',
      explanation: 'Words like "people," "things," "stuff," and "a lot" signal lazy writing.',
      aoThought: '"This student can\'t articulate specifics."',
      fix: 'Replace every vague word with something specific. "People" → who exactly?',
    },

    no_scenes: {
      headline: 'Your essay reads like a summary, not a story',
      explanation: 'You\'re telling us about events from a distance instead of putting us there.',
      aoThought: '"Boring. Where\'s the story?"',
      fix: 'Add at least one scene with dialogue, sensory details, and action.',
    },

    missing_sensory: {
      headline: 'No sensory details make your essay forgettable',
      explanation: 'We can\'t see, hear, or feel anything in your essay. It\'s abstract.',
      aoThought: '"Nothing memorable here."',
      fix: 'Add specific sights, sounds, smells. Make us experience the moment with you.',
    },
  },

  // -------------------------------------------------------------------------
  // RISK ISSUES
  // -------------------------------------------------------------------------
  risk: {
    trauma_no_agency: {
      headline: 'You describe trauma but show no growth from it',
      explanation: 'AOs want resilience, not pity. Right now, you\'re a victim, not a protagonist.',
      aoThought: '"This is concerning, not inspiring."',
      fix: 'Focus on what you DID, not what happened TO you. Show your agency.',
    },

    savior_complex: {
      headline: 'This has "white savior" or "helper" complex vibes',
      explanation: 'Describing helping "less fortunate" people as your growth moment is problematic.',
      aoThought: '"Tone-deaf privilege."',
      fix: 'Focus on what YOU learned and how your perspective changed. Not on "saving" others.',
    },

    negative_tone: {
      headline: 'Your essay sounds bitter or complaining',
      explanation: 'Blaming others, complaining about unfairness, or negativity are red flags.',
      aoThought: '"Do we want this person in our community?"',
      fix: 'Focus on what you overcame, not what was unfair. Stay positive and forward-looking.',
    },

    exaggeration: (claim: string) => ({
      headline: `This claim seems exaggerated: "${claim}"`,
      explanation: 'AOs are skeptical of suspiciously impressive numbers or achievements.',
      aoThought: '"This doesn\'t add up. Integrity concern."',
      fix: 'Be honest and specific. Modest truth beats suspicious exaggeration.',
    }),
  },
};

// =============================================================================
// FEEDBACK GENERATION FUNCTIONS
// =============================================================================

/**
 * Generate blunt feedback for a specific issue type
 */
export function generateBluntFeedback(
  issueType: string,
  context?: Record<string, any>
): BluntFeedback | null {
  const [category, specific] = issueType.split('.');

  const categoryTemplates = BLUNT_TEMPLATES[category as keyof typeof BLUNT_TEMPLATES];
  if (!categoryTemplates) return null;

  const template = specific
    ? categoryTemplates[specific as keyof typeof categoryTemplates]
    : categoryTemplates.generic;

  if (!template) return null;

  // Handle function templates that need context
  if (typeof template === 'function') {
    const result = template(context?.value || context?.word || context?.school || '');
    return {
      category: category as FeedbackCategory,
      severity: determineSeverity(issueType),
      ...result,
    };
  }

  return {
    category: category as FeedbackCategory,
    severity: determineSeverity(issueType),
    ...(template as any),
  };
}

/**
 * Generate feedback for AI detection results
 */
export function generateAIDetectionFeedback(detection: AIDetectionResult): BluntFeedback[] {
  const feedbacks: BluntFeedback[] = [];

  if (detection.aiLikelihood === 'high') {
    feedbacks.push({
      category: 'ai_detection',
      severity: 'critical',
      ...BLUNT_TEMPLATES.ai.high_likelihood,
    });
  } else if (detection.aiLikelihood === 'medium') {
    feedbacks.push({
      category: 'ai_detection',
      severity: 'major',
      ...BLUNT_TEMPLATES.ai.medium_likelihood,
    });
  }

  // Add specific issue feedback
  for (const issue of detection.issues) {
    if (issue.type === 'em_dash_overuse') {
      const template = BLUNT_TEMPLATES.ai.em_dash_overuse(issue.count);
      feedbacks.push({
        category: 'ai_detection',
        severity: issue.severity === 'critical' ? 'critical' : 'major',
        ...template,
      });
    }

    if (issue.type === 'ai_vocabulary' && issue.examples.length > 0) {
      const template = BLUNT_TEMPLATES.ai.ai_vocabulary(issue.examples);
      feedbacks.push({
        category: 'ai_detection',
        severity: 'major',
        ...template,
      });
    }
  }

  return feedbacks;
}

/**
 * Generate feedback for a cliche detection
 */
export function generateClicheFeedback(
  phrase: string,
  suggestion?: string
): BluntFeedback {
  // Check for specific cliche types
  if (/passion(?:ate)?/i.test(phrase)) {
    const template = BLUNT_TEMPLATES.cliche['passionate_about'](
      phrase.replace(/.*passion(?:ate)? (?:about|for) /i, '')
    );
    return {
      category: 'cliche',
      severity: 'major',
      ...template,
      example: suggestion ? { before: phrase, after: suggestion } : undefined,
    };
  }

  if (/changed my life/i.test(phrase)) {
    return {
      category: 'cliche',
      severity: 'major',
      ...BLUNT_TEMPLATES.cliche.changed_my_life,
      example: suggestion ? { before: phrase, after: suggestion } : undefined,
    };
  }

  if (/learned the importance/i.test(phrase)) {
    return {
      category: 'cliche',
      severity: 'major',
      ...BLUNT_TEMPLATES.cliche.learned_importance,
      example: suggestion ? { before: phrase, after: suggestion } : undefined,
    };
  }

  // Generic cliche feedback
  return {
    category: 'cliche',
    severity: 'minor',
    headline: `"${phrase}" is overused`,
    explanation: BLUNT_TEMPLATES.cliche.generic.explanation,
    aoThought: BLUNT_TEMPLATES.cliche.generic.aoThought,
    fix: BLUNT_TEMPLATES.cliche.generic.fix,
    example: suggestion ? { before: phrase, after: suggestion } : undefined,
  };
}

/**
 * Generate school-specific feedback
 */
export function generateSchoolFitFeedback(
  school: string,
  issueType: 'generic' | 'name_dropping' | 'prestige'
): BluntFeedback {
  const templateMap = {
    generic: BLUNT_TEMPLATES.school_fit.could_be_anywhere,
    name_dropping: BLUNT_TEMPLATES.school_fit.name_dropping,
    prestige: BLUNT_TEMPLATES.school_fit.prestige_focused,
  };

  const template = templateMap[issueType](school);
  return {
    category: 'school_fit',
    severity: issueType === 'prestige' ? 'critical' : 'major',
    ...template,
  };
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

function determineSeverity(issueType: string): BluntFeedback['severity'] {
  const criticalIssues = [
    'ai.high_likelihood',
    'risk.savior_complex',
    'school_fit.prestige_focused',
    'opening.webster_defines',
  ];

  const majorIssues = [
    'ai.medium_likelihood',
    'reflection.missing_so_what',
    'opening.i_have_always',
    'voice.sounds_coached',
    'risk.trauma_no_agency',
  ];

  if (criticalIssues.includes(issueType)) return 'critical';
  if (majorIssues.includes(issueType)) return 'major';
  return 'minor';
}

// =============================================================================
// EXPORTS
// =============================================================================

export {
  BLUNT_TEMPLATES,
};
