/**
 * RAG Utility Functions
 * Centralized helpers to reduce code duplication and improve maintainability
 */

import type { Embedding } from './types';

// =============================================================================
// TIMEOUT UTILITIES
// =============================================================================

/**
 * Wrap a promise with a timeout
 * Returns the promise result or throws if timeout exceeded
 */
export async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  operation: string = 'Operation'
): Promise<T> {
  let timeoutId: NodeJS.Timeout;

  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new Error(`${operation} timed out after ${timeoutMs}ms`));
    }, timeoutMs);
  });

  try {
    const result = await Promise.race([promise, timeoutPromise]);
    clearTimeout(timeoutId!);
    return result;
  } catch (error) {
    clearTimeout(timeoutId!);
    throw error;
  }
}

/**
 * Wrap multiple promises with individual timeouts
 * Returns array of results with nulls for failed/timed-out promises
 */
export async function allWithTimeout<T>(
  promises: Promise<T>[],
  timeoutMs: number,
  operation: string = 'Operation'
): Promise<(T | null)[]> {
  const wrappedPromises = promises.map((p, i) =>
    withTimeout(p, timeoutMs, `${operation}[${i}]`)
      .catch(error => {
        console.warn(`${operation}[${i}] failed:`, error.message);
        return null;
      })
  );

  return Promise.all(wrappedPromises);
}

/**
 * Retry with exponential backoff
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: {
    maxRetries?: number;
    initialDelayMs?: number;
    maxDelayMs?: number;
    operation?: string;
  } = {}
): Promise<T> {
  const {
    maxRetries = 3,
    initialDelayMs = 200,
    maxDelayMs = 5000,
    operation = 'Operation',
  } = options;

  let lastError: Error | undefined;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;

      if (attempt === maxRetries) break;

      const delay = Math.min(
        initialDelayMs * Math.pow(2, attempt),
        maxDelayMs
      );

      console.warn(
        `${operation} attempt ${attempt + 1} failed, retrying in ${delay}ms:`,
        lastError.message
      );

      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError;
}

// =============================================================================
// VALIDATION UTILITIES
// =============================================================================

/**
 * Validate embedding has correct dimensions
 */
export function validateEmbedding(
  embedding: unknown,
  expectedDimensions: number = 1536
): embedding is Embedding {
  if (!Array.isArray(embedding)) {
    return false;
  }

  if (embedding.length !== expectedDimensions) {
    console.warn(
      `Invalid embedding dimensions: expected ${expectedDimensions}, got ${embedding.length}`
    );
    return false;
  }

  // Check first and last few values are valid numbers
  const checkIndices = [0, 1, embedding.length - 2, embedding.length - 1];
  for (const i of checkIndices) {
    if (typeof embedding[i] !== 'number' || isNaN(embedding[i])) {
      return false;
    }
  }

  return true;
}

/**
 * Safely cast to embedding with validation
 */
export function safeEmbedding(value: unknown): Embedding | null {
  if (validateEmbedding(value)) {
    return value;
  }
  return null;
}

/**
 * Validate and normalize school ID
 */
export function normalizeSchoolId(schoolId: string): string | null {
  const validSchools = new Set([
    'harvard', 'yale', 'princeton', 'columbia',
    'brown', 'dartmouth', 'cornell', 'upenn'
  ]);

  const normalized = schoolId.toLowerCase().trim();

  if (validSchools.has(normalized)) {
    return normalized;
  }

  // Handle common variations
  const aliases: Record<string, string> = {
    'penn': 'upenn',
    'u penn': 'upenn',
    'university of pennsylvania': 'upenn',
    'harvard university': 'harvard',
    'yale university': 'yale',
    'princeton university': 'princeton',
    'columbia university': 'columbia',
    'brown university': 'brown',
    'dartmouth college': 'dartmouth',
    'cornell university': 'cornell',
  };

  return aliases[normalized] || null;
}

/**
 * Validate essay type
 */
export function normalizeEssayType(essayType: string): string | null {
  const validTypes = new Set([
    'PERSONAL_STATEMENT', 'WHY_US', 'SUPPLEMENTAL', 'ACTIVITY', 'OTHER'
  ]);

  const normalized = essayType.toUpperCase().trim().replace(/\s+/g, '_');

  if (validTypes.has(normalized)) {
    return normalized;
  }

  // Handle common variations
  const aliases: Record<string, string> = {
    'PERSONAL': 'PERSONAL_STATEMENT',
    'PS': 'PERSONAL_STATEMENT',
    'WHY': 'WHY_US',
    'WHY_SCHOOL': 'WHY_US',
    'SUPPLEMENT': 'SUPPLEMENTAL',
    'ACTIVITIES': 'ACTIVITY',
  };

  return aliases[normalized] || null;
}

// =============================================================================
// FILTER BUILDING UTILITIES
// =============================================================================

/**
 * Build Prisma where clause for school/type filtering
 */
