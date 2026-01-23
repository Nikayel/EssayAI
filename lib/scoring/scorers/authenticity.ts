/**
 * Authenticity & Voice Scorer (Dimension 1)
 * 25 points total - Does this sound like a real 17-year-old?
 */

import type { AuthenticityScore, FlaggedPhrase, TextSpan, StudentIntake } from '../types';
import {
  parseText,
  calculateFleschKincaid,
  findPatternSpans,
  normalizeToScore,
  combineScores,
} from '../text-utils';
import {
  detectGenericPhrases,
  calculateClicheScore,
  THESAURUS_ABUSE_PATTERNS,
} from '../generic-phrases';

// =============================================================================
// MAIN SCORER
// =============================================================================

export async function scoreAuthenticity(
  essayText: string,
  intake: StudentIntake,
  toneEmbedding?: number[]
): Promise<AuthenticityScore> {
  const [
    toneConsistency,
    ageAppropriateness,
    uniquePerspective,
    personalIdioms,
    clicheDensity,
  ] = await Promise.all([
    scoreToneConsistency(essayText, intake, toneEmbedding),
    scoreAgeAppropriateness(essayText),
    scoreUniquePerspective(essayText, intake),
    scorePersonalIdioms(essayText),
    scoreClicheDensity(essayText),
  ]);

  const totalScore =
    toneConsistency.score +
    ageAppropriateness.score +
    uniquePerspective.score +
    personalIdioms.score +
    clicheDensity.score;

  return {
    totalScore: Math.round(totalScore * 10) / 10,
    toneConsistency,
    ageAppropriateness,
    uniquePerspective,
    personalIdioms,
    clicheDensity,
  };
}

// =============================================================================
// SUB-CRITERION 1.1: TONE CONSISTENCY (0-5)
// =============================================================================

async function scoreToneConsistency(
  essayText: string,
  intake: StudentIntake,
  toneEmbedding?: number[]
): Promise<AuthenticityScore['toneConsistency']> {
  // If no tone sample provided, give benefit of doubt
  if (!intake.voice?.toneSample || !toneEmbedding) {
    return {
      score: 3,
      cosineSimilarity: 0,
      driftLocations: [],
      feedback: 'No tone sample provided for comparison. Consider adding a voice sample for better analysis.',
    };
  }

  // For now, we'll do basic lexical comparison
  // In production, this would use embeddings
  const toneSample = intake.voice.toneSample.toLowerCase();
  const essay = essayText.toLowerCase();

  // Extract characteristic patterns from tone sample
  const samplePatterns = extractVoicePatterns(toneSample);
  const essayPatterns = extractVoicePatterns(essay);

  // Calculate overlap
  const overlap = calculatePatternOverlap(samplePatterns, essayPatterns);

  // Find drift locations (where voice changes)
  const driftLocations = findToneDriftLocations(essayText, samplePatterns);

  let score = 5;
  let feedback = 'Voice is consistent throughout.';

  if (overlap < 0.3) {
    score = 2;
    feedback = 'Essay voice differs significantly from your natural writing style. It may sound coached.';
  } else if (overlap < 0.5) {
    score = 3;
    feedback = 'Some inconsistency between your natural voice and this essay. Review flagged sections.';
  } else if (overlap < 0.7) {
    score = 4;
    feedback = 'Voice is mostly consistent with minor variations.';
  }

  if (driftLocations.length > 3) {
    score = Math.max(1, score - 1);
    feedback += ' Multiple sections show voice drift.';
  }

  return {
    score,
    cosineSimilarity: overlap,
    driftLocations,
    feedback,
  };
}

function extractVoicePatterns(text: string): Set<string> {
  const patterns = new Set<string>();

  // Sentence starters
  const sentences = text.split(/[.!?]+/);
  for (const s of sentences) {
    const words = s.trim().split(/\s+/).slice(0, 3);
    if (words.length >= 2) {
      patterns.add(words.slice(0, 2).join(' ').toLowerCase());
    }
  }

  // Common phrase patterns
  const phrases = text.match(/\b\w+\s+\w+\s+\w+\b/g) || [];
  for (const p of phrases.slice(0, 50)) {
    patterns.add(p.toLowerCase());
  }

  return patterns;
}

function calculatePatternOverlap(set1: Set<string>, set2: Set<string>): number {
  if (set1.size === 0 || set2.size === 0) return 0;

  let overlap = 0;
  for (const p of set1) {
    if (set2.has(p)) overlap++;
  }

  return overlap / Math.min(set1.size, set2.size);
}

function findToneDriftLocations(text: string, basePatterns: Set<string>): TextSpan[] {
  const driftLocations: TextSpan[] = [];
  const paragraphs = text.split(/\n\s*\n/);

  let lineNum = 1;
  for (const para of paragraphs) {
    const paraPatterns = extractVoicePatterns(para);
    const overlap = calculatePatternOverlap(basePatterns, paraPatterns);

    if (overlap < 0.2 && para.length > 100) {
      driftLocations.push({
        text: para.substring(0, 100) + '...',
        startLine: lineNum,
        endLine: lineNum + para.split('\n').length - 1,
        startChar: 0,
        endChar: para.length,
      });
    }

    lineNum += para.split('\n').length + 1;
  }

  return driftLocations;
}

