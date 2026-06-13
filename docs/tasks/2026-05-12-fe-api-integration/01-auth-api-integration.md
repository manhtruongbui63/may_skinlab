---
task_id: "01"
title: "Auth API Integration"
description: "Create API hooks, types, and auth store for all authentication endpoints (register, login, logout, me, profile, change-password)"
type: IMPLEMENTATION
phase: 3
status: pending
estimated_effort: M
complexity: medium
risk: low
depends_on: []
rule_refs: []
date: "2026-05-12"
changelog:
  - version: 1.0
    date: "2026-05-12"
    summary: Initial task specification.
---

# Context
- **Requirement**: Integration of existing Auth APIs into Frontend
- **Parent Task**: [2026-05-12-fe-api-integration-implementation-tasks.md](../2026-05-12-fe-api-integration-implementation-tasks.md)
- **Applicable Workflows**: (None)
- **Applicable Skills**: `fe-implementation`

---

# Task 01: Auth API Integration

## Description
Implement complete frontend integration for all authentication APIs including API hooks, TypeScript types, Zod schemas for validation, and Zustand store for auth state management. This task covers the full auth flow from registration to logout.

## Out of Scope
- UI components (login form, register form) — only data layer
- Password reset/forgot password flows
- Social authentication (OAuth)

---

## Current State (Already Exists)
- **Feature Directory**: `features/auth/` exists with basic structure
- **API Client**: `lib/api/client.ts` exists
- **Endpoints**: Backend APIs already implemented:
  - `POST /api/auth/register`
  - `POST /api/auth/login`
  - `POST /api/auth/logout`
  - `GET /api/auth/me`
  - `POST /api/auth/profile`
  - `POST /api/auth/change-password`

---

## Requirements

### 1. API Types (`features/auth/types/auth.ts`)

**Action: NEW**

Create TypeScript interfaces for all auth-related data:

| Interface | Fields |
|-----------|--------|
| `User` | id, email, name, avatar?, role, createdAt, updatedAt |
| `LoginRequest` | email: string, password: string |
| `LoginResponse` | user: User, token: string |
| `RegisterRequest` | name: string, email: string, password: string, passwordConfirmation: string |
| `RegisterResponse` | user: User, token: string |
| `UpdateProfileRequest` | name?: string, email?: string |
| `ChangePasswordRequest` | currentPassword: string, newPassword: string, newPasswordConfirmation: string |

### 2. Zod Schemas (`features/auth/schemas/auth-schemas.ts`)

**Action: NEW**

Create Zod validation schemas matching backend validation:

| Schema | Rules |
|--------|-------|
| `loginSchema` | email: email format, password: min 8 chars |
| `registerSchema` | name: min 2 chars, email: email format, password: min 8 chars, passwordConfirmation: must match password |
| `updateProfileSchema` | name: min 2 chars (optional), email: email format (optional) |
| `changePasswordSchema` | currentPassword: required, newPassword: min 8 chars, newPasswordConfirmation: must match newPassword |

### 3. API Hooks (`features/auth/hooks/`)

**Action: NEW**

Create React Query hooks for each auth endpoint:

| Hook | Endpoint | Method | Purpose |
|------|----------|--------|---------|
| `useLoginMutation` | `/api/auth/login` | POST | Login with credentials |
| `useRegisterMutation` | `/api/auth/register` | POST | Register new user |
| `useLogoutMutation` | `/api/auth/logout` | POST | Logout current user |
| `useMeQuery` | `/api/auth/me` | GET | Get current user profile |
| `useUpdateProfileMutation` | `/api/auth/profile` | POST | Update user profile |
| `useChangePasswordMutation` | `/api/auth/change-password` | POST | Change user password |

**Hook Signatures:**
```typescript
// Mutation hooks
export function useLoginMutation(): UseMutationResult<LoginResponse, Error, LoginRequest>
export function useRegisterMutation(): UseMutationResult<RegisterResponse, Error, RegisterRequest>
export function useLogoutMutation(): UseMutationResult<void, Error, void>
export function useUpdateProfileMutation(): UseMutationResult<User, Error, UpdateProfileRequest>
export function useChangePasswordMutation(): UseMutationResult<void, Error, ChangePasswordRequest>

// Query hooks
export function useMeQuery(): UseQueryResult<User, Error>
```

### 4. Auth Store (`features/auth/stores/auth-store.ts`)

