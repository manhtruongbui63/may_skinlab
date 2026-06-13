'use client'

import { Suspense } from 'react'
import { ResetPasswordPage } from '@/features/auth/components/reset-password-page'

export default function Page() {
  // useSearchParams() requires a Suspense boundary during prerender.
  return (
    <Suspense>
      <ResetPasswordPage />
    </Suspense>
  )
}
