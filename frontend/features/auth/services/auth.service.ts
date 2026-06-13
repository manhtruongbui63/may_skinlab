import { useAuthStore } from '@/features/auth/stores/auth.store'
import { handleApiError } from '@/infra/api/error-handler'
import { AuthRepository } from './auth.repository.impl'
import { toast } from 'sonner'
import type { IAuthRepository } from './auth.repository'
import type {
  ChangePasswordCredentials,
  LoginCredentials,
  RegisterCredentials,
  UpdateProfileCredentials,
  User,
} from '@/features/auth/types'

export class AuthService {
  constructor(private readonly repository: IAuthRepository) {}

  async login(credentials: LoginCredentials): Promise<User | null> {
    const store = useAuthStore.getState()
    store.setLoading(true)
    store.setError(null, null)

    try {
      const { user } = await this.repository.login(credentials)
      store.setUser(user)
      return user
    } catch (error: unknown) {
      this.handleFormError(error, 'Login failed')
      return null
    } finally {
      store.setLoading(false)
    }
  }

  async register(credentials: RegisterCredentials): Promise<User | null> {
    const store = useAuthStore.getState()
    store.setLoading(true)
    store.setError(null, null)

    try {
      const { user, message } = await this.repository.register(credentials)
      if (message) toast.success(message)
      return user
    } catch (error: unknown) {
      this.handleFormError(error, 'Register failed')
      return null
    } finally {
      store.setLoading(false)
    }
  }

  async logout(): Promise<void> {
    try {
      await this.repository.logout()
    } catch {
      // Fire-and-forget; clear local state regardless.
    } finally {
      useAuthStore.getState().reset()
    }
  }

  async fetchMe(): Promise<User | null> {
    const store = useAuthStore.getState()
    store.setLoading(true)

    try {
      const user = await this.repository.getMe()
      store.setUser(user)
      return user
    } catch (error: unknown) {
      // A 401 simply means there is no active session — the expected path on a
      // fresh load, not an error. Set the user to null and only surface an error
      // for non-401 failures so the login screen shows no spurious message.
      const responseStatus = (error as { response?: { status?: number } })?.response?.status
      store.setUser(null)
      if (responseStatus !== 401) {
        store.setError(error instanceof Error ? error.message : 'Failed to fetch user')
      }
      return null
    } finally {
      store.setLoading(false)
    }
  }

  async updateProfile(credentials: UpdateProfileCredentials): Promise<User | null> {
    const store = useAuthStore.getState()
    store.setLoading(true)
    store.setError(null, null)

    try {
      const { user, message } = await this.repository.updateProfile(credentials)
      store.setUser(user)
      if (message) toast.success(message)
      return user
    } catch (error: unknown) {
      this.handleFormError(error, 'Profile update failed')
      return null
    } finally {
      store.setLoading(false)
    }
  }

  async changePassword(credentials: ChangePasswordCredentials): Promise<boolean> {
    const store = useAuthStore.getState()
    store.setLoading(true)
    store.setError(null, null)

    try {
      const { success, message } = await this.repository.changePassword(credentials)
      if (success && message) toast.success(message)
      return success
    } catch (error: unknown) {
      const responseStatus = (error as { response?: { status?: number } })?.response?.status
      const responseData = (error as { response?: { data?: Record<string, unknown> } })?.response?.data
      const isValidationError = responseStatus === 422 || responseData?.status_code === 422

      if (isValidationError) throw error

      if (responseStatus === 401) {
        // Await the logout/store reset before the error handler redirects, so
        // the login page never mounts while the store still holds a stale user.
        await this.logout()
        handleApiError(error)
        return false
      }

      handleApiError(error)
      return false
    } finally {
      store.setLoading(false)
    }
  }

  private handleFormError(error: unknown, fallbackMessage: string): void {
    const store = useAuthStore.getState()
    const responseData = (error as { response?: { data?: Record<string, unknown> } })?.response?.data
    const responseStatus = (error as { response?: { status?: number } })?.response?.status
    const isValidationError = responseStatus === 422 || responseData?.status_code === 422
    const backendMsg = responseData?.message as string | undefined
    const message = backendMsg || (error instanceof Error ? error.message : fallbackMessage)

    let fieldErrors = (responseData?.errors as Record<string, string[]> | null) || null
    if (!fieldErrors && isValidationError && responseData?.data) {
      fieldErrors = responseData.data as Record<string, string[]>
    }

    if (isValidationError) {
      store.setError(message, fieldErrors)
      return
    }

    if (responseStatus === 401) {
      store.setError(message, null)
      return
    }

    handleApiError(error)
    store.setError(message, null)
  }
}

/** Client-side singleton - import `authService` in hooks and client components. */
export const authService = new AuthService(new AuthRepository())
