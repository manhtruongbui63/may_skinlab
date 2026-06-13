import { z } from 'zod'

type AuthTranslator = (key: string, values?: Record<string, string | number>) => string

export const BackendUserSchema = z.object({
  id: z.union([z.string(), z.number()]),
  name: z.string().nullable().optional(),
  full_name: z.string().nullable().optional(),
  username: z.string().nullable().optional(),
  email: z.string(),
  avatar: z.string().nullable().optional(),
  avatar_url: z.string().nullable().optional(),
  status: z.number().nullable().optional(),
  roles: z.array(z.string()).nullable().optional(),
  permissions: z.array(z.string()).nullable().optional(),
})

export type BackendUser = z.infer<typeof BackendUserSchema>

const BackendErrorsSchema = z.record(z.string(), z.array(z.string()))

export const BackendAuthUserResponseSchema = z.object({
  status_code: z.number().optional(),
  success: z.boolean().optional(),
  message: z.string().nullable().optional(),
  errors: BackendErrorsSchema.nullable().optional(),
  data: BackendUserSchema.nullable().optional(),
})

export const BackendLogoutResponseSchema = z.object({
  status_code: z.number().optional(),
  success: z.boolean().optional(),
  message: z.string().nullable().optional(),
  errors: BackendErrorsSchema.nullable().optional(),
  data: z.null().optional().nullable(),
})

export const BackendChangePasswordResponseSchema = z.object({
  status_code: z.number().optional(),
  success: z.boolean().optional(),
  message: z.string().nullable().optional(),
  errors: BackendErrorsSchema.nullable().optional(),
  data: z.union([z.boolean(), z.record(z.string(), z.unknown()), z.null()]).optional().nullable(),
})

/** Generic `{ message }`-only envelope used by forgot/reset password endpoints. */
export const BackendMessageResponseSchema = z.object({
  status_code: z.number().optional(),
  success: z.boolean().optional(),
  message: z.string().nullable().optional(),
  errors: BackendErrorsSchema.nullable().optional(),
  data: z.null().optional().nullable(),
})

export const createLoginSchema = (t: AuthTranslator) =>
  z.object({
    email: z
      .string()
      .min(1, t('errors.emailRequired'))
      .email(t('errors.emailInvalid')),
    password: z.string().min(1, t('errors.passwordRequired')),
  })

export const createRegisterSchema = (t: AuthTranslator) =>
  z
    .object({
      name: z
        .string()
        .min(1, t('errors.nameRequired'))
        .max(255, t('errors.nameMaxLength')),
      email: z
        .string()
        .min(1, t('errors.emailRequired'))
        .email(t('errors.emailInvalid'))
        .max(255, t('errors.emailMaxLength')),
      password: z
        .string()
        .min(1, t('errors.passwordRequired'))
        .min(8, t('errors.passwordMinLength')),
      password_confirmation: z.string().min(1, t('errors.confirmPasswordRequired')),
    })
    .refine((data) => data.password === data.password_confirmation, {
      message: t('errors.passwordMismatch'),
      path: ['password_confirmation'],
    })

export const createChangePasswordSchema = (t: AuthTranslator) =>
  z
    .object({
      currentPassword: z.string().min(1, t('errors.oldPasswordRequired')),
      password: z
        .string()
        .min(1, t('errors.newPasswordRequired'))
        .min(8, t('errors.newPasswordLength'))
        .max(255, t('errors.newPasswordLength')),
      passwordConfirmation: z.string().min(1, t('errors.confirmPasswordRequired')),
    })
    .refine((data) => data.password !== data.currentPassword, {
      message: t('errors.newPasswordDifferent'),
      path: ['password'],
    })
    .refine((data) => data.password === data.passwordConfirmation, {
      message: t('errors.confirmPasswordMismatch'),
      path: ['passwordConfirmation'],
    })

export const createForgotPasswordSchema = (t: AuthTranslator) =>
  z.object({
    email: z
      .string()
      .min(1, t('errors.emailRequired'))
      .email(t('errors.emailInvalid')),
  })

export const createResetPasswordSchema = (t: AuthTranslator) =>
  z
    .object({
      // Hidden, sourced from the URL — surfaced as an error if the link is malformed.
      token: z.string().min(1, t('errors.tokenRequired')),
      email: z.string().min(1, t('errors.tokenRequired')).email(t('errors.tokenRequired')),
      password: z
        .string()
        .min(1, t('errors.passwordRequired'))
        .min(8, t('errors.passwordMin')),
      password_confirmation: z.string().min(1, t('errors.confirmPasswordRequired')),
    })
    .refine((data) => data.password === data.password_confirmation, {
      message: t('errors.passwordMismatch'),
      path: ['password_confirmation'],
    })

export type LoginFormValues = z.infer<ReturnType<typeof createLoginSchema>>
export type RegisterFormValues = z.infer<ReturnType<typeof createRegisterSchema>>
export type ChangePasswordFormValues = z.infer<ReturnType<typeof createChangePasswordSchema>>
export type ForgotPasswordFormValues = z.infer<ReturnType<typeof createForgotPasswordSchema>>
export type ResetPasswordFormValues = z.infer<ReturnType<typeof createResetPasswordSchema>>
