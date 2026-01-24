/**
 * Insight & Reflection Scorer (Dimension 2)
 * 25 points total - Is there a "so what?" Does it reveal something non-obvious?
 */

import type { InsightScore, TextSpan, StudentIntake } from '../types';
import {
  parseText,
  classifySentence,
  findPatternSpans,
  normalizeToScore,
} from '../text-utils';
import { SURFACE_EPIPHANY_PATTERNS } from '../generic-phrases';

// =============================================================================
// MAIN SCORER
// =============================================================================

export async function scoreInsight(
  essayText: string,
  intake: StudentIntake
): Promise<InsightScore> {
  const [
    depthOfReflection,
    growthArc,
    selfAwareness,
    nonObviousConnections,
    soWhatFactor,
  ] = await Promise.all([
    scoreDepthOfReflection(essayText),
    scoreGrowthArc(essayText),
    scoreSelfAwareness(essayText, intake),
    scoreNonObviousConnections(essayText, intake),
    scoreSoWhatFactor(essayText),
  ]);

  const totalScore =
    depthOfReflection.score +
    growthArc.score +
    selfAwareness.score +
    nonObviousConnections.score +
    soWhatFactor.score;

  return {
    totalScore: Math.round(totalScore * 10) / 10,
    depthOfReflection,
    growthArc,
    selfAwareness,
    nonObviousConnections,
    soWhatFactor,
  };
}

// =============================================================================
// SUB-CRITERION 2.1: DEPTH OF REFLECTION (0-5)
// =============================================================================

async function scoreDepthOfReflection(
  essayText: string
): Promise<InsightScore['depthOfReflection']> {
  const sentences = essayText.split(/[.!?]+/).filter(s => s.trim().length > 10);
  const surfaceStatements: TextSpan[] = [];
  const deepStatements: TextSpan[] = [];

  // Surface-level patterns
  const surfacePatterns = [
    /I (?:felt|was) (?:happy|sad|excited|nervous|scared|proud)/i,
    /It (?:was|felt) (?:good|bad|great|amazing|terrible)/i,
    /I (?:learned|realized) (?:that|how) (?:important|valuable)/i,
    /This (?:taught|showed) me/i,
  ];

  // Deep reflection patterns
  const deepPatterns = [
    /I (?:began to )?(?:question|wonder|understand) (?:why|how|whether)/i,
    /(?:looking back|in retrospect|now I (?:see|understand|realize))/i,
    /this (?:challenged|changed|shifted) (?:my|how I)/i,
    /I (?:struggled|grappled) with/i,
    /(?:the contradiction|the tension|the paradox) (?:between|of)/i,
    /what I (?:didn't|hadn't) (?:expected|anticipated|realized)/i,
    /(?:at first|initially).+(?:but|however|yet).+(?:eventually|later|now)/i,
  ];

  let charCount = 0;
  for (let i = 0; i < sentences.length; i++) {
    const sentence = sentences[i].trim();
    const startChar = charCount;
    const endChar = charCount + sentence.length;
    charCount = endChar + 1;

    // Check for surface patterns
    for (const pattern of surfacePatterns) {
      if (pattern.test(sentence)) {
        surfaceStatements.push({
          text: sentence,
          startLine: i + 1,
          endLine: i + 1,
          startChar,
          endChar,
        });
        break;
      }
    }

    // Check for deep patterns
    for (const pattern of deepPatterns) {
      if (pattern.test(sentence)) {
        deepStatements.push({
          text: sentence,
          startLine: i + 1,
          endLine: i + 1,
          startChar,
          endChar,
        });
        break;
      }
    }
  }

  // Check for surface epiphany cliches
  for (const pattern of SURFACE_EPIPHANY_PATTERNS) {
    const spans = findPatternSpans(essayText, pattern.pattern);
    for (const span of spans) {
      // Add to surface if not already there
      if (!surfaceStatements.some(s => s.startChar === span.startChar)) {
        surfaceStatements.push(span);
      }
    }
  }

  const total = surfaceStatements.length + deepStatements.length;
  const depthRatio = total > 0 ? deepStatements.length / total : 0.5;

  // Calculate score
  let score = 2.5; // Start neutral

  // Reward deep statements
  score += Math.min(2, deepStatements.length * 0.5);

  // Penalize surface statements
  score -= Math.min(2, surfaceStatements.length * 0.3);

  // Bonus for good ratio
  if (depthRatio > 0.6) score += 0.5;

  let feedback = 'Moderate depth of reflection.';

  if (score >= 4.5) {
    feedback = 'Excellent depth! Your reflection goes beyond surface observations.';
  } else if (score >= 3.5) {
    feedback = 'Good reflection with some deeper insights. Push further on key moments.';
  } else if (score < 2.5) {
    feedback = 'Reflection stays at surface level. Dig deeper into the "why" behind your experiences.';
  }

  return {
    score: Math.max(0, Math.min(5, Math.round(score * 10) / 10)),
    surfaceStatements,
    deepStatements,
    depthRatio: Math.round(depthRatio * 100) / 100,
    feedback,
  };
}

