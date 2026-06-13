import { AxiosError } from 'axios'
import type { RetryOptions } from './retry.types'

/** Transient statuses that are safe to retry by default. */
const DEFAULT_RETRY_STATUS_CODES = [408, 429, 500, 502, 503, 504]
const DEFAULT_RETRY_DELAY_MS = 1000

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * Default retry predicate: retry on network/transport failures (no response)
 * and on the configured transient status codes. 4xx (except 408/429) are
 * caller errors and are never retried.
 */
function isRetryableError(error: unknown, statusCodes: number[]): boolean {
  if (!(error instanceof AxiosError)) return false
  if (!error.response) return true // network/timeout — safe to retry
  return statusCodes.includes(error.response.status)
}

/**
 * Run `request`, retrying transient failures according to `options`.
 *
 * With no options (or `count` <= 0) the request executes exactly once, so this
 * is a transparent wrapper for the common no-retry path. `count` is the number
 * of *additional* attempts after the first, matching RetryOptions' semantics.
 */
export async function withRetry<T>(
  request: () => Promise<T>,
  options?: RetryOptions,
): Promise<T> {
  const count = options?.count ?? 0
  const delay = options?.delay ?? DEFAULT_RETRY_DELAY_MS
  const statusCodes = options?.statusCodes ?? DEFAULT_RETRY_STATUS_CODES
  const shouldRetry = options?.shouldRetry

  let attempt = 0
  for (;;) {
    try {
      return await request()
    } catch (error) {
      const retriable = shouldRetry
        ? shouldRetry(error)
        : isRetryableError(error, statusCodes)
      if (!retriable || attempt >= count) throw error
      attempt += 1
      if (delay > 0) await sleep(delay)
    }
  }
}
