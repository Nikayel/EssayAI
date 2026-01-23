/**
 * LRU Cache Implementation for RAG Embeddings
 * Thread-safe, bounded cache with TTL support
 */

import { simpleHash } from './utils';
import { CACHE_CONFIG, type Embedding } from './types';

// =============================================================================
// TYPES
// =============================================================================

interface CacheEntry<T> {
  value: T;
  tokenCount: number;
  expiresAt: number;
  lastAccessedAt: number;
}

interface CacheStats {
  size: number;
  maxSize: number;
  hits: number;
  misses: number;
  hitRate: number;
  memoryEstimateKB: number;
}

// =============================================================================
// LRU CACHE IMPLEMENTATION
// =============================================================================

export class LRUCache<T> {
  private cache: Map<string, CacheEntry<T>> = new Map();
  private maxSize: number;
  private hits: number = 0;
  private misses: number = 0;
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor(maxSize: number = 1000) {
    this.maxSize = maxSize;
    this.startCleanupInterval();
  }

  /**
   * Get value from cache
   */
  get(key: string): { value: T; tokenCount: number } | null {
    const entry = this.cache.get(key);

    if (!entry) {
      this.misses++;
      return null;
    }

    // Check expiration
    if (entry.expiresAt < Date.now()) {
      this.cache.delete(key);
      this.misses++;
      return null;
    }

    // Update last accessed time
    entry.lastAccessedAt = Date.now();
    this.hits++;

    return { value: entry.value, tokenCount: entry.tokenCount };
  }

  /**
   * Set value in cache
   */
  set(
    key: string,
    value: T,
    tokenCount: number,
    ttlMs: number
  ): void {
    // Evict if at max capacity
    if (this.cache.size >= this.maxSize) {
      this.evictLRU();
    }

    this.cache.set(key, {
      value,
      tokenCount,
      expiresAt: Date.now() + ttlMs,
      lastAccessedAt: Date.now(),
    });
  }

  /**
   * Check if key exists and is valid
   */
  has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;
    if (entry.expiresAt < Date.now()) {
      this.cache.delete(key);
      return false;
    }
    return true;
  }

  /**
   * Delete key from cache
   */
  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  /**
   * Clear all entries
   */
  clear(): void {
    this.cache.clear();
    this.hits = 0;
    this.misses = 0;
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats {
    const totalRequests = this.hits + this.misses;

    // Estimate memory: ~12KB per 1536-dim embedding + overhead
    const memoryEstimateKB = this.cache.size * 13;

    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      hits: this.hits,
      misses: this.misses,
      hitRate: totalRequests > 0 ? this.hits / totalRequests : 0,
      memoryEstimateKB,
    };
  }

  /**
   * Evict least recently used entry
   */
  private evictLRU(): void {
    let oldestKey: string | null = null;
    let oldestTime = Infinity;

    for (const [key, entry] of this.cache.entries()) {
      if (entry.lastAccessedAt < oldestTime) {
        oldestTime = entry.lastAccessedAt;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey);
    }
  }

  /**
   * Clean up expired entries
   */
  cleanExpired(): number {
    const now = Date.now();
    let cleaned = 0;

    for (const [key, entry] of this.cache.entries()) {
      if (entry.expiresAt < now) {
        this.cache.delete(key);
        cleaned++;
      }
    }

    return cleaned;
  }

  /**
   * Start automatic cleanup interval
   */
  private startCleanupInterval(): void {
    // Clean every 5 minutes
    this.cleanupInterval = setInterval(() => {
      this.cleanExpired();
    }, 5 * 60 * 1000);

    // Don't prevent process exit
    if (this.cleanupInterval.unref) {
      this.cleanupInterval.unref();
    }
  }

  /**
   * Stop cleanup interval (for cleanup)
   */
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    this.cache.clear();
  }
}

// =============================================================================
// EMBEDDING CACHE SINGLETON
// =============================================================================

// Global embedding cache with 2000 entry limit (~26MB max memory)
export const embeddingCache = new LRUCache<Embedding>(2000);

// =============================================================================
// CACHE KEY GENERATION
// =============================================================================

/**
 * Generate cache key for embedding
 */
export function generateCacheKey(text: string, type: string): string {
  // Use first 100 chars + length + type for key
  const normalized = text.toLowerCase().trim().slice(0, 100);
  return `${type}:${normalized.length}:${simpleHash(normalized)}`;
}

/**
 * Get TTL based on embedding type
 */
export function getCacheTTL(type: string): number {
  switch (type) {
    case 'insight':
      return CACHE_CONFIG.schoolInsights;
    case 'pattern':
      return CACHE_CONFIG.feedbackPatterns;
    case 'essay':
      return CACHE_CONFIG.exampleEssays;
    case 'spike':
    case 'tone':
      return CACHE_CONFIG.userEmbeddings;
    case 'query':
    default:
      return CACHE_CONFIG.queryEmbeddings;
  }
}

// =============================================================================
// EXPORTS
// =============================================================================

export default embeddingCache;
