/**
 * Text Analysis Utilities
 * Shared utilities for analyzing essay text - DRY principle
 */

// =============================================================================
// TEXT PARSING
// =============================================================================

export interface ParsedText {
  raw: string;
  sentences: string[];
  paragraphs: string[];
  words: string[];
  lines: string[];
  wordCount: number;
  sentenceCount: number;
  paragraphCount: number;
  avgWordsPerSentence: number;
  avgSentencesPerParagraph: number;
}

/**
 * Parse text into analyzable components
 */
export function parseText(text: string): ParsedText {
  const raw = text.trim();
  const paragraphs = raw.split(/\n\s*\n/).filter(p => p.trim().length > 0);
  const sentences = raw.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const words = raw.split(/\s+/).filter(w => w.length > 0);
  const lines = raw.split('\n').filter(l => l.trim().length > 0);

  return {
    raw,
    sentences,
    paragraphs,
    words,
    lines,
    wordCount: words.length,
    sentenceCount: sentences.length,
    paragraphCount: paragraphs.length,
    avgWordsPerSentence: sentences.length > 0 ? words.length / sentences.length : 0,
    avgSentencesPerParagraph: paragraphs.length > 0 ? sentences.length / paragraphs.length : 0,
  };
}

// =============================================================================
// READABILITY METRICS
// =============================================================================

/**
 * Calculate Flesch-Kincaid Grade Level
 * Target for college essays: 9-12 grade level
 */
export function calculateFleschKincaid(text: string): number {
  const parsed = parseText(text);
  if (parsed.sentenceCount === 0 || parsed.wordCount === 0) return 0;

  const syllables = countSyllables(text);
  const avgSyllablesPerWord = syllables / parsed.wordCount;
  const avgWordsPerSentence = parsed.wordCount / parsed.sentenceCount;

  // Flesch-Kincaid Grade Level formula
  const grade = 0.39 * avgWordsPerSentence + 11.8 * avgSyllablesPerWord - 15.59;

  return Math.max(0, Math.min(20, grade)); // Cap at reasonable range
}

/**
 * Count syllables in text (approximation)
 */
export function countSyllables(text: string): number {
  const words = text.toLowerCase().split(/\s+/);
  let total = 0;

  for (const word of words) {
    total += countWordSyllables(word);
  }

  return total;
}

function countWordSyllables(word: string): number {
  word = word.toLowerCase().replace(/[^a-z]/g, '');
  if (word.length <= 3) return 1;

  // Count vowel groups
  const vowelGroups = word.match(/[aeiouy]+/g);
  let count = vowelGroups ? vowelGroups.length : 1;

  // Adjust for silent e
  if (word.endsWith('e') && !word.endsWith('le')) count--;

  // Adjust for common suffixes
  if (word.endsWith('ed') && !word.endsWith('ted') && !word.endsWith('ded')) count--;

  return Math.max(1, count);
}

// =============================================================================
// TEXT SPAN UTILITIES
// =============================================================================

export interface TextSpan {
  text: string;
  startLine: number;
  endLine: number;
  startChar: number;
  endChar: number;
  sentenceIndex?: number;
}

/**
 * Find all occurrences of a pattern and return as TextSpans
 */
export function findPatternSpans(text: string, pattern: RegExp): TextSpan[] {
  const spans: TextSpan[] = [];
  const lines = text.split('\n');
  const matches = text.matchAll(new RegExp(pattern, 'gi'));

  for (const match of matches) {
    const startChar = match.index || 0;
    const endChar = startChar + match[0].length;

    // Find line numbers
    let charCount = 0;
    let startLine = 0;
    let endLine = 0;

    for (let i = 0; i < lines.length; i++) {
      const lineEnd = charCount + lines[i].length + 1; // +1 for newline
      if (startChar >= charCount && startChar < lineEnd) startLine = i + 1;
      if (endChar >= charCount && endChar <= lineEnd) endLine = i + 1;
      charCount = lineEnd;
    }

    spans.push({
      text: match[0],
      startLine,
      endLine,
      startChar,
      endChar,
    });
  }

  return spans;
}

/**
 * Get context around a text span (surrounding sentences)
 */
