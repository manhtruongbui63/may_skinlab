'use client'

import Link from 'next/link'
import { ArrowLeft, CheckCircle2 } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { Alert, AlertDescription, AlertTitle } from '@bks/ds-system-sdk'

export interface ResetLinkSentNoticeProps {
  /** The email the link was requested for, echoed back to the user. */
  email?: string
}

/**
 * Success state shown after a reset link is requested. Intentionally identical
 * regardless of whether the email exists, so account existence is never leaked.
 */
export function ResetLinkSentNotice({ email }: ResetLinkSentNoticeProps) {
  const t = useTranslations('ForgotPassword')

  return (
    <div className="space-y-6" data-testid="reset-link-sent-notice">
      <Alert variant="success">
        <CheckCircle2 className="size-5" aria-hidden />
        <AlertTitle>{t('successTitle')}</AlertTitle>
        <AlertDescription>{t('successMessage', { email: email ?? '' })}</AlertDescription>
      </Alert>

      <p className="typo-caption text-center text-muted-foreground">
        <Link
          href="/login"
          className="inline-flex items-center gap-1 font-medium text-primary hover:underline"
        >
          <ArrowLeft className="size-4" aria-hidden />
          {t('backToLogin')}
        </Link>
      </p>
    </div>
  )
}
