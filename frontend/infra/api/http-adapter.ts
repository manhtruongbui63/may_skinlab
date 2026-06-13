import type { AxiosRequestConfig, AxiosResponse } from 'axios'
import type { RetryOptions } from './retry/retry.types'
import type { ZodSchema } from 'zod'

/**
 * Contract for an HTTP adapter with common methods.
 * Enables depth by allowing implementations to hide complexity (retry, refresh).

/**
 * Contract for an HTTP adapter with Zod validation support.
 * Extends IHttpAdapter with type-safe methods that validate responses.
 */
export abstract class IHttpAdapter<TClient = unknown> {
  public abstract readonly client: TClient

  public abstract setHeaders(headers: AxiosRequestConfig['headers']): void
  public abstract deleteHeader(name: string): void

  // ─── Base methods (raw Axios) ───────────────────────────────────────────────
  public abstract get<TParams = unknown, TResponse = AxiosResponse>(
    url: string,
    params?: TParams,
    options?: { retry?: RetryOptions }
  ): Promise<TResponse>

  public abstract post<TData = unknown, TResponse = AxiosResponse>(
    url: string,
    data?: TData,
    axiosOptions?: AxiosRequestConfig,
    options?: { retry?: RetryOptions }
  ): Promise<TResponse>

  public abstract put<TData = unknown, TResponse = AxiosResponse>(
    url: string,
    data?: TData,
    options?: { retry?: RetryOptions }
  ): Promise<TResponse>

  public abstract patch<TData = unknown, TResponse = AxiosResponse>(
    url: string,
    data?: TData,
    options?: { retry?: RetryOptions }
  ): Promise<TResponse>

  public abstract delete<TData = unknown, TResponse = AxiosResponse>(
    url: string,
    data?: TData,
    options?: { retry?: RetryOptions }
  ): Promise<TResponse>

  // ─── Validated methods (with Zod) ────────────────────────────────────────────
  /**
   * GET with Zod validation
   * Extracts and validates response.data.data
   */
  public abstract getValidated<T>(
    url: string,
    schema: ZodSchema<T>,
    params?: unknown
  ): Promise<T>

  /**
   * POST with Zod validation
   */
  public abstract postValidated<T>(
    url: string,
    data: unknown,
    schema: ZodSchema<T>,
    options?: AxiosRequestConfig
  ): Promise<T>

  /**
   * PUT with Zod validation
   */
  public abstract putValidated<T>(
    url: string,
    data: unknown,
    schema: ZodSchema<T>
  ): Promise<T>

  /**
   * PATCH with Zod validation
   */
  public abstract patchValidated<T>(
    url: string,
    data: unknown,
    schema: ZodSchema<T>
  ): Promise<T>

  /**
   * DELETE with Zod validation
   */
  public abstract deleteValidated<T>(
    url: string,
    schema: ZodSchema<T>,
    data?: unknown
  ): Promise<T>
}
