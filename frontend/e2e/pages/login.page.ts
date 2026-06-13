import type { Page, Locator } from '@playwright/test'

/** Minimal Page Object for the login screen — only the bits the reset flow needs. */
export class LoginPage {
  readonly page: Page
  readonly forgotPasswordLink: Locator

  constructor(page: Page) {
    this.page = page
    this.forgotPasswordLink = page.locator('a[href="/forgot-password"]')
  }

  async goto() {
    await this.page.goto('/login')
  }
}
