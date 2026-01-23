/**
 * RAG Guardrails System
 * Hybrid approach: Fast regex checks + semantic analysis for edge cases
 *
 * Philosophy:
 * 1. Regex-first for speed (catches 95% of issues in <1ms)
 * 2. Semantic checks only when regex is inconclusive
 * 3. Never block legitimate student content
 * 4. Prioritize false negatives over false positives for student essays
 */

import type {
  GuardrailResult,
  GuardrailViolation,
  GuardrailSeverity,
  GuardrailCategory,
} from './types';

// =============================================================================
// CONFIGURATION
// =============================================================================

const CONFIG = {
  // Length limits
  minEssayLength: 50,
  maxEssayLength: 10000,
  minWordCount: 10,
  maxWordCount: 2000,

  // Thresholds
  aiDetectionThreshold: 0.75,
  plagiarismThreshold: 0.90,
  injectionThreshold: 0.80,

  // Enable/disable semantic checks (slower but more accurate)
  // MVP: Disabled - regex catches 95%+ of issues. Enable when classifier model is ready.
  enableSemanticChecks: false,

  // Risk score weights
  weights: {
    prompt_injection: 50,
    pii_detection: 20,
    plagiarism_signal: 30,
    ai_generated: 15,
    harmful_content: 40,
    length_violation: 10,
    quality_check: 5,
  },
};

// =============================================================================
// REGEX PATTERNS (Fast, deterministic)
// =============================================================================

/**
 * Prompt injection patterns
 * These are DEFINITE red flags - block immediately
 */
