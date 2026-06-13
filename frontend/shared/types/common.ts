/**
 * Common types shared across features
 */

import type { AxiosResponse } from 'axios'

/**
 * Standard API response wrapper
 */
export interface ResponseData<T> {
  success: boolean
  message: string
  data: T
  errors: Record<string, string[]> | null
}

/**
 * Future type for repository pattern
 * Returns AxiosResponse with ResponseData wrapper
 */
export type Future<T> = Promise<AxiosResponse<ResponseData<T>>>

/**
 * Standard paginated list response wrapper
 */
export interface ListResponse<T> {
  data: T[]
  total: number
  per_page: number
  current_page: number
  total_page?: number
  last_page?: number
  links?: {
    first: string
    last: string
    prev: string | null
    next: string | null
  }
  meta?: {
    current_page: number
    from: number
    last_page: number
    path?: string
    per_page: number
    to: number
    total: number
  }
}
