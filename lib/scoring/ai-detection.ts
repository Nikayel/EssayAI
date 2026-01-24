/**
 * AI Writing Detection Module
 * Detects patterns that indicate AI-generated or AI-assisted writing
 *
 * Design Philosophy:
 * - Be blunt and honest - no sugar coating
 * - Regex-first for speed, semantic for edge cases
 * - Flag patterns that admissions officers recognize
 * - Focus on what ChatGPT specifically does
 */

import { config } from '@/lib/config';

// =============================================================================
// TYPES
// =============================================================================

export interface AIDetectionResult {
  /** Overall AI likelihood score (0-100) */
  aiScore: number;
  /** Human-readable likelihood */
  aiLikelihood: 'low' | 'medium' | 'high';
  /** Detected issues with details */
  issues: AIDetectionIssue[];
  /** Blunt, honest verdict */
  bluntVerdict: string;
  /** Detailed breakdown by category */
  breakdown: AIDetectionBreakdown;
}

export interface AIDetectionIssue {
  type: string;
  category: AIPatternCategory;
  count: number;
  severity: 'info' | 'warning' | 'critical';
  message: string;
  examples: string[];
  /** Line numbers where found (if available) */
  locations?: number[];
}

export interface AIDetectionBreakdown {
  emDashes: { count: number; flagged: boolean };
  aiTransitions: { count: number; flagged: boolean; found: string[] };
  aiVocabulary: { count: number; flagged: boolean; found: string[] };
  structuralPatterns: { count: number; flagged: boolean; patterns: string[] };
  sentencePatterns: { count: number; flagged: boolean; patterns: string[] };
}

export type AIPatternCategory =
  | 'punctuation'
  | 'vocabulary'
  | 'structure'
  | 'transition'
  | 'sentence_pattern'
  | 'formatting';

// =============================================================================
// AI WRITING PATTERNS
// =============================================================================

/**
 * Em-dash overuse detection
 * ChatGPT loves em-dashes (—) excessively
 */
const EM_DASH_PATTERN = /—/g;

/**
 * "It's not just X, it's Y" pattern
 * Extremely common in ChatGPT output
 */
const NOT_JUST_PATTERN =
  /(?:it'?s|this is|that'?s|they'?re|we'?re) not (?:just|only|merely|simply) .{3,60}[,;] (?:it'?s|this is|that'?s|they'?re|we'?re|but(?: also)?)/gi;

/**
 * AI-favorite transitional phrases
 * Teenagers rarely use these in natural writing
 */
const AI_TRANSITIONS = [
  /\bmoreover\b/gi,
  /\bfurthermore\b/gi,
  /\bnevertheless\b/gi,
  /\bnonetheless\b/gi,
  /\bconsequently\b/gi,
  /\bsubsequently\b/gi,
  /\bin essence\b/gi,
  /\bundoubtedly\b/gi,
  /\bthus\b/gi,
  /\bhence\b/gi,
  /\bthereby\b/gi,
  /\bwherein\b/gi,
  /\binsofar as\b/gi,
  /\binasmuch as\b/gi,
  /\bnotwithstanding\b/gi,
  /\bhitherto\b/gi,
  /\bheretofore\b/gi,
];

/**
 * ChatGPT's favorite vocabulary
 * Words that appear disproportionately in AI text
 */
const AI_VOCABULARY = [
  /\btapestry\b/gi,           // "tapestry of experiences"
  /\btestament to\b/gi,       // "a testament to"
  /\bjourney of (?:self-)?discovery\b/gi,
  /\bprofound(?:ly)?\b/gi,    // Overused intensifier
  /\bpivotal\b/gi,            // "pivotal moment"
  /\bparadigm\b/gi,           // "paradigm shift"
  /\bholistic\b/gi,           // "holistic approach"
  /\bmultifaceted\b/gi,       // "multifaceted problem"
  /\bdelve(?:d|s|ing)?\b/gi,  // "delve into" - ChatGPT signature
  /\bnavigate(?:d|s|ing)? (?:the )?(?:complex|intricate|nuanced)/gi,
  /\bintricacies\b/gi,        // "intricacies of"
  /\brealm of\b/gi,           // "realm of possibilities"
  /\blandscape of\b/gi,       // "landscape of opportunities"
  /\bmyriad\b/gi,             // "myriad of"
  /\bplethora\b/gi,           // "plethora of"
  /\binnate\b/gi,             // "innate ability"
  /\bintrinsic\b/gi,          // "intrinsic motivation"
  /\bseamless(?:ly)?\b/gi,    // "seamlessly integrated"
  /\bunwavering\b/gi,         // "unwavering commitment"
  /\bresonate(?:d|s)?\b/gi,   // "resonated with me"
  /\bcatalyst\b/gi,           // "catalyst for change"
  /\bfostered?\b/gi,          // "fostered growth"
  /\bcultivate(?:d|s|ing)?\b/gi, // "cultivate skills"
  /\bignite(?:d|s|ing)?\b/gi, // "ignited my passion"
  /\bspearhead(?:ed|ing|s)?\b/gi, // "spearheaded the initiative"
];