export function getSpanContext(text: string, span: TextSpan, contextSentences: number = 1): string {
  const sentences = text.split(/(?<=[.!?])\s+/);
  let charCount = 0;
  let targetIndex = -1;

  for (let i = 0; i < sentences.length; i++) {
    if (charCount <= span.startChar && charCount + sentences[i].length >= span.startChar) {
      targetIndex = i;
      break;
    }
    charCount += sentences[i].length + 1;
  }

  if (targetIndex === -1) return span.text;

  const start = Math.max(0, targetIndex - contextSentences);
  const end = Math.min(sentences.length, targetIndex + contextSentences + 1);

  return sentences.slice(start, end).join(' ');
}

// =============================================================================
// PATTERN MATCHING UTILITIES
// =============================================================================

export interface PatternMatch {
  pattern: string;
  matches: TextSpan[];
  count: number;
}

/**
 * Match multiple patterns against text
 */
export function matchPatterns(text: string, patterns: Array<{ id: string; pattern: RegExp }>): Map<string, PatternMatch> {
  const results = new Map<string, PatternMatch>();

  for (const { id, pattern } of patterns) {
    const spans = findPatternSpans(text, pattern);
    results.set(id, {
      pattern: pattern.source,
      matches: spans,
      count: spans.length,
    });
  }

  return results;
}

// =============================================================================
// SENTENCE CLASSIFICATION
// =============================================================================

export type SentenceType = 'showing' | 'telling' | 'neutral' | 'dialogue' | 'reflection';

/**
 * Classify a sentence as showing, telling, dialogue, etc.
 */
