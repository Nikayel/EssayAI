/**
 * Output Sanitizer - Code-Level Anti-Hallucination
 *
 * PHILOSOPHY: Prompts are fragile. Code is law.
 * This module enforces hard constraints on LLM output that cannot be bypassed.
 */

import type { AnalysisResponse } from '@/types/ai';

// =============================================================================
// TYPES
// =============================================================================

export interface SanitizationResult {
  sanitized: AnalysisResponse;
  modifications: SanitizationModification[];
  trustScore: number; // 0-100, higher = more trustworthy
  wasModified: boolean;
  // Human escalation flags
  needsHumanReview: boolean;
  escalationReason?: string;
  escalationPriority: 'none' | 'low' | 'medium' | 'high';
}

export interface SanitizationModification {
  type: 'stripped_quote' | 'removed_pattern' | 'capped_score' | 'removed_field' | 'fixed_structure';
  field: string;
  reason: string;
  original?: unknown;
  replacement?: unknown;
}

export interface SanitizationContext {
  essayText: string;
  allowedPatternIds: string[];
  allowedExampleIds?: string[];
  schoolId?: string;
}

// =============================================================================
// MAIN SANITIZER
// =============================================================================

/**
 * Sanitize LLM output with HARD code-level enforcement
 * This cannot be bypassed by prompt injection
 */
export function sanitizeAnalysisOutput(
  rawOutput: unknown,
  context: SanitizationContext
): SanitizationResult {
  const modifications: SanitizationModification[] = [];

  // Start with a deep clone to avoid mutating original
  let output: Record<string, unknown>;
  try {
    output = JSON.parse(JSON.stringify(rawOutput));
  } catch {
    // If we can't even parse it, return a safe default
    return {
      sanitized: createSafeDefault(),
      modifications: [{ type: 'fixed_structure', field: 'root', reason: 'Invalid JSON structure' }],
      trustScore: 0,
      wasModified: true,
      needsHumanReview: true,
      escalationReason: 'Invalid JSON structure in LLM output',
      escalationPriority: 'high',
    };
  }

  // 1. ENFORCE: Scores must be within bounds (0-6 for dimensions, 0-100 for overall)
  if (output.scores && typeof output.scores === 'object') {
    output.scores = enforceScoreBounds(output.scores as Record<string, unknown>, modifications);
  }

  if (output.overall && typeof output.overall === 'object') {
    const overall = output.overall as Record<string, unknown>;
    if (typeof overall.score_100 === 'number') {
      if (overall.score_100 < 0 || overall.score_100 > 100) {
        modifications.push({
          type: 'capped_score',
          field: 'overall.score_100',
          reason: `Score ${overall.score_100} out of bounds [0-100]`,
          original: overall.score_100,
          replacement: Math.max(0, Math.min(100, overall.score_100)),
        });
        overall.score_100 = Math.max(0, Math.min(100, overall.score_100));
      }
    }
  }

  // 2. ENFORCE: All quoted evidence must exist in essay
  output = stripFakeQuotes(output, context.essayText, modifications);

  // 3. ENFORCE: Pattern IDs must be from allowed list
  if (output.patterns_matched && Array.isArray(output.patterns_matched)) {
    output.patterns_matched = enforcePatternWhitelist(
      output.patterns_matched,
      context.allowedPatternIds,
      modifications
    );
  }

  // 4. ENFORCE: Suggestions must not contain full rewrites
  if (output.suggestions && typeof output.suggestions === 'object') {
    output.suggestions = sanitizeSuggestions(
      output.suggestions as Record<string, unknown>,
      modifications
    );
  }

  // 5. ENFORCE: Meta fields must match reality
  if (output.meta && typeof output.meta === 'object') {
    const meta = output.meta as Record<string, unknown>;
    // Word count should match actual essay
    const actualWordCount = context.essayText.split(/\s+/).filter(w => w.length > 0).length;
    if (typeof meta.word_count === 'number' && Math.abs(meta.word_count - actualWordCount) > 10) {
      modifications.push({
        type: 'fixed_structure',
        field: 'meta.word_count',
        reason: `Word count ${meta.word_count} doesn't match actual ${actualWordCount}`,
        original: meta.word_count,
        replacement: actualWordCount,
      });
      meta.word_count = actualWordCount;
    }
  }

  // Calculate trust score based on modifications
  const trustScore = calculateTrustScore(modifications);

  // Determine if human review is needed based on trust score and modification severity
  const escalation = determineHumanEscalation(trustScore, modifications);

  return {
    sanitized: output as unknown as AnalysisResponse,
    modifications,
    trustScore,
    wasModified: modifications.length > 0,
    needsHumanReview: escalation.needsReview,
    escalationReason: escalation.reason,
    escalationPriority: escalation.priority,
  };
}

