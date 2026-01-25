import Anthropic from '@anthropic-ai/sdk';
import OpenAI from 'openai';

/**
 * Lazy-initialized AI clients
 * These are initialized on first use to avoid build-time errors when env vars are missing
 */

let _anthropic: Anthropic | null = null;
let _openai: OpenAI | null = null;

// Anthropic Claude client (lazy initialization)
export function getAnthropic(): Anthropic {
  if (!_anthropic) {
    if (!process.env.ANTHROPIC_API_KEY) {
      throw new Error('ANTHROPIC_API_KEY environment variable is required');
    }
    _anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });
  }
  return _anthropic;
}

// OpenAI client (lazy initialization)
export function getOpenAI(): OpenAI {
  if (!_openai) {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY environment variable is required');
    }
    _openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }
  return _openai;
}

// Legacy exports for backwards compatibility - use getAnthropic() and getOpenAI() instead
export const anthropic = {
  get messages() { return getAnthropic().messages; },
  get beta() { return getAnthropic().beta; },
};

export const openai = {
  get embeddings() { return getOpenAI().embeddings; },
  get chat() { return getOpenAI().chat; },
};

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
