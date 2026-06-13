import { describe, it, expect, vi } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithIntl } from '../../utils/render-with-intl'
import { ForgotPasswordForm } from '@/features/auth/components/forgot-password-form'
import { ForgotPasswordPage } from '@/features/auth/components/forgot-password-page'
import { ResetLinkSentNotice } from '@/features/auth/components/reset-link-sent-notice'

// next/link needs the App Router context; a plain anchor is enough for these tests.
vi.mock('next/link', () => ({
  default: ({ href, children, ...props }: { href: string; children: React.ReactNode }) => (
    <a href={typeof href === 'string' ? href : '#'} {...props}>
      {children}
    </a>
  ),
}))

describe('ForgotPasswordForm (S1) — behavioral (VT)', () => {
  it('renders the email field and submit button', () => {
    renderWithIntl(<ForgotPasswordForm onSubmit={vi.fn()} isPending={false} />)
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /send reset link/i })).toBeInTheDocument()
  })

  it('shows an inline error and does not submit on an invalid email', async () => {
    const onSubmit = vi.fn()
    const user = userEvent.setup()
    renderWithIntl(<ForgotPasswordForm onSubmit={onSubmit} isPending={false} />)

    await user.type(screen.getByLabelText(/email/i), 'not-an-email')
    await user.click(screen.getByRole('button', { name: /send reset link/i }))

    expect(await screen.findByText(/email must be valid/i)).toBeInTheDocument()
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('submits the email when valid', async () => {
    const onSubmit = vi.fn()
    const user = userEvent.setup()
    renderWithIntl(<ForgotPasswordForm onSubmit={onSubmit} isPending={false} />)

    await user.type(screen.getByLabelText(/email/i), 'jane@example.com')
    await user.click(screen.getByRole('button', { name: /send reset link/i }))

    // RHF calls onSubmit(values, event), so assert on the first argument only.
    await waitFor(() => expect(onSubmit).toHaveBeenCalled())
    expect(onSubmit.mock.calls[0][0]).toEqual(expect.objectContaining({ email: 'jane@example.com' }))
  })

  it('disables the submit button while pending (UI-004)', () => {
    const { container } = renderWithIntl(<ForgotPasswordForm onSubmit={vi.fn()} isPending />)
    // While loading the DS Button hides its label, so query by id, not name.
    expect(container.querySelector('#forgot-submit-btn')).toBeDisabled()
  })

  it('requires the email field (empty submit)', async () => {
    const onSubmit = vi.fn()
    const user = userEvent.setup()
    renderWithIntl(<ForgotPasswordForm onSubmit={onSubmit} isPending={false} />)

    await user.click(screen.getByRole('button', { name: /send reset link/i }))

    expect(await screen.findByText(/email is required/i)).toBeInTheDocument()
    expect(onSubmit).not.toHaveBeenCalled()
  })
})

describe('ForgotPasswordPage (S1) — integration (VT)', () => {
  it('swaps to the success notice after a valid submit without navigating (UI-001)', async () => {
    const user = userEvent.setup()
    renderWithIntl(<ForgotPasswordPage />)

    await user.type(screen.getByLabelText(/email/i), 'jane@example.com')
    await user.click(screen.getByRole('button', { name: /send reset link/i }))

    expect(await screen.findByTestId('reset-link-sent-notice')).toBeInTheDocument()
    expect(screen.queryByLabelText(/email/i)).not.toBeInTheDocument()
  })

  it('shows an inline error for an unregistered email (no success notice)', async () => {
    const user = userEvent.setup()
    renderWithIntl(<ForgotPasswordPage />)

    await user.type(screen.getByLabelText(/email/i), 'ghost-account@example.com')
    await user.click(screen.getByRole('button', { name: /send reset link/i }))

    expect(await screen.findByText(/no account was found/i)).toBeInTheDocument()
    expect(screen.queryByTestId('reset-link-sent-notice')).not.toBeInTheDocument()
  })
})

describe('Forgot password — design-system mapping (VT-DS)', () => {
  it('email input maps to the DS Input slot', () => {
    renderWithIntl(<ForgotPasswordForm onSubmit={vi.fn()} isPending={false} />)
    expect(screen.getByLabelText(/email/i)).toHaveAttribute('data-slot', 'input')
  })

  it('submit maps to the DS Button slot', () => {
    renderWithIntl(<ForgotPasswordForm onSubmit={vi.fn()} isPending={false} />)
    expect(screen.getByRole('button', { name: /send reset link/i })).toHaveAttribute(
      'data-slot',
      'button',
    )
  })

  it('the label renders via the DS FieldLabel with a required indicator', () => {
    const { container } = renderWithIntl(<ForgotPasswordForm onSubmit={vi.fn()} isPending={false} />)
    expect(container.querySelector('[data-slot="field-label"]')).toBeInTheDocument()
    expect(container.querySelector('[data-slot="field-required-indicator"]')).toBeInTheDocument()
  })

  it('invalid input surfaces via the DS FieldError slot', async () => {
    const user = userEvent.setup()
    const { container } = renderWithIntl(<ForgotPasswordForm onSubmit={vi.fn()} isPending={false} />)
    await user.type(screen.getByLabelText(/email/i), 'bad')
    await user.click(screen.getByRole('button', { name: /send reset link/i }))
    await waitFor(() =>
      expect(container.querySelector('[data-slot="field-error"]')).toBeInTheDocument(),
    )
  })

  it('the success notice uses the DS Alert with the success variant', () => {
    const { container } = renderWithIntl(<ResetLinkSentNotice email="jane@example.com" />)
    const alert = container.querySelector('[data-slot="alert"]')
    expect(alert).toBeInTheDocument()
    expect(alert?.className).toMatch(/success/)
  })

  it('the success notice echoes the submitted email and links back to login', () => {
    renderWithIntl(<ResetLinkSentNotice email="jane@example.com" />)
    expect(screen.getByText(/jane@example.com/)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /back to sign in/i })).toHaveAttribute('href', '/login')
  })
})
