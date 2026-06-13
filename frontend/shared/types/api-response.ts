/**
 * API Response Wrapper Types and Utils
 * 
 * Validates API responses match the wrapper format:
 * { success: boolean, message: string, data: T, errors: object }
 */

import { z } from 'zod'

export const ApiResponseSchema = <T extends z.ZodTypeAny>(dataSchema: T) =>
  z.object({
    success: z.boolean(),
    message: z.string(),
    data: dataSchema,
    errors: z.union([z.record(z.string(), z.array(z.string())), z.null()]),
  })

/**
 * Custom error class containing message and errors from server
 */
export class ApiError extends Error {
  /** Message from server */
  public readonly message: string
  /** Errors object from server (422 validation errors) */
  public readonly errors?: Record<string, string[]>
  /** HTTP status code */
  public readonly status?: number

  constructor(
    message: string,
    errors?: Record<string, string[]>,
    status?: number
  ) {
    super(message)
    this.name = 'ApiError'
    this.message = message
    this.errors = errors
    this.status = status
  }

  /** Check if it's a 422 validation error */
  get isValidationError(): boolean {
    return this.status === 422 || !!this.errors
  }
}

/**
 * Type guard to check if error is ApiError
 */
export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError
}

export function parseApiResponse<T>(
  schema: z.ZodSchema<T>,
  response: unknown,
  statusCode?: number
): T {
  const result = ApiResponseSchema(schema).safeParse(response)
  
  if (!result.success) {
    throw new ApiError(
      `API response validation failed: ${result.error.message}`,
      undefined,
      500
    )
  }
  
  if (!result.data.success) {
    throw new ApiError(
      result.data.message || 'API returned error',
      result.data.errors || undefined,
      statusCode || 422
    )
  }
  
  return result.data.data
}

// ============================================================================
// Result-based API Response (returns full response, does not throw)
// ============================================================================

/**
 * Full API result type with success flag and errors
 */
export type ApiResult<T> = {
  success: boolean
  message: string
  data: T
  errors: Record<string, string[]> | null
}

/**
 * Parse API response and return full ApiResult<T>
 * Does not throw error, returns both success and error cases
 */
export function parseApiResult<T>(
  schema: z.ZodSchema<T>,
  response: unknown,
  statusCode?: number
): ApiResult<T> {
  const result = ApiResponseSchema(schema).safeParse(response)
  
  if (!result.success) {
    throw new ApiError(
      `API response validation failed: ${result.error.message}`,
      undefined,
      500
    )
  }
  
  if (!result.data.success) {
    throw new ApiError(
      result.data.message || 'API returned error',
      result.data.errors || undefined,
      statusCode || 422
    )
  }
  
  return {
    success: result.data.success,
    message: result.data.message,
    data: result.data.data,
    errors: result.data.errors || null,
  }
}
