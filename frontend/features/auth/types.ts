import type { IIdentity } from '@/shared/types/identity'

export interface User extends IIdentity {
  id: string
  name: string
  email: string
  role: string
  roles: string[]
  permissions: string[]
  avatar?: string
}

export interface LoginCredentials {
  email: string
  password: string
}

export interface RegisterCredentials {
  name: string
  email: string
  password: string
  password_confirmation: string
}

export interface UpdateProfileCredentials {
  name: string
}

export interface ChangePasswordCredentials {
  currentPassword: string
  password: string
  passwordConfirmation: string
}

export interface ForgotPasswordCredentials {
  email: string
}

export interface ResetPasswordCredentials {
  email: string
  token: string
  password: string
  password_confirmation: string
}

export interface LoginResponse {
  user: User
  message?: string | null
}

export interface RegisterResponse {
  user: User
  message?: string | null
}

export interface AuthResponse {
  user: User
  message?: string | null
}
