'use client'

import { useEffect, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Eye, EyeOff } from 'lucide-react'
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
  createResetPasswordSchema,
  type ResetPasswordFormValues,
} from '@/features/auth/schemas/auth.schema'
import { mapBackendErrors } from '@/shared/utils/map-backend-errors'

export interface ResetPasswordFormProps {
  onSubmit: (values: ResetPasswordFormValues) => void | Promise<unknown>
  isPending: boolean
  token: string
  email: string
  /** Backend 422 field errors to surface on the matching fields. */
  fieldErrors?: Record<string, string[]> | null
}

/**
 * Presentational reset-password form: new password + confirmation, with the
 * token/email carried as hidden values prefilled from the URL.
 */
export function ResetPasswordForm({
  onSubmit,
  isPending,
  token,
  email,
  fieldErrors,
}: ResetPasswordFormProps) {
  const t = useTranslations('ResetPassword')
  const schema = useMemo(() => createResetPasswordSchema(t), [t])
  const [showPassword, setShowPassword] = useState(false)

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(schema),
    defaultValues: { token, email, password: '', password_confirmation: '' },
  })

  // Reflect backend validation errors (e.g. same_password) on their fields.
  useEffect(() => {
    if (fieldErrors) mapBackendErrors(fieldErrors, setError)
  }, [fieldErrors, setError])

  return (
    <form
      id="reset-password-form"
      onSubmit={handleSubmit(onSubmit)}
      className="space-y-6"
      noValidate
    >
      <input type="hidden" {...register('token')} />
      <input type="hidden" {...register('email')} />

      <Field className="gap-1">
        <FieldLabel required className="text-muted-foreground" htmlFor="reset-password">
          {t('passwordLabel')}
        </FieldLabel>
        <FieldContent>
          <div className="relative">
            <Input
              id="reset-password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              placeholder={t('passwordPlaceholder')}
              className="pr-10"
              aria-invalid={Boolean(errors.password) || undefined}
              {...register('password')}
            />
            <button
              type="button"
              onClick={() => setShowPassword((value) => !value)}
              className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer text-muted-foreground transition-colors hover:text-foreground"
              aria-label={showPassword ? t('hidePassword') : t('showPassword')}
            >
              {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>
          {errors.password ? <FieldError>{errors.password.message}</FieldError> : null}
        </FieldContent>
      </Field>

      <Field className="gap-1">
        <FieldLabel required className="text-muted-foreground" htmlFor="reset-password-confirmation">
          {t('confirmPasswordLabel')}
        </FieldLabel>
        <FieldContent>
          <Input
            id="reset-password-confirmation"
            type={showPassword ? 'text' : 'password'}
            autoComplete="new-password"
            placeholder={t('confirmPasswordPlaceholder')}
            aria-invalid={Boolean(errors.password_confirmation) || undefined}
            {...register('password_confirmation')}
          />
          {errors.password_confirmation ? (
            <FieldError>{errors.password_confirmation.message}</FieldError>
          ) : null}
        </FieldContent>
      </Field>

      <Button
        id="reset-submit-btn"
        type="submit"
        loading={isPending}
        variant="default"
        className="w-full"
      >
        {t('submit')}
      </Button>
    </form>
  )
}
