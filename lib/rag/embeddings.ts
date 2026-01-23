/**
 * RAG Embedding Generation Module
 * Handles single and batch embedding generation with caching
 */

import { openai } from '../ai/clients';
import {
  EMBEDDING_MODEL,
  EMBEDDING_DIMENSIONS,
  type Embedding,
  type EmbeddingResult,
  type BatchEmbeddingResult,
} from './types';
import { embeddingCache, generateCacheKey, getCacheTTL } from './cache';
import { withTimeout, withRetry, validateEmbedding, chunkArray } from './utils';

// =============================================================================
// CONFIGURATION
// =============================================================================

const CONFIG = {
  // OpenAI API timeout
  apiTimeoutMs: 30000,

  // Maximum tokens per batch (OpenAI limit is 8191 per input)
  maxTokensPerInput: 8000,

  // Batch size for embeddings
  batchSize: 100,

  // Retry configuration
  maxRetries: 3,
  initialRetryDelayMs: 500,
};

/**
 * Clean expired cache entries
 */
export function cleanExpiredCache(): number {
  return embeddingCache.cleanExpired();
}

// =============================================================================
// CORE EMBEDDING FUNCTIONS
// =============================================================================

/**
 * Generate embedding for a single text
 * Uses cache when available, with retry and timeout handling
 */
export async function generateEmbedding(
  text: string,
  type: string = 'query'
): Promise<EmbeddingResult> {
  // Validate input
  if (!text || typeof text !== 'string') {
    throw new Error('Invalid input: text must be a non-empty string');
  }

  // Check cache first
  const cacheKey = generateCacheKey(text, type);
  const cached = embeddingCache.get(cacheKey);

  if (cached) {
    return {
      embedding: cached.value,
      tokenCount: cached.tokenCount,
      cached: true,
    };
  }

  // Prepare text - trim and limit length
  const preparedText = prepareTextForEmbedding(text);

  // Generate embedding via OpenAI with retry and timeout
  const response = await withRetry(
    () => withTimeout(
      openai.embeddings.create({
        model: EMBEDDING_MODEL,
        input: preparedText,
      }),
      CONFIG.apiTimeoutMs,
      'OpenAI embedding generation'
    ),
    {
      maxRetries: CONFIG.maxRetries,
      initialDelayMs: CONFIG.initialRetryDelayMs,
      operation: 'Generate embedding',
    }
  );

  // Validate response
  if (!response.data?.[0]?.embedding) {
    throw new Error('Invalid response from OpenAI: no embedding returned');
  }

  const embedding = response.data[0].embedding;
  const tokenCount = response.usage?.total_tokens || estimateTokenCount(text);

  // Validate embedding dimensions
  if (!validateEmbedding(embedding, EMBEDDING_DIMENSIONS)) {
    throw new Error(`Invalid embedding: expected ${EMBEDDING_DIMENSIONS} dimensions, got ${(embedding as number[]).length}`);
  }

  // Cache the result
  embeddingCache.set(cacheKey, embedding, tokenCount, getCacheTTL(type));

  return {
    embedding,
    tokenCount,
    cached: false,
  };
}

/**
 * Generate embeddings for multiple texts (batch)
 * More efficient than individual calls, with proper error handling
 */
export async function batchGenerateEmbeddings(
  texts: string[],
  type: string = 'query'
): Promise<BatchEmbeddingResult> {
  if (!texts || texts.length === 0) {
    return { embeddings: [], totalTokens: 0, cached: 0 };
  }

  // Validate inputs
  const validTexts = texts.filter(t => t && typeof t === 'string');
  if (validTexts.length !== texts.length) {
    console.warn(`Filtered ${texts.length - validTexts.length} invalid texts from batch`);
  }

  // Separate cached and uncached texts
  const results: (Embedding | null)[] = new Array(texts.length).fill(null);
  const uncachedIndices: number[] = [];
  const uncachedTexts: string[] = [];
  let cachedCount = 0;
  let totalTokens = 0;

  // Check cache for each text
  for (let i = 0; i < texts.length; i++) {
    if (!texts[i]) {
      continue;
    }

    const cacheKey = generateCacheKey(texts[i], type);
    const cached = embeddingCache.get(cacheKey);

    if (cached) {
      results[i] = cached.value;
      totalTokens += cached.tokenCount;
      cachedCount++;
    } else {
      uncachedIndices.push(i);
      uncachedTexts.push(prepareTextForEmbedding(texts[i]));
    }
  }

  // Generate embeddings for uncached texts
  if (uncachedTexts.length > 0) {
    const batches = chunkArray(uncachedTexts, CONFIG.batchSize);
    const batchIndexChunks = chunkArray(uncachedIndices, CONFIG.batchSize);

    for (let batchIdx = 0; batchIdx < batches.length; batchIdx++) {
      const batch = batches[batchIdx];
      const batchIndices = batchIndexChunks[batchIdx];

      try {
        const response = await withRetry(
          () => withTimeout(
            openai.embeddings.create({
              model: EMBEDDING_MODEL,
              input: batch,
            }),
            CONFIG.apiTimeoutMs,
            `Batch embedding generation [${batchIdx + 1}/${batches.length}]`
          ),
          {
            maxRetries: CONFIG.maxRetries,
            initialDelayMs: CONFIG.initialRetryDelayMs,
            operation: `Batch ${batchIdx + 1}`,
          }
        );

        totalTokens += response.usage?.total_tokens || 0;

        // Store results and cache
        for (let j = 0; j < response.data.length; j++) {
          const embedding = response.data[j].embedding;
          const originalIndex = batchIndices[j];

          // Validate before storing
          if (validateEmbedding(embedding, EMBEDDING_DIMENSIONS)) {
            results[originalIndex] = embedding;

            // Cache the result
            const cacheKey = generateCacheKey(texts[originalIndex], type);
            const tokenCount = estimateTokenCount(texts[originalIndex]);
            embeddingCache.set(cacheKey, embedding, tokenCount, getCacheTTL(type));
          } else {
            console.warn(`Invalid embedding at index ${originalIndex}, skipping cache`);
          }
        }
      } catch (error) {
        // Log error but continue with remaining batches
        console.error(`Batch ${batchIdx + 1} failed:`, error);
        // Mark failed items as null (already initialized as null)
      }
    }
  }

  return {
    embeddings: results as Embedding[],
    totalTokens,
    cached: cachedCount,
  };
}

