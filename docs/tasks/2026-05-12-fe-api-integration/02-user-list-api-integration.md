---
task_id: "02"
title: "User List API Integration"
description: "Create API hooks, types, and data table components for user list with pagination, sorting, and filtering"
type: IMPLEMENTATION
phase: 3
status: pending
estimated_effort: S
complexity: medium
risk: low
depends_on: ["01"]
rule_refs: []
date: "2026-05-12"
changelog:
  - version: 1.0
    date: "2026-05-12"
    summary: Initial task specification.
---

# Context
- **Requirement**: Integration of User List API into Frontend
- **Parent Task**: [2026-05-12-fe-api-integration-implementation-tasks.md](../2026-05-12-fe-api-integration-implementation-tasks.md)
- **Applicable Workflows**: (None)
- **Applicable Skills**: `fe-implementation`

---

# Task 02: User List API Integration

## Description
Implement frontend integration for the User List API, including data fetching hooks, pagination handling, sorting, and filtering. This task focuses on the data layer required to display a paginated user list table.

## Out of Scope
- Actual table UI component (only data layer)
- User detail/edit modals
- User creation/deletion flows

---

## Current State (Already Exists)
- **Backend API**: `GET /api/users` exists with pagination and filter support
- **Feature Directory**: `features/users/` exists
- **Depends On**: Task 01 (Auth API) for authentication

---

## Requirements

### 1. API Types (`features/users/types/user.ts`)

**Action: NEW**

Create TypeScript interfaces for user list operations:

| Interface | Fields |
|-----------|--------|
| `UserListItem` | id, name, email, role, createdAt |
| `UserListResponse` | data: UserListItem[], meta: PaginationMeta |
| `UserListParams` | page?: number, perPage?: number, search?: string, sortBy?: string, sortOrder?: 'asc' \| 'desc' |
| `PaginationMeta` | currentPage, lastPage, perPage, total, from, to |

### 2. API Hooks (`features/users/hooks/`)

**Action: NEW**

Create React Query hooks for user list operations:

| Hook | Purpose |
|------|---------|
| `useUserListQuery` | Fetch paginated user list with filters |
| `useUserSearch` | Debounced search hook |

**Hook Signatures:**
```typescript
export function useUserListQuery(
  params: UserListParams
): UseQueryResult<UserListResponse, Error>

export function useUserSearch(
  delay?: number
): {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  debouncedSearch: string;
}
```

### 3. Data Table State (`features/users/stores/user-list-store.ts`)

**Action: NEW**

Create Zustand store for user list state:

**Store Interface:**
```typescript
interface UserListState {
  // Pagination
  page: number;
  perPage: number;
  
  // Sorting
  sortBy: string | null;
  sortOrder: 'asc' | 'desc' | null;
  
  // Filtering
  search: string;
  
  // Actions
  setPage: (page: number) => void;
  setPerPage: (perPage: number) => void;
  setSort: (column: string, order: 'asc' | 'desc') => void;
  setSearch: (search: string) => void;
  resetFilters: () => void;
}
```

### 4. Table Utilities (`features/users/utils/table-utils.ts`)

**Action: NEW**

Create utility functions for table operations:

| Function | Purpose |
|----------|---------|
| `buildUserListQueryKey` | Generate query key for cache invalidation |
| `getSortIcon` | Return sort icon based on current sort state |

### 5. API Constants (`features/users/constants/api-endpoints.ts`)

**Action: NEW**

Define API endpoint constants:

```typescript
export const USER_ENDPOINTS = {
  list: '/api/users',
} as const;
```

### 6. i18n Keys

**Action: NEW**

Add translation keys:

| Key | English | Vietnamese |
|-----|---------|------------|
| `users.title` | "Users" | "Người dùng" |
| `users.columns.name` | "Name" | "Tên" |
| `users.columns.email` | "Email" | "Email" |
| `users.columns.role` | "Role" | "Vai trò" |
| `users.columns.createdAt` | "Created At" | "Ngày tạo" |
| `users.search.placeholder` | "Search users..." | "Tìm kiếm người dùng..." |
| `users.pagination.showing` | "Showing {from} to {to} of {total}" | "Hiển thị {from} đến {to} của {total}" |

---

## API Endpoints Summary

| Method | URI | Description | Input Parameters | Output Response | Auth |
|--------|-----|-------------|------------------|-----------------|------|
| GET | `/api/users` | List users | `page` (number), `per_page` (number), `search` (string), `sort_by` (string), `sort_order` (asc/desc) | `{ data: [...], meta: {...} }` | Yes |

---

## Testing Hints

**Frontend Requirements:**
- **Stores/Composables**: Test store state changes and URL sync
- **UI Interactions**: Test pagination, sorting, search interactions
- **Key test scenarios**:
  - Fetch users on mount → data displayed
  - Change page → new data loaded, URL updated
  - Sort by column → data reordered
  - Search → debounced API call
  - Reset filters → back to default state

---

## Status
- [ ] Create TypeScript types in `features/users/types/user.ts`
- [ ] Create API hooks in `features/users/hooks/use-user-list-query.ts`
- [ ] Create search hook in `features/users/hooks/use-user-search.ts`
- [ ] Create Zustand store in `features/users/stores/user-list-store.ts`
- [ ] Create utility functions in `features/users/utils/table-utils.ts`
- [ ] Add i18n strings
- [ ] Run `pnpm lint`
- [ ] Run `pnpm test:unit`

---

## Acceptance Criteria
1. User list hook fetches data with pagination
2. Store manages pagination, sorting, and filter state
3. Search is debounced to prevent excessive API calls
4. Sort state syncs with URL query parameters
5. All types are properly defined and exported
6. MSW handler mocks paginated user list response

---

## Error Scenarios
- Unauthorized → 401, redirect to login
- Server error → 500, show error state
- Empty results → Display empty state
- Network error → Retry with exponential backoff

---

## Dependencies
- Task 01 (Auth API Integration) — Required for authenticated requests
