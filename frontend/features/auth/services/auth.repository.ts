import type {
  ChangePasswordCredentials,
  ForgotPasswordCredentials,
  LoginCredentials,
  RegisterCredentials,
  ResetPasswordCredentials,
  UpdateProfileCredentials,
  User,
} from '../types'

/**
 * Contract for the auth repository.
 * Implementations: AuthRepository (production), AuthMock (MSW tests/dev).
 */
export interface IAuthRepository {
  /** POST /api/auth/login - authenticates the SPA session (cookie-based). */
  login(credentials: LoginCredentials): Promise<{ user: User; message?: string | null }>

  /** POST /api/auth/register - creates a new user; does not assume session login. */
  register(credentials: RegisterCredentials): Promise<{ user: User; message?: string | null }>

  /** POST /api/auth/logout. */
  logout(): Promise<{ message?: string | null }>

  /** POST /api/auth/change-password. */
  changePassword(data: ChangePasswordCredentials): Promise<{ success: boolean; message?: string | null }>

  /** GET /api/auth/me - returns current user profile with roles + permissions. */
  getMe(): Promise<User>

  /** POST /api/auth/profile - only updates the current user's name. */
  updateProfile(data: UpdateProfileCredentials): Promise<{ user: User; message?: string | null }>

  /** POST /api/auth/forgot-password - issues a reset link; uniform response (no enumeration). */
  forgotPassword(credentials: ForgotPasswordCredentials): Promise<{ message?: string | null }>

  /** POST /api/auth/reset-password - verifies the token and sets a new password. */
  resetPassword(data: ResetPasswordCredentials): Promise<{ message?: string | null }>
}
