export interface RetryOptions {
  /**
   * Number of times to retry the request.
   * @default 0
   */
  count?: number;

  /**
   * Delay between retries in milliseconds.
   * @default 1000
   */
  delay?: number;

  /**
   * HTTP status codes that should trigger a retry.
   * @default [408, 429, 500, 502, 503, 504]
   */
  statusCodes?: number[];

  /**
   * Custom function to determine if a retry should be attempted.
   */
  shouldRetry?: (error: unknown) => boolean;
}
