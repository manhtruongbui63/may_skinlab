'use client'

import { useEffect, useMemo } from 'react'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowLeft } from 'lucide-react'
import { useTranslations } from 'next-intl'
import {
  Button,
  Field,
  FieldContent,
  FieldError,
  FieldLabel,
  Input,
} from '@bks/ds-system-sdk'
import {
  createForgotPasswordSchema,
  type ForgotPasswordFormValues,
} from '@/features/auth/schemas/auth.schema'
import { mapBackendErrors } from '@/shared/utils/map-backend-errors'

export interface ForgotPasswordFormProps {
  onSubmit: (values: ForgotPasswordFormValues) => void | Promise<unknown>
  isPending: boolean
  /** Backend 422 field errors (e.g. email not found) to surface on the field. */
  fieldErrors?: Record<string, string[]> | null
}

/**
 * Presentational forgot-password form: a single email field + submit.
 * Validation is client-side via Zod; submission is delegated to `onSubmit`.
 */
export function ForgotPasswordForm({ onSubmit, isPending, fieldErrors }: ForgotPasswordFormProps) {
  const t = useTranslations('ForgotPassword')
  const schema = useMemo(() => createForgotPasswordSchema(t), [t])

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: '' },
  })

  // Reflect backend validation errors (e.g. email not found) on the field.
  useEffect(() => {
    if (fieldErrors) mapBackendErrors(fieldErrors, setError)
  }, [fieldErrors, setError])

  return (
    <form
      id="forgot-password-form"
      onSubmit={handleSubmit(onSubmit)}
      className="space-y-6"
      noValidate
    >
      <Field className="gap-1">
        <FieldLabel required className="text-muted-foreground" htmlFor="forgot-email">
          {t('emailLabel')}
        </FieldLabel>
        <FieldContent>
          <Input
            id="forgot-email"
            type="email"
            autoComplete="email"
            placeholder={t('emailPlaceholder')}
            aria-invalid={Boolean(errors.email) || undefined}
            {...register('email')}
          />
          {errors.email ? <FieldError>{errors.email.message}</FieldError> : null}
        </FieldContent>
      </Field>

      <Button
        id="forgot-submit-btn"
        type="submit"
        loading={isPending}
        variant="default"
        className="w-full"
      >
        {t('submit')}
      </Button>

      <p className="typo-caption text-center text-muted-foreground">
        <Link
          href="/login"
          className="inline-flex items-center gap-1 font-medium text-primary hover:underline"
        >
          <ArrowLeft className="size-4" aria-hidden />
          {t('backToLogin')}
        </Link>
      </p>
    </form>
  )
}