// =============================================================================
// SUB-CRITERION 2.2: GROWTH ARC (0-5)
// =============================================================================

async function scoreGrowthArc(
  essayText: string
): Promise<InsightScore['growthArc']> {
  const textLower = essayText.toLowerCase();

  // Before state indicators
  const beforePatterns = [
    /(?:before|previously|at first|initially|used to|once|when I was younger)/i,
    /I (?:thought|believed|assumed|didn't know|never|always|used to)/i,
    /(?:back then|at the time|years ago|growing up)/i,
  ];

  // After state indicators
  const afterPatterns = [
    /(?:now|today|currently|these days|since then)/i,
    /I (?:now|finally|have come to|no longer|understand|realize)/i,
    /(?:looking back|in hindsight|having|after)/i,
  ];

  // Transformation indicators
  const transformPatterns = [
    /(?:changed|transformed|shifted|evolved|grew|developed)/i,
    /(?:turning point|pivotal|moment that|everything changed)/i,
    /(?:learned|discovered|realized|understood|recognized)/i,
  ];

  let hasBeforeState = beforePatterns.some(p => p.test(textLower));
  let hasAfterState = afterPatterns.some(p => p.test(textLower));
  let hasTransformation = transformPatterns.some(p => p.test(textLower));

  // Find growth evidence
  const growthEvidence: TextSpan[] = [];
  const paragraphs = essayText.split(/\n\s*\n/);

  let lineNum = 1;
  for (const para of paragraphs) {
    const hasBefore = beforePatterns.some(p => p.test(para));
    const hasAfter = afterPatterns.some(p => p.test(para));
    const hasTransform = transformPatterns.some(p => p.test(para));

    if ((hasBefore && hasAfter) || hasTransform) {
      growthEvidence.push({
        text: para.substring(0, 150) + (para.length > 150 ? '...' : ''),
        startLine: lineNum,
        endLine: lineNum + para.split('\n').length - 1,
        startChar: 0,
        endChar: para.length,
      });
    }

    lineNum += para.split('\n').length + 1;
  }

  // Calculate transformation clarity (how clear is the before/after contrast?)
  let transformationClarity = 0;
  if (hasBeforeState) transformationClarity += 0.3;
  if (hasAfterState) transformationClarity += 0.3;
  if (hasTransformation) transformationClarity += 0.2;
  if (growthEvidence.length > 0) transformationClarity += 0.2;

  // Calculate score
  let score = 0;

  if (hasBeforeState) score += 1;
  if (hasAfterState) score += 1;
  if (hasTransformation) score += 1;
  if (growthEvidence.length >= 2) score += 1;
  if (transformationClarity > 0.7) score += 1;

  let feedback = 'No clear growth arc detected.';

  if (score >= 4.5) {
    feedback = 'Clear and compelling growth arc with specific before/after contrast.';
  } else if (score >= 3.5) {
    feedback = 'Good growth arc. Consider making the transformation more explicit.';
  } else if (score >= 2.5) {
    feedback = 'Partial growth arc detected. Show more clearly how you changed.';
  } else if (score < 2) {
    feedback = 'Add a clear before/after contrast to show your growth journey.';
  }

  return {
    score: Math.max(0, Math.min(5, Math.round(score * 10) / 10)),
    hasBeforeState,
    hasAfterState,
    transformationClarity: Math.round(transformationClarity * 100) / 100,
    growthEvidence,
    feedback,
  };
}

// =============================================================================
// SUB-CRITERION 2.3: SELF-AWARENESS (0-5)
// =============================================================================

async function scoreSelfAwareness(
  essayText: string,
  intake: StudentIntake
): Promise<InsightScore['selfAwareness']> {
  const strengthsAcknowledged: string[] = [];
  const weaknessesAcknowledged: string[] = [];
  const blindSpots: string[] = [];

  // Strength acknowledgment patterns
  const strengthPatterns = [
    { pattern: /I (?:am|was|have been) (?:good at|skilled in|capable of)/i, extract: true },
    { pattern: /my (?:strength|ability|skill|talent) (?:in|at|with)/i, extract: true },
    { pattern: /I (?:excel|thrive|succeed) (?:at|in|when)/i, extract: true },
  ];

  // Weakness acknowledgment patterns
  const weaknessPatterns = [
    { pattern: /I (?:struggle|struggled) (?:with|to)/i, extract: true },
    { pattern: /my (?:weakness|challenge|difficulty|flaw)/i, extract: true },
    { pattern: /I (?:need|needed) to (?:work on|improve|learn)/i, extract: true },
    { pattern: /I (?:failed|made mistakes|was wrong)/i, extract: true },
    { pattern: /I (?:didn't|don't) (?:know|understand|realize)/i, extract: true },
  ];

  // Find acknowledged strengths
  for (const { pattern } of strengthPatterns) {
    const matches = essayText.match(new RegExp(pattern, 'gi'));
    if (matches) {
      strengthsAcknowledged.push(...matches.map(m => m.trim()));
    }
  }

  // Find acknowledged weaknesses
  for (const { pattern } of weaknessPatterns) {
    const matches = essayText.match(new RegExp(pattern, 'gi'));
    if (matches) {
      weaknessesAcknowledged.push(...matches.map(m => m.trim()));
    }
  }

  // Detect potential blind spots
  const humilityIndicators = weaknessesAcknowledged.length > 0;
  const onlyPositive = strengthsAcknowledged.length > 2 && weaknessesAcknowledged.length === 0;

  if (onlyPositive) {
    blindSpots.push('Essay only highlights strengths without acknowledging areas for growth');
  }

  // Check if essay mentions others' perspectives
  const othersPerspective = /(?:my (?:friend|parent|teacher|mentor|coach) (?:said|told|showed|helped))/i.test(essayText);
  if (!othersPerspective) {
    blindSpots.push('Consider including how others view you or helped you see yourself differently');
  }

  // Calculate score
  let score = 2.5;

  if (strengthsAcknowledged.length > 0) score += 0.5;
  if (weaknessesAcknowledged.length > 0) score += 1.5; // Showing vulnerability is valuable
  if (othersPerspective) score += 0.5;
  if (blindSpots.length > 0) score -= blindSpots.length * 0.5;

  let feedback = 'Moderate self-awareness shown.';

  if (score >= 4.5) {
    feedback = 'Excellent self-awareness! You show both strengths and honest reflection on challenges.';
  } else if (score >= 3.5) {
    feedback = 'Good self-awareness. Consider showing more vulnerability about challenges faced.';
  } else if (score < 2.5) {
    feedback = 'Show more self-awareness by acknowledging challenges or areas where you\'ve grown.';
  }

  return {
    score: Math.max(0, Math.min(5, Math.round(score * 10) / 10)),
    strengthsAcknowledged: [...new Set(strengthsAcknowledged)].slice(0, 5),
    weaknessesAcknowledged: [...new Set(weaknessesAcknowledged)].slice(0, 5),
    blindSpots,
    feedback,
  };
}

// =============================================================================
// SUB-CRITERION 2.4: NON-OBVIOUS CONNECTIONS (0-5)
// =============================================================================

interface InsightConnection {
  elementA: string;
  elementB: string;
  insightLevel: 'surface' | 'moderate' | 'deep';
}

async function scoreNonObviousConnections(
  essayText: string,
  intake: StudentIntake
): Promise<InsightScore['nonObviousConnections']> {
  const connections: InsightConnection[] = [];

  // Connection phrases
  const connectionPatterns = [
    { pattern: /this (?:reminded|taught|showed) me (?:that|how|why)/i, level: 'moderate' as const },
    { pattern: /I (?:realized|discovered|understood) (?:that|the connection|how)/i, level: 'moderate' as const },
    { pattern: /(?:just like|similar to|much like|in the same way)/i, level: 'moderate' as const },
    { pattern: /the (?:irony|paradox|contradiction|tension) (?:was|is|being)/i, level: 'deep' as const },
    { pattern: /what (?:seemed|appeared) (?:to be|like).+(?:was actually|turned out)/i, level: 'deep' as const },
    { pattern: /I (?:never|hadn't) (?:expected|thought|considered).+(?:but|until|however)/i, level: 'deep' as const },
    { pattern: /(?:on the surface|at first glance).+(?:but|however|beneath|deeper)/i, level: 'deep' as const },
  ];

  for (const { pattern, level } of connectionPatterns) {
    const matches = essayText.match(new RegExp(pattern, 'gi'));
    if (matches) {
      for (const match of matches) {
        connections.push({
          elementA: match.substring(0, 50),
          elementB: '(context)',
          insightLevel: level,
        });
      }
    }
  }

  // Check for unexpected connections (A + B = surprising insight)
  const unexpectedPatterns = [
    /\b(\w+ing)\b.+\b(taught|showed|helped)\b.+\b(\w+)\b/i,
  ];

  for (const pattern of unexpectedPatterns) {
    const matches = essayText.match(new RegExp(pattern, 'gi'));
    if (matches) {
      for (const match of matches) {
        connections.push({
          elementA: match.substring(0, 30),
          elementB: match.substring(30, 60),
          insightLevel: 'moderate',
        });
      }
    }
  }

  // Calculate score based on quantity and depth
  let score = 2;

  const deepCount = connections.filter(c => c.insightLevel === 'deep').length;
  const moderateCount = connections.filter(c => c.insightLevel === 'moderate').length;

  score += deepCount * 1;
  score += moderateCount * 0.5;

  let feedback = 'Some connections made between ideas.';

  if (score >= 4.5) {
    feedback = 'Excellent! You make non-obvious connections that reveal deeper meaning.';
  } else if (score >= 3.5) {
    feedback = 'Good connections. Try to find even more unexpected links between ideas.';
  } else if (score < 2.5) {
    feedback = 'Look for surprising connections between different parts of your experience.';
  }

  return {
    score: Math.max(0, Math.min(5, Math.round(score * 10) / 10)),
    connections: connections.slice(0, 5),
    feedback,
  };
}

// =============================================================================
// SUB-CRITERION 2.5: "SO WHAT" FACTOR (0-5)
// =============================================================================

async function scoreSoWhatFactor(
  essayText: string
): Promise<InsightScore['soWhatFactor']> {
  const parsed = parseText(essayText);

  // What does the reader learn about the applicant?
  const revelationPatterns = [
    /I (?:am|value|believe|care about|prioritize)/i,
    /what (?:matters|is important) to me/i,
    /this (?:defines|shapes|influences) (?:who I am|how I|my)/i,
    /I (?:want to|hope to|plan to|will)/i,
  ];

  // Check last paragraph for meaningful conclusion
  const lastParagraph = parsed.paragraphs[parsed.paragraphs.length - 1] || '';

  let hasRevelation = revelationPatterns.some(p => p.test(lastParagraph));
  let hasForwardLooking = /(?:future|going forward|from now on|will continue)/i.test(lastParagraph);

  // Check for memorable/distinctive elements
  const memorablePatterns = [
    /"[^"]+"/,  // Direct quotes
    /\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\b/,  // Proper nouns
    /\b\d+\b/,  // Specific numbers
  ];

  const memorableElements = memorablePatterns.filter(p => p.test(essayText)).length;

  // Calculate memorability
  const memorability = Math.min(1, memorableElements * 0.2 + (hasRevelation ? 0.3 : 0) + (hasForwardLooking ? 0.2 : 0));

  // Determine reader takeaway
  let readerTakeaway = 'Unclear what makes this applicant unique.';

  if (hasRevelation && hasForwardLooking) {
    readerTakeaway = 'Essay reveals clear values and future direction.';
  } else if (hasRevelation) {
    readerTakeaway = 'Essay reveals personal values but could be more forward-looking.';
  } else if (hasForwardLooking) {
    readerTakeaway = 'Essay shows future goals but needs more personal revelation.';
  }

  // Calculate score
  let score = 2;

  if (hasRevelation) score += 1.5;
  if (hasForwardLooking) score += 1;
  score += memorability;

  let feedback = 'Reader learns something about you, but it could be clearer.';

  if (score >= 4.5) {
    feedback = 'Strong "so what" - reader clearly understands who you are and why it matters.';
  } else if (score >= 3.5) {
    feedback = 'Good revelation. Make the "so what" even more explicit in your conclusion.';
  } else if (score < 2.5) {
    feedback = 'Ask yourself: "So what?" Why should the reader care? What do they learn about you?';
  }

  return {
    score: Math.max(0, Math.min(5, Math.round(score * 10) / 10)),
    readerTakeaway,
    memorability: Math.round(memorability * 100) / 100,
    feedback,
  };
}