// =============================================================================
// SUB-CRITERION 1.2: AGE-APPROPRIATE LANGUAGE (0-5)
// =============================================================================

async function scoreAgeAppropriateness(
  essayText: string
): Promise<AuthenticityScore['ageAppropriateness']> {
  const gradeLevel = calculateFleschKincaid(essayText);
  const thesaurusFlags = detectThesaurusAbuse(essayText);

  let score = 5;
  let feedback = 'Language is appropriate for a high school student.';

  // Penalize if reading level is too high (sounds like an adult wrote it)
  if (gradeLevel > 14) {
    score -= 2;
    feedback = 'Language is overly complex. Simplify for authenticity.';
  } else if (gradeLevel > 12) {
    score -= 1;
    feedback = 'Some language may seem too sophisticated. Check flagged words.';
  }

  // Penalize if reading level is too low
  if (gradeLevel < 8) {
    score -= 1;
    feedback = 'Language could be more sophisticated. Show your intellectual depth.';
  }

  // Penalize thesaurus abuse
  const thesaurusPenalty = Math.min(2, thesaurusFlags.length * 0.5);
  score -= thesaurusPenalty;

  if (thesaurusFlags.length > 0) {
    feedback += ` Found ${thesaurusFlags.length} potentially forced vocabulary word(s).`;
  }

  return {
    score: Math.max(0, Math.round(score * 10) / 10),
    fleschKincaidGrade: Math.round(gradeLevel * 10) / 10,
    thesaurusFlags,
    feedback,
  };
}

function detectThesaurusAbuse(text: string): FlaggedPhrase[] {
  const flagged: FlaggedPhrase[] = [];

  for (const pattern of THESAURUS_ABUSE_PATTERNS) {
    const spans = findPatternSpans(text, pattern.pattern);
    for (const span of spans) {
      flagged.push({
        phrase: span.text,
        location: span,
        severity: pattern.severity,
        category: 'thesaurus_abuse',
        suggestion: pattern.suggestion,
      });
    }
  }

  return flagged;
}

// =============================================================================
// SUB-CRITERION 1.3: UNIQUE PERSPECTIVE (0-5)
// =============================================================================