export function classifySentence(sentence: string): SentenceType {
  const trimmed = sentence.trim();

  // Dialogue detection
  if (/["'"'].+["'"']/.test(trimmed) || /said|asked|replied|whispered|shouted/i.test(trimmed)) {
    return 'dialogue';
  }

  // Telling indicators (abstract statements)
  const tellingPatterns = [
    /^I (?:was|am|felt|feel|learned|realized|discovered|understood|knew|thought|believed)/i,
    /^(?:It|This|That) (?:was|is|made me|taught me)/i,
    /I (?:have|had) always/i,
    /^(?:My|The) (?:\w+ )*(?:experience|journey|moment|time)/i,
  ];

  for (const pattern of tellingPatterns) {
    if (pattern.test(trimmed)) return 'telling';
  }

  // Showing indicators (concrete, sensory, action)
  const showingPatterns = [
    /\b(?:hands|fingers|eyes|voice|breath|heart)\b/i,  // Body parts
    /\b(?:red|blue|green|yellow|dark|bright|cold|warm|loud|quiet)\b/i,  // Sensory
    /\b(?:grabbed|reached|stepped|walked|ran|jumped|pulled|pushed)\b/i,  // Actions
    /\b(?:smelled|tasted|heard|saw|felt|touched)\b/i,  // Senses
  ];

  for (const pattern of showingPatterns) {
    if (pattern.test(trimmed)) return 'showing';
  }

  // Reflection indicators
  const reflectionPatterns = [
    /\b(?:now I|looking back|in retrospect|I've come to|I understand now)\b/i,
    /\b(?:this means|what this|the significance|I realize)\b/i,
  ];

  for (const pattern of reflectionPatterns) {
    if (pattern.test(trimmed)) return 'reflection';
  }

  return 'neutral';
}

/**
 * Calculate show vs tell ratio
 */
export function calculateShowTellRatio(text: string): {
  ratio: number;
  showingCount: number;
  tellingCount: number;
  sentences: Array<{ text: string; type: SentenceType }>;
} {
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 10);
  const classified = sentences.map(s => ({
    text: s.trim(),
    type: classifySentence(s),
  }));

  const showingCount = classified.filter(s => s.type === 'showing' || s.type === 'dialogue').length;
  const tellingCount = classified.filter(s => s.type === 'telling').length;

  const total = showingCount + tellingCount;
  const ratio = total > 0 ? showingCount / total : 0.5;

  return { ratio, showingCount, tellingCount, sentences: classified };
}

// =============================================================================
// SPECIFICITY ANALYSIS
// =============================================================================

const VAGUE_WORDS = new Set([
  'things', 'stuff', 'something', 'somehow', 'somewhere', 'someone',
  'people', 'good', 'bad', 'nice', 'great', 'amazing', 'incredible',
  'interesting', 'important', 'really', 'very', 'a lot', 'many',
]);

const SPECIFIC_INDICATORS = [
  /\b\d+\b/,  // Numbers
  /\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\b/,  // Proper nouns
  /["'"'].+["'"']/,  // Quoted speech
  /\b(?:January|February|March|April|May|June|July|August|September|October|November|December)\b/i,
  /\b(?:Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)\b/i,
];

/**
 * Calculate specificity score for text
 */
export function calculateSpecificity(text: string): {
  score: number;
  vagueWords: string[];
  specificElements: string[];
  density: number;
} {
  const words = text.toLowerCase().split(/\s+/);
  const vagueWords: string[] = [];
  const specificElements: string[] = [];

  // Find vague words
  for (const word of words) {
    const clean = word.replace(/[^a-z]/g, '');
    if (VAGUE_WORDS.has(clean)) {
      vagueWords.push(word);
    }
  }

  // Find specific elements
  for (const pattern of SPECIFIC_INDICATORS) {
    const matches = text.match(new RegExp(pattern, 'g'));
    if (matches) {
      specificElements.push(...matches);
    }
  }

  // Calculate density (specific elements per 100 words)
  const density = words.length > 0 ? (specificElements.length / words.length) * 100 : 0;

  // Score: penalize vague, reward specific
  const vagueRatio = words.length > 0 ? vagueWords.length / words.length : 0;
  const specificRatio = words.length > 0 ? specificElements.length / words.length : 0;

  let score = 4; // Start at 4/5
  score -= vagueRatio * 10; // Penalize vague words
  score += specificRatio * 5; // Reward specific elements
  score = Math.max(0, Math.min(5, score));

  return {
    score: Math.round(score * 10) / 10,
    vagueWords: [...new Set(vagueWords)],
    specificElements: [...new Set(specificElements)].slice(0, 10),
    density,
  };
}

// =============================================================================
// OPENING HOOK ANALYSIS
// =============================================================================

export type HookType = 'in_medias_res' | 'question' | 'statement' | 'scene' | 'dialogue' | 'weak';

/**
 * Analyze the opening hook
 */
export function analyzeOpeningHook(text: string): {
  hookType: HookType;
  grabsAttention: boolean;
  firstSentence: string;
  score: number;
  feedback: string;
} {
  const firstSentence = text.split(/[.!?]/)[0]?.trim() || '';

  // Question hook
  if (firstSentence.endsWith('?') || /^(?:What|Why|How|When|Where|Who|Can|Do|Is|Are|Was|Were)/i.test(firstSentence)) {
    return {
      hookType: 'question',
      grabsAttention: true,
      firstSentence,
      score: 3,
      feedback: 'Question hooks can work, but ensure it\'s not rhetorical or generic.',
    };
  }

  // Dialogue hook
  if (/^["'"']/.test(firstSentence)) {
    return {
      hookType: 'dialogue',
      grabsAttention: true,
      firstSentence,
      score: 4,
      feedback: 'Strong choice! Dialogue immediately creates scene and voice.',
    };
  }

  // In medias res (action/scene)
  if (/^(?:I|My|The)\s+\w+(?:ed|ing)\b/i.test(firstSentence) ||
      /\b(?:grabbed|ran|jumped|fell|crashed|slammed|burst)\b/i.test(firstSentence)) {
    return {
      hookType: 'in_medias_res',
      grabsAttention: true,
      firstSentence,
      score: 5,
      feedback: 'Excellent! Starting in the middle of action immediately engages readers.',
    };
  }

  // Scene setting with specifics
  if (/\b(?:morning|night|afternoon|summer|winter|o'clock|am|pm)\b/i.test(firstSentence) &&
      /\b[A-Z][a-z]+\b/.test(firstSentence)) {
    return {
      hookType: 'scene',
      grabsAttention: true,
      firstSentence,
      score: 4,
      feedback: 'Good scene-setting with specific details.',
    };
  }

  // Weak openings
  const weakPatterns = [
    /^(?:I have always|Ever since|From a young age|Growing up|When I was)/i,
    /^(?:This essay|In this essay|I am going to|I want to tell you)/i,
    /^(?:Webster'?s?|The dictionary|According to)/i,
  ];

  for (const pattern of weakPatterns) {
    if (pattern.test(firstSentence)) {
      return {
        hookType: 'weak',
        grabsAttention: false,
        firstSentence,
        score: 1,
        feedback: 'This opening is a cliche. Start with a specific scene or moment instead.',
      };
    }
  }

  // Generic statement
  return {
    hookType: 'statement',
    grabsAttention: false,
    firstSentence,
    score: 2,
    feedback: 'Consider starting with a more vivid scene or moment to grab attention.',
  };
}

// =============================================================================
// STRUCTURE ANALYSIS
// =============================================================================

/**
 * Analyze essay structure
 */
export function analyzeStructure(text: string): {
  hasHook: boolean;
  hasClearArc: boolean;
  transitionQuality: number;
  pacing: 'rushed' | 'balanced' | 'slow';
  paragraphBalance: number[];
  feedback: string[];
} {
  const parsed = parseText(text);
  const feedback: string[] = [];

  // Check hook
  const hook = analyzeOpeningHook(text);
  const hasHook = hook.grabsAttention;

  // Analyze paragraph lengths
  const paragraphLengths = parsed.paragraphs.map(p => p.split(/\s+/).length);
  const avgParagraphLength = paragraphLengths.reduce((a, b) => a + b, 0) / paragraphLengths.length;

  // Check for arc (beginning, middle, end structure)
  const hasBeginning = paragraphLengths.length >= 1;
  const hasMiddle = paragraphLengths.length >= 2;
  const hasEnd = paragraphLengths.length >= 3;
  const hasClearArc = hasBeginning && hasMiddle && hasEnd;

  // Transition words
  const transitionWords = [
    'however', 'therefore', 'moreover', 'furthermore', 'consequently',
    'meanwhile', 'nevertheless', 'although', 'because', 'since',
    'then', 'next', 'finally', 'first', 'second', 'lastly',
  ];
  const transitionCount = transitionWords.filter(t =>
    text.toLowerCase().includes(t)
  ).length;
  const transitionQuality = Math.min(1, transitionCount / 5);

  // Pacing based on paragraph length variance
  const variance = paragraphLengths.reduce((acc, len) => acc + Math.pow(len - avgParagraphLength, 2), 0) / paragraphLengths.length;
  const pacing: 'rushed' | 'balanced' | 'slow' =
    avgParagraphLength < 50 ? 'rushed' :
    avgParagraphLength > 150 ? 'slow' : 'balanced';

  // Generate feedback
  if (!hasHook) feedback.push('Opening could be stronger - start with action or a scene.');
  if (!hasClearArc) feedback.push('Essay structure is unclear - ensure clear beginning, development, and conclusion.');
  if (transitionQuality < 0.4) feedback.push('Add more transitional phrases to improve flow.');
  if (pacing === 'rushed') feedback.push('Paragraphs are short - consider developing ideas more fully.');
  if (pacing === 'slow') feedback.push('Paragraphs are very long - consider breaking them up for readability.');

  return {
    hasHook,
    hasClearArc,
    transitionQuality,
    pacing,
    paragraphBalance: paragraphLengths,
    feedback,
  };
}

// =============================================================================
// SCORE CALCULATION UTILITIES
// =============================================================================

/**
 * Normalize a value to a score range
 */
export function normalizeToScore(value: number, min: number, max: number, scoreMax: number): number {
  const normalized = (value - min) / (max - min);
  const clamped = Math.max(0, Math.min(1, normalized));
  return Math.round(clamped * scoreMax * 10) / 10;
}

/**
 * Combine multiple sub-scores with weights
 */
export function combineScores(scores: Array<{ score: number; weight: number }>): number {
  const totalWeight = scores.reduce((sum, s) => sum + s.weight, 0);
  if (totalWeight === 0) return 0;

  const weightedSum = scores.reduce((sum, s) => sum + s.score * s.weight, 0);
  return Math.round((weightedSum / totalWeight) * 10) / 10;
}

/**
 * Apply deductions to a base score
 */
export function applyDeductions(baseScore: number, deductions: number[], minScore: number = 0): number {
  const totalDeduction = deductions.reduce((sum, d) => sum + d, 0);
  return Math.max(minScore, baseScore - totalDeduction);
}
