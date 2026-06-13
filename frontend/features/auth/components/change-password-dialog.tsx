'use client'

import { useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Eye, EyeOff, Lock } from 'lucide-react'
import { useTranslations } from 'next-intl'
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Field,
  FieldContent,
  FieldError,
  FieldLabel,
  Input,
} from '@bks/ds-system-sdk'
import { useAuth } from '../hooks/use-auth'
import { useAuthStore } from '@/features/auth/stores/auth.store'
import {
  createChangePasswordSchema,
  type ChangePasswordFormValues,
} from '@/features/auth/schemas/auth.schema'
import { mapBackendErrors } from '@/shared/utils/map-backend-errors'

type ChangePasswordDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ChangePasswordDialog({ open, onOpenChange }: ChangePasswordDialogProps) {
  const t = useTranslations('ChangePassword')

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton
        className="flex max-h-[min(90vh,44rem)] w-[min(calc(100vw-2rem),28rem)] max-w-[calc(100vw-2rem)] flex-col gap-0 overflow-hidden p-0 sm:max-w-[min(calc(100vw-2rem),28rem)]"
      >
        <DialogHeader className="gap-2 border-b border-border px-6 py-5 text-left">
          <div className="flex size-10 items-center justify-center rounded-full border border-border bg-muted">
            <Lock className="size-5 text-muted-foreground" aria-hidden />
          </div>
          <DialogTitle className="pr-8 text-foreground">{t('title')}</DialogTitle>
          <DialogDescription className="text-muted-foreground">{t('description')}</DialogDescription>
        </DialogHeader>

        {open ? <ChangePasswordForm onClose={() => onOpenChange(false)} /> : null}
      </DialogContent>
    </Dialog>
  )
}

function ChangePasswordForm({ onClose }: { onClose: () => void }) {
  const t = useTranslations('ChangePassword')
  const { changePassword, isLoading } = useAuth()
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showPasswordConfirmation, setShowPasswordConfirmation] = useState(false)
  const [isFormSubmitting, setIsFormSubmitting] = useState(false)
  const schema = useMemo(() => createChangePasswordSchema(t), [t])

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<ChangePasswordFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      currentPassword: '',
      password: '',
      passwordConfirmation: '',
    },
  })

  const onSubmit = async (values: ChangePasswordFormValues) => {
    if (isFormSubmitting || useAuthStore.getState().isLoading) return
    setIsFormSubmitting(true)

    try {
      const success = await changePassword(values)
      if (success) onClose()
    } catch (error: unknown) {
      const responseData = (error as { response?: { data?: Record<string, unknown> } })?.response?.data
      const rawErrors =
        (responseData?.errors as Record<string, string[]> | null) ??
        (responseData?.data as Record<string, string[]> | null)

      mapBackendErrors(rawErrors, setError, {
        current_password: 'currentPassword',
        password: 'password',
        password_confirmation: 'passwordConfirmation',
      })
    } finally {
      setIsFormSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex min-h-0 flex-1 flex-col overflow-hidden" noValidate>
      <div className="custom-scrollbar min-h-0 flex-1 space-y-4 overflow-y-auto p-6">
        <Field className="gap-1">
          <FieldLabel required className="text-muted-foreground" htmlFor="currentPassword">
            {t('oldPasswordLabel')}
          </FieldLabel>
          <FieldContent>
            <PasswordInput
              id="currentPassword"
              autoComplete="current-password"
              placeholder={t('placeholder')}
              showPassword={showCurrentPassword}
              onToggle={() => setShowCurrentPassword((value) => !value)}
              ariaLabel={showCurrentPassword ? t('hidePassword') : t('showPassword')}
              invalid={Boolean(errors.currentPassword)}
              registerProps={register('currentPassword')}
            />
            {errors.currentPassword ? <FieldError>{errors.currentPassword.message}</FieldError> : null}
          </FieldContent>
        </Field>

        <Field className="gap-1">
          <FieldLabel required className="text-muted-foreground" htmlFor="password">
            {t('newPasswordLabel')}
          </FieldLabel>
          <FieldContent>
            <PasswordInput
              id="password"
              autoComplete="new-password"
              placeholder={t('placeholder')}
              showPassword={showPassword}
              onToggle={() => setShowPassword((value) => !value)}
              ariaLabel={showPassword ? t('hidePassword') : t('showPassword')}
              invalid={Boolean(errors.password)}
              registerProps={register('password')}
            />
            {errors.password ? <FieldError>{errors.password.message}</FieldError> : null}
          </FieldContent>
        </Field>

        <Field className="gap-1">
          <FieldLabel required className="text-muted-foreground" htmlFor="passwordConfirmation">
            {t('confirmNewPasswordLabel')}
          </FieldLabel>
          <FieldContent>
            <PasswordInput
              id="passwordConfirmation"
              autoComplete="new-password"
              placeholder={t('placeholder')}
              showPassword={showPasswordConfirmation}
              onToggle={() => setShowPasswordConfirmation((value) => !value)}
              ariaLabel={showPasswordConfirmation ? t('hidePassword') : t('showPassword')}
              invalid={Boolean(errors.passwordConfirmation)}
              registerProps={register('passwordConfirmation')}
            />
            {errors.passwordConfirmation ? (
              <FieldError>{errors.passwordConfirmation.message}</FieldError>
            ) : null}
          </FieldContent>
        </Field>
      </div>

      <DialogFooter className="m-0 -mx-0 -mb-0 shrink-0 flex-row justify-end gap-2 px-6 py-4">
        <Button type="button" variant="outline" onClick={onClose} className="min-w-24">
          {t('cancel')}
        </Button>
        <Button type="submit" loading={isLoading || isFormSubmitting} className="min-w-24">
          {t('submit')}
        </Button>
      </DialogFooter>
    </form>
  )
}

type PasswordInputProps = {
  id: string
  autoComplete: string
  placeholder: string
  showPassword: boolean
  onToggle: () => void
  ariaLabel: string
  invalid: boolean
  registerProps: React.InputHTMLAttributes<HTMLInputElement>
}

function PasswordInput({
  id,
  autoComplete,
  placeholder,
  showPassword,
  onToggle,
  ariaLabel,
  invalid,
  registerProps,
}: PasswordInputProps) {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { size, ...inputProps } = registerProps

  return (
    <div className="relative">
      <Input
        id={id}
        type={showPassword ? 'text' : 'password'}
        autoComplete={autoComplete}
        placeholder={placeholder}
        className="pr-10"
        aria-invalid={invalid || undefined}
        {...inputProps}
      />
      <button
        type="button"
        onClick={(event) => {
          event.preventDefault()
          onToggle()
        }}
        className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer text-muted-foreground transition-colors hover:text-foreground"
        aria-label={ariaLabel}
      >
        {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
      </button>
    </div>
  )
}
