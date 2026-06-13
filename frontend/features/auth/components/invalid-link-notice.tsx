'use client'

import Link from 'next/link'
import { ArrowLeft, AlertTriangle } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { Alert, AlertDescription, AlertTitle } from '@bks/ds-system-sdk'

export interface InvalidLinkNoticeProps {
  /** Optional override message (e.g. an expired-token error from the server). */
  message?: string
}

/**
 * Shown when the reset link is missing its `token`/`email` params or the server
 * rejected the token. Offers a path to request a fresh link.
 */
export function InvalidLinkNotice({ message }: InvalidLinkNoticeProps) {
  const t = useTranslations('ResetPassword')

  return (
    <div className="space-y-6" data-testid="invalid-link-notice">
      <Alert variant="destructive">
        <AlertTriangle className="size-5" aria-hidden />
        <AlertTitle>{t('invalidLinkTitle')}</AlertTitle>
        <AlertDescription>{message ?? t('invalidLinkMessage')}</AlertDescription>
      </Alert>

      <Link
        href="/forgot-password"
        className="block text-center font-medium text-primary hover:underline"
      >
        {t('requestNewLink')}
      </Link>

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