/**
 * Determine if output needs human review and at what priority
 * This enables a human-in-the-loop for edge cases
 */
function determineHumanEscalation(
  trustScore: number,
  modifications: SanitizationModification[]
): {
  needsReview: boolean;
  reason?: string;
  priority: 'none' | 'low' | 'medium' | 'high';
} {
  // Count modification types
  const hallucinations = modifications.filter(m =>
    m.type === 'stripped_quote' || m.type === 'removed_pattern'
  ).length;

  const structuralIssues = modifications.filter(m =>
    m.type === 'fixed_structure'
  ).length;

  const contentRemovals = modifications.filter(m =>
    m.type === 'removed_field'
  ).length;

  // HIGH PRIORITY: Trust score below 40 or multiple hallucinations
  if (trustScore < 40 || hallucinations >= 3) {
    return {
      needsReview: true,
      reason: `Low trust score (${trustScore}/100) with ${hallucinations} hallucinations detected. Model output may be unreliable.`,
      priority: 'high',
    };
  }

  // MEDIUM PRIORITY: Trust score 40-60 or structural issues
  if (trustScore < 60 || structuralIssues >= 2) {
    return {
      needsReview: true,
      reason: `Moderate trust score (${trustScore}/100). ${structuralIssues} structural issues and ${contentRemovals} content removals.`,
      priority: 'medium',
    };
  }

  // LOW PRIORITY: Trust score 60-75 with any modifications
  if (trustScore < 75 && modifications.length > 0) {
    return {
      needsReview: true,
      reason: `Minor issues detected (trust score: ${trustScore}/100). ${modifications.length} modifications made.`,
      priority: 'low',
    };
  }

  // NO ESCALATION: Trust score 75+ with minimal issues
  return {
    needsReview: false,
    priority: 'none',
  };
}

// =============================================================================
// ENFORCEMENT FUNCTIONS
// =============================================================================

/**
 * HARD ENFORCEMENT: Cap all scores within valid bounds
 */
function enforceScoreBounds(
  scores: Record<string, unknown>,
  modifications: SanitizationModification[]
): Record<string, unknown> {
  const result = { ...scores };

  for (const [dimension, data] of Object.entries(result)) {
    if (data && typeof data === 'object' && 'score' in data) {
      const scoreData = data as { score: number };
      if (typeof scoreData.score === 'number') {
        if (scoreData.score < 0 || scoreData.score > 6) {
          const capped = Math.max(0, Math.min(6, Math.round(scoreData.score)));
          modifications.push({
            type: 'capped_score',
            field: `scores.${dimension}.score`,
            reason: `Score ${scoreData.score} out of bounds [0-6]`,
            original: scoreData.score,
            replacement: capped,
          });
          scoreData.score = capped;
        }
      }
    }
  }

  return result;
}

/**
 * HARD ENFORCEMENT: Remove any quotes that don't exist in the essay
 * Uses substring matching - if the quote isn't in the essay, it's hallucinated
 */
function stripFakeQuotes(
  output: Record<string, unknown>,
  essayText: string,
  modifications: SanitizationModification[]
): Record<string, unknown> {
  const essayLower = essayText.toLowerCase();
  const essayNormalized = normalizeText(essayText);

  // Recursively find and validate all "evidence" fields
  function validateEvidence(obj: unknown, path: string): unknown {
    if (obj === null || obj === undefined) return obj;

    if (Array.isArray(obj)) {
      return obj.map((item, i) => validateEvidence(item, `${path}[${i}]`));
    }

    if (typeof obj === 'object') {
      const result: Record<string, unknown> = {};

      for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
        const fieldPath = path ? `${path}.${key}` : key;

        // Check evidence arrays
        if (key === 'evidence' && Array.isArray(value)) {
          const validEvidence = value.filter((quote: unknown) => {
            if (typeof quote !== 'string') return true;
            const isValid = quoteExistsInEssay(quote, essayLower, essayNormalized);
            if (!isValid && quote.length > 10) {
              modifications.push({
                type: 'stripped_quote',
                field: fieldPath,
                reason: 'Quote not found in essay text',
                original: quote,
              });
            }
            return isValid;
          });
          result[key] = validEvidence;
        }
        // Check single evidence strings
        else if (key === 'evidence' && typeof value === 'string') {
          if (quoteExistsInEssay(value, essayLower, essayNormalized)) {
            result[key] = value;
          } else if (value.length > 10) {
            modifications.push({
              type: 'stripped_quote',
              field: fieldPath,
              reason: 'Quote not found in essay text',
              original: value,
            });
            result[key] = ''; // Empty instead of removing
          } else {
            result[key] = value;
          }
        }
        // Recursively process nested objects
        else {
          result[key] = validateEvidence(value, fieldPath);
        }
      }

      return result;
    }

    return obj;
  }

  return validateEvidence(output, '') as Record<string, unknown>;
}

