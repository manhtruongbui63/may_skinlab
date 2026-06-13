import { BaseRepository } from '@/infra/api/base-repository'
import { HttpService } from '@/infra/api/http-service'
import type { IHttpAdapter } from '@/infra/api/http-adapter'
import type {
  ChangePasswordCredentials,
  ForgotPasswordCredentials,
  LoginCredentials,
  RegisterCredentials,
  ResetPasswordCredentials,
  UpdateProfileCredentials,
  User,
} from '@/features/auth/types'
import type { IAuthRepository } from './auth.repository'
import {
  BackendAuthUserResponseSchema,
  BackendChangePasswordResponseSchema,
  BackendLogoutResponseSchema,
  BackendMessageResponseSchema,
  type BackendUser,
} from '../schemas/auth.schema'

type BackendEnvelope = {
  status_code?: number
  success?: boolean
  message?: string | null
  errors?: Record<string, string[]> | null
  data?: unknown
}

/** Map a backend user payload to the frontend `User` model. */
function mapBackendUser(user: BackendUser): User {
  return {
    id: String(user.id),
    name: user.name || user.full_name || user.username || '',
    email: user.email,
    avatar: user.avatar_url || user.avatar || '',
    role: user.roles?.[0] || 'admin',
    roles: user.roles || ['admin'],
    permissions: user.permissions || [],
  }
}

function throwIfBackendError(response: BackendEnvelope, fallbackStatus?: number): void {
  const statusCode = response.status_code ?? fallbackStatus
  const isError = statusCode === 422 || statusCode === 401 || response.success === false

  if (!isError) return

  const error = new Error(response.message || 'Request failed') as Error & {
    response?: { data?: unknown; status?: number }
  }
  error.response = {
    data: response,
    status: statusCode ?? (response.success === false ? 422 : undefined),
  }
  throw error
}

/**
 * Auth repository - works for client and server via IHttpAdapter injection.
 */
export class AuthRepository extends BaseRepository implements IAuthRepository {
  constructor(http: IHttpAdapter = HttpService) {
    super(http)
  }

  async ensureCsrfToken(): Promise<void> {
    await this.http.get('/sanctum/csrf-cookie')
  }

  async login(credentials: LoginCredentials): Promise<{ user: User; message?: string | null }> {
    await this.ensureCsrfToken()

    const responseRaw = await this.post<unknown, LoginCredentials>('/api/auth/login', credentials)
    const response = BackendAuthUserResponseSchema.parse(responseRaw)
    throwIfBackendError(response)

    if (!response.data) {
      throw new Error(response.message || 'Login failed: Invalid response format')
    }

    return { user: mapBackendUser(response.data), message: response.message }
  }

  async register(credentials: RegisterCredentials): Promise<{ user: User; message?: string | null }> {
    await this.ensureCsrfToken()

    const responseRaw = await this.post<unknown, RegisterCredentials>('/api/auth/register', credentials)
    const response = BackendAuthUserResponseSchema.parse(responseRaw)
    throwIfBackendError(response)

    if (!response.data) {
      throw new Error(response.message || 'Register failed: Invalid response format')
    }

    return { user: mapBackendUser(response.data), message: response.message }
  }

  async logout(): Promise<{ message?: string | null }> {
    const responseRaw = await this.post<unknown>('/api/auth/logout')
    const response = BackendLogoutResponseSchema.parse(responseRaw)
    throwIfBackendError(response)

    return { message: response.message }
  }

  async changePassword(data: ChangePasswordCredentials): Promise<{ success: boolean; message?: string | null }> {
    const payload = {
      current_password: data.currentPassword,
      password: data.password,
      password_confirmation: data.passwordConfirmation,
    }

    const responseRaw = await this.post<unknown, typeof payload>('/api/auth/change-password', payload)
    const response = BackendChangePasswordResponseSchema.parse(responseRaw)
    throwIfBackendError(response)

    return {
      // `typeof null === 'object'`, so guard against a null `data` being read as
      // a successful object envelope and reporting a password change that never
      // happened.
      success:
        response.success === true ||
        response.data === true ||
        (response.data != null && typeof response.data === 'object'),
      message: response.message,
    }
  }

  async getMe(): Promise<User> {
    const responseRaw = await this.get<unknown>('/api/auth/me')
    const response = BackendAuthUserResponseSchema.parse(responseRaw)
    throwIfBackendError(response)

    if (!response.data) {
      throw new Error('Failed to fetch user profile')
    }

    return mapBackendUser(response.data)
  }

  async updateProfile(data: UpdateProfileCredentials): Promise<{ user: User; message?: string | null }> {
    const responseRaw = await this.post<unknown, UpdateProfileCredentials>('/api/auth/profile', data)
    const response = BackendAuthUserResponseSchema.parse(responseRaw)
    throwIfBackendError(response)

    if (!response.data) {
      throw new Error(response.message || 'Profile update failed: Invalid response format')
    }

    return { user: mapBackendUser(response.data), message: response.message }
  }

  async forgotPassword(credentials: ForgotPasswordCredentials): Promise<{ message?: string | null }> {
    await this.ensureCsrfToken()

    const responseRaw = await this.post<unknown, ForgotPasswordCredentials>(
      '/api/auth/forgot-password',
      credentials,
    )
    const response = BackendMessageResponseSchema.parse(responseRaw)
    throwIfBackendError(response)

    return { message: response.message }
  }

  async resetPassword(data: ResetPasswordCredentials): Promise<{ message?: string | null }> {
    await this.ensureCsrfToken()

    const responseRaw = await this.post<unknown, ResetPasswordCredentials>(
      '/api/auth/reset-password',
      data,
    )
    const response = BackendMessageResponseSchema.parse(responseRaw)
    throwIfBackendError(response)

    return { message: response.message }
  }
}

/** Client-side singleton - safe to import in hooks and Client Components. */
export const authRepository: IAuthRepository = new AuthRepository()
