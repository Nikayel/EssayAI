/**
 * Ivy League Essay Analyzer
 * Integrates with existing AI infrastructure for Ivy-specific analysis
 */

import { anthropic, MODELS, generateEmbedding, cosineSimilarity } from './clients';
import {
  IVY_ANALYSIS_SYSTEM_PROMPT,
  IVY_FIT_SYSTEM_PROMPT,
  buildIvyAnalysisPrompt,
  buildSchoolFitPrompt,
  buildIvyRewritePrompt,
  calculateIvyScore,
  calculateFitScore,
  validateEssayInput,
  validateSchoolId,
} from './ivy-prompts';
import { getIvySchool, getSchoolPrompts } from '../data/ivy-league';
import { z } from 'zod';

// ============================================================================
// TYPES & SCHEMAS
// ============================================================================

export const IvyAnalysisResponseSchema = z.object({
  meta: z.object({
    school: z.string(),
    essay_type: z.string(),
    word_count: z.number(),
    prompt: z.string(),
  }),
  scores: z.object({
    authenticity: z.object({ score: z.number(), rationale: z.string() }),
    school_fit: z.object({
      score: z.number(),
      rationale: z.string(),
      evidence: z.array(z.string()).optional(),
    }),
    reflection: z.object({ score: z.number(), rationale: z.string() }),
    structure: z.object({ score: z.number(), rationale: z.string() }),
    specificity: z.object({
      score: z.number(),
      rationale: z.string(),
      generic_phrases: z.array(z.string()).optional(),
    }),
    clarity: z.object({ score: z.number(), rationale: z.string() }),
    mechanics: z.object({ score: z.number(), rationale: z.string() }),
  }),
  school_fit_analysis: z.object({
    demonstrated_research: z.array(z.string()),
    value_alignment: z.array(z.string()),
    missing_opportunities: z.array(z.string()),
    red_flags: z.array(z.string()),
    fit_score: z.number(),
  }),
  commons_check: z.object({
    about_applicant: z.object({ flag: z.boolean(), evidence: z.array(z.string()) }),
    generic_language: z.object({ flag: z.boolean(), phrases: z.array(z.string()) }),
    school_specific: z.object({ flag: z.boolean(), evidence: z.array(z.string()) }),
    cliches: z.object({ flag: z.boolean(), phrases: z.array(z.string()) }),
    voice_authentic: z.object({ flag: z.boolean(), notes: z.string() }),
  }),
  suggestions: z.object({
    top_priorities: z.array(z.object({
      issue: z.string(),
      why_matters: z.string(),
      how_to_fix: z.string(),
      example: z.string().optional(),
    })),
    school_fit_improvements: z.array(z.string()),
    sentence_edits: z.array(z.object({
      original: z.string(),
      suggested: z.string(),
      reason: z.string(),
    })).optional(),
  }),
  overall: z.object({
    score_100: z.number(),
    summary: z.string(),
    strengths: z.array(z.string()),
    action_items: z.array(z.string()),
  }),
});

export type IvyAnalysisResponse = z.infer<typeof IvyAnalysisResponseSchema>;

export const SchoolFitResponseSchema = z.object({
  fit_signals_found: z.array(z.object({
    signal: z.string(),
    evidence: z.string(),
    strength: z.number(),
  })),
  fit_signals_missing: z.array(z.string()),
  school_references: z.object({
    programs_mentioned: z.array(z.string()),
    courses_mentioned: z.array(z.string()),
    people_mentioned: z.array(z.string()),
    locations_mentioned: z.array(z.string()),
    values_demonstrated: z.array(z.string()),
  }),
  red_flags: z.array(z.string()),
  fit_score: z.number(),
  fit_grade: z.string(),
  recommendations: z.array(z.string()),
});

export type SchoolFitResponse = z.infer<typeof SchoolFitResponseSchema>;

// ============================================================================
// CORE ANALYSIS FUNCTIONS
// ============================================================================

interface AnalyzeIvyEssayParams {
  essayText: string;
  schoolId: string;
  essayType: string;
  promptText: string;
  wordLimit?: number;
  toneSample?: string;
}

/**
 * Full Ivy League essay analysis
 */
