import { useState } from 'react'
import { toast } from 'sonner'
import { useTranslations } from 'next-intl'
import { handleApiError } from '@/infra/api/error-handler'
import { authRepository } from '@/features/auth/services/auth.repository.impl'
import type { ResetPasswordCredentials } from '@/features/auth/types'

interface UseResetPasswordResult {
  submit: (values: ResetPasswordCredentials) => Promise<boolean>
  isPending: boolean
  /** Backend 422 field errors (e.g. token/password) for mapBackendErrors + banner. */
  fieldErrors: Record<string, string[]> | null
}

/** Read `errors` out of an axios-style 422 envelope, if present. */
function extractFieldErrors(error: unknown): Record<string, string[]> | null {
  const data = (error as { response?: { data?: { errors?: Record<string, string[]> | null } } })
    ?.response?.data
  return data?.errors ?? null
}

function isValidationError(error: unknown): boolean {
  const response = (error as { response?: { status?: number; data?: { status_code?: number } } })?.response
  return response?.status === 422 || response?.data?.status_code === 422
}

/**
 * Drives the reset-password request. Guest flow: local state only. On a 422 the
 * field errors are exposed so the screen can map them to form fields / a banner;
 * other failures go through the global handler.
 */
export function useResetPassword(): UseResetPasswordResult {
  const t = useTranslations('ResetPassword')
  const [isPending, setIsPending] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]> | null>(null)

  const submit = async (values: ResetPasswordCredentials): Promise<boolean> => {
    setIsPending(true)
    setFieldErrors(null)
    try {
      await authRepository.resetPassword(values)
      toast.success(t('toastSuccess'))
      return true
    } catch (error: unknown) {
      if (isValidationError(error)) {
        setFieldErrors(extractFieldErrors(error))
      } else {
        handleApiError(error)
      }
      return false
    } finally {
      setIsPending(false)
    }
  }

  return { submit, isPending, fieldErrors }
}
