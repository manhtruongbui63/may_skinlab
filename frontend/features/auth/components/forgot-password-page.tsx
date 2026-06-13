'use client'

import { useTranslations } from 'next-intl'
import { useForgotPassword } from '@/features/auth/hooks/use-forgot-password'
import { AuthScreenShell } from './auth-screen-shell'
import { ForgotPasswordForm } from './forgot-password-form'
import { ResetLinkSentNotice } from './reset-link-sent-notice'

/**
 * Forgot-password screen container (S1). Owns the request hook and toggles
 * between the email form and the success notice. On success it does NOT
 * navigate, so email existence is never revealed (anti-enumeration, UI-001).
 */
export function ForgotPasswordPage() {
  const t = useTranslations('ForgotPassword')
  const { submit, isPending, isSuccess, submittedEmail, fieldErrors } = useForgotPassword()

  return (
    <AuthScreenShell
      title={t('title')}
      subtitle={t('subtitle')}
      brandingTitle={t('brandingTitle')}
      brandingDescription={t('brandingDescription')}
    >
      {isSuccess ? (
        <ResetLinkSentNotice email={submittedEmail ?? undefined} />
      ) : (
        <ForgotPasswordForm onSubmit={submit} isPending={isPending} fieldErrors={fieldErrors} />
      )}
    </AuthScreenShell>
  )
}