/**
 * Check if a quote exists in the essay (fuzzy matching)
 */
function quoteExistsInEssay(
  quote: string,
  essayLower: string,
  essayNormalized: string
): boolean {
  if (!quote || quote.length < 5) return true; // Too short to validate

  const quoteLower = quote.toLowerCase();
  const quoteNormalized = normalizeText(quote);

  // Direct substring match
  if (essayLower.includes(quoteLower)) return true;

  // Normalized match (removes punctuation, extra spaces)
  if (essayNormalized.includes(quoteNormalized)) return true;

  // First N words match (handles truncation)
  const quoteWords = quoteLower.split(/\s+/).filter(w => w.length > 0);
  if (quoteWords.length >= 3) {
    const firstThreeWords = quoteWords.slice(0, 3).join(' ');
    if (essayLower.includes(firstThreeWords)) return true;
  }

  // Word overlap score (at least 70% of quote words must appear in essay)
  const essayWords = new Set(essayLower.split(/\s+/));
  const matchingWords = quoteWords.filter(w => essayWords.has(w));
  if (quoteWords.length > 0 && matchingWords.length / quoteWords.length >= 0.7) {
    return true;
  }

  return false;
}

/**
 * Normalize text for comparison
 */
function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, '') // Remove punctuation
    .replace(/\s+/g, ' ')    // Normalize whitespace
    .trim();
}

/**
 * HARD ENFORCEMENT: Only allow pattern IDs from the whitelist
 */
function enforcePatternWhitelist(
  patterns: unknown[],
  allowedIds: string[],
  modifications: SanitizationModification[]
): unknown[] {
  const allowedSet = new Set(allowedIds);

  return patterns.filter((pattern) => {
    if (!pattern || typeof pattern !== 'object') return false;

    const patternObj = pattern as Record<string, unknown>;
    const patternId = patternObj.pattern_id;

    if (typeof patternId !== 'string') return true; // Keep if no ID

    if (!allowedSet.has(patternId)) {
      modifications.push({
        type: 'removed_pattern',
        field: 'patterns_matched',
        reason: `Pattern ID "${patternId}" not in retrieved context`,
        original: pattern,
      });
      return false;
    }

    return true;
  });
}

/**
 * HARD ENFORCEMENT: Sanitize suggestions to prevent full rewrites
 *
 * The goal is to ensure Claude provides COACHING (direction, guidance)
 * not GHOSTWRITING (actual text to copy-paste).
 *
 * Patterns we catch:
 * 1. Long quoted rewrites (>40 chars) - obvious ghostwriting
 * 2. "Change X to Y" with specific replacement text
 * 3. "Here's what you could write:" type suggestions
 * 4. Full sentence replacements in any form
 */