export async function analyzeIvyEssay(
  params: AnalyzeIvyEssayParams
): Promise<IvyAnalysisResponse> {
  // Validate inputs
  const validation = validateEssayInput(params.essayText);
  if (!validation.valid) {
    throw new Error(`Invalid input: ${validation.errors.join(', ')}`);
  }

  if (!validateSchoolId(params.schoolId)) {
    throw new Error(`Invalid school ID: ${params.schoolId}`);
  }

  const school = getIvySchool(params.schoolId);
  if (!school) {
    throw new Error(`School not found: ${params.schoolId}`);
  }

  // Build prompt using sanitized text
  const prompt = buildIvyAnalysisPrompt({
    essayText: validation.sanitizedText || params.essayText,
    schoolId: params.schoolId,
    essayType: params.essayType,
    promptText: params.promptText,
    wordLimit: params.wordLimit,
    toneSample: params.toneSample,
  });

  // Call Claude
  const response = await anthropic.messages.create({
    model: MODELS.CLAUDE_SONNET,
    max_tokens: 4096,
    temperature: 0.3,
    system: IVY_ANALYSIS_SYSTEM_PROMPT,
    messages: [{ role: 'user', content: prompt }],
  });

  const content = response.content[0];
  if (content.type !== 'text') {
    throw new Error('Unexpected response type');
  }

  // Parse and validate response
  const parsed = parseJsonResponse(content.text);
  const validated = IvyAnalysisResponseSchema.parse(parsed);

  // Recalculate overall score to ensure consistency
  const calculatedScore = calculateIvyScore({
    authenticity: validated.scores.authenticity.score,
    schoolFit: validated.scores.school_fit.score,
    reflection: validated.scores.reflection.score,
    structure: validated.scores.structure.score,
    specificity: validated.scores.specificity.score,
    clarity: validated.scores.clarity.score,
    mechanics: validated.scores.mechanics.score,
  });

  validated.overall.score_100 = calculatedScore;

  return validated;
}

/**
 * School fit analysis only (faster, cheaper)
 */
export async function analyzeSchoolFit(
  essayText: string,
  schoolId: string
): Promise<SchoolFitResponse> {
  const validation = validateEssayInput(essayText);
  if (!validation.valid) {
    throw new Error(`Invalid input: ${validation.errors.join(', ')}`);
  }

  if (!validateSchoolId(schoolId)) {
    throw new Error(`Invalid school ID: ${schoolId}`);
  }

  const prompt = buildSchoolFitPrompt({
    essayText: validation.sanitizedText || essayText,
    schoolId,
  });

  const response = await anthropic.messages.create({
    model: MODELS.CLAUDE_HAIKU, // Use Haiku for speed
    max_tokens: 2048,
    temperature: 0.3,
    system: IVY_FIT_SYSTEM_PROMPT,
    messages: [{ role: 'user', content: prompt }],
  });

  const content = response.content[0];
  if (content.type !== 'text') {
    throw new Error('Unexpected response type');
  }

  const parsed = parseJsonResponse(content.text);
  const validated = SchoolFitResponseSchema.parse(parsed);

  // Recalculate fit score using our algorithm
  validated.fit_score = calculateFitScore(
    validated.fit_signals_found,
    schoolId
  );

  return validated;
}

// ============================================================================
// REWRITE SUGGESTIONS
// ============================================================================

export const IvyRewriteResponseSchema = z.object({
  rewrites: z.array(z.object({
    paragraph_index: z.number(),
    goal: z.string(),
    original: z.string(),
    suggested: z.string(),
    changes_made: z.array(z.string()),
    voice_preserved: z.boolean(),
    school_fit_added: z.boolean(),
  })),
  overall_notes: z.string(),
});

export type IvyRewriteResponse = z.infer<typeof IvyRewriteResponseSchema>;

interface GenerateIvyRewritesParams {
  essayText: string;
  schoolId: string;
  goals: ('school_fit' | 'specificity' | 'voice' | 'structure' | 'clarity')[];
  toneSample?: string;
}

/**
 * Generate Ivy-specific rewrite suggestions
 */