async function scoreUniquePerspective(
  essayText: string,
  intake: StudentIntake
): Promise<AuthenticityScore['uniquePerspective']> {
  const uniqueElements: string[] = [];
  const genericElements: string[] = [];

  // Check for specific details that show unique perspective
  const specificPatterns = [
    // Named people/places
    /\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\b/g,
    // Specific numbers
    /\b\d+(?::\d+)?\s*(?:am|pm|years?|months?|days?|hours?|minutes?)?\b/gi,
    // Cultural/family specifics
    /\b(?:grandmother|grandfather|abuela|nonna|baba|haraboji|nainai|dadi)\b/gi,
  ];

  for (const pattern of specificPatterns) {
    const matches = essayText.match(pattern) || [];
    uniqueElements.push(...matches.slice(0, 5));
  }

  // Check for generic elements
  const genericPatterns = [
    /\b(?:someone|somewhere|something|somehow)\b/gi,
    /\b(?:many people|most students|everyone knows)\b/gi,
    /\b(?:in today's (?:world|society)|in the modern world)\b/gi,
  ];

  for (const pattern of genericPatterns) {
    const matches = essayText.match(pattern) || [];
    genericElements.push(...matches);
  }

  // Check if essay connects to stated spike/activities
  let spikeConnection = false;
  if (intake.activities?.spike) {
    const spikeWords = intake.activities.spike.toLowerCase().split(/\s+/);
    const essayLower = essayText.toLowerCase();
    spikeConnection = spikeWords.some(w => w.length > 4 && essayLower.includes(w));
  }

  // Calculate score
  let score = 3; // Start neutral

  // Reward unique elements
  score += Math.min(1.5, uniqueElements.length * 0.15);

  // Penalize generic elements
  score -= Math.min(1.5, genericElements.length * 0.3);

  // Bonus for spike connection
  if (spikeConnection) score += 0.5;

  let feedback = 'Essay shows some unique perspective.';

  if (score >= 4.5) {
    feedback = 'Strong unique voice and perspective. This essay could only be written by you.';
  } else if (score >= 3.5) {
    feedback = 'Good personal details. Consider adding more specific moments only you experienced.';
  } else if (score < 2.5) {
    feedback = 'Essay feels generic. Add specific details, names, and moments unique to your life.';
  }

  return {
    score: Math.max(0, Math.min(5, Math.round(score * 10) / 10)),
    uniqueElements: [...new Set(uniqueElements)].slice(0, 10),
    genericElements: [...new Set(genericElements)],
    feedback,
  };
}

// =============================================================================
// SUB-CRITERION 1.4: PERSONAL IDIOMS (0-5)
// =============================================================================

async function scorePersonalIdioms(
  essayText: string
): Promise<AuthenticityScore['personalIdioms']> {
  const naturalPhrases: string[] = [];
  const corporateSpeak: FlaggedPhrase[] = [];

  // Corporate/consultant speak patterns
  const corporatePatterns = [
    { pattern: /\bsynergiz(?:e|ing)\b/gi, suggestion: 'Use natural language' },
    { pattern: /\bleverage(?:d|s|ing)?\b/gi, suggestion: 'Say "use" instead' },
    { pattern: /\bactionable\b/gi, suggestion: 'Too corporate - simplify' },
    { pattern: /\bimpactful\b/gi, suggestion: 'Describe the actual impact instead' },
    { pattern: /\bholistic(?:ally)?\b/gi, suggestion: 'Be specific about what you mean' },
    { pattern: /\bparadigm\b/gi, suggestion: 'Academic jargon - explain directly' },
    { pattern: /\bfacilitate(?:d|s|ing)?\b/gi, suggestion: 'Say "help" or "enable"' },
    { pattern: /\bbest practices?\b/gi, suggestion: 'Too corporate' },
    { pattern: /\bthought leader(?:ship)?\b/gi, suggestion: 'Corporate buzzword' },
    { pattern: /\bvalue[- ]add(?:ed)?\b/gi, suggestion: 'Business jargon' },
    { pattern: /\bmoving forward\b/gi, suggestion: 'Corporate filler' },
    { pattern: /\bat the end of the day\b/gi, suggestion: 'Cliche - be specific' },
  ];

  for (const { pattern, suggestion } of corporatePatterns) {
    const spans = findPatternSpans(essayText, pattern);
    for (const span of spans) {
      corporateSpeak.push({
        phrase: span.text,
        location: span,
        severity: 'hard',
        category: 'corporate_speak',
        suggestion,
      });
    }
  }

  // Natural phrases (contractions, casual language)
  const naturalPatterns = [
    /\b(?:I'm|I've|I'd|I'll|can't|won't|don't|didn't|wasn't|couldn't)\b/g,
    /\b(?:kinda|gonna|wanna|gotta|y'all|yeah|okay|ok)\b/gi,
  ];

  for (const pattern of naturalPatterns) {
    const matches = essayText.match(pattern) || [];
    naturalPhrases.push(...matches);
  }

  // Calculate score
  let score = 5;

  // Heavy penalty for corporate speak
  score -= Math.min(3, corporateSpeak.length * 0.75);

  // Slight bonus for natural language (but not too much - it should still be formal enough)
  const naturalCount = naturalPhrases.length;
  if (naturalCount > 0 && naturalCount < 10) {
    score += 0.5; // Some natural language is good
  } else if (naturalCount > 15) {
    score -= 0.5; // Too casual
  }

  let feedback = 'Language feels natural and personal.';

  if (corporateSpeak.length > 0) {
    feedback = `Found ${corporateSpeak.length} corporate/consultant phrase(s). Replace with natural language.`;
  }

  if (score < 3) {
    feedback = 'Essay sounds like it was written by a consultant or heavily edited by an adult.';
  }

  return {
    score: Math.max(0, Math.round(score * 10) / 10),
    naturalPhrases: [...new Set(naturalPhrases)].slice(0, 10),
    corporateSpeak,
    feedback,
  };
}

// =============================================================================
// SUB-CRITERION 1.5: CLICHE DENSITY (0-5)
// =============================================================================

async function scoreClicheDensity(
  essayText: string
): Promise<AuthenticityScore['clicheDensity']> {
  const detection = detectGenericPhrases(essayText);

  const clichesFound: FlaggedPhrase[] = [
    ...detection.hardFlags.map(f => ({
      phrase: f.match,
      location: {
        text: f.match,
        startLine: 0,
        endLine: 0,
        startChar: f.index,
        endChar: f.index + f.match.length,
      },
      severity: f.phrase.severity,
      category: f.phrase.category,
      suggestion: f.phrase.suggestion,
    })),
    ...detection.softFlags.map(f => ({
      phrase: f.match,
      location: {
        text: f.match,
        startLine: 0,
        endLine: 0,
        startChar: f.index,
        endChar: f.index + f.match.length,
      },
      severity: f.phrase.severity,
      category: f.phrase.category,
      suggestion: f.phrase.suggestion,
    })),
  ];

  const score = calculateClicheScore(detection.clicheDensity, detection.hardFlags.length);

  let feedback = 'Language is fresh and original.';

  if (detection.hardFlags.length > 0) {
    feedback = `Found ${detection.hardFlags.length} common cliche(s) that should be replaced.`;
  } else if (detection.softFlags.length > 3) {
    feedback = 'Several potentially generic phrases detected. Consider revising for originality.';
  }

  if (detection.clicheDensity > 0.2) {
    feedback = 'High cliche density. Over 20% of sentences contain generic phrases.';
  }

  return {
    score,
    clichesFound,
    clichePercentage: Math.round(detection.clicheDensity * 100),
    feedback,
  };
}
