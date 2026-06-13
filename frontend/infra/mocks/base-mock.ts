import type { HttpHandler } from 'msw'

/**
 * Abstract class for defining a mock module.
 * Each feature mock (e.g., AuthMock, UserMock) should extend this.
 */
export abstract class BaseMock {
  /**
   * Returns a list of MSW handlers for this module.
   */
  public abstract getHandlers(): HttpHandler[]
}
