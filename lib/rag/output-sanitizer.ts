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

  return {
    sanitized: output as unknown as AnalysisResponse,
    modifications,
    trustScore,
    wasModified: modifications.length > 0,
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
 */
function sanitizeSuggestions(
  suggestions: Record<string, unknown>,
  modifications: SanitizationModification[]
): Record<string, unknown> {
  const result = { ...suggestions };

  // Check top5 suggestions
  if (result.top5 && Array.isArray(result.top5)) {
    result.top5 = result.top5.map((suggestion, i) => {
      if (!suggestion || typeof suggestion !== 'object') return suggestion;

      const s = suggestion as Record<string, unknown>;

      // Check if example_edit looks like a full rewrite (> 100 chars of quoted text)
      if (typeof s.example_edit === 'string') {
        const edit = s.example_edit;

        // Pattern: starts with a quote that's a full sentence
        const fullRewritePattern = /^["'][\w\s,.'!?-]{80,}["']/;
        if (fullRewritePattern.test(edit)) {
          modifications.push({
            type: 'removed_field',
            field: `suggestions.top5[${i}].example_edit`,
            reason: 'Suggestion appears to be a full rewrite, not coaching',
            original: edit,
            replacement: '[Suggestion removed - contained full rewrite instead of coaching guidance]',
          });
          return {
            ...s,
            example_edit: '[Suggestion removed - contained full rewrite instead of coaching guidance]',
          };
        }
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
      recommendation: 'Analysis could not be completed. Please try again.',
      highlights: [],
      action_items: ['Retry analysis'],
    },
  };
}

// =============================================================================
// EXPORTS
// =============================================================================

export {
  sanitizeAnalysisOutput,
  quoteExistsInEssay,
  normalizeText,
  createSafeDefault,
};
