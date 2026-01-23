/**
 * Webhook Utilities
 * Shared utilities for webhook handling with error recovery and monitoring
 */

import { prisma } from '@/lib/prisma';

// =============================================================================
// WEBHOOK EVENT LOGGING
// =============================================================================

export interface WebhookEventLog {
  id: string;
  eventType: string;
  eventId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  payload: any;
  error?: string;
  attempts: number;
  processedAt?: Date;
}

/**
 * Log webhook event for tracking and debugging
 */
export async function logWebhookEvent(
  eventId: string,
  eventType: string,
  status: 'received' | 'processing' | 'completed' | 'failed',
  details?: { error?: string; metadata?: any }
) {
  try {
    await prisma.auditLog.create({
      data: {
        action: `WEBHOOK_${status.toUpperCase()}`,
        resource: 'STRIPE_WEBHOOK',
        details: {
          eventId,
          eventType,
          ...details,
          timestamp: new Date().toISOString(),
        },
      },
    });
  } catch (error) {
    // Don't fail the webhook if logging fails
    console.error('Failed to log webhook event:', error);
  }
}

// =============================================================================
// RETRY LOGIC
// =============================================================================

interface RetryOptions {
  maxAttempts?: number;
  baseDelayMs?: number;
  maxDelayMs?: number;
  onRetry?: (attempt: number, error: Error) => void;
}

/**
 * Execute an operation with exponential backoff retry
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const {
    maxAttempts = 3,
    baseDelayMs = 1000,
    maxDelayMs = 10000,
    onRetry,
  } = options;

  let lastError: Error | undefined;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      if (attempt < maxAttempts) {
        const delay = Math.min(baseDelayMs * Math.pow(2, attempt - 1), maxDelayMs);
        onRetry?.(attempt, lastError);
        await sleep(delay);
      }
    }
  }

  throw lastError;
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// =============================================================================
// IDEMPOTENCY
// =============================================================================

/**
 * Check if a webhook event has already been processed
 */
export async function isEventProcessed(eventId: string): Promise<boolean> {
  try {
    const existing = await prisma.auditLog.findFirst({
      where: {
        action: 'WEBHOOK_COMPLETED',
        details: {
          path: ['eventId'],
          equals: eventId,
        },
      },
    });
    return !!existing;
  } catch (error) {
    console.error('Failed to check event idempotency:', error);
    return false;
  }
}

/**
 * Mark a webhook event as processed
 */
export async function markEventProcessed(eventId: string, eventType: string) {
  await logWebhookEvent(eventId, eventType, 'completed');
}

// =============================================================================
// ERROR HANDLING
// =============================================================================

export interface WebhookError {
  code: string;
  message: string;
  retryable: boolean;
  details?: any;
}

/**
 * Classify an error to determine if it's retryable
 */
export function classifyError(error: unknown): WebhookError {
  if (error instanceof Error) {
    const message = error.message.toLowerCase();

    // Database connection errors - retryable
    if (message.includes('connection') || message.includes('timeout')) {
      return {
        code: 'DB_CONNECTION_ERROR',
        message: error.message,
        retryable: true,
      };
    }

    // Network errors - retryable
    if (message.includes('network') || message.includes('econnrefused')) {
      return {
        code: 'NETWORK_ERROR',
        message: error.message,
        retryable: true,
      };
    }

    // Rate limiting - retryable with backoff
    if (message.includes('rate limit') || message.includes('too many requests')) {
      return {
        code: 'RATE_LIMITED',
        message: error.message,
        retryable: true,
      };
    }

    // Validation errors - not retryable
    if (message.includes('validation') || message.includes('invalid')) {
      return {
        code: 'VALIDATION_ERROR',
        message: error.message,
        retryable: false,
      };
    }

    // Not found errors - not retryable
    if (message.includes('not found') || message.includes('does not exist')) {
      return {
        code: 'NOT_FOUND',
        message: error.message,
        retryable: false,
      };
    }
  }

  // Unknown errors - be conservative, don't retry
  return {
    code: 'UNKNOWN_ERROR',
    message: error instanceof Error ? error.message : String(error),
    retryable: false,
  };
}

// =============================================================================
// MONITORING HELPERS
// =============================================================================

/**
 * Track webhook processing metrics
 */
export function trackWebhookMetrics(eventType: string, durationMs: number, success: boolean) {
  // In production, send to monitoring service (DataDog, NewRelic, etc.)
  console.log(`[Webhook Metrics] ${eventType}: ${success ? 'success' : 'failed'} in ${durationMs}ms`);
}

/**
 * Alert on critical webhook failures
 */
export async function alertWebhookFailure(
  eventId: string,
  eventType: string,
  error: WebhookError
) {
  // In production, send to alerting service (PagerDuty, Slack, etc.)
  console.error(`[ALERT] Webhook failed:`, {
    eventId,
    eventType,
    error,
    timestamp: new Date().toISOString(),
  });

  // You would integrate with your alerting service here:
  // await slack.send({ text: `Webhook ${eventType} failed: ${error.message}` });
}

// =============================================================================
// SAFE ASYNC OPERATIONS
// =============================================================================

/**
 * Execute an operation without blocking the webhook response
 * Logs any errors that occur
 */
export function runAsync<T>(
  operation: () => Promise<T>,
  context: string
): void {
  operation().catch(error => {
    console.error(`[Async Error] ${context}:`, error);
  });
}

/**
 * Execute multiple operations in parallel, collecting results and errors
 */
export async function runParallel<T>(
  operations: Array<{ name: string; fn: () => Promise<T> }>
): Promise<Array<{ name: string; result?: T; error?: Error }>> {
  return Promise.all(
    operations.map(async ({ name, fn }) => {
      try {
        const result = await fn();
        return { name, result };
      } catch (error) {
        return { name, error: error instanceof Error ? error : new Error(String(error)) };
      }
    })
  );
}