**Action: NEW**

Create Zustand store for auth state management:

**Store Interface:**
```typescript
interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  
  // Actions
  setUser: (user: User) => void;
  setToken: (token: string) => void;
  login: (data: LoginResponse) => void;
  logout: () => void;
  updateUser: (data: Partial<User>) => void;
}
```

**Features:**
- Persist token to localStorage
- Sync user state across components
- Computed `isAuthenticated` property
- Clear auth state on logout

### 5. API Constants (`features/auth/constants/api-endpoints.ts`)

**Action: NEW**

Define API endpoint constants:

```typescript
export const AUTH_ENDPOINTS = {
  login: '/api/auth/login',
  register: '/api/auth/register',
  logout: '/api/auth/logout',
  me: '/api/auth/me',
  profile: '/api/auth/profile',
  changePassword: '/api/auth/change-password',
} as const;
```

### 6. i18n Keys

**Action: NEW**

Add translation keys to `i18n/en.json` and `i18n/vi.json`:

| Key | English | Vietnamese |
|-----|---------|------------|
| `auth.login.success` | "Login successful" | "Đăng nhập thành công" |
| `auth.login.error` | "Invalid credentials" | "Thông tin đăng nhập không đúng" |
| `auth.register.success` | "Registration successful" | "Đăng ký thành công" |
| `auth.logout.success` | "Logged out successfully" | "Đăng xuất thành công" |
| `auth.profile.update.success` | "Profile updated" | "Cập nhật hồ sơ thành công" |
| `auth.password.change.success` | "Password changed" | "Đổi mật khẩu thành công" |
| `validation.password.mismatch` | "Passwords do not match" | "Mật khẩu không khớp" |

---

## API Endpoints Summary

| Method | URI | Description | Input Parameters | Output Response | Auth |
|--------|-----|-------------|------------------|-----------------|------|
| POST | `/api/auth/login` | User login | `email` (string, required), `password` (string, required) | `{ user: {...}, token: "..." }` | No |
| POST | `/api/auth/register` | User registration | `name` (string, min:2), `email` (email), `password` (string, min:8), `password_confirmation` (string) | `{ user: {...}, token: "..." }` | No |
| POST | `/api/auth/logout` | User logout | — | `{ message: "..." }` | Yes |
| GET | `/api/auth/me` | Get current user | — | `{ data: {...} }` | Yes |
| POST | `/api/auth/profile` | Update profile | `name` (string, optional), `email` (email, optional) | `{ data: {...} }` | Yes |
| POST | `/api/auth/change-password` | Change password | `current_password` (string), `new_password` (string, min:8), `new_password_confirmation` (string) | `{ message: "..." }` | Yes |

---

## Testing Hints

**Frontend Requirements:**
- **Stores/Composables**: Mock Zustand store for isolated hook testing
- **API Mocks**: Create MSW handlers for all auth endpoints
- **Key test scenarios**:
  - Login with valid credentials → token stored
  - Login with invalid credentials → error message
  - Register with valid data → user created
  - Logout → token cleared, redirect to login
  - Token persistence → restored from localStorage on reload

---

## Status
- [ ] Create TypeScript types in `features/auth/types/auth.ts`
- [ ] Create Zod schemas in `features/auth/schemas/auth-schemas.ts`
- [ ] Create API constants in `features/auth/constants/api-endpoints.ts`
- [ ] Create API hooks in `features/auth/hooks/` (useLoginMutation, useRegisterMutation, etc.)
- [ ] Create Zustand store in `features/auth/stores/auth-store.ts`
- [ ] Add i18n strings to `i18n/en.json` and `i18n/vi.json`
- [ ] Run `pnpm lint` to check code style
- [ ] Run `pnpm test:unit` to verify tests pass

---

## Acceptance Criteria
1. All 6 auth endpoints have corresponding React Query hooks
2. Zod schemas validate input matching backend rules
3. Zustand store persists auth token and syncs user state
4. All hooks are typed with proper TypeScript interfaces
5. i18n strings defined for all user-facing messages
6. MSW handlers created for mocking auth APIs in tests
7. Unit tests pass for hooks and store

---

## Error Scenarios
- Invalid credentials → 401 Unauthorized, show error message
- Validation errors → 422 Unprocessable Entity, display field errors
- Token expired → 401, auto-logout user
- Network error → Show connection error message

---

## Dependencies
- None (this is the first task)
