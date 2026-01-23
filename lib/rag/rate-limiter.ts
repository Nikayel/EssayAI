/**
 * Rate Limiter for RAG API Endpoints
 * Token bucket algorithm with sliding window
 */

// =============================================================================
// TYPES
// =============================================================================

interface RateLimitConfig {
  maxRequests: number;   // Max requests per window
  windowMs: number;      // Window size in milliseconds
  blockDurationMs?: number; // How long to block after exceeding limit
}

interface RateLimitEntry {
  requests: number;
  windowStart: number;
  blocked: boolean;
  blockedUntil: number;
}

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
  retryAfter?: number;
}

// =============================================================================
// RATE LIMIT CONFIGS
// =============================================================================

export const RATE_LIMIT_CONFIGS: Record<string, RateLimitConfig> = {
  // RAG analysis - expensive, limit tightly
  'rag_analyze': {
    maxRequests: 10,
    windowMs: 60 * 1000, // 10 requests per minute
    blockDurationMs: 60 * 1000, // Block for 1 minute if exceeded
  },

  // Pattern/insight retrieval - moderate
  'rag_retrieve': {
    maxRequests: 30,
    windowMs: 60 * 1000, // 30 requests per minute
  },

  // Benchmark/status - cheap, allow more
  'rag_benchmark': {
    maxRequests: 60,
    windowMs: 60 * 1000, // 60 requests per minute
  },

  // Embedding generation - moderate, API costs
  'embedding': {
    maxRequests: 50,
    windowMs: 60 * 1000, // 50 per minute
    blockDurationMs: 30 * 1000,
  },

  // Default fallback
  'default': {
    maxRequests: 100,
    windowMs: 60 * 1000,
  },
};

// =============================================================================
// RATE LIMITER IMPLEMENTATION
// =============================================================================

class RateLimiter {
  private entries: Map<string, RateLimitEntry> = new Map();
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor() {
    // Clean up old entries every minute
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 60 * 1000);

    if (this.cleanupInterval.unref) {
      this.cleanupInterval.unref();
    }
  }

  /**
   * Check if request is allowed
   */
  check(
    identifier: string,
    category: string = 'default'
  ): RateLimitResult {
    const config = RATE_LIMIT_CONFIGS[category] || RATE_LIMIT_CONFIGS.default;
    const key = `${category}:${identifier}`;
    const now = Date.now();

    let entry = this.entries.get(key);

    // Initialize entry if doesn't exist
    if (!entry) {
      entry = {
        requests: 0,
        windowStart: now,
        blocked: false,
        blockedUntil: 0,
      };
      this.entries.set(key, entry);
    }

    // Check if blocked
    if (entry.blocked && entry.blockedUntil > now) {
      return {
        allowed: false,
        remaining: 0,
        resetAt: entry.blockedUntil,
        retryAfter: Math.ceil((entry.blockedUntil - now) / 1000),
      };
    }

    // Reset window if expired
    if (now - entry.windowStart >= config.windowMs) {
      entry.requests = 0;
      entry.windowStart = now;
      entry.blocked = false;
    }

    // Check if within limit
    if (entry.requests >= config.maxRequests) {
      // Block if configured
      if (config.blockDurationMs) {
        entry.blocked = true;
        entry.blockedUntil = now + config.blockDurationMs;
      }

      return {
        allowed: false,
        remaining: 0,
        resetAt: entry.windowStart + config.windowMs,
        retryAfter: Math.ceil((entry.windowStart + config.windowMs - now) / 1000),
      };
    }

    // Increment and allow
    entry.requests++;

    return {
      allowed: true,
      remaining: config.maxRequests - entry.requests,
      resetAt: entry.windowStart + config.windowMs,
    };
  }

  /**
   * Record a request (alias for check that always counts)
   */
  record(identifier: string, category: string = 'default'): RateLimitResult {
    return this.check(identifier, category);
  }

  /**
   * Get current stats for an identifier
   */
  getStats(identifier: string, category: string = 'default'): {
    requests: number;
    remaining: number;
    blocked: boolean;
    resetsIn: number;
  } {
    const config = RATE_LIMIT_CONFIGS[category] || RATE_LIMIT_CONFIGS.default;
    const key = `${category}:${identifier}`;
    const now = Date.now();

    const entry = this.entries.get(key);

    if (!entry) {
      return {
        requests: 0,
        remaining: config.maxRequests,
        blocked: false,
        resetsIn: config.windowMs,
      };
    }

    // Check if window expired
    if (now - entry.windowStart >= config.windowMs) {
      return {
        requests: 0,
        remaining: config.maxRequests,
        blocked: false,
        resetsIn: config.windowMs,
      };
    }

    return {
      requests: entry.requests,
      remaining: Math.max(0, config.maxRequests - entry.requests),
      blocked: entry.blocked && entry.blockedUntil > now,
      resetsIn: entry.windowStart + config.windowMs - now,
    };
  }

  /**
   * Reset rate limit for an identifier
   */
  reset(identifier: string, category: string = 'default'): void {
    const key = `${category}:${identifier}`;
    this.entries.delete(key);
  }

  /**
   * Cleanup old entries
   */
  private cleanup(): void {
    const now = Date.now();

    for (const [key, entry] of this.entries.entries()) {
      // Remove if window expired and not blocked
      const config = RATE_LIMIT_CONFIGS[key.split(':')[0]] || RATE_LIMIT_CONFIGS.default;

      if (
        now - entry.windowStart > config.windowMs * 2 &&
        (!entry.blocked || entry.blockedUntil < now)
      ) {
        this.entries.delete(key);
      }
    }
  }

  /**
   * Destroy rate limiter
   */
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    this.entries.clear();
  }
}

// =============================================================================
// SINGLETON & HELPERS
// =============================================================================

// Global rate limiter instance
export const rateLimiter = new RateLimiter();

/**
 * Helper to check rate limit and return appropriate response
 */
export function checkRateLimit(
  identifier: string,
  category: string
): {
  allowed: boolean;
  headers: Record<string, string>;
  errorResponse?: {
    error: string;
    retryAfter: number;
  };
} {
  const result = rateLimiter.check(identifier, category);

  const headers: Record<string, string> = {
    'X-RateLimit-Remaining': result.remaining.toString(),
    'X-RateLimit-Reset': result.resetAt.toString(),
  };

  if (!result.allowed) {
    headers['Retry-After'] = (result.retryAfter || 60).toString();

    return {
      allowed: false,
      headers,
      errorResponse: {
        error: 'Rate limit exceeded',
        retryAfter: result.retryAfter || 60,
      },
    };
  }

  return {
    allowed: true,
    headers,
  };
}

/**
 * Extract identifier from request (user ID or IP)
 */
export function getRequestIdentifier(
  userId?: string,
  request?: { headers: { get: (key: string) => string | null } }
): string {
  // Prefer user ID for authenticated requests
  if (userId) {
    return `user:${userId}`;
  }

  // Fall back to IP
  if (request?.headers) {
    const forwardedFor = request.headers.get('x-forwarded-for');
    if (forwardedFor) {
      return `ip:${forwardedFor.split(',')[0].trim()}`;
    }

    const realIp = request.headers.get('x-real-ip');
    if (realIp) {
      return `ip:${realIp}`;
    }
  }

  return 'anonymous';
}

// =============================================================================
// EXPORTS
// =============================================================================

export default rateLimiter;
