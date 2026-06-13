import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithIntl } from '../../utils/render-with-intl'
import { ResetPasswordForm } from '@/features/auth/components/reset-password-form'
import { ResetPasswordPage } from '@/features/auth/components/reset-password-page'
import { InvalidLinkNotice } from '@/features/auth/components/invalid-link-notice'

// Hoisted mock state so the next/navigation mock can vary per test.
const nav = vi.hoisted(() => ({
  params: new URLSearchParams(),
  push: vi.fn(),
}))

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: nav.push }),
  useSearchParams: () => nav.params,
}))

vi.mock('next/link', () => ({
  default: ({ href, children, ...props }: { href: string; children: React.ReactNode }) => (
    <a href={typeof href === 'string' ? href : '#'} {...props}>
      {children}
    </a>
  ),
}))

beforeEach(() => {
  nav.params = new URLSearchParams()
  nav.push.mockReset()
})

const FORM_PROPS = { token: 'valid-token', email: 'user@example.com', isPending: false }

// The DS FieldLabel appends a required indicator, so query the inputs by id
// instead of by accessible label text (which would also be ambiguous between
// "New password" and "Confirm new password").
const passwordInput = () => document.getElementById('reset-password') as HTMLInputElement
const confirmInput = () => document.getElementById('reset-password-confirmation') as HTMLInputElement

