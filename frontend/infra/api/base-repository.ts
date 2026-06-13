import type { AxiosRequestConfig, AxiosResponse } from 'axios'
import type { IHttpAdapter } from './http-adapter'
import type { RetryOptions } from './retry/retry.types'

/**
 * Base Repository class that provides common functionality for all repositories.
 * Uses the Adapter pattern via IHttpAdapter to remain decoupled from the HTTP client.
 */
export abstract class BaseRepository {
  protected readonly http: IHttpAdapter

  constructor(http: IHttpAdapter) {
    this.http = http
  }

  /**
   * Helper to build full URLs if needed, or handle common path prefixing.
   */
  protected buildUrl(path: string): string {
    // Ensure path starts with /
    return path.startsWith('/') ? path : `/${path}`
  }

  /**
   * Common GET wrapper
   */
  protected async get<TResponse = unknown, TParams = unknown>(
    url: string,
    params?: TParams,
    retry?: RetryOptions
  ): Promise<TResponse> {
    const response = await this.http.get<TParams, AxiosResponse<TResponse>>(
      this.buildUrl(url),
      params,
      { retry }
    )
    return response.data
  }

  /**
   * Common POST wrapper
   */
  protected async post<TResponse = unknown, TData = unknown>(
    url: string,
    data?: TData,
    options?: AxiosRequestConfig,
    retry?: RetryOptions
  ): Promise<TResponse> {
    const response = await this.http.post<TData, AxiosResponse<TResponse>>(
      this.buildUrl(url),
      data,
      options,
      { retry }
    )
    return response.data
  }

  /**
   * Common PUT wrapper
   */
  protected async put<TResponse = unknown, TData = unknown>(
    url: string,
    data?: TData,
    retry?: RetryOptions
  ): Promise<TResponse> {
    const response = await this.http.put<TData, AxiosResponse<TResponse>>(
      this.buildUrl(url),
      data,
      { retry }
    )
    return response.data
  }

  /**
   * Common PATCH wrapper
   */
  protected async patch<TResponse = unknown, TData = unknown>(
    url: string,
    data?: TData,
    retry?: RetryOptions
  ): Promise<TResponse> {
    const response = await this.http.patch<TData, AxiosResponse<TResponse>>(
      this.buildUrl(url),
      data,
      { retry }
    )
    return response.data
  }

  /**
   * Common DELETE wrapper
   */
  protected async delete<TResponse = unknown, TData = unknown>(
    url: string,
    data?: TData,
    retry?: RetryOptions
  ): Promise<TResponse> {
    const response = await this.http.delete<TData, AxiosResponse<TResponse>>(
      this.buildUrl(url),
      data,
      { retry }
    )
    return response.data
  }
}
