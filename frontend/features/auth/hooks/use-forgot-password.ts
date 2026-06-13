import { useState } from 'react'
import { toast } from 'sonner'
import { useTranslations } from 'next-intl'
import { handleApiError } from '@/infra/api/error-handler'
import { authRepository } from '@/features/auth/services/auth.repository.impl'
import type { ForgotPasswordCredentials } from '@/features/auth/types'

interface UseForgotPasswordResult {
  submit: (values: ForgotPasswordCredentials) => Promise<boolean>
  isPending: boolean
  isSuccess: boolean
  submittedEmail: string | null
  /** Backend 422 field errors (e.g. email-not-found) for mapBackendErrors. */
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
 * Drives the forgot-password request. Guest flow: no auth-store mutation, all
 * state is local. The backend returns 422 when the email is not registered, so
 * that case surfaces as an inline field error instead of the success notice.
 */
export function useForgotPassword(): UseForgotPasswordResult {
  const t = useTranslations('ForgotPassword')
  const [isPending, setIsPending] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [submittedEmail, setSubmittedEmail] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]> | null>(null)

  const submit = async (values: ForgotPasswordCredentials): Promise<boolean> => {
    setIsPending(true)
    setFieldErrors(null)
    try {
      await authRepository.forgotPassword(values)
      setSubmittedEmail(values.email)
      setIsSuccess(true)
      toast.success(t('toastSuccess'))
      return true
    } catch (error: unknown) {
      if (isValidationError(error)) {
        // e.g. email not registered → show the inline field error.
        setFieldErrors(extractFieldErrors(error))
      } else {
        handleApiError(error)
      }
      return false
    } finally {
      setIsPending(false)
    }
  }

  return { submit, isPending, isSuccess, submittedEmail, fieldErrors }
}
