/**
 * API Client with Zod Validation
 * 
 * Wrapper around infra/api HttpService to add Zod validation.
 * Use this instead of direct axios.
 */

import type { ZodSchema } from 'zod'
import { HttpService } from '@/infra/api/http-service'
import { parseApiResponse, parseApiResult, type ApiResult } from '@/shared/types/api-response'
import type { AxiosRequestConfig } from 'axios'

/**
 * GET request with Zod validation
 * @throws Error if validation fails or API error
 * 
 * @example
 * const user = await get('/api/users/1', UserSchema)
 */
export async function get<T>(
  url: string,
  schema: ZodSchema<T>,
  params?: unknown,
): Promise<T> {
  const response = await HttpService.get(url, params)
  return parseApiResponse(schema, response.data)
}

/**
 * POST request with Zod validation
 * @throws Error if validation fails or API error
 * 
 * @example
 * const user = await post('/api/users', newUser, UserSchema)
 */
export async function post<T>(
  url: string,
  data: unknown,
  schema: ZodSchema<T>,
  config?: AxiosRequestConfig,
): Promise<T> {
  const response = await HttpService.post(url, data, config)
  return parseApiResponse(schema, response.data)
}

/**
 * PUT request with Zod validation
 */
export async function put<T>(
  url: string,
  data: unknown,
  schema: ZodSchema<T>,
): Promise<T> {
  const response = await HttpService.put(url, data)
  return parseApiResponse(schema, response.data)
}

/**
 * PATCH request with Zod validation
 */
export async function patch<T>(
  url: string,
  data: unknown,
  schema: ZodSchema<T>,
): Promise<T> {
  const response = await HttpService.patch(url, data)
  return parseApiResponse(schema, response.data)
}

/**
 * DELETE request with Zod validation (if DELETE returns data)
 */
export async function del<T>(
  url: string,
  schema: ZodSchema<T>,
  data?: unknown,
): Promise<T> {
  const response = await HttpService.delete(url, data)
  return parseApiResponse(schema, response.data)
}

/**
 * DELETE request without validation (204 or null)
 */
export async function delVoid(url: string, data?: unknown): Promise<void> {
  await HttpService.delete(url, data)
}

// =============================================================================
// Result-based API Helpers - Returns ApiResult<T> with success flag and errors
// =============================================================================

/**
 * GET request returning ApiResult<T> - does not throw error
 * Use when you need to handle both success and error cases
 * 
 * @example
 * const result = await getResult('/api/users', z.array(UserSchema))
 * if (result.success) {
 *   console.log(result.data)
 * } else {
 *   console.error(result.message, result.errors)
 * }
 */
export async function getResult<T>(
  url: string,
  schema: ZodSchema<T>,
  params?: unknown,
): Promise<ApiResult<T>> {
  try {
    const response = await HttpService.get(url, params)
    return parseApiResult(schema, response.data)
  } catch (error) {
    // Handle axios error with 422 validation
    if (error && typeof error === 'object' && 'response' in error) {
      const axiosError = error as { response?: { data?: { message?: string; errors?: Record<string, string[]> } }; message?: string }
      if (axiosError.response?.data) {
        const data = axiosError.response.data
        return {
          success: false,
          message: data.message || 'Request failed',
          data: null as unknown as T,
          errors: data.errors || null,
        }
      }
      return {
        success: false,
        message: axiosError.message || 'Network error',
        data: null as unknown as T,
        errors: null,
      }
    }
    return {
      success: false,
      message: 'Network error',
      data: null as unknown as T,
      errors: null,
    }
  }
}

/**
 * POST request returning ApiResult<T> - does not throw error
 */
export async function postResult<T>(
  url: string,
  data: unknown,
  schema: ZodSchema<T>,
  config?: AxiosRequestConfig,
): Promise<ApiResult<T>> {
  try {
    const response = await HttpService.post(url, data, config)
    return parseApiResult(schema, response.data)
  } catch (error) {
    // Handle axios error with 422 validation
    if (error && typeof error === 'object' && 'response' in error) {
      const axiosError = error as { response?: { data?: { message?: string; errors?: Record<string, string[]> } }; message?: string }
      if (axiosError.response?.data) {
        const responseData = axiosError.response.data
        return {
          success: false,
          message: responseData.message || 'Request failed',
          data: null as unknown as T,
          errors: responseData.errors || null,
        }
      }
      return {
        success: false,
        message: axiosError.message || 'Network error',
        data: null as unknown as T,
        errors: null,
      }
    }
    return {
      success: false,
      message: 'Network error',
      data: null as unknown as T,
      errors: null,
    }
  }
}

/**
 * PUT request returning ApiResult<T> - does not throw error
 */
export async function putResult<T>(
  url: string,
  data: unknown,
  schema: ZodSchema<T>,
): Promise<ApiResult<T>> {
  try {
    const response = await HttpService.put(url, data)
    return parseApiResult(schema, response.data)
  } catch (error) {
    // Handle axios error with 422 validation
    if (error && typeof error === 'object' && 'response' in error) {
      const axiosError = error as { response?: { data?: { message?: string; errors?: Record<string, string[]> } }; message?: string }
      if (axiosError.response?.data) {
        const responseData = axiosError.response.data
        return {
          success: false,
          message: responseData.message || 'Request failed',
          data: null as unknown as T,
          errors: responseData.errors || null,
        }
      }
      return {
        success: false,
        message: axiosError.message || 'Network error',
        data: null as unknown as T,
        errors: null,
      }
    }
    return {
      success: false,
      message: 'Network error',
      data: null as unknown as T,
      errors: null,
    }
  }
}

/**
 * DELETE request returning ApiResult<T> - does not throw error
 */
export async function delResult<T>(
  url: string,
  schema: ZodSchema<T>,
  data?: unknown,
): Promise<ApiResult<T>> {
  try {
    const response = await HttpService.delete(url, data)
    return parseApiResult(schema, response.data)
  } catch (error) {
    // Handle axios error with 422 validation
    if (error && typeof error === 'object' && 'response' in error) {
      const axiosError = error as { response?: { data?: { message?: string; errors?: Record<string, string[]> } }; message?: string }
      if (axiosError.response?.data) {
        const responseData = axiosError.response.data
        return {
          success: false,
          message: responseData.message || 'Request failed',
          data: null as unknown as T,
          errors: responseData.errors || null,
        }
      }
      return {
        success: false,
        message: axiosError.message || 'Network error',
        data: null as unknown as T,
        errors: null,
      }
    }
    return {
      success: false,
      message: 'Network error',
      data: null as unknown as T,
      errors: null,
    }
  }
}

// Re-export HttpService for direct use if needed
export { HttpService }