/**
 * Overly balanced sentence structures
 * ChatGPT loves perfectly balanced clauses
 */
const BALANCED_CLAUSE_PATTERNS = [
  /(?:while .{10,80}, .{10,80}\.)/gi,
  /(?:although .{10,80}, .{10,80}\.)/gi,
  /(?:not only .{10,80}, but also .{10,80})/gi,
  /(?:on (?:the )?one hand .{10,80}, on the other (?:hand )?.{10,80})/gi,
  /(?:rather than .{10,60}, .{10,60})/gi,
];

/**
 * Perfect 5-paragraph structure check
 */
function hasPerfectFiveParagraphStructure(text: string): boolean {
  const paragraphs = text.split(/\n\s*\n/).filter(p => p.trim().length > 0);

  if (paragraphs.length !== 5) return false;

  // Check for suspiciously even paragraph lengths
  const lengths = paragraphs.map(p => p.length);
  const avgLength = lengths.reduce((a, b) => a + b, 0) / lengths.length;

  // Body paragraphs (2, 3, 4) should be roughly similar
  const bodyLengths = lengths.slice(1, 4);
  const bodyVariance = bodyLengths.reduce(
    (sum, len) => sum + Math.abs(len - avgLength),
    0
  ) / bodyLengths.length;

  // If variance is very low (paragraphs are suspiciously similar), flag it
  return bodyVariance < avgLength * 0.2;
}

/**
 * Colon-list pattern (ChatGPT loves these)
 */
const COLON_LIST_PATTERN = /:\s*(?:\d\)|[a-z]\)|•|–|—|-)\s/gi;

/**
 * "As a [identity], I..." opening
 */
const AS_A_OPENING = /^As a (?:first-generation|low-income|student|young|passionate|dedicated|driven|aspiring|[A-Za-z-]+) (?:student|person|individual|learner)/i;

/**
 * Overly smooth paragraph transitions
 */
const SMOOTH_TRANSITIONS = [
  /^This experience (?:taught|showed|demonstrated)/im,
  /^This moment (?:marked|represented|signified)/im,
  /^Looking back,? (?:I|it)/im,
  /^In retrospect,/im,
  /^Moving forward,/im,
  /^Building (?:on|upon) this,/im,
  /^Taking this (?:lesson|experience|insight)/im,
  /^Armed with this (?:knowledge|understanding)/im,
  /^With this (?:newfound|new|deeper)/im,
];

/**
 * ChatGPT's sentence starters
 */
