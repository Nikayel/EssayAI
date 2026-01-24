/**
 * Score Context Messaging
 *
 * Provides human-friendly, encouraging context for essay scores.
 * Designed to reduce student anxiety and focus on actionable improvement.
 *
 * Philosophy:
 * - First drafts are SUPPOSED to need work - that's normal
 * - Scores are tools for improvement, not judgments
 * - Every essay can get better with focused revision
 */

// =============================================================================
// TYPES
// =============================================================================

export interface ScoreContext {
  score: number; // 0-100
  percentile?: number; // 0-100
  essayType: string;
  isDraft: boolean; // Is this a first/early draft?
}

export interface ScoreMessage {
  headline: string; // Short, encouraging headline
  context: string; // Human-friendly context
  nextSteps: string; // What to do next
  encouragement: string; // Reassurance message
  isNormal: boolean; // Is this score normal for the stage?
}

// =============================================================================
// SCORE MESSAGING
// =============================================================================

/**
 * Get encouraging, contextual messaging for a score
 * Designed to reduce anxiety and focus on improvement
 */
export function getScoreMessage(ctx: ScoreContext): ScoreMessage {
  const { score, percentile, essayType, isDraft } = ctx;

  // Draft vs. Final changes messaging significantly
  if (isDraft) {
    return getDraftMessage(score, essayType);
  }

  return getFinalMessage(score, percentile, essayType);
}

/**
 * Messaging for draft essays - normalize that drafts need work
 */
function getDraftMessage(score: number, essayType: string): ScoreMessage {
  if (score >= 80) {
    return {
      headline: 'Strong foundation',
      context: 'Your draft is in great shape. Most essays at this stage score 50-70, so you\'re ahead of the curve.',
      nextSteps: 'Focus on the 2-3 specific suggestions below. Small refinements will make this essay memorable.',
      encouragement: 'You\'re on track for a compelling final essay.',
      isNormal: true,
    };
  }

  if (score >= 65) {
    return {
      headline: 'Solid progress',
      context: 'This is exactly where most strong first drafts land. The core is there - now we refine.',
      nextSteps: 'Review the top suggestions and prioritize the ones that feel most important to you.',
      encouragement: 'First drafts are meant to be revised. You\'re doing great.',
      isNormal: true,
    };
  }

  if (score >= 50) {
    return {
      headline: 'Good starting point',
      context: 'This is a typical first draft score. The ideas are there - the essay just needs development.',
      nextSteps: 'Focus on adding specific details and deepening your reflection. Look at the structure suggestions first.',
      encouragement: 'Every great essay started as a rough draft. This is completely normal.',
      isNormal: true,
    };
  }

  if (score >= 35) {
    return {
      headline: 'Work to do (and that\'s okay)',
      context: 'Your essay needs significant revision, but that\'s what the writing process is for.',
      nextSteps: 'Start with the structural suggestions. Get the foundation right before polishing details.',
      encouragement: 'Many successful applicants started with drafts like this. The key is focused revision.',
      isNormal: true,
    };
  }

  return {
    headline: 'Early stage draft',
    context: 'This essay needs substantial development. Think of this as a brainstorm rather than a draft.',
    nextSteps: 'Consider starting with a different angle or story. Review the "So What?" test feedback.',
    encouragement: 'It takes time to find the right story. Keep exploring.',
    isNormal: true,
  };
}

/**
 * Messaging for final/polished essays
 */
function getFinalMessage(score: number, percentile?: number, essayType?: string): ScoreMessage {
  const percentileContext = percentile
    ? ` This puts you at the ${percentile}th percentile compared to other essays we've analyzed.`
    : '';

  if (score >= 85) {
    return {
      headline: 'Excellent essay',
      context: `This is a strong, polished essay.${percentileContext}`,
      nextSteps: 'Consider the minor suggestions below, but don\'t over-edit. Sometimes good enough is perfect.',
      encouragement: 'This essay will serve you well.',
      isNormal: true,
    };
  }

  if (score >= 70) {
    return {
      headline: 'Good essay',
      context: `This is a solid essay that will represent you well.${percentileContext}`,
      nextSteps: 'Address the top 2-3 suggestions to elevate from good to great.',
      encouragement: 'You\'re in competitive territory. A few tweaks will make this shine.',
      isNormal: true,
    };
  }

  if (score >= 55) {
    return {
      headline: 'Needs polish',
      context: `This essay has potential but needs more refinement.${percentileContext}`,
      nextSteps: 'Prioritize the suggestions marked "high impact" first.',
      encouragement: 'You have a good foundation. Focus on the key improvements.',
      isNormal: true,
    };
  }

  return {
    headline: 'Needs revision',
    context: `This essay needs significant work before submission.${percentileContext}`,
    nextSteps: 'Consider a substantial revision addressing the core feedback before polishing.',
    encouragement: 'Take your time. It\'s better to submit a stronger essay than to rush.',
    isNormal: true,
  };
}

// =============================================================================
// PERCENTILE CONTEXT
// =============================================================================

/**
 * Explain what a percentile means in human terms
 */
export function explainPercentile(percentile: number, sampleSize: number): string {
  if (sampleSize < 50) {
    return 'We need more data to provide meaningful comparisons.';
  }

  if (percentile >= 90) {
    return `Your essay scores higher than ${percentile}% of essays we've analyzed. This is excellent.`;
  }

  if (percentile >= 75) {
    return `Your essay is in the top quarter of essays we've seen - a strong position.`;
  }

  if (percentile >= 50) {
    return `Your essay is above average. With the suggested improvements, you can move into the top tier.`;
  }

  if (percentile >= 25) {
    return `Your essay has room to grow. Focus on the core suggestions to improve your standing.`;
  }

  return `This essay needs substantial work, but that's what revision is for. Focus on the fundamentals first.`;
}