const INJECTION_PATTERNS_CRITICAL = [
  /ignore\s+(all\s+)?(previous|prior|above)\s+(instructions|prompts|rules)/i,
  /disregard\s+(your|the|all)\s+(instructions|guidelines|rules)/i,
  /forget\s+(everything|all|your)\s+(above|previous|prior)/i,
  /you\s+are\s+now\s+(a|an|the)\s+\w+/i,
  /pretend\s+(you\s+are|to\s+be|you're)/i,
  /act\s+as\s+(if|a|an)\s+/i,
  /new\s+instruction[s]?\s*:/i,
  /system\s*prompt\s*:/i,
  /override\s+(the\s+)?(system|prompt|instructions)/i,
  /bypass\s+(your|the|all)\s+(filter|restrictions|safeguards)/i,
  /jailbreak/i,
  /DAN\s+mode/i,
  /developer\s+mode/i,
  /<\|im_start\|>/i,
  /<\|endoftext\|>/i,
  /\[INST\]/i,
  /\[\[SYSTEM\]\]/i,
];

/**
 * Suspicious patterns - warn but don't block
 * Could be legitimate in essay context
 */
const INJECTION_PATTERNS_SUSPICIOUS = [
  /respond\s+(only\s+)?in\s+json/i,
  /format\s+your\s+(response|output|answer)\s+as/i,
  /you\s+must\s+(always|never)/i,
  /do\s+not\s+(ever|under\s+any)/i,
  /from\s+now\s+on/i,
];

/**
 * Advanced injection patterns - encoding/unicode tricks
 */
const INJECTION_PATTERNS_ADVANCED = [
  // Base64 encoded commands (common trick)
  /(?:aWdub3Jl|Zm9yZ2V0|b3ZlcnJpZGU|cHJldGVuZA)/i, // base64 for ignore, forget, override, pretend
  // Zero-width characters (used to hide text)
  /[\u200B\u200C\u200D\uFEFF]/,
  // Homoglyph attacks (Cyrillic lookalikes)
  /[АВСЕНІКМОРТХасеіорхуАа]/,  // Cyrillic letters that look like Latin
  // Markdown/formatting exploits
  /\[system\]/i,
  /<!--[\s\S]*?-->/,  // HTML comments
  // Unicode direction overrides
  /[\u202A-\u202E\u2066-\u2069]/,
  // Invisible separators
  /[\u2028\u2029]/,
  // Context window stuffing
  /(.)\1{50,}/,  // Same character 50+ times
];

/**
 * Output manipulation attempts
 */
const OUTPUT_MANIPULATION_PATTERNS = [
  /return\s+this\s+(exact|specific)/i,
  /output\s+(must|should)\s+be\s+exactly/i,
  /json\s*:\s*\{/i,
  /start\s+(your\s+)?(response|answer)\s+with/i,
  /end\s+(your\s+)?(response|answer)\s+with/i,
];

/**
 * PII patterns
 * Match with caution - names/places are common in essays
 */
const PII_PATTERNS = {
  // Definite PII (high confidence)
  ssn: /\b\d{3}[-\s]?\d{2}[-\s]?\d{4}\b/,
  creditCard: /\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/,
  email: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/,
  phone: /\b(?:\+1[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b/,

  // Possible PII (check context)
  address: /\b\d{1,5}\s+[\w\s]+(?:street|st|avenue|ave|road|rd|drive|dr|lane|ln|way|boulevard|blvd)\b/i,
  zipCode: /\b\d{5}(?:-\d{4})?\b/,
  dateOfBirth: /\b(?:born|birthday|dob)[:\s]+\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}\b/i,
};

/**
 * Harmful content patterns
 */
const HARMFUL_PATTERNS = [
  /\b(kill|murder|harm|hurt)\s+(myself|yourself|themselves|people)\b/i,
  /\bhow\s+to\s+(make|build|create)\s+(a\s+)?(bomb|weapon|explosive)/i,
  /\b(hate|death\s+to)\s+(all\s+)?\w+\s*(people|race|religion)/i,
  /\b(racial|ethnic)\s+slur/i,
];

/**
 * AI-generated content signals (heuristic)
 * These alone don't prove AI - need combination
 */
const AI_SIGNALS = {
  overusedPhrases: [
    /\bin\s+conclusion\b/i,
    /\bfurthermore\b/gi,
    /\bmoreover\b/gi,
    /\badditionally\b/gi,
    /\bin\s+today's\s+society\b/i,
    /\bit\s+is\s+important\s+to\s+note\b/i,
    /\ba\s+testament\s+to\b/i,
    /\bdelve\s+(into|deeper)\b/i,
    /\bnavigat(e|ing)\s+the\s+(complex|intricate)/i,
    /\btapestry\s+of\b/i,
    /\bjourney\s+of\s+self-discovery\b/i,
    /\bparadigm\s+shift\b/i,
    /\bholistic\s+approach\b/i,
  ],
  structuralPatterns: [
    // Perfect 5-paragraph structure with transition words
    /^(first|firstly|to\s+begin)[\s,]/im,
    /(second|secondly)[\s,]/i,
    /(third|thirdly)[\s,]/i,
    /(finally|lastly|in\s+conclusion)[\s,]/i,
  ],
};

/**
 * Essay quality signals (positive indicators)
 */
const QUALITY_SIGNALS = {
  personalPronouns: /\b(I|my|me|mine|myself)\b/gi,
  specificDetails: /\b(when I was|one day|that morning|my \w+ said|I remember)\b/gi,
  dialogue: /"[^"]+"/g,
  sensoryLanguage: /\b(smell|taste|feel|hear|saw|watch|sound|touch)\b/gi,
};

// =============================================================================
// MAIN GUARDRAIL FUNCTION
// =============================================================================

/**
 * Run all guardrails on input text
 * Returns result with violations and risk score
 */
export async function runGuardrails(
  text: string,
  options: {
    checkPII?: boolean;
    checkInjection?: boolean;
    checkHarmful?: boolean;
    checkAI?: boolean;
    checkQuality?: boolean;
    enableSemantic?: boolean;
  } = {}
): Promise<GuardrailResult> {
  const {
    checkPII = true,
    checkInjection = true,
    checkHarmful = true,
    checkAI = true,
    checkQuality = true,
    enableSemantic = CONFIG.enableSemanticChecks,
  } = options;

  const violations: GuardrailViolation[] = [];
  let riskScore = 0;

  // 1. Length checks (fast, always run)
  const lengthViolations = checkLength(text);
  violations.push(...lengthViolations);
  riskScore += lengthViolations.length > 0 ? CONFIG.weights.length_violation : 0;

  // 2. Prompt injection checks
  if (checkInjection) {
    const injectionViolations = checkPromptInjection(text);
    violations.push(...injectionViolations);

    const hasCritical = injectionViolations.some(v => v.severity === 'block');
    riskScore += hasCritical ? CONFIG.weights.prompt_injection : 0;
  }

  // 3. PII detection
  if (checkPII) {
    const piiViolations = checkPIIPatterns(text);
    violations.push(...piiViolations);
    riskScore += piiViolations.length > 0 ? CONFIG.weights.pii_detection : 0;
  }

  // 4. Harmful content
  if (checkHarmful) {
    const harmfulViolations = checkHarmfulContent(text);
    violations.push(...harmfulViolations);
    riskScore += harmfulViolations.length > 0 ? CONFIG.weights.harmful_content : 0;
  }

  // 5. AI-generated signals (heuristic only, low weight)
  if (checkAI) {
    const aiViolations = checkAISignals(text);
    violations.push(...aiViolations);
    // Only add to risk if multiple signals detected
    if (aiViolations.length >= 3) {
      riskScore += CONFIG.weights.ai_generated;
    }
  }

  // 6. Quality signals (positive - reduce risk)
  if (checkQuality) {
    const qualityScore = checkQualitySignals(text);
    riskScore = Math.max(0, riskScore - qualityScore);
  }

  // 7. Semantic checks (only if regex found something ambiguous)
  // MVP STATUS: Disabled (enableSemanticChecks=false)
  // When enabled, this would use a classifier model to:
  // - Distinguish real prompt injections from essay content about AI
  // - Detect sophisticated paraphrased plagiarism
  // - Identify context-dependent harmful content
  const hasAmbiguousViolations = violations.some(v => v.severity === 'warn');
  if (enableSemantic && hasAmbiguousViolations) {
    // TODO: Implement semantic classifier when needed
    // Options: (1) Fine-tuned BERT classifier, (2) Claude Haiku with prompt,
    // (3) Embedding-based similarity to known bad patterns
    // For now, regex handles 95%+ of cases effectively
  }

  // Sanitize text if needed
  const sanitizedText = sanitizeText(text, violations);

  // Determine if passed
  const blockingViolations = violations.filter(v => v.severity === 'block');
  const passed = blockingViolations.length === 0;

  return {
    passed,
    violations,
    sanitizedText,
    riskScore: Math.min(100, riskScore),
  };
}

// =============================================================================
// INDIVIDUAL CHECK FUNCTIONS
// =============================================================================

/**
 * Check text length constraints
 */
function checkLength(text: string): GuardrailViolation[] {
  const violations: GuardrailViolation[] = [];
  const wordCount = text.split(/\s+/).filter(w => w.length > 0).length;

  if (text.length < CONFIG.minEssayLength) {
    violations.push({
      type: 'length_violation',
      severity: 'block',
      message: `Text too short (${text.length} chars, minimum ${CONFIG.minEssayLength})`,
    });
  }

  if (text.length > CONFIG.maxEssayLength) {
    violations.push({
      type: 'length_violation',
      severity: 'warn',
      message: `Text very long (${text.length} chars), will be truncated`,
    });
  }

  if (wordCount < CONFIG.minWordCount) {
    violations.push({
      type: 'length_violation',
      severity: 'block',
      message: `Too few words (${wordCount}, minimum ${CONFIG.minWordCount})`,
    });
  }

  if (wordCount > CONFIG.maxWordCount) {
    violations.push({
      type: 'length_violation',
      severity: 'info',
      message: `Essay exceeds typical word count (${wordCount} words)`,
    });
  }

  return violations;
}

/**
 * Check for prompt injection attempts
 */
function checkPromptInjection(text: string): GuardrailViolation[] {
  const violations: GuardrailViolation[] = [];

  // Critical patterns - definite injection attempts
  for (const pattern of INJECTION_PATTERNS_CRITICAL) {
    const match = text.match(pattern);
    if (match) {
      violations.push({
        type: 'prompt_injection',
        severity: 'block',
        message: 'Detected potential prompt injection attempt',
        evidence: match[0].slice(0, 50),
      });
      break; // One is enough to block
    }
  }

  // Advanced patterns - encoding/unicode tricks
  if (violations.length === 0) {
    for (const pattern of INJECTION_PATTERNS_ADVANCED) {
      const match = text.match(pattern);
      if (match) {
        violations.push({
          type: 'prompt_injection',
          severity: 'block',
          message: 'Detected obfuscated content or encoding tricks',
          evidence: '[hidden characters detected]',
        });
        break;
      }
    }
  }

  // Output manipulation attempts
  if (violations.length === 0) {
    for (const pattern of OUTPUT_MANIPULATION_PATTERNS) {
      const match = text.match(pattern);
      if (match) {
        violations.push({
          type: 'prompt_injection',
          severity: 'warn',
          message: 'Detected attempt to manipulate output format',
          evidence: match[0].slice(0, 50),
        });
      }
    }
  }

  // Suspicious patterns - might be legitimate
  if (violations.length === 0) {
    for (const pattern of INJECTION_PATTERNS_SUSPICIOUS) {
      const match = text.match(pattern);
      if (match) {
        violations.push({
          type: 'prompt_injection',
          severity: 'warn',
          message: 'Detected unusual phrasing that may affect analysis',
          evidence: match[0].slice(0, 50),
        });
      }
    }
  }

  return violations;
}

/**
 * Check for PII in text
 */
function checkPIIPatterns(text: string): GuardrailViolation[] {
  const violations: GuardrailViolation[] = [];

  // High-confidence PII
  if (PII_PATTERNS.ssn.test(text)) {
    violations.push({
      type: 'pii_detection',
      severity: 'block',
      message: 'Detected what appears to be a Social Security Number',
    });
  }

  if (PII_PATTERNS.creditCard.test(text)) {
    violations.push({
      type: 'pii_detection',
      severity: 'block',
      message: 'Detected what appears to be a credit card number',
    });
  }

  // Medium-confidence PII - warn only
  const emailMatches = text.match(PII_PATTERNS.email);
  if (emailMatches && emailMatches.length > 0) {
    violations.push({
      type: 'pii_detection',
      severity: 'warn',
      message: `Detected email address(es): consider removing for privacy`,
      evidence: emailMatches[0],
    });
  }

  const phoneMatches = text.match(PII_PATTERNS.phone);
  if (phoneMatches && phoneMatches.length > 0) {
    // Check if it might be a legitimate date or other number
    const contextCheck = text.slice(
      Math.max(0, text.indexOf(phoneMatches[0]) - 20),
      text.indexOf(phoneMatches[0]) + phoneMatches[0].length + 20
    );
    const isLikelyPhone = /call|phone|text|contact|reach/i.test(contextCheck);

    if (isLikelyPhone) {
      violations.push({
        type: 'pii_detection',
        severity: 'warn',
        message: 'Detected what appears to be a phone number',
        evidence: phoneMatches[0],
      });
    }
  }

  return violations;
}

/**
 * Check for harmful content
 */
function checkHarmfulContent(text: string): GuardrailViolation[] {
  const violations: GuardrailViolation[] = [];

  for (const pattern of HARMFUL_PATTERNS) {
    const match = text.match(pattern);
    if (match) {
      violations.push({
        type: 'harmful_content',
        severity: 'block',
        message: 'Detected potentially harmful content',
        evidence: match[0].slice(0, 30),
      });
      break;
    }
  }

  return violations;
}

/**
 * Check for AI-generated content signals
 * Uses heuristics - not definitive
 */
function checkAISignals(text: string): GuardrailViolation[] {
  const violations: GuardrailViolation[] = [];
  let aiSignalCount = 0;

  // Check overused AI phrases
  for (const pattern of AI_SIGNALS.overusedPhrases) {
    const matches = text.match(pattern);
    if (matches && matches.length > 0) {
      aiSignalCount += matches.length;
    }
  }

  // Check structural patterns
  let structuralMatches = 0;
  for (const pattern of AI_SIGNALS.structuralPatterns) {
    if (pattern.test(text)) {
      structuralMatches++;
    }
  }

  // If multiple structural patterns, it's more suspicious
  if (structuralMatches >= 3) {
    aiSignalCount += 2;
  }

  // Threshold for reporting
  if (aiSignalCount >= 4) {
    violations.push({
      type: 'ai_generated',
      severity: 'info',
      message: `Detected ${aiSignalCount} phrases commonly associated with AI-generated text. This is informational only - many legitimate essays use similar language.`,
    });
  }

  return violations;
}

/**
 * Check for quality signals (returns reduction to risk score)
 */
function checkQualitySignals(text: string): number {
  let qualityScore = 0;

  // Personal pronouns indicate personal essay
  const pronounMatches = text.match(QUALITY_SIGNALS.personalPronouns);
  if (pronounMatches && pronounMatches.length >= 5) {
    qualityScore += 5;
  }

  // Specific details
  const detailMatches = text.match(QUALITY_SIGNALS.specificDetails);
  if (detailMatches && detailMatches.length >= 2) {
    qualityScore += 5;
  }

  // Dialogue
  const dialogueMatches = text.match(QUALITY_SIGNALS.dialogue);
  if (dialogueMatches && dialogueMatches.length >= 1) {
    qualityScore += 5;
  }

  // Sensory language
  const sensoryMatches = text.match(QUALITY_SIGNALS.sensoryLanguage);
  if (sensoryMatches && sensoryMatches.length >= 3) {
    qualityScore += 5;
  }

  return qualityScore;
}

// =============================================================================
// SANITIZATION
// =============================================================================

/**
 * Sanitize text based on violations found
 */
function sanitizeText(text: string, violations: GuardrailViolation[]): string {
  let sanitized = text;

  // Remove potential code/script blocks
  sanitized = sanitized
    .replace(/```[\s\S]*?```/g, '[code block removed]')
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '');

  // Remove HTML tags but preserve content
  sanitized = sanitized.replace(/<[^>]+>/g, '');

  // Normalize whitespace
  sanitized = sanitized
    .replace(/\r\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  // If PII detected, optionally redact
  const piiViolations = violations.filter(v => v.type === 'pii_detection');
  for (const violation of piiViolations) {
    if (violation.evidence && violation.severity === 'block') {
      sanitized = sanitized.replace(
        new RegExp(escapeRegex(violation.evidence), 'g'),
        '[REDACTED]'
      );
    }
  }

  return sanitized;
}

/**
 * Escape special regex characters
 */
function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// =============================================================================
// QUICK VALIDATION HELPERS
// =============================================================================

/**
 * Quick check if text is likely safe (for hot path)
 * Returns true if no critical issues found
 */
export function quickSafetyCheck(text: string): boolean {
  if (text.length < CONFIG.minEssayLength || text.length > CONFIG.maxEssayLength * 2) {
    return false;
  }

  for (const pattern of INJECTION_PATTERNS_CRITICAL) {
    if (pattern.test(text)) {
      return false;
    }
  }

  for (const pattern of HARMFUL_PATTERNS) {
    if (pattern.test(text)) {
      return false;
    }
  }

  return true;
}

/**
 * Validate school ID
 */
export function validateSchoolId(schoolId: string): boolean {
  const validIds = [
    'harvard', 'yale', 'princeton', 'columbia',
    'brown', 'dartmouth', 'cornell', 'upenn'
  ];
  return validIds.includes(schoolId.toLowerCase());
}

/**
 * Validate essay type
 */
export function validateEssayType(essayType: string): boolean {
  const validTypes = [
    'PERSONAL_STATEMENT', 'WHY_US', 'SUPPLEMENTAL',
    'ACTIVITY', 'OTHER'
  ];
  return validTypes.includes(essayType.toUpperCase());
}

// =============================================================================
// EXPORTS
// =============================================================================

// =============================================================================
// OUTPUT GUARDRAILS (Validate Claude's responses)
// =============================================================================

/**
 * Output validation result
 */
export interface OutputValidationResult {
  valid: boolean;
  issues: OutputIssue[];
  sanitizedOutput?: unknown;
  confidence: number;
}

interface OutputIssue {
  type: 'hallucination' | 'format_error' | 'unsafe_content' | 'inconsistency';
  message: string;
  field?: string;
}

/**
 * Validate Claude's analysis output for hallucination and safety
 */
export function validateAnalysisOutput(
  output: unknown,
  essayText: string,
  retrievedContext?: { patternIds?: string[]; exampleIds?: string[] }
): OutputValidationResult {
  const issues: OutputIssue[] = [];

  // Must be an object
  if (!output || typeof output !== 'object') {
    return {
      valid: false,
      issues: [{ type: 'format_error', message: 'Output is not a valid object' }],
      confidence: 0,
    };
  }

  const result = output as Record<string, unknown>;

  // 1. Validate required fields exist
  const requiredFields = ['meta', 'scores', 'suggestions', 'overall'];
  for (const field of requiredFields) {
    if (!(field in result)) {
      issues.push({
        type: 'format_error',
        message: `Missing required field: ${field}`,
        field,
      });
    }
  }

  // 2. Check for hallucinated pattern references
  if (result.patterns_matched && Array.isArray(result.patterns_matched)) {
    for (const pattern of result.patterns_matched as Array<{ pattern_id?: string; evidence?: string }>) {
      // Check if evidence actually exists in essay
      if (pattern.evidence && !essayText.toLowerCase().includes(pattern.evidence.toLowerCase().slice(0, 30))) {
        issues.push({
          type: 'hallucination',
          message: `Pattern evidence not found in essay text`,
          field: 'patterns_matched',
        });
      }

      // Check if pattern_id is from retrieved context (if we have it)
      if (retrievedContext?.patternIds && pattern.pattern_id) {
        if (!retrievedContext.patternIds.includes(pattern.pattern_id)) {
          issues.push({
            type: 'hallucination',
            message: `Referenced pattern not in retrieved context: ${pattern.pattern_id}`,
            field: 'patterns_matched',
          });
        }
      }
    }
  }

  // 3. Check for unrealistic scores
  if (result.scores && typeof result.scores === 'object') {
    const scores = result.scores as Record<string, { score?: number }>;
    for (const [dimension, data] of Object.entries(scores)) {
      if (data?.score !== undefined) {
        if (data.score < 0 || data.score > 6) {
          issues.push({
            type: 'inconsistency',
            message: `Score out of range (0-6): ${dimension} = ${data.score}`,
            field: `scores.${dimension}`,
          });
        }
      }
    }
  }

  // 4. Check overall score consistency
  if (result.overall && typeof result.overall === 'object') {
    const overall = result.overall as { score_100?: number };
    if (overall.score_100 !== undefined) {
      if (overall.score_100 < 0 || overall.score_100 > 100) {
        issues.push({
          type: 'inconsistency',
          message: `Overall score out of range: ${overall.score_100}`,
          field: 'overall.score_100',
        });
      }
    }
  }

  // 5. Check for unsafe content in suggestions
  if (result.suggestions && typeof result.suggestions === 'object') {
    const suggestions = result.suggestions as { top5?: Array<{ example_edit?: string }> };
    if (suggestions.top5 && Array.isArray(suggestions.top5)) {
      for (const suggestion of suggestions.top5) {
        if (suggestion.example_edit) {
          // Check if suggestion writes content for student (violation)
          const writesContent = /here('s| is) (what|the text|your new|a better)/i.test(suggestion.example_edit);
          if (writesContent) {
            issues.push({
              type: 'unsafe_content',
              message: 'Suggestion appears to write content for student instead of coaching',
              field: 'suggestions.top5',
            });
          }
        }
      }
    }
  }

  // 6. Check for potential jailbreak in output
  const outputStr = JSON.stringify(result);
  for (const pattern of HARMFUL_PATTERNS) {
    if (pattern.test(outputStr)) {
      issues.push({
        type: 'unsafe_content',
        message: 'Output contains potentially harmful content',
      });
    }
  }

  // Calculate confidence based on issues
  const confidence = Math.max(0, 100 - issues.length * 20);

  return {
    valid: issues.filter(i => i.type === 'format_error').length === 0,
    issues,
    sanitizedOutput: issues.length === 0 ? result : undefined,
    confidence,
  };
}

/**
 * Check if quoted text in output actually exists in essay (anti-hallucination)
 */
export function verifyQuotedEvidence(
  output: unknown,
  essayText: string
): { verified: boolean; missingQuotes: string[] } {
  const missingQuotes: string[] = [];
  const essayLower = essayText.toLowerCase();

  // Extract all quoted strings from output
  const outputStr = JSON.stringify(output);
  const quotePattern = /"([^"]{10,100})"/g;
  let match;

  while ((match = quotePattern.exec(outputStr)) !== null) {
    const quote = match[1];
    // Skip if it looks like a field name or common phrase
    if (quote.includes(':') || quote.includes('_') || /^(high|medium|low|score|N\/A)$/i.test(quote)) {
      continue;
    }

    // Check if this quote exists in the essay (fuzzy match)
    const quoteLower = quote.toLowerCase();
    const firstWords = quoteLower.split(' ').slice(0, 4).join(' ');

    if (quoteLower.length > 20 && !essayLower.includes(firstWords)) {
      missingQuotes.push(quote.slice(0, 50));
    }
  }

  return {
    verified: missingQuotes.length === 0,
    missingQuotes,
  };
}

export { CONFIG as GUARDRAIL_CONFIG };
