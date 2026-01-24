import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

// =============================================================================
// TYPES
// =============================================================================

export interface AuthenticatedUser {
  id: string;
  email?: string;
}

export interface ApiError {
  error: string;
  details?: unknown;
}

export interface ApiSuccess<T = unknown> {
  success: true;
  data?: T;
}

// =============================================================================
// AUTHENTICATION HELPERS
// =============================================================================

/**
 * Get authenticated user from request
 * Returns null if not authenticated
 */
export async function getAuthUser(): Promise<AuthenticatedUser | null> {
  try {
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
      return null;
    }

    return {
      id: user.id,
      email: user.email,
    };
  } catch {
    return null;
  }
}

/**
 * Require authentication - returns user or throws response
 */
export async function requireAuth(): Promise<AuthenticatedUser> {
  const user = await getAuthUser();
  if (!user) {
    throw unauthorizedResponse();
  }
  return user;
}

/**
 * Higher-order function for authenticated API handlers
 */
export function withAuth<T>(
  handler: (user: AuthenticatedUser, request: NextRequest) => Promise<NextResponse<T>>
) {
  return async (request: NextRequest): Promise<NextResponse<T | ApiError>> => {
    const user = await getAuthUser();
    if (!user) {
      return unauthorizedResponse() as NextResponse<T | ApiError>;
    }
    return handler(user, request);
  };
}

// =============================================================================
// VALIDATION HELPERS
// =============================================================================

/**
 * Parse and validate request body with Zod schema
 * Returns validated data or throws formatted error response
 */
export async function validateBody<T>(
  request: NextRequest,
  schema: z.ZodSchema<T>
): Promise<T> {
  try {
    const body = await request.json();
    return schema.parse(body);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw validationErrorResponse(error);
    }
    throw badRequestResponse('Invalid JSON body');
  }
}

/**
 * Parse and validate query params with Zod schema
 */
export function validateQuery<T>(
  request: NextRequest,
  schema: z.ZodSchema<T>
): T {
  const url = new URL(request.url);
  const params = Object.fromEntries(url.searchParams.entries());

  try {
    return schema.parse(params);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw validationErrorResponse(error);
    }
    throw badRequestResponse('Invalid query parameters');
  }
}

// =============================================================================
// RESPONSE HELPERS
// =============================================================================

/**
 * Success response with data
 */
export function successResponse<T>(data: T, status = 200): NextResponse {
  return NextResponse.json({ success: true, ...data }, { status });
}

/**
 * Error response (generic)
 */
export function errorResponse(message: string, status = 500): NextResponse<ApiError> {
  return NextResponse.json({ error: message }, { status });
}

/**
 * 401 Unauthorized
 */
export function unauthorizedResponse(message = 'Unauthorized'): NextResponse<ApiError> {
  return NextResponse.json({ error: message }, { status: 401 });
}

/**
 * 403 Forbidden
 */
export function forbiddenResponse(message = 'Forbidden'): NextResponse<ApiError> {
  return NextResponse.json({ error: message }, { status: 403 });
}

/**
 * 404 Not Found
 */
export function notFoundResponse(resource = 'Resource'): NextResponse<ApiError> {
  return NextResponse.json({ error: `${resource} not found` }, { status: 404 });
}

/**
 * 400 Bad Request
 */
export function badRequestResponse(message = 'Bad request'): NextResponse<ApiError> {
  return NextResponse.json({ error: message }, { status: 400 });
}

/**
 * 400 Validation Error with Zod details
 */
export function validationErrorResponse(error: z.ZodError): NextResponse<ApiError> {
  return NextResponse.json(
    {
      error: 'Validation error',
      details: error.issues.map(issue => ({
        path: issue.path.join('.'),
        message: issue.message,
      })),
    },
    { status: 400 }
  );
}

/**
 * 429 Rate Limited
 */
export function rateLimitedResponse(retryAfter?: number): NextResponse<ApiError> {
  const headers: HeadersInit = {};
  if (retryAfter) {
    headers['Retry-After'] = String(retryAfter);
  }
  return NextResponse.json(
    { error: 'Rate limit exceeded. Please try again later.' },
    { status: 429, headers }
  );
}

// =============================================================================
// ERROR HANDLING
// =============================================================================

/**
 * Safe error handler for API routes
 * Logs error details server-side, returns safe message to client
 */
export function handleApiError(
  error: unknown,
  context: string,
  defaultMessage = 'An unexpected error occurred'
): NextResponse<ApiError> {
  // Handle Zod validation errors
  if (error instanceof z.ZodError) {
    return validationErrorResponse(error);
  }

  // Handle known error responses (thrown by our helpers)
  if (error instanceof NextResponse) {
    return error;
  }

  // Log the actual error for debugging
  const errorMessage = error instanceof Error ? error.message : String(error);
  console.error(`[API Error: ${context}]`, errorMessage);

  // Return safe message to client
  return errorResponse(defaultMessage, 500);
}

/**
 * Wrapper for API route handlers with automatic error handling
 */
export function apiHandler<T>(
  handler: (request: NextRequest) => Promise<NextResponse<T>>,
  context: string
) {
  return async (request: NextRequest): Promise<NextResponse<T | ApiError>> => {
    try {
      return await handler(request);
    } catch (error) {
      return handleApiError(error, context) as NextResponse<T | ApiError>;
    }
  };
}

// =============================================================================
// PAGINATION HELPERS
// =============================================================================

export interface PaginationParams {
  page: number;
  limit: number;
  offset: number;
}

export const PaginationSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
});

export function getPagination(request: NextRequest): PaginationParams {
  const url = new URL(request.url);
  const page = Math.max(1, parseInt(url.searchParams.get('page') || '1'));
  const limit = Math.min(100, Math.max(1, parseInt(url.searchParams.get('limit') || '20')));

  return {
    page,
    limit,
    offset: (page - 1) * limit,
  };
}

export function paginatedResponse<T>(
  data: T[],
  total: number,
  pagination: PaginationParams
) {
  return {
    data,
    pagination: {
      page: pagination.page,
      limit: pagination.limit,
      total,
      totalPages: Math.ceil(total / pagination.limit),
      hasMore: pagination.offset + data.length < total,
    },
  };
}
