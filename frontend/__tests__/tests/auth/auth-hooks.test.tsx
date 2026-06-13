import type { ReactNode } from 'react'
import { describe, it, expect } from 'vitest'
import { act, renderHook, waitFor } from '@testing-library/react'
import { NextIntlClientProvider } from 'next-intl'
import messages from '@/messages/en.json'
import { useForgotPassword } from '@/features/auth/hooks/use-forgot-password'
import { useResetPassword } from '@/features/auth/hooks/use-reset-password'

const wrapper = ({ children }: { children: ReactNode }) => (
  <NextIntlClientProvider locale="en" messages={messages}>
    {children}
  </NextIntlClientProvider>
)

describe('useForgotPassword (VT)', () => {
  it('starts idle', () => {
    const { result } = renderHook(() => useForgotPassword(), { wrapper })
    expect(result.current.isPending).toBe(false)
    expect(result.current.isSuccess).toBe(false)
    expect(result.current.submittedEmail).toBeNull()
  })

  it('marks success and remembers the email after a submit', async () => {
    const { result } = renderHook(() => useForgotPassword(), { wrapper })

    await act(async () => {
      const ok = await result.current.submit({ email: 'jane@example.com' })
      expect(ok).toBe(true)
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.submittedEmail).toBe('jane@example.com')
  })

  it('surfaces a 422 email-not-found without marking success', async () => {
    const { result } = renderHook(() => useForgotPassword(), { wrapper })

    let ok = true
    await act(async () => {
      ok = await result.current.submit({ email: 'nobody@example.com' })
    })

    expect(ok).toBe(false)
    expect(result.current.isSuccess).toBe(false)
    await waitFor(() => expect(result.current.fieldErrors?.email?.[0]).toMatch(/no account/i))
  })
})

describe('useResetPassword (VT)', () => {
  const base = { email: 'user@example.com', password: 'Password123', password_confirmation: 'Password123' }

  it('returns true and no field errors on a valid token', async () => {
    const { result } = renderHook(() => useResetPassword(), { wrapper })

    let ok = false
    await act(async () => {
      ok = await result.current.submit({ ...base, token: 'valid-token' })
    })

    expect(ok).toBe(true)
    expect(result.current.fieldErrors).toBeNull()
  })

  it('surfaces 422 field errors on an invalid token', async () => {
    const { result } = renderHook(() => useResetPassword(), { wrapper })

    let ok = true
    await act(async () => {
      ok = await result.current.submit({ ...base, token: 'invalid-token' })
    })

    expect(ok).toBe(false)
    await waitFor(() => expect(result.current.fieldErrors?.token?.[0]).toMatch(/invalid/i))
  })

  it('maps a same-password 422 onto the password field', async () => {
    const { result } = renderHook(() => useResetPassword(), { wrapper })

    await act(async () => {
      await result.current.submit({ ...base, token: 'same-password' })
    })

    await waitFor(() => expect(result.current.fieldErrors?.password?.[0]).toMatch(/different/i))
  })
})