describe('ResetPasswordForm (S2) — behavioral (VT)', () => {
  it('rejects a password shorter than 8 characters', async () => {
    const onSubmit = vi.fn()
    const user = userEvent.setup()
    renderWithIntl(<ResetPasswordForm {...FORM_PROPS} onSubmit={onSubmit} />)

    await user.type(passwordInput(), 'short')
    await user.type(confirmInput(), 'short')
    await user.click(screen.getByRole('button', { name: /reset password/i }))

    expect(await screen.findByText(/at least 8 characters/i)).toBeInTheDocument()
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('rejects mismatched confirmation', async () => {
    const onSubmit = vi.fn()
    const user = userEvent.setup()
    renderWithIntl(<ResetPasswordForm {...FORM_PROPS} onSubmit={onSubmit} />)

    await user.type(passwordInput(), 'Password123')
    await user.type(confirmInput(), 'Different123')
    await user.click(screen.getByRole('button', { name: /reset password/i }))

    expect(await screen.findByText(/passwords do not match/i)).toBeInTheDocument()
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('submits all fields including the hidden token/email when valid', async () => {
    const onSubmit = vi.fn()
    const user = userEvent.setup()
    renderWithIntl(<ResetPasswordForm {...FORM_PROPS} onSubmit={onSubmit} />)

    await user.type(passwordInput(), 'Password123')
    await user.type(confirmInput(), 'Password123')
    await user.click(screen.getByRole('button', { name: /reset password/i }))

    await waitFor(() => expect(onSubmit).toHaveBeenCalled())
    expect(onSubmit.mock.calls[0][0]).toEqual({
      token: 'valid-token',
      email: 'user@example.com',
      password: 'Password123',
      password_confirmation: 'Password123',
    })
  })

  it('disables the submit button while pending (UI-004)', () => {
    const { container } = renderWithIntl(<ResetPasswordForm {...FORM_PROPS} isPending onSubmit={vi.fn()} />)
    expect(container.querySelector('#reset-submit-btn')).toBeDisabled()
  })

  it('toggles password visibility', async () => {
    const user = userEvent.setup()
    renderWithIntl(<ResetPasswordForm {...FORM_PROPS} onSubmit={vi.fn()} />)
    const password = passwordInput()
    expect(password).toHaveAttribute('type', 'password')
    await user.click(screen.getByRole('button', { name: /show password/i }))
    expect(password).toHaveAttribute('type', 'text')
  })
})

describe('ResetPasswordPage (S2) — integration (VT)', () => {
  it('renders the invalid-link notice when params are missing (UI-002)', () => {
    nav.params = new URLSearchParams()
    renderWithIntl(<ResetPasswordPage />)
    expect(screen.getByTestId('invalid-link-notice')).toBeInTheDocument()
    expect(passwordInput()).not.toBeInTheDocument()
  })

  it('renders the form when token and email are present', () => {
    nav.params = new URLSearchParams({ token: 'valid-token', email: 'user@example.com' })
    renderWithIntl(<ResetPasswordPage />)
    expect(passwordInput()).toBeInTheDocument()
    expect(screen.queryByTestId('invalid-link-notice')).not.toBeInTheDocument()
  })

  it('redirects to /login after a successful reset (UI-003)', async () => {
    nav.params = new URLSearchParams({ token: 'valid-token', email: 'user@example.com' })
    const user = userEvent.setup()
    renderWithIntl(<ResetPasswordPage />)

    await user.type(passwordInput(), 'Password123')
    await user.type(confirmInput(), 'Password123')
    await user.click(screen.getByRole('button', { name: /reset password/i }))

    await waitFor(() => expect(nav.push).toHaveBeenCalledWith('/login'), { timeout: 3000 })
  })

  it('shows a banner for an invalid token (422 mapBackendErrors)', async () => {
    nav.params = new URLSearchParams({ token: 'invalid-token', email: 'user@example.com' })
    const user = userEvent.setup()
    renderWithIntl(<ResetPasswordPage />)

    await user.type(passwordInput(), 'Password123')
    await user.type(confirmInput(), 'Password123')
    await user.click(screen.getByRole('button', { name: /reset password/i }))

    const banner = await screen.findByTestId('reset-token-error')
    expect(banner).toHaveTextContent(/invalid/i)
    expect(nav.push).not.toHaveBeenCalled()
  })

  it('shows a banner for an expired token', async () => {
    nav.params = new URLSearchParams({ token: 'expired-token', email: 'user@example.com' })
    const user = userEvent.setup()
    renderWithIntl(<ResetPasswordPage />)

    await user.type(passwordInput(), 'Password123')
    await user.type(confirmInput(), 'Password123')
    await user.click(screen.getByRole('button', { name: /reset password/i }))

    expect(await screen.findByTestId('reset-token-error')).toHaveTextContent(/expired/i)
  })

  it('maps a same-password 422 onto the password field', async () => {
    nav.params = new URLSearchParams({ token: 'same-password', email: 'user@example.com' })
    const user = userEvent.setup()
    renderWithIntl(<ResetPasswordPage />)

    await user.type(passwordInput(), 'Password123')
    await user.type(confirmInput(), 'Password123')
    await user.click(screen.getByRole('button', { name: /reset password/i }))

    expect(await screen.findByText(/must be different from your current password/i)).toBeInTheDocument()
  })
})

describe('Reset password — design-system mapping (VT-DS)', () => {
  it('password fields map to the DS Input slot', () => {
    renderWithIntl(<ResetPasswordForm {...FORM_PROPS} onSubmit={vi.fn()} />)
    expect(passwordInput()).toHaveAttribute('data-slot', 'input')
    expect(confirmInput()).toHaveAttribute('data-slot', 'input')
  })

  it('submit maps to the DS Button slot', () => {
    renderWithIntl(<ResetPasswordForm {...FORM_PROPS} onSubmit={vi.fn()} />)
    expect(screen.getByRole('button', { name: /reset password/i })).toHaveAttribute(
      'data-slot',
      'button',
    )
  })

  it('carries token and email as hidden inputs prefilled from the URL', () => {
    const { container } = renderWithIntl(<ResetPasswordForm {...FORM_PROPS} onSubmit={vi.fn()} />)
    const hidden = container.querySelectorAll('input[type="hidden"]')
    const values = Array.from(hidden).map((el) => (el as HTMLInputElement).value)
    expect(values).toContain('valid-token')
    expect(values).toContain('user@example.com')
  })

  it('the invalid-link notice uses the DS Alert with the destructive variant', () => {
    const { container } = renderWithIntl(<InvalidLinkNotice />)
    const alert = container.querySelector('[data-slot="alert"]')
    expect(alert).toBeInTheDocument()
    expect(alert?.className).toMatch(/destructive/)
  })

  it('the invalid-link notice links to request a new link and back to login', () => {
    renderWithIntl(<InvalidLinkNotice />)
    expect(screen.getByRole('link', { name: /request a new link/i })).toHaveAttribute(
      'href',
      '/forgot-password',
    )
    expect(screen.getByRole('link', { name: /back to sign in/i })).toHaveAttribute('href', '/login')
  })

  it('renders required field labels via the DS FieldLabel slot', () => {
    const { container } = renderWithIntl(<ResetPasswordForm {...FORM_PROPS} onSubmit={vi.fn()} />)
    expect(container.querySelectorAll('[data-slot="field-label"]').length).toBeGreaterThanOrEqual(2)
  })
})