export function buildSchoolTypeFilter(options: {
  schoolId?: string;
  essayType?: string;
  includeGeneral?: boolean; // Include items with null school/type
}): Record<string, unknown> {
  const { schoolId, essayType, includeGeneral = true } = options;

  const where: Record<string, unknown> = {};

  if (schoolId) {
    const normalized = normalizeSchoolId(schoolId);
    if (normalized) {
      if (includeGeneral) {
        where.OR = [{ schoolId: null }, { schoolId: normalized }];
      } else {
        where.schoolId = normalized;
      }
    }
  }

  if (essayType) {
    const normalized = normalizeEssayType(essayType);
    if (normalized) {
      const essayTypeCondition = includeGeneral
        ? [{ essayType: null }, { essayType: normalized }]
        : [{ essayType: normalized }];

      if (where.OR) {
        // Combine with existing OR
        where.AND = [
          { OR: where.OR },
          { OR: essayTypeCondition },
        ];
        delete where.OR;
      } else {
        where.OR = essayTypeCondition;
      }
    }
  }

  return where;
}

// =============================================================================
// STRING UTILITIES
// =============================================================================

/**
 * Truncate text safely at word boundary
 */
export function truncateAtWord(
  text: string,
  maxLength: number,
  suffix: string = '...'
): string {
  if (text.length <= maxLength) {
    return text;
  }

  // Leave room for suffix
  const targetLength = maxLength - suffix.length;
  const truncated = text.slice(0, targetLength);

  // Find last word boundary
  const lastSpace = truncated.lastIndexOf(' ');
  const lastNewline = truncated.lastIndexOf('\n');
  const lastBreak = Math.max(lastSpace, lastNewline);

  // If we found a break point in the last 30% of the text, use it
  if (lastBreak > targetLength * 0.7) {
    return truncated.slice(0, lastBreak).trimEnd() + suffix;
  }

  return truncated.trimEnd() + suffix;
}

/**
 * Escape special regex characters in a string
 */
export function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Sanitize string for safe interpolation (no HTML/script)
 */
export function sanitizeString(str: string): string {
  return str
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, '')
    .replace(/[\u0000-\u001F]/g, ' ')
    .trim();
}

/**
 * Count words accurately
 */
export function countWords(text: string): number {
  return text
    .trim()
    .split(/\s+/)
    .filter(word => word.length > 0)
    .length;
}

// =============================================================================
// HASH UTILITIES
// =============================================================================

/**
 * Simple hash for cache keys (not cryptographic)
 */
export function simpleHash(str: string): string {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash) ^ str.charCodeAt(i);
  }
  return Math.abs(hash).toString(36);
}

/**
 * Create content hash for deduplication
 */
export function contentHash(content: string): string {
  // Use first 200 chars + length for fast comparison
  const normalized = content.toLowerCase().trim().slice(0, 200);
  return `${normalized.length}:${simpleHash(normalized)}`;
}

// =============================================================================
// ARRAY UTILITIES
// =============================================================================

/**
 * Safely access array element
 */
export function safeArrayAccess<T>(
  arr: T[] | undefined | null,
  index: number
): T | undefined {
  if (!arr || !Array.isArray(arr) || index < 0 || index >= arr.length) {
    return undefined;
  }
  return arr[index];
}

/**
 * Chunk array into smaller arrays
 */
export function chunkArray<T>(array: T[], chunkSize: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += chunkSize) {
    chunks.push(array.slice(i, i + chunkSize));
  }
  return chunks;
}

/**
 * Deduplicate array by key
 */
export function dedupeBy<T>(array: T[], keyFn: (item: T) => string): T[] {
  const seen = new Set<string>();
  return array.filter(item => {
    const key = keyFn(item);
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}

// =============================================================================
// ERROR UTILITIES
// =============================================================================

/**
 * Extract error message safely
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  return 'Unknown error';
}

/**
 * Create typed error with context
 */
export class RAGError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly context?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'RAGError';
  }
}

// =============================================================================
// EMBEDDING QUALITY UTILITIES
// =============================================================================

/**
 * Calculate statistics for a set of embeddings
 * Useful for monitoring RAG data quality
 */
export function calculateEmbeddingStats<T>(
  items: T[],
  getEmbedding: (item: T) => unknown
): {
  total: number;
  valid: number;
  invalid: number;
  validPercent: number;
  issues: string[];
} {
  const issues: string[] = [];
  let valid = 0;
  let invalid = 0;

  for (const item of items) {
    const embedding = getEmbedding(item);
    if (validateEmbedding(embedding)) {
      valid++;
    } else {
      invalid++;
      // Diagnose issue
      if (!embedding) {
        if (!issues.includes('null_embedding')) issues.push('null_embedding');
      } else if (!Array.isArray(embedding)) {
        if (!issues.includes('not_array')) issues.push('not_array');
      } else if ((embedding as number[]).length !== 1536) {
        if (!issues.includes('wrong_dimensions')) issues.push('wrong_dimensions');
      } else {
        if (!issues.includes('invalid_values')) issues.push('invalid_values');
      }
    }
  }

  return {
    total: items.length,
    valid,
    invalid,
    validPercent: items.length > 0 ? Math.round((valid / items.length) * 100) : 100,
    issues,
  };
}

/**
 * Filter items by valid embedding and log statistics
 */
export function filterByValidEmbedding<T>(
  items: T[],
  getEmbedding: (item: T) => unknown,
  logContext?: string
): T[] {
  const stats = calculateEmbeddingStats(items, getEmbedding);

  if (stats.invalid > 0 && logContext) {
    console.warn(
      `[RAG ${logContext}] ${stats.invalid}/${stats.total} items have invalid embeddings (${stats.issues.join(', ')})`
    );
  }

  return items.filter(item => validateEmbedding(getEmbedding(item)));
}
