import Anthropic from '@anthropic-ai/sdk';
import OpenAI from 'openai';

/**
 * Initialize AI clients
 */

// Anthropic Claude client
export const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

// OpenAI client
export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

/**
 * Model configurations
 */
export const MODELS = {
  // Fast and cheap for Commons Check
  CLAUDE_HAIKU: 'claude-3-haiku-20240307',

  // Balanced for full analysis
  CLAUDE_SONNET: 'claude-3-5-sonnet-20241022',

  // For embeddings
  OPENAI_EMBEDDING: 'text-embedding-3-small',

  // For structured outputs (if needed)
  OPENAI_GPT4O_MINI: 'gpt-4o-mini',
} as const;

/**
 * Generate text embedding for tone comparison
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  const response = await openai.embeddings.create({
    model: MODELS.OPENAI_EMBEDDING,
    input: text,
  });

  return response.data[0].embedding;
}

/**
 * Calculate cosine similarity between two embeddings
 */
export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    throw new Error('Embeddings must have the same length');
  }

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}
