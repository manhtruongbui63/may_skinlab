'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Eye, EyeOff, UserPlus } from 'lucide-react'
import { useTranslations } from 'next-intl'
import {
  Button,
  Field,
  FieldContent,
  FieldError,
  FieldLabel,
  Input,
} from '@bks/ds-system-sdk'
import { useAuth } from '@/features/auth'
import { useAuthStore } from '@/features/auth/stores/auth.store'
import { createRegisterSchema, type RegisterFormValues } from '@/features/auth/schemas/auth.schema'
import { mapBackendErrors } from '@/shared/utils/map-backend-errors'
import { NOISE_TEXTURE_BACKGROUND } from '@/shared/config/noise-texture'

export default function RegisterPage() {
  const router = useRouter()
  const t = useTranslations('Register')
  const tBranding = useTranslations('Branding')
  const { register: registerAccount, isLoading, error, fieldErrors } = useAuth()

  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [localError, setLocalError] = useState<string | null>(null)
  const [isFormSubmitting, setIsFormSubmitting] = useState(false)
  const registerSchema = useMemo(() => createRegisterSchema(t), [t])

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      password_confirmation: '',
    },
  })

  useEffect(() => {
    if (fieldErrors) mapBackendErrors(fieldErrors, setError)
  }, [fieldErrors, setError])

  const onSubmit = async (values: RegisterFormValues) => {
    if (isFormSubmitting || useAuthStore.getState().isLoading) return
    setIsFormSubmitting(true)
    setLocalError(null)

    try {
      const user = await registerAccount(values)
      if (!user) {
        setLocalError(useAuthStore.getState().error)
        return
      }
      router.push('/login')
    } finally {
      setIsFormSubmitting(false)
    }
  }

  const displayError = localError ?? error

  return (
    <div className="flex min-h-screen bg-background">
      <div className="relative hidden flex-1 items-center justify-center overflow-hidden bg-muted lg:flex">
        <div
          className="absolute inset-0 opacity-70"
          style={{
            backgroundImage: `
              radial-gradient(circle at 15% 50%, hsl(var(--primary) / 0.15), transparent 50%),
              radial-gradient(circle at 85% 30%, hsl(var(--primary) / 0.12), transparent 50%),
              radial-gradient(circle at 50% 80%, hsl(var(--info) / 0.08), transparent 50%)
            `,
            backgroundSize: '100% 100%',
          }}
        />
        <div
          className="absolute inset-0 opacity-20 mix-blend-overlay"
          style={{ backgroundImage: NOISE_TEXTURE_BACKGROUND }}
        />
        <div className="relative z-10 max-w-lg p-12 text-center">
          <div className="mb-8 inline-flex size-20 items-center justify-center rounded-3xl border border-border bg-background/80 shadow-2xl backdrop-blur-xl">
            <UserPlus className="size-10 text-foreground" strokeWidth={1.5} aria-hidden />
          </div>
          <h2 className="typo-display mb-4 text-balance font-medium tracking-tight text-foreground">
            {tBranding('systemName')}
          </h2>
          <p className="typo-body text-balance font-light text-muted-foreground">
            {tBranding('systemDescription')}
          </p>
        </div>
      </div>

      <div className="custom-scrollbar relative flex flex-1 flex-col items-center justify-center overflow-y-auto bg-background p-8 sm:p-12 lg:p-24">
        <div className="my-auto w-full max-w-sm space-y-8">
          <div className="space-y-3">
            <h1 className="typo-heading-1 tracking-tight text-foreground">{t('title')}</h1>
            <p className="typo-body text-muted-foreground">{t('subtitle')}</p>
          </div>

          <form id="register-form" onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
            <Field className="gap-1">
              <FieldLabel required className="text-muted-foreground" htmlFor="register-name">
                {t('nameLabel')}
              </FieldLabel>
              <FieldContent>
                <Input
                  id="register-name"
                  type="text"
                  autoComplete="name"
                  placeholder={t('namePlaceholder')}
                  aria-invalid={Boolean(errors.name) || undefined}
                  {...register('name')}
                />
                {errors.name ? <FieldError>{errors.name.message}</FieldError> : null}
              </FieldContent>
            </Field>

            <Field className="gap-1">
              <FieldLabel required className="text-muted-foreground" htmlFor="register-email">
                {t('emailLabel')}
              </FieldLabel>
              <FieldContent>
                <Input
                  id="register-email"
                  type="email"
                  autoComplete="email"
                  placeholder={t('emailPlaceholder')}
                  aria-invalid={Boolean(errors.email) || undefined}
                  {...register('email')}
                />
                {errors.email ? <FieldError>{errors.email.message}</FieldError> : null}
              </FieldContent>
            </Field>

            <Field className="gap-1">
              <FieldLabel required className="text-muted-foreground" htmlFor="register-password">
                {t('passwordLabel')}
              </FieldLabel>
              <FieldContent>
                <div className="relative">
                  <Input
                    id="register-password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    placeholder={t('passwordPlaceholder')}
                    className="pr-10"
                    aria-invalid={Boolean(errors.password) || undefined}
                    {...register('password')}
                  />
                  <button
                    type="button"
                    onClick={(event) => {
                      event.preventDefault()
                      setShowPassword((value) => !value)
                    }}
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
              <FieldLabel required className="text-muted-foreground" htmlFor="register-password-confirmation">
                {t('confirmPasswordLabel')}
              </FieldLabel>
              <FieldContent>
                <div className="relative">
                  <Input
                    id="register-password-confirmation"
                    type={showConfirmPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    placeholder={t('passwordPlaceholder')}
                    className="pr-10"
                    aria-invalid={Boolean(errors.password_confirmation || displayError) || undefined}
                    aria-describedby={displayError ? 'register-error-message' : undefined}
                    {...register('password_confirmation')}
                  />
                  <button
                    type="button"
                    onClick={(event) => {
                      event.preventDefault()
                      setShowConfirmPassword((value) => !value)
                    }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer text-muted-foreground transition-colors hover:text-foreground"
                    aria-label={showConfirmPassword ? t('hidePassword') : t('showPassword')}
                  >
                    {showConfirmPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
                {errors.password_confirmation ? (
                  <FieldError>{errors.password_confirmation.message}</FieldError>
                ) : null}
                {displayError ? <FieldError id="register-error-message">{displayError}</FieldError> : null}
              </FieldContent>
            </Field>

            <Button type="submit" loading={isLoading || isFormSubmitting} className="mt-4 w-full">
              {t('submit')}
            </Button>

            <p className="typo-caption mt-6 text-center text-muted-foreground">
              {t('haveAccount')}{' '}
              <Link href="/login" className="font-medium text-primary hover:underline">
                {t('login')}
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  )
}