export async function generateIvyRewrites(
  params: GenerateIvyRewritesParams
): Promise<IvyRewriteResponse> {
  const validation = validateEssayInput(params.essayText);
  if (!validation.valid) {
    throw new Error(`Invalid input: ${validation.errors.join(', ')}`);
  }

  if (!validateSchoolId(params.schoolId)) {
    throw new Error(`Invalid school ID: ${params.schoolId}`);
  }

  const prompt = buildIvyRewritePrompt({
    essayText: validation.sanitizedText || params.essayText,
    schoolId: params.schoolId,
    goals: params.goals,
    toneSample: params.toneSample,
  });

  const response = await anthropic.messages.create({
    model: MODELS.CLAUDE_SONNET,
    max_tokens: 4096,
    temperature: 0.5, // Slightly higher for creative suggestions
    system: 'You improve essays while preserving voice. Return valid JSON only.',
    messages: [{ role: 'user', content: prompt }],
  });

  const content = response.content[0];
  if (content.type !== 'text') {
    throw new Error('Unexpected response type');
  }

  const parsed = parseJsonResponse(content.text);
  return IvyRewriteResponseSchema.parse(parsed);
}

// ============================================================================
// TONE COMPARISON
// ============================================================================

interface ToneComparisonResult {
  similarity: number;
  driftDetected: boolean;
  assessment: 'authentic' | 'slight_drift' | 'significant_drift';
  notes: string;
}

/**
 * Compare essay tone with student's sample
 */
export async function compareToneWithSample(
  essayText: string,
  toneSample: string
): Promise<ToneComparisonResult> {
  const [essayEmbedding, sampleEmbedding] = await Promise.all([
    generateEmbedding(essayText),
    generateEmbedding(toneSample),
  ]);

  const similarity = cosineSimilarity(essayEmbedding, sampleEmbedding);

  let assessment: ToneComparisonResult['assessment'];
  let notes: string;

  if (similarity >= 0.85) {
    assessment = 'authentic';
    notes = 'Essay voice strongly matches your natural writing style.';
  } else if (similarity >= 0.70) {
    assessment = 'slight_drift';
    notes = 'Essay voice is mostly consistent but shows some variation from your natural style.';
  } else {
    assessment = 'significant_drift';
    notes = 'Essay voice differs notably from your natural writing style. Consider if changes feel authentic.';
  }

  return {
    similarity: Math.round(similarity * 100) / 100,
    driftDetected: similarity < 0.75,
    assessment,
    notes,
  };
}

// ============================================================================
// PROMPT MATCHING
// ============================================================================

interface PromptSuggestion {
  schoolId: string;
  promptId: string;
  title: string;
  wordLimit: number;
  tips: string[];
}

/**
 * Get essay prompts for a specific school
 */
export function getIvyPromptSuggestions(schoolId: string): PromptSuggestion[] {
  const prompts = getSchoolPrompts(schoolId);
  const school = getIvySchool(schoolId);

  if (!school) return [];

  return prompts.map(p => ({
    schoolId,
    promptId: p.id,
    title: p.title,
    wordLimit: p.wordLimit,
    tips: p.tips,
  }));
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Parse JSON from AI response (handles markdown code blocks)
 */
function parseJsonResponse(text: string): unknown {
  // Try to extract JSON from markdown code blocks
  const jsonMatch = text.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/);
  const jsonText = jsonMatch ? jsonMatch[1] : text;

  // Clean up common issues
  const cleaned = jsonText
    .replace(/[\u0000-\u001F]+/g, ' ') // Remove control characters
    .replace(/,\s*([}\]])/g, '$1');     // Remove trailing commas

  try {
    return JSON.parse(cleaned);
  } catch (error) {
    // Try to find JSON object in the text
    const objectMatch = text.match(/\{[\s\S]*\}/);
    if (objectMatch) {
      return JSON.parse(objectMatch[0]);
    }
    throw new Error(`Failed to parse JSON: ${(error as Error).message}`);
  }
}

/**
 * Count words in text
 */
export function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(w => w.length > 0).length;
}

/**
 * Check if essay is within word limit
 */
export function checkWordLimit(
  text: string,
  limit: number
): { count: number; withinLimit: boolean; overage: number } {
  const count = countWords(text);
  return {
    count,
    withinLimit: count <= limit,
    overage: Math.max(0, count - limit),
  };
}