// =============================================================================
// IMPROVEMENT POTENTIAL
// =============================================================================

/**
 * Explain estimated improvement potential
 */
export function explainImprovement(
  currentScore: number,
  estimatedImprovement: number,
  patternsMatched: string[]
): string {
  const potentialScore = Math.min(100, currentScore + estimatedImprovement);

  if (estimatedImprovement < 5) {
    return 'Your essay is already strong. Minor tweaks can add polish.';
  }

  if (estimatedImprovement < 10) {
    return `Addressing the ${patternsMatched.length} patterns we identified could improve your score to around ${potentialScore}.`;
  }

  if (estimatedImprovement < 20) {
    return `There's significant room for improvement. Students who address these patterns typically see scores rise to ${potentialScore-5}-${potentialScore+5}.`;
  }

  return `This essay has major improvement potential. Focused revision on the core issues could transform this essay.`;
}

// =============================================================================
// DIMENSION-SPECIFIC CONTEXT
// =============================================================================

/**
 * Get context for individual dimension scores
 */
export function getDimensionContext(
  dimension: string,
  score: number
): { label: string; explanation: string } {
  const contexts: Record<string, Record<string, { label: string; explanation: string }>> = {
    authenticity: {
      high: { label: 'Genuine voice', explanation: 'Your authentic personality comes through clearly.' },
      mid: { label: 'Mostly authentic', explanation: 'Some parts feel more natural than others. Look for sections that sound "written" rather than "you."' },
      low: { label: 'Voice unclear', explanation: 'The essay doesn\'t quite sound like you yet. Try reading it aloud - does it sound like how you actually talk?' },
    },
    reflection: {
      high: { label: 'Deep insight', explanation: 'You show strong self-awareness and growth mindset.' },
      mid: { label: 'Some reflection', explanation: 'Add more "so what?" moments. After describing events, pause to share what you learned or realized.' },
      low: { label: 'Needs depth', explanation: 'The essay describes what happened but not what it means to you. Add your internal voice.' },
    },
    specificity_fit: {
      high: { label: 'Specific & vivid', explanation: 'Concrete details make your story come alive.' },
      mid: { label: 'Somewhat specific', explanation: 'Some areas feel vague. Replace generalities with specific names, numbers, and moments.' },
      low: { label: 'Too generic', explanation: 'This essay could describe many people. Add details only you could write.' },
    },
    structure: {
      high: { label: 'Well organized', explanation: 'The essay flows naturally and keeps the reader engaged.' },
      mid: { label: 'Adequate structure', explanation: 'The organization works but could be tighter. Check transitions between sections.' },
      low: { label: 'Needs reorganization', explanation: 'The reader may feel lost. Consider a clearer through-line or different organizational approach.' },
    },
    school_fit: {
      high: { label: 'Strong fit demonstrated', explanation: 'You\'ve clearly researched this school and shown genuine connection.' },
      mid: { label: 'Some fit shown', explanation: 'Go deeper. Replace generic references with specific programs, courses, or opportunities.' },
      low: { label: 'Fit unclear', explanation: 'This essay could apply to many schools. Research specific offerings and explain why they matter to you.' },
    },
  };

  const level = score >= 5 ? 'high' : score >= 3 ? 'mid' : 'low';
  const defaultContext = {
    high: { label: 'Strong', explanation: 'This dimension is well-addressed.' },
    mid: { label: 'Adequate', explanation: 'This area could be stronger.' },
    low: { label: 'Needs work', explanation: 'Focus improvement here.' },
  };

  return contexts[dimension]?.[level] || defaultContext[level];
}

// =============================================================================
// STAGE-APPROPRIATE EXPECTATIONS
// =============================================================================

/**
 * Set appropriate expectations based on essay stage
 */
export function getStageExpectations(stage: 'brainstorm' | 'first_draft' | 'revision' | 'final'): {
  typicalScoreRange: [number, number];
  whatToFocusOn: string[];
  whatNotToWorryAbout: string[];
} {
  switch (stage) {
    case 'brainstorm':
      return {
        typicalScoreRange: [20, 45],
        whatToFocusOn: ['Finding the right story', 'Identifying your core message', 'Brainstorming specific moments'],
        whatNotToWorryAbout: ['Word count', 'Perfect grammar', 'Polished prose', 'School-specific details'],
      };
    case 'first_draft':
      return {
        typicalScoreRange: [40, 65],
        whatToFocusOn: ['Story structure', 'Adding reflection', 'Including specific details'],
        whatNotToWorryAbout: ['Minor word choice', 'Perfect opening line', 'Final polish'],
      };
    case 'revision':
      return {
        typicalScoreRange: [55, 80],
        whatToFocusOn: ['Strengthening weak sections', 'Cutting unnecessary content', 'Deepening insight'],
        whatNotToWorryAbout: ['Starting over', 'Major structural changes'],
      };
    case 'final':
      return {
        typicalScoreRange: [70, 95],
        whatToFocusOn: ['Final polish', 'Word count precision', 'Last consistency checks'],
        whatNotToWorryAbout: ['Over-editing', 'Second-guessing your story'],
      };
  }
}
