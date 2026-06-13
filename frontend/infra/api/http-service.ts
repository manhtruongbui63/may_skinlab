import type { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios'

import HttpModule from './module'
import { IHttpAdapter } from './http-adapter'
import { ZodSchema } from 'zod'
import type { RetryOptions } from './retry/retry.types'
import { withRetry } from './retry/with-retry'

const DEFAULT_API_URL = ''
function getApiBaseUrl(): string {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? DEFAULT_API_URL
  // If we are on the server and the URL is relative or empty, try to use APP_URL
  if (typeof window === 'undefined' && (!apiUrl || apiUrl.startsWith('/'))) {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    return apiUrl ? `${appUrl}${apiUrl}` : appUrl
  }
  return apiUrl
}

/**
 * Deep HTTP Client that encapsulates Axios, Token Refresh, and Retry logic.
 */

class AxiosHttpClient implements IHttpAdapter<AxiosInstance> {
  public readonly client: AxiosInstance
  private readonly module: HttpModule

  public constructor(baseUrl: string = getApiBaseUrl()) {
    this.module = new HttpModule(baseUrl)
    this.client = this.module.getInstance()
  }

  public setHeaders(headers: AxiosRequestConfig['headers']): void {
    if (!headers) return
    // Write into the `common` bucket — the canonical location axios applies to
    // every request — so set/delete are symmetric with deleteHeader().
    Object.assign(this.client.defaults.headers.common, headers)
  }

  public deleteHeader(name: string): void {
    const headers = this.client.defaults.headers as Record<string, unknown> & {
      common?: Record<string, unknown>
    }
    delete headers[name]
    if (headers.common) delete headers.common[name]
  }

  public async get<TParams = unknown, TResponse = AxiosResponse>(
    url: string,
    params?: TParams,
    options?: { retry?: RetryOptions }
  ): Promise<TResponse> {
    return withRetry(() => this.client.get(url, { params }), options?.retry)
  }

  public async post<TData = unknown, TResponse = AxiosResponse>(
    url: string,
    data?: TData,
    axiosOptions?: AxiosRequestConfig,
    options?: { retry?: RetryOptions }
  ): Promise<TResponse> {
    return withRetry(() => this.client.post(url, data, axiosOptions), options?.retry)
  }

  public async put<TData = unknown, TResponse = AxiosResponse>(
    url: string,
    data?: TData,
    options?: { retry?: RetryOptions }
  ): Promise<TResponse> {
    return withRetry(() => this.client.put(url, data), options?.retry)
  }

  public async patch<TData = unknown, TResponse = AxiosResponse>(
    url: string,
    data?: TData,
    options?: { retry?: RetryOptions }
  ): Promise<TResponse> {
    return withRetry(() => this.client.patch(url, data), options?.retry)
  }

  public async delete<TData = unknown, TResponse = AxiosResponse>(
    url: string,
    data?: TData,
    options?: { retry?: RetryOptions }
  ): Promise<TResponse> {
    return withRetry(() => this.client.delete(url, { data }), options?.retry)
  }

  // ─── Validated methods (with Zod) ────────────────────────────────────────────

  /**
   * Unwrap the backend envelope before Zod-validating its `data` payload.
   *
   * A backend can return a business error envelope (`{ success:false, message,
   * errors, data:null }`) with HTTP 200. Parsing `data.data` (null) directly
   * would throw an opaque ZodError and discard the server message / 422 errors.
   * Instead we throw an axios-like error that carries the envelope, so the
   * shared error handler and mapBackendErrors() can use it.
   */
  private unwrapValidated<T>(response: AxiosResponse, schema: ZodSchema<T>): T {
    const envelope = response.data as
      | { success?: boolean; message?: string; errors?: unknown; data?: unknown }
      | undefined

    if (envelope && envelope.success === false) {
      const error = new Error(envelope.message || 'Request failed') as Error & {
        response?: { data?: unknown; status?: number }
      }
      error.response = { data: envelope, status: response.status }
      throw error
    }

    return schema.parse(envelope?.data)
  }

  public async getValidated<T>(
    url: string,
    schema: ZodSchema<T>,
    params?: unknown
  ): Promise<T> {
    const response = await this.client.get(url, { params })
    return this.unwrapValidated(response as AxiosResponse, schema)
  }

  public async postValidated<T>(
    url: string,
    data: unknown,
    schema: ZodSchema<T>,
    options?: AxiosRequestConfig
  ): Promise<T> {
    const response = await this.client.post(url, data, options)
    return this.unwrapValidated(response as AxiosResponse, schema)
  }

  public async putValidated<T>(
    url: string,
    data: unknown,
    schema: ZodSchema<T>
  ): Promise<T> {
    const response = await this.client.put(url, data)
    return this.unwrapValidated(response as AxiosResponse, schema)
  }

  public async patchValidated<T>(
    url: string,
    data: unknown,
    schema: ZodSchema<T>
  ): Promise<T> {
    const response = await this.client.patch(url, data)
    return this.unwrapValidated(response as AxiosResponse, schema)
  }

  public async deleteValidated<T>(
    url: string,
    schema: ZodSchema<T>,
    data?: unknown
  ): Promise<T> {
    const response = await this.client.delete(url, { data })
    return this.unwrapValidated(response as AxiosResponse, schema)
  }
}

export const HttpService = new AxiosHttpClient()
