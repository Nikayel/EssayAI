// Safe error handling utilities
// Never expose internal error details to clients

/**
 * Extracts a safe error message for logging (internal use only)
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
}

/**
 * Returns a safe, generic error message for client responses
 * Logs the actual error server-side
 */
export function safeErrorResponse(
  error: unknown,
  context: string
): { message: string; logged: boolean } {
  const actualMessage = getErrorMessage(error);
  console.error(`[${context}]`, actualMessage);

  return {
    message: getClientSafeMessage(context),
    logged: true,
  };
}

/**
 * Maps internal error contexts to client-safe messages
 */
function getClientSafeMessage(context: string): string {
  const messages: Record<string, string> = {
    'analysis': 'Analysis failed. Please try again.',
    'rewrite': 'Failed to generate suggestions. Please try again.',
    'rag-analyze': 'Analysis failed. Please try again.',
    'rag-benchmarks': 'Failed to calculate benchmarks.',
    'rag-examples': 'Failed to retrieve examples.',
    'rag-patterns': 'Failed to retrieve patterns.',
    'rag-insights': 'Failed to retrieve insights.',
    'rag-status': 'Failed to check status.',
    'ivy-analyze': 'Analysis failed. Please try again.',
    'ivy-rewrite': 'Failed to generate suggestions.',
  };

  return messages[context] || 'An unexpected error occurred. Please try again.';
}

/**
 * Type guard for Prisma errors
 */
export function isPrismaError(error: unknown): error is { code: string } {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    typeof (error as { code: unknown }).code === 'string'
  );
}
