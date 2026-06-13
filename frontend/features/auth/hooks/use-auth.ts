import { useAuthStore } from '@/features/auth/stores/auth.store'
import { authService } from '@/features/auth/services/auth.service'
import type {
  ChangePasswordCredentials,
  LoginCredentials,
  RegisterCredentials,
  UpdateProfileCredentials,
} from '@/features/auth/types'

export const useAuth = () => {
  const { user, isLoading, isInitialized, error, fieldErrors, roles, permissions } = useAuthStore()

  const login = async (credentials: LoginCredentials) => await authService.login(credentials)
  const register = async (credentials: RegisterCredentials) => await authService.register(credentials)
  const logout = async () => await authService.logout()
  const fetchMe = async () => await authService.fetchMe()
  const updateProfile = async (credentials: UpdateProfileCredentials) =>
    await authService.updateProfile(credentials)
  const changePassword = async (credentials: ChangePasswordCredentials) =>
    await authService.changePassword(credentials)

  return {
    user,
    isLoading,
    isInitialized,
    error,
    fieldErrors,
    roles,
    permissions,
    isAuthenticated: !!user,
    login,
    register,
    logout,
    fetchMe,
    updateProfile,
    changePassword,
  }
}
