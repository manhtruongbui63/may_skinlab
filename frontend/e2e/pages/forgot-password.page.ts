import type { Page, Locator } from '@playwright/test'

/** Page Object for the forgot-password screen (S1). */
export class ForgotPasswordPage {
  readonly page: Page
  readonly form: Locator
  readonly emailInput: Locator
  readonly submitButton: Locator
  readonly sentNotice: Locator
  readonly emailError: Locator

  constructor(page: Page) {
    this.page = page
    this.form = page.locator('#forgot-password-form')
    this.emailInput = page.locator('#forgot-email')
    this.submitButton = page.locator('#forgot-submit-btn')
    this.sentNotice = page.getByTestId('reset-link-sent-notice')
    // The DS FieldError rendered under the email field.
    this.emailError = page.locator('[data-slot="field-error"]')
  }

  async goto() {
    await this.page.goto('/forgot-password')
  }

  async submit(email: string) {
    await this.emailInput.fill(email)
    await this.submitButton.click()
  }
}
