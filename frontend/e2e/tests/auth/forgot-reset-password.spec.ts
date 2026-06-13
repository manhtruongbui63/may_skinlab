import { test, expect } from '@playwright/test'
import { LoginPage } from '../../pages/login.page'
import { ForgotPasswordPage } from '../../pages/forgot-password.page'
import { ResetPasswordPage } from '../../pages/reset-password.page'

/**
 * E2E for the guest password-reset journey. Runs against the app in mock mode
 * (NEXT_PUBLIC_USE_MOCK=true), where the reset `token` selects the outcome:
 *   valid-token → success · expired-token → expired · same-password → must-differ
 *   anything else → invalid.
 * Selectors are id/test-id/role based so they are independent of the UI locale.
 */

const VALID_EMAIL = 'user@example.com'

test.describe('Forgot password (S1)', () => {
  test('login screen links to forgot-password', async ({ page }) => {
    const login = new LoginPage(page)
    await login.goto()
    await expect(login.forgotPasswordLink).toBeVisible()
    await login.forgotPasswordLink.first().click()
    await expect(page).toHaveURL(/\/forgot-password$/)
  })

  test('submitting a valid email shows the sent notice without navigating (UI-001)', async ({ page }) => {
    const forgot = new ForgotPasswordPage(page)
    await forgot.goto()
    await forgot.submit(VALID_EMAIL)
    await expect(forgot.sentNotice).toBeVisible()
    await expect(forgot.form).toHaveCount(0)
    await expect(page).toHaveURL(/\/forgot-password$/)
  })

  test('an invalid email shows an inline error and fires no request', async ({ page }) => {
    const forgot = new ForgotPasswordPage(page)
    await forgot.goto()
    await forgot.submit('not-an-email')
    await expect(forgot.emailError).toBeVisible()
    await expect(forgot.sentNotice).toHaveCount(0)
  })

  test('an unregistered email shows an inline not-found error (no notice)', async ({ page }) => {
    const forgot = new ForgotPasswordPage(page)
    await forgot.goto()
    await forgot.submit('definitely-not-registered@example.com')
    await expect(forgot.emailError).toBeVisible()
    await expect(forgot.sentNotice).toHaveCount(0)
  })
})

test.describe('Reset password (S2)', () => {
  test('opens the form when token and email are present', async ({ page }) => {
    const reset = new ResetPasswordPage(page)
    await reset.goto({ token: 'valid-token', email: VALID_EMAIL })
    await expect(reset.form).toBeVisible()
    await expect(reset.invalidLinkNotice).toHaveCount(0)
  })

  test('shows the invalid-link notice when params are missing (UI-002)', async ({ page }) => {
    const reset = new ResetPasswordPage(page)
    await reset.goto()
    await expect(reset.invalidLinkNotice).toBeVisible()
    await expect(reset.form).toHaveCount(0)
  })

  test('the invalid-link notice links to request a new link', async ({ page }) => {
    const reset = new ResetPasswordPage(page)
    await reset.goto()
    await reset.requestNewLink.click()
    await expect(page).toHaveURL(/\/forgot-password$/)
  })

  test('rejects a password shorter than 8 characters', async ({ page }) => {
    const reset = new ResetPasswordPage(page)
    await reset.goto({ token: 'valid-token', email: VALID_EMAIL })
    await reset.submit('short')
    await expect(reset.fieldErrors.first()).toBeVisible()
    await expect(page).toHaveURL(/\/reset-password/)
  })

  test('rejects a mismatched confirmation', async ({ page }) => {
    const reset = new ResetPasswordPage(page)
    await reset.goto({ token: 'valid-token', email: VALID_EMAIL })
    await reset.submit('Password123', 'Different123')
    await expect(reset.fieldErrors.first()).toBeVisible()
  })

  test('a valid token resets the password and redirects to login (UI-003)', async ({ page }) => {
    const reset = new ResetPasswordPage(page)
    await reset.goto({ token: 'valid-token', email: VALID_EMAIL })
    await reset.submit('Password123')
    await page.waitForURL(/\/login$/, { timeout: 5000 })
  })

  test('an invalid token surfaces an error banner', async ({ page }) => {
    const reset = new ResetPasswordPage(page)
    await reset.goto({ token: 'bad-token', email: VALID_EMAIL })
    await reset.submit('Password123')
    await expect(reset.tokenErrorBanner).toBeVisible()
    await expect(page).toHaveURL(/\/reset-password/)
  })

  test('an expired token surfaces an error banner', async ({ page }) => {
    const reset = new ResetPasswordPage(page)
    await reset.goto({ token: 'expired-token', email: VALID_EMAIL })
    await reset.submit('Password123')
    await expect(reset.tokenErrorBanner).toBeVisible()
  })

  test('reusing the current password is rejected on the password field', async ({ page }) => {
    const reset = new ResetPasswordPage(page)
    await reset.goto({ token: 'same-password', email: VALID_EMAIL })
    await reset.submit('Password123')
    await expect(reset.fieldErrors.first()).toBeVisible()
    await expect(page).toHaveURL(/\/reset-password/)
  })
})

test.describe('Full journey', () => {
  test('login → forgot link → submit → sent notice', async ({ page }) => {
    const login = new LoginPage(page)
    await login.goto()
    await login.forgotPasswordLink.first().click()
    await expect(page).toHaveURL(/\/forgot-password$/)

    const forgot = new ForgotPasswordPage(page)
    await forgot.submit(VALID_EMAIL)
    await expect(forgot.sentNotice).toBeVisible()
  })
})
