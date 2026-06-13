import type { HttpHandler } from 'msw'
import type { BaseMock } from './base-mock'

/**
 * Registry class to manage all MSW mock handlers.
 * Implements the Singleton pattern.
 */
class MockManager {
  private static instance: MockManager
  private mocks: BaseMock[] = []

  private constructor() {}

  public static getInstance(): MockManager {
    if (!MockManager.instance) {
      MockManager.instance = new MockManager()
    }
    return MockManager.instance
  }

  /**
   * Register a new mock module.
   */
  public register(mock: BaseMock): void {
    this.mocks.push(mock)
  }

  /**
   * Get all handlers from all registered mock modules.
   */
  public getAllHandlers(): HttpHandler[] {
    return this.mocks.flatMap((mock) => mock.getHandlers())
  }
}

export const mockManager = MockManager.getInstance()
