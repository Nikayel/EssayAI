import { anthropic, MODELS, generateEmbedding, cosineSimilarity } from './clients';
import {
  ANALYSIS_SYSTEM_PROMPT,
  COMMONS_CHECK_SYSTEM_PROMPT,
  REWRITE_SYSTEM_PROMPT,
  createAnalysisPrompt,
  createRewritePrompt,
  createCommonsCheckPrompt,
  createSchoolFitPrompt,
  calculateOverallScore,
} from './prompts';
import { AnalysisResponseSchema, RewriteResponseSchema, SchoolFitAlignmentSchema } from '../validations/ai-schemas';
import type { AnalysisResponse, RewriteResponse, SchoolFitAlignment, ToneComparisonResult } from '@/types/ai';

/**
 * Retry logic for AI calls
 */
async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  delayMs = 1000
): Promise<T> {
  let lastError: Error | undefined;

  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      if (i < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, delayMs * (i + 1)));
      }
    }
  }

  throw lastError;
}

/**
 * Parse and validate JSON response from AI
 */
function parseAndValidate<T>(
  text: string,
  schema: any,
  fallbackParser?: (text: string) => any
): T {
  try {
    // Try to extract JSON from markdown code blocks
    const jsonMatch = text.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/);
    const jsonText = jsonMatch ? jsonMatch[1] : text;

    const parsed = JSON.parse(jsonText);
    const validated = schema.parse(parsed);
    return validated as T;
  } catch (error) {
    console.error('JSON parsing error:', error);

    // Try fallback parser if provided
    if (fallbackParser) {
      try {
        const fallbackResult = fallbackParser(text);
        return schema.parse(fallbackResult) as T;
      } catch (fallbackError) {
        console.error('Fallback parser error:', fallbackError);
      }
    }

    throw new Error(`Failed to parse AI response: ${(error as Error).message}`);
  }
}

/**
 * Commons Check - Fast screening (uses Haiku)
 */
export async function runCommonsCheck(essayText: string): Promise<{
  commons_check: AnalysisResponse['commons_check'];
  quick_tips: string[];
}> {
  return withRetry(async () => {
    const response = await anthropic.messages.create({
      model: MODELS.CLAUDE_HAIKU,
      max_tokens: 2048,
      temperature: 0.3,
      system: COMMONS_CHECK_SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: createCommonsCheckPrompt(essayText),
        },
      ],
    });

    const content = response.content[0];
    if (content.type !== 'text') {
      throw new Error('Unexpected response type from Claude');
    }

    return parseAndValidate(content.text, null); // Quick validation
  });
}

/**
 * Full Essay Analysis (uses Sonnet)
 */
export async function analyzeEssay(params: {
  essayText: string;
  essayType: string;
  school?: string;
  prompt: string;
  wordLimit?: number;
  hasPreviousDraft?: boolean;
  toneSample?: string;
}): Promise<AnalysisResponse> {
  return withRetry(async () => {
    const response = await anthropic.messages.create({
      model: MODELS.CLAUDE_SONNET,
      max_tokens: 4096,
      temperature: 0.3,
      system: ANALYSIS_SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: createAnalysisPrompt({
            essayType: params.essayType,
            school: params.school,
            prompt: params.prompt,
            wordLimit: params.wordLimit,
            hasPreviousDraft: params.hasPreviousDraft || false,
            toneSample: params.toneSample,
            essayText: params.essayText,
          }),
        },
      ],
    });

    const content = response.content[0];
    if (content.type !== 'text') {
      throw new Error('Unexpected response type from Claude');
    }

    const analysis = parseAndValidate<AnalysisResponse>(
      content.text,
      AnalysisResponseSchema
    );

    // Verify and recalculate overall score to ensure consistency
    const calculatedScore = calculateOverallScore({
      authenticity: analysis.scores.authenticity.score,
      reflection: analysis.scores.reflection.score,
      structure: analysis.scores.structure.score,
      specificity_fit: analysis.scores.specificity_fit.score,
      clarity_style: analysis.scores.clarity_style.score,
      mechanics: analysis.scores.mechanics.score,
      ethics_originality: analysis.scores.ethics_originality.score,
    });

    analysis.overall.score_100 = calculatedScore;

    return analysis;
  });
}

/**
 * Generate Rewrite Suggestions
 */
export async function generateRewrites(params: {
  essayText: string;
  goals: string[];
  toneSample?: string;
}): Promise<RewriteResponse> {
  return withRetry(async () => {
    const response = await anthropic.messages.create({
      model: MODELS.CLAUDE_SONNET,
      max_tokens: 4096,
      temperature: 0.5,
      system: REWRITE_SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: createRewritePrompt(params),
        },
      ],
    });

    const content = response.content[0];
    if (content.type !== 'text') {
      throw new Error('Unexpected response type from Claude');
    }

    return parseAndValidate<RewriteResponse>(
      content.text,
      RewriteResponseSchema
    );
  });
}

/**
 * School Fit Analysis
 */
export async function analyzeSchoolFit(params: {
  essayText: string;
  schoolFacts: string;
}): Promise<SchoolFitAlignment> {
  return withRetry(async () => {
    const response = await anthropic.messages.create({
      model: MODELS.CLAUDE_HAIKU,
      max_tokens: 1024,
      temperature: 0.3,
      system: 'Analyze essay-school alignment. Return JSON only.',
      messages: [
        {
          role: 'user',
          content: createSchoolFitPrompt(params),
        },
      ],
    });

    const content = response.content[0];
    if (content.type !== 'text') {
      throw new Error('Unexpected response type from Claude');
    }

    return parseAndValidate<SchoolFitAlignment>(
      content.text,
      SchoolFitAlignmentSchema
    );
  });
}

/**
 * Compare Tone with Sample
 */
export async function compareTone(params: {
  essayText: string;
  toneSample: string;
  threshold?: number;
}): Promise<ToneComparisonResult> {
  const threshold = params.threshold || 0.75;

  // Generate embeddings for both texts
  const [essayEmbedding, sampleEmbedding] = await Promise.all([
    generateEmbedding(params.essayText),
    generateEmbedding(params.toneSample),
  ]);

  // Calculate similarity
  const similarity = cosineSimilarity(essayEmbedding, sampleEmbedding);
  const driftDetected = similarity < threshold;

  return {
    similarity_score: similarity,
    drift_detected: driftDetected,
    notes: driftDetected
      ? `Tone drift detected. Similarity: ${(similarity * 100).toFixed(1)}%. Consider reviewing voice consistency.`
      : `Tone is consistent with sample. Similarity: ${(similarity * 100).toFixed(1)}%.`,
  };
}

/**
 * Word count utility
 */
export function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(word => word.length > 0).length;
}
