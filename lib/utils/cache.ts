/**
 * Simple in-memory cache for AI responses
 * For production, use Redis (Upstash) or similar
 */

interface CacheEntry {
  value: any;
  expires: number;
}

class SimpleCache {
  private cache: Map<string, CacheEntry> = new Map();

  set(key: string, value: any, ttlSeconds: number = 3600) {
    this.cache.set(key, {
      value,
      expires: Date.now() + ttlSeconds * 1000,
    });

    // Cleanup expired entries periodically
    if (this.cache.size > 1000) {
      this.cleanup();
    }
  }

  get(key: string): any | null {
    const entry = this.cache.get(key);

    if (!entry) return null;

    if (Date.now() > entry.expires) {
      this.cache.delete(key);
      return null;
    }

    return entry.value;
  }

  delete(key: string) {
    this.cache.delete(key);
  }

  cleanup() {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expires) {
        this.cache.delete(key);
      }
    }
  }

  clear() {
    this.cache.clear();
  }
}

// Global cache instance
export const cache = new SimpleCache();

/**
 * Generate cache key for essay analysis
 */
export function getAnalysisCacheKey(essayContent: string, essayType: string): string {
  // Simple hash of content + type
  const hash = Buffer.from(`${essayContent}:${essayType}`).toString('base64').substring(0, 32);
  return `analysis:${hash}`;
}

/**
 * Wrapper for cached AI analysis
 */
export async function withCache<T>(
  key: string,
  fn: () => Promise<T>,
  ttlSeconds: number = 3600
): Promise<T> {
  // Check cache first
  const cached = cache.get(key);
  if (cached) {
    console.log(`✅ Cache hit for key: ${key}`);
    return cached as T;
  }

  // Cache miss - execute function
  console.log(`❌ Cache miss for key: ${key}`);
  const result = await fn();

  // Store in cache
  cache.set(key, result, ttlSeconds);

  return result;
}
