'use client'

import { useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Alert, AlertDescription } from '@bks/ds-system-sdk'
import { useResetPassword } from '@/features/auth/hooks/use-reset-password'
import type { ResetPasswordFormValues } from '@/features/auth/schemas/auth.schema'
import { AuthScreenShell } from './auth-screen-shell'
import { ResetPasswordForm } from './reset-password-form'
import { InvalidLinkNotice } from './invalid-link-notice'

/** Delay before redirecting to login so the success toast is visible (UI-003). */
const REDIRECT_DELAY_MS = 1500

/**
 * Reset-password screen container (S2). Reads `token`/`email` from the URL,
 * guards a malformed link (UI-002), submits via the reset hook, and on success
 * toasts then redirects to /login (UI-003). Token errors surface as a banner.
 */
export function ResetPasswordPage() {
  const t = useTranslations('ResetPassword')
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectingRef = useRef(false)

  const token = searchParams.get('token') ?? ''
  const email = searchParams.get('email') ?? ''

  const { submit, isPending, fieldErrors } = useResetPassword()

  // UI-002: a link missing either param can never succeed — show the notice.
  if (!token || !email) {
    return (
      <AuthScreenShell
        title={t('title')}
        subtitle={t('subtitle')}
        brandingTitle={t('brandingTitle')}
        brandingDescription={t('brandingDescription')}
      >
        <InvalidLinkNotice />
      </AuthScreenShell>
    )
  }

  const handleSubmit = async (values: ResetPasswordFormValues) => {
    if (redirectingRef.current) return
    const ok = await submit(values)
    if (ok) {
      redirectingRef.current = true
      setTimeout(() => router.push('/login'), REDIRECT_DELAY_MS)
    }
  }

  // Invalid/expired token errors apply to the hidden token field → show a banner.
  const tokenError = fieldErrors?.token?.[0] ?? null

  return (
    <AuthScreenShell
      title={t('title')}
      subtitle={t('subtitle')}
      brandingTitle={t('brandingTitle')}
      brandingDescription={t('brandingDescription')}
    >
      <div className="space-y-6">
        {tokenError ? (
          <Alert variant="destructive" data-testid="reset-token-error">
            <AlertDescription>{tokenError}</AlertDescription>
          </Alert>
        ) : null}

        <ResetPasswordForm
          onSubmit={handleSubmit}
          isPending={isPending}
          token={token}
          email={email}
          fieldErrors={fieldErrors}
        />
      </div>
    </AuthScreenShell>
  )
}