// =============================================================================
// SIMILARITY FUNCTIONS
// =============================================================================

/**
 * Calculate cosine similarity between two embeddings
 */
export function cosineSimilarity(a: Embedding, b: Embedding): number {
  if (a.length !== b.length) {
    throw new Error(`Embedding dimensions don't match: ${a.length} vs ${b.length}`);
  }

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  const denominator = Math.sqrt(normA) * Math.sqrt(normB);
  if (denominator === 0) return 0;

  return dotProduct / denominator;
}

/**
 * Find top-K most similar embeddings from a list
 */
export function findTopKSimilar(
  queryEmbedding: Embedding,
  candidates: Array<{ id: string; embedding: Embedding }>,
  topK: number,
  threshold: number = 0
): Array<{ id: string; similarity: number }> {
  const similarities = candidates.map(candidate => ({
    id: candidate.id,
    similarity: cosineSimilarity(queryEmbedding, candidate.embedding),
  }));

  return similarities
    .filter(s => s.similarity >= threshold)
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, topK);
}

/**
 * Calculate average similarity for a set of embeddings
 */
export function averageSimilarity(
  queryEmbedding: Embedding,
  embeddings: Embedding[]
): number {
  if (embeddings.length === 0) return 0;

  const total = embeddings.reduce(
    (sum, emb) => sum + cosineSimilarity(queryEmbedding, emb),
    0
  );

  return total / embeddings.length;
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Prepare text for embedding generation
 * - Trims whitespace
 * - Limits length to avoid token limits
 * - Normalizes newlines
 */
function prepareTextForEmbedding(text: string): string {
  // OpenAI's text-embedding-3-small has 8191 token limit
  // Approximate: 1 token ~= 4 characters for English
  const MAX_CHARS = 30000;

  let prepared = text
    .trim()
    .replace(/\r\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n');

  if (prepared.length > MAX_CHARS) {
    // Truncate intelligently at sentence boundary
    prepared = prepared.slice(0, MAX_CHARS);
    const lastPeriod = prepared.lastIndexOf('.');
    if (lastPeriod > MAX_CHARS * 0.8) {
      prepared = prepared.slice(0, lastPeriod + 1);
    }
  }

  return prepared;
}

/**
 * Estimate token count from text
 * Rough approximation: 1 token ~= 4 characters for English
 */
function estimateTokenCount(text: string): number {
  return Math.ceil(text.length / 4);
}

// validateEmbedding is imported from utils.ts - re-export for backwards compatibility
export { validateEmbedding } from './utils';

/**
 * Chunk text for embedding long documents
 * Splits into overlapping chunks for better retrieval
 */
export function chunkText(
  text: string,
  chunkSize: number = 500,
  overlap: number = 100
): string[] {
  const words = text.split(/\s+/);
  const chunks: string[] = [];

  for (let i = 0; i < words.length; i += chunkSize - overlap) {
    const chunk = words.slice(i, i + chunkSize).join(' ');
    if (chunk.trim()) {
      chunks.push(chunk);
    }
  }

  return chunks;
}

/**
 * Get embedding cache stats for monitoring
 * Uses the LRU cache's built-in stats tracking
 */
export function getCacheStats(): {
  size: number;
  hitRate: number;
  memoryEstimate: string;
  maxSize: number;
  hits: number;
  misses: number;
} {
  const stats = embeddingCache.getStats();

  // Format memory estimate
  const memoryEstimate = stats.memoryEstimateKB > 1024
    ? `${(stats.memoryEstimateKB / 1024).toFixed(1)} MB`
    : `${stats.memoryEstimateKB.toFixed(1)} KB`;

  return {
    size: stats.size,
    hitRate: stats.hitRate,
    memoryEstimate,
    maxSize: stats.maxSize,
    hits: stats.hits,
    misses: stats.misses,
  };
}