const AI_SENTENCE_STARTERS = [
  /^(?:It is (?:important|worth|essential|crucial) to note)/im,
  /^(?:One (?:could|might|may) argue)/im,
  /^(?:It (?:goes|is) without saying)/im,
  /^(?:Needless to say,)/im,
  /^(?:It should be noted)/im,
  /^(?:What's more,)/im,
  /^(?:More importantly,)/im,
  /^(?:Equally important(?:ly)?,)/im,
  /^(?:At the end of the day,)/im,
  /^(?:When all is said and done,)/im,
  /^(?:In today's (?:world|society|day and age))/im,
  /^(?:In the grand scheme of things)/im,
];

// =============================================================================
// DETECTION FUNCTIONS
// =============================================================================

/**
 * Main AI detection function
 * Runs all pattern checks and aggregates results
 */
export function detectAIWriting(text: string): AIDetectionResult {
  const issues: AIDetectionIssue[] = [];
  let aiScore = 0;

  const thresholds = config.aiDetection;

  // Initialize breakdown
  const breakdown: AIDetectionBreakdown = {
    emDashes: { count: 0, flagged: false },
    aiTransitions: { count: 0, flagged: false, found: [] },
    aiVocabulary: { count: 0, flagged: false, found: [] },
    structuralPatterns: { count: 0, flagged: false, patterns: [] },
    sentencePatterns: { count: 0, flagged: false, patterns: [] },
  };

  // 1. Em-dash detection
  const emDashMatches = text.match(EM_DASH_PATTERN);
  const emDashCount = emDashMatches?.length || 0;
  breakdown.emDashes.count = emDashCount;

  if (emDashCount > thresholds.emDashThreshold) {
    breakdown.emDashes.flagged = true;
    issues.push({
      type: 'em_dash_overuse',
      category: 'punctuation',
      count: emDashCount,
      severity: emDashCount > 6 ? 'critical' : 'warning',
      message: `Excessive em-dashes (${emDashCount} found). ChatGPT overuses em-dashes — like this — in ways teenagers rarely do.`,
      examples: ['Look for: text — more text — even more'],
    });
    aiScore += emDashCount > 6 ? 20 : 12;
  }

  // 2. "It's not just X, it's Y" pattern
  const notJustMatches = text.match(NOT_JUST_PATTERN);
  if (notJustMatches && notJustMatches.length > 0) {
    issues.push({
      type: 'not_just_pattern',
      category: 'sentence_pattern',
      count: notJustMatches.length,
      severity: 'warning',
      message: `The "it's not just X, it's Y" construction is a ChatGPT signature. Found ${notJustMatches.length} instance(s).`,
      examples: notJustMatches.slice(0, 2),
    });
    aiScore += 15 * notJustMatches.length;
    breakdown.sentencePatterns.count += notJustMatches.length;
    breakdown.sentencePatterns.patterns.push(...notJustMatches.slice(0, 2));
  }

  // 3. AI transitions
  const foundTransitions: string[] = [];
  for (const pattern of AI_TRANSITIONS) {
    const matches = text.match(pattern);
    if (matches) {
      foundTransitions.push(...matches);
    }
  }

  breakdown.aiTransitions.count = foundTransitions.length;
  breakdown.aiTransitions.found = [...new Set(foundTransitions)].slice(0, 5);

  if (foundTransitions.length >= thresholds.aiTransitionThreshold) {
    breakdown.aiTransitions.flagged = true;
    const uniqueTransitions = [...new Set(foundTransitions.map(t => t.toLowerCase()))];
    issues.push({
      type: 'ai_transitions',
      category: 'transition',
      count: foundTransitions.length,
      severity: foundTransitions.length > 4 ? 'critical' : 'warning',
      message: `Formal academic transitions that teenagers rarely use naturally: "${uniqueTransitions.slice(0, 3).join('", "')}"`,
      examples: uniqueTransitions.slice(0, 3),
    });
    aiScore += 8 * Math.min(foundTransitions.length, 5);
  }

  // 4. AI vocabulary
  const foundVocab: string[] = [];
  for (const pattern of AI_VOCABULARY) {
    const matches = text.match(pattern);
    if (matches) {
      foundVocab.push(...matches);
    }
  }

  breakdown.aiVocabulary.count = foundVocab.length;
  breakdown.aiVocabulary.found = [...new Set(foundVocab)].slice(0, 5);

  if (foundVocab.length >= thresholds.aiVocabularyThreshold) {
    breakdown.aiVocabulary.flagged = true;
    const uniqueVocab = [...new Set(foundVocab.map(v => v.toLowerCase()))];
    issues.push({
      type: 'ai_vocabulary',
      category: 'vocabulary',
      count: foundVocab.length,
      severity: foundVocab.length > 5 ? 'critical' : 'warning',
      message: `AI-favorite words that real teenagers rarely use: "${uniqueVocab.slice(0, 4).join('", "')}"`,
      examples: uniqueVocab.slice(0, 4),
    });
    aiScore += 6 * Math.min(foundVocab.length, 6);
  }

  // 5. Balanced clause patterns
  let balancedCount = 0;
  for (const pattern of BALANCED_CLAUSE_PATTERNS) {
    const matches = text.match(pattern);
    if (matches) {
      balancedCount += matches.length;
      breakdown.structuralPatterns.patterns.push(...matches.slice(0, 1));
    }
  }

  if (balancedCount >= thresholds.balancedClauseThreshold) {
    breakdown.structuralPatterns.flagged = true;
    issues.push({
      type: 'balanced_clauses',
      category: 'structure',
      count: balancedCount,
      severity: 'info',
      message: 'Multiple perfectly balanced clause structures suggest AI generation.',
      examples: breakdown.structuralPatterns.patterns.slice(0, 2),
    });
    aiScore += 10;
  }

  // 6. Perfect 5-paragraph structure
  if (hasPerfectFiveParagraphStructure(text)) {
    breakdown.structuralPatterns.count++;
    breakdown.structuralPatterns.patterns.push('5-paragraph structure');
    issues.push({
      type: 'perfect_structure',
      category: 'structure',
      count: 1,
      severity: 'info',
      message: 'Suspiciously perfect 5-paragraph structure with evenly sized body paragraphs.',
      examples: [],
    });
    aiScore += 12;
  }

  // 7. Colon-list pattern
  const colonListMatches = text.match(COLON_LIST_PATTERN);
  if (colonListMatches && colonListMatches.length > 0) {
    issues.push({
      type: 'colon_list',
      category: 'formatting',
      count: colonListMatches.length,
      severity: 'warning',
      message: 'Colon followed by formatted list is a strong AI indicator.',
      examples: colonListMatches.slice(0, 2),
    });
    aiScore += 15;
  }

  // 8. "As a [identity]" opening
  if (AS_A_OPENING.test(text)) {
    issues.push({
      type: 'as_a_opening',
      category: 'sentence_pattern',
      count: 1,
      severity: 'warning',
      message: 'Starting with "As a [identity], I..." is generic and often AI-influenced.',
      examples: [text.split('.')[0]],
    });
    aiScore += 10;
  }

  // 9. Smooth paragraph transitions
  let smoothTransitionCount = 0;
  const foundSmooth: string[] = [];
  for (const pattern of SMOOTH_TRANSITIONS) {
    const matches = text.match(pattern);
    if (matches) {
      smoothTransitionCount += matches.length;
      foundSmooth.push(...matches);
    }
  }

  if (smoothTransitionCount >= 2) {
    breakdown.sentencePatterns.count += smoothTransitionCount;
    breakdown.sentencePatterns.flagged = true;
    issues.push({
      type: 'smooth_transitions',
      category: 'transition',
      count: smoothTransitionCount,
      severity: 'info',
      message: 'Overly smooth paragraph transitions feel manufactured.',
      examples: foundSmooth.slice(0, 2),
    });
    aiScore += 8;
  }

  // 10. AI sentence starters
  let aiStarterCount = 0;
  const foundStarters: string[] = [];
  for (const pattern of AI_SENTENCE_STARTERS) {
    const matches = text.match(pattern);
    if (matches) {
      aiStarterCount += matches.length;
      foundStarters.push(...matches);
    }
  }

  if (aiStarterCount > 0) {
    breakdown.sentencePatterns.count += aiStarterCount;
    issues.push({
      type: 'ai_sentence_starters',
      category: 'sentence_pattern',
      count: aiStarterCount,
      severity: aiStarterCount > 2 ? 'warning' : 'info',
      message: `Formulaic sentence starters typical of AI: "${foundStarters.slice(0, 2).join('", "')}"`,
      examples: foundStarters.slice(0, 3),
    });
    aiScore += 8 * Math.min(aiStarterCount, 3);
  }

  // Cap score at 100
  aiScore = Math.min(100, aiScore);

  // Determine likelihood
  const aiLikelihood: 'low' | 'medium' | 'high' =
    aiScore >= thresholds.highConfidenceThreshold
      ? 'high'
      : aiScore >= thresholds.mediumConfidenceThreshold
        ? 'medium'
        : 'low';

  return {
    aiScore,
    aiLikelihood,
    issues,
    bluntVerdict: generateBluntVerdict(aiScore, issues),
    breakdown,
  };
}

/**
 * Generate a blunt, honest verdict about AI detection
 * No sugar coating - tell them straight
 */
function generateBluntVerdict(score: number, issues: AIDetectionIssue[]): string {
  if (score >= 70) {
    const topIssues = issues
      .filter(i => i.severity === 'critical' || i.severity === 'warning')
      .slice(0, 2)
      .map(i => i.type.replace(/_/g, ' '));

    return `This essay has strong indicators of AI-generated content (${topIssues.join(', ')}). ` +
      `Admissions officers read thousands of essays and will recognize these patterns. ` +
      `If you used ChatGPT to help write this, it shows. Rewrite it in your own voice.`;
  }

  if (score >= 50) {
    return `Parts of this essay read like ChatGPT output. ` +
      `Even if you wrote it yourself, these patterns (${issues.length} detected) will raise red flags. ` +
      `An AO who sees "moreover" and "tapestry of experiences" will suspect AI. Revise the flagged sections.`;
  }

  if (score >= 30) {
    return `Some AI-like patterns detected (${issues.length} minor issues). ` +
      `These might be coincidental, but consider revising for a more natural, teenage voice. ` +
      `Admissions officers are increasingly trained to spot AI writing.`;
  }

  if (issues.length > 0) {
    return `Minor AI patterns detected, but nothing alarming. ` +
      `Your writing generally sounds authentic. Review the ${issues.length} flagged item(s) if you want to be safe.`;
  }

  return `No significant AI writing patterns detected. Your essay sounds authentically human.`;
}

// AIPatternCategory is already exported at definition