function sanitizeSuggestions(
  suggestions: Record<string, unknown>,
  modifications: SanitizationModification[]
): Record<string, unknown> {
  const result = { ...suggestions };

  // Patterns that indicate ghostwriting instead of coaching
  const ghostwritingPatterns = [
    // Long quoted text (reduced from 80 to 40 chars)
    /^["'][\w\s,.'!?-]{40,}["']/,
    // "Change X to: [full text]" or "Replace with: [full text]"
    /(?:change|replace|rewrite|revise)\s+(?:it|this|that)?\s*(?:to|with)\s*[:"]\s*[\w\s,.'!?-]{30,}/i,
    // "Here's what you could write/say"
    /here['']?s?\s+(?:what|how)\s+(?:you\s+)?(?:could|should|might)\s+(?:write|say)/i,
    // "Try something like: [text]"
    /try\s+(?:something\s+)?like\s*[:"]\s*[\w\s,.'!?-]{30,}/i,
    // "Consider writing: [text]"
    /consider\s+(?:writing|saying)\s*[:"]\s*[\w\s,.'!?-]{30,}/i,
    // Full sentence in quotes that looks like replacement text
    /["'][A-Z][\w\s,.'!?-]{35,}[.!?]["']/,
  ];

  // Check top5 suggestions
  if (result.top5 && Array.isArray(result.top5)) {
    result.top5 = result.top5.map((suggestion, i) => {
      if (!suggestion || typeof suggestion !== 'object') return suggestion;

      const s = suggestion as Record<string, unknown>;

      // Check example_edit field
      if (typeof s.example_edit === 'string') {
        const edit = s.example_edit;

        for (const pattern of ghostwritingPatterns) {
          if (pattern.test(edit)) {
            modifications.push({
              type: 'removed_field',
              field: `suggestions.top5[${i}].example_edit`,
              reason: 'Suggestion contains replacement text instead of coaching direction',
              original: edit,
              replacement: '[Removed: contained specific text to copy. We provide coaching direction, not replacement text.]',
            });
            return {
              ...s,
              example_edit: '[Removed: Please ask for coaching direction on how to improve this section, not replacement text.]',
            };
          }
        }
      }

      // Also check the 'to' field in sentence_level suggestions
      if (typeof s.to === 'string' && s.to.length > 50) {
        modifications.push({
          type: 'removed_field',
          field: `suggestions.top5[${i}].to`,
          reason: 'Sentence-level suggestion too long - appears to be ghostwriting',
          original: s.to,
        });
        return {
          ...s,
          to: '[Coaching direction needed, not replacement text]',
        };
      }

      return s;
    });
  }

  // Also check sentence_level suggestions
  if (result.sentence_level && Array.isArray(result.sentence_level)) {
    result.sentence_level = result.sentence_level.map((suggestion, i) => {
      if (!suggestion || typeof suggestion !== 'object') return suggestion;

      const s = suggestion as Record<string, unknown>;

      // Check if 'to' field is too long (likely ghostwriting)
      if (typeof s.to === 'string' && s.to.length > 60) {
        modifications.push({
          type: 'removed_field',
          field: `suggestions.sentence_level[${i}].to`,
          reason: 'Replacement text too long - coaching should be directional',
          original: s.to,
        });
        return {
          ...s,
          to: '[Provide direction for improvement, not replacement text]',
        };
      }

      return s;
    });
  }

  return result;
}

/**
 * Calculate trust score based on modifications made
 */
function calculateTrustScore(modifications: SanitizationModification[]): number {
  let score = 100;

  for (const mod of modifications) {
    switch (mod.type) {
      case 'stripped_quote':
        score -= 15; // Hallucinated quotes are serious
        break;
      case 'removed_pattern':
        score -= 20; // Hallucinated pattern IDs are serious
        break;
      case 'capped_score':
        score -= 5; // Minor issue
        break;
      case 'removed_field':
        score -= 10;
        break;
      case 'fixed_structure':
        score -= 5;
        break;
    }
  }

  return Math.max(0, score);
}

/**
 * Create a safe default response when output is completely invalid
 */
function createSafeDefault(): AnalysisResponse {
  return {
    meta: {
      essay_type: 'other',
      word_count: 0,
      prompt: '',
      school: '',
    },
    scores: {
      authenticity: { score: 3, rationales: ['Unable to analyze - please try again'] },
      reflection: { score: 3, rationales: ['Unable to analyze - please try again'] },
      structure: { score: 3, rationales: ['Unable to analyze - please try again'] },
      specificity_fit: { score: 3, rationales: ['Unable to analyze - please try again'] },
      clarity_style: { score: 3, rationales: ['Unable to analyze - please try again'] },
      mechanics: { score: 3, rationales: ['Unable to analyze - please try again'] },
      ethics_originality: { score: 3, rationales: ['Unable to analyze - please try again'] },
    },
    commons_check: {
      about_applicant: { flag: false },
      jargon_overuse: { flag: false },
      goals_articulated: { flag: false },
      school_alignment: { flag: false },
      buzzwords_cliches: { flag: false },
      genericness: { flag: false },
      trauma_without_reflection: { flag: false },
      exaggeration: { flag: false },
      tone_drift: { flag: false },
      ethics_risks: { flag: false },
    },
    suggestions: {
      top5: [],
      outline_fix: [],
      sentence_level: [],
    },
    overall: {
      score_100: 50,
      summary: 'Analysis could not be completed. Please try again.',
      next_actions_checklist: ['Retry analysis'],
    },
  };
}

// =============================================================================
// EXPORTS
// =============================================================================

export {
  quoteExistsInEssay,
  normalizeText,
  createSafeDefault,
};
