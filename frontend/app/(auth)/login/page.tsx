'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Eye, EyeOff, Lock } from 'lucide-react'
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
import { createLoginSchema, type LoginFormValues } from '@/features/auth/schemas/auth.schema'
import { mapBackendErrors } from '@/shared/utils/map-backend-errors'
import { resetErrorState } from '@/infra/api/error-handler'
import { NOISE_TEXTURE_BACKGROUND } from '@/shared/config/noise-texture'

/**
 * Only allow redirecting to a same-origin, path-absolute URL (e.g. "/users").
 * Rejects absolute ("https://evil.com") and protocol-relative ("//evil.com")
 * targets to prevent open-redirect phishing. Returns "/" when unsafe.
 */
function sanitizeCallbackUrl(raw: string | null): string {
  if (!raw) return '/'
  // Must start with a single "/" and not be protocol-relative ("//") or a
  // backslash variant ("/\\") that browsers normalise to a network path.
  if (!raw.startsWith('/') || raw.startsWith('//') || raw.startsWith('/\\')) {
    return '/'
  }
  return raw
}

export default function LoginPage() {
  const router = useRouter()
  const t = useTranslations('Login')
  const tBranding = useTranslations('Branding')
  const { login, isLoading, error, fieldErrors, user } = useAuth()

  const [showPassword, setShowPassword] = useState(false)
  const [localError, setLocalError] = useState<string | null>(null)
  const [isFormSubmitting, setIsFormSubmitting] = useState(false)
  const loginSchema = useMemo(() => createLoginSchema(t), [t])

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  })

  useEffect(() => {
    // Reset cái errorState khi component login được mount
    resetErrorState()
  }, [])

  useEffect(() => {
    // Only redirect if we have a user and we just logged in.
    if (!user) return
    const callbackUrlStr = new URLSearchParams(window.location.search).get('callbackUrl')
    const callbackUrl = sanitizeCallbackUrl(callbackUrlStr)

    router.replace(callbackUrl)
  }, [user, router])

  useEffect(() => {
    if (fieldErrors) mapBackendErrors(fieldErrors, setError)
  }, [fieldErrors, setError])

  const onSubmit = async (values: LoginFormValues) => {
    if (isFormSubmitting || useAuthStore.getState().isLoading) return
    setIsFormSubmitting(true)
    setLocalError(null)

    try {
      const loggedInUser = await login(values)
      if (!loggedInUser) {
        setLocalError(useAuthStore.getState().error)
        return
      }
      
      // On success the user-watching effect performs the (validated) redirect,
      // so there is no manual router.push here that could race with it.
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
            <Lock className="size-10 text-foreground" strokeWidth={1.5} aria-hidden />
          </div>
          <h2 className="typo-display mb-4 text-balance font-medium tracking-tight text-foreground">
            {tBranding('systemName')}
          </h2>
          <p className="typo-body text-balance font-light text-muted-foreground">
            {tBranding('systemDescription')}
          </p>
        </div>
      </div>

      <div className="relative flex flex-1 flex-col items-center justify-center bg-background p-8 sm:p-12 lg:p-24">
        <div className="w-full max-w-sm space-y-10">
          <div className="space-y-3">
            <h1 className="typo-heading-1 tracking-tight text-foreground">{t('title')}</h1>
            <p className="typo-body text-muted-foreground">{t('subtitle')}</p>
          </div>

          <form id="login-form" onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate>
            <Field className="gap-1">
              <FieldLabel required className="text-muted-foreground" htmlFor="login-email">
                {t('emailLabel')}
              </FieldLabel>
              <FieldContent>
                <Input
                  id="login-email"
                  type="email"
                  autoComplete="username"
                  placeholder={t('emailPlaceholder')}
                  aria-invalid={Boolean(errors.email) || undefined}
                  {...register('email')}
                />
                {errors.email ? <FieldError>{errors.email.message}</FieldError> : null}
              </FieldContent>
            </Field>

            <Field className="gap-1">
              <div className="flex items-center justify-between">
                <FieldLabel required className="text-muted-foreground" htmlFor="login-password">
                  {t('passwordLabel')}
                </FieldLabel>
                <Link href="/forgot-password" className="typo-caption text-primary hover:underline">
                  {t('forgotPassword')}
                </Link>
              </div>
              <FieldContent>
                <div className="relative">
                  <Input
                    id="login-password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    placeholder={t('passwordPlaceholder')}
                    className="pr-10"
                    aria-invalid={Boolean(errors.password || displayError) || undefined}
                    aria-describedby={displayError ? 'login-error-message' : undefined}
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
                {displayError ? <FieldError id="login-error-message">{displayError}</FieldError> : null}
              </FieldContent>
            </Field>

            <Button
              id="login-submit-btn"
              type="submit"
              loading={isLoading || isFormSubmitting}
              variant="default"
              className="mt-2 w-full"
            >
              {t('submit')}
            </Button>
          </form>

          <p className="typo-caption mt-8 text-center text-muted-foreground">
            {t('noAccount')}{' '}
            <Link href="/register" className="font-medium text-primary hover:underline">
              {t('signUp')}
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
