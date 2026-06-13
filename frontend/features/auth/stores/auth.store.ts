import { create } from 'zustand'
import type { User } from '@/features/auth/types'

interface AuthState {
  user: User | null
  isLoading: boolean
  isInitialized: boolean
  error: string | null
  fieldErrors: Record<string, string[]> | null
  hasLoggedOut: boolean

  // Derived permission helpers (computed from user)
  roles: string[]
  permissions: string[]

  // Setters
  setUser: (user: User | null) => void
  setLoading: (isLoading: boolean) => void
  setError: (error: string | null, fieldErrors?: Record<string, string[]> | null) => void
  setLogoutStatus: (status: boolean) => void

  /** Full reset — called on logout */
  reset: () => void
}

const initialState = {
  user: null,
  isLoading: false,
  isInitialized: false,
  error: null,
  fieldErrors: null,
  hasLoggedOut: false,
  roles: [],
  permissions: [],
}

export const useAuthStore = create<AuthState>((set) => ({
  ...initialState,

  setUser: (user) =>
    set({
      user,
      isLoading: false,
      isInitialized: true,
      error: null,
      fieldErrors: null,
      // Sync roles & permissions directly from user object
      roles: user?.roles ?? [],
      permissions: user?.permissions ?? [],
    }),

  setLoading: (isLoading) => set({ isLoading }),

  setError: (error, fieldErrors = null) => set({ error, fieldErrors, isLoading: false, isInitialized: true }),

  setLogoutStatus: (status) => set({ hasLoggedOut: status }),

  reset: () => set({ ...initialState, isInitialized: true }),
}))
