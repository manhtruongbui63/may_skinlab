import type { Page, Locator } from '@playwright/test'

/** Page Object for the reset-password screen (S2). */
export class ResetPasswordPage {
  readonly page: Page
  readonly form: Locator
  readonly passwordInput: Locator
  readonly confirmInput: Locator
  readonly submitButton: Locator
  readonly invalidLinkNotice: Locator
  readonly tokenErrorBanner: Locator
  readonly fieldErrors: Locator
  readonly requestNewLink: Locator

  constructor(page: Page) {
    this.page = page
    this.form = page.locator('#reset-password-form')
    this.passwordInput = page.locator('#reset-password')
    this.confirmInput = page.locator('#reset-password-confirmation')
    this.submitButton = page.locator('#reset-submit-btn')
    this.invalidLinkNotice = page.getByTestId('invalid-link-notice')
    this.tokenErrorBanner = page.getByTestId('reset-token-error')
    this.fieldErrors = page.locator('[data-slot="field-error"]')
    this.requestNewLink = page.locator('a[href="/forgot-password"]')
  }

  async goto(params?: { token?: string; email?: string }) {
    const query = new URLSearchParams()
    if (params?.token !== undefined) query.set('token', params.token)
    if (params?.email !== undefined) query.set('email', params.email)
    const qs = query.toString()
    await this.page.goto(`/reset-password${qs ? `?${qs}` : ''}`)
  }

  async submit(password: string, confirmation = password) {
    await this.passwordInput.fill(password)
    await this.confirmInput.fill(confirmation)
    await this.submitButton.click()
  }
}
