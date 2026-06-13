---
task_id: "03"
title: "Master Data API Integration"
description: "Create API hooks and cache management for master data endpoints used across the application"
type: IMPLEMENTATION
phase: 3
status: pending
estimated_effort: S
complexity: low
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
- **Requirement**: Integration of Master Data API into Frontend
- **Parent Task**: [2026-05-12-fe-api-integration-implementation-tasks.md](../2026-05-12-fe-api-integration-implementation-tasks.md)
- **Applicable Workflows**: (None)
- **Applicable Skills**: `fe-implementation`

---

# Task 03: Master Data API Integration

## Description
Implement frontend integration for the Master Data API, creating hooks to fetch and cache master data resources like roles, permissions, and other lookup data used across the application.

## Out of Scope
- Master data management UI (CRUD operations)
- Dynamic master data registration
- Custom master data drivers

---

## Current State (Already Exists)
- **Backend API**: `GET /api/master-data` exists
- **Feature Directory**: Create `features/master-data/`

---

## Requirements

### 1. API Types (`features/master-data/types/master-data.ts`)

**Action: NEW**

Create TypeScript interfaces for master data:

| Interface | Fields |
|-----------|--------|
| `MasterDataItem` | value: string \| number, label: string |
| `MasterDataResponse` | Record<string, MasterDataItem[]> |
| `MasterDataRequest` | resources: string[] |

**Supported Resources:**
- `roles` — User roles (admin, user, etc.)
- `permissions` — Permission list
- `genders` — Gender options
- `statuses` — Status options

### 2. API Hooks (`features/master-data/hooks/`)

**Action: NEW**

Create React Query hooks:

| Hook | Purpose |
|------|---------|
| `useMasterDataQuery` | Fetch master data by resource names |
| `useMasterDataItem` | Get single master data resource |

**Hook Signatures:**
```typescript
export function useMasterDataQuery(
  resources: string[],
  options?: { enabled?: boolean }
): UseQueryResult<MasterDataResponse, Error>

export function useMasterDataItem(
  resource: string
): MasterDataItem[] | undefined
```

### 3. Master Data Cache (`features/master-data/stores/master-data-store.ts`)

**Action: NEW**

Create lightweight store for master data cache:

**Store Interface:**
```typescript
interface MasterDataState {
  cache: Record<string, MasterDataItem[]>;
  isLoaded: Record<string, boolean>;
  
  setData: (resource: string, data: MasterDataItem[]) => void;
  getData: (resource: string) => MasterDataItem[] | undefined;
  isResourceLoaded: (resource: string) => boolean;
  clearCache: () => void;
}
```

### 4. Utility Hooks (`features/master-data/hooks/`)

**Action: NEW**

Create utility hooks:

| Hook | Purpose |
|------|---------|
| `useRoleOptions` | Get roles as select options |
| `usePermissionOptions` | Get permissions as select options |
| `useFindLabel` | Find label by value from master data |

**Hook Signatures:**
```typescript
export function useRoleOptions(): { value: string; label: string }[]
export function useFindLabel(resource: string, value: string \| number): string | undefined
```

### 5. API Constants (`features/master-data/constants/api-endpoints.ts`)

**Action: NEW**

```typescript
export const MASTER_DATA_ENDPOINTS = {
  masterData: '/api/master-data',
} as const;

export const MASTER_DATA_RESOURCES = {
  roles: 'roles',
  permissions: 'permissions',
  genders: 'genders',
  statuses: 'statuses',
} as const;
```

### 6. i18n Keys

**Action: NEW**

Add translation keys for master data labels (if needed):

| Key | English | Vietnamese |
|-----|---------|------------|
| `masterData.loading` | "Loading options..." | "Đang tải dữ liệu..." |
| `masterData.empty` | "No options available" | "Không có dữ liệu" |

---

## API Endpoints Summary

| Method | URI | Description | Input Parameters | Output Response | Auth |
|--------|-----|-------------|------------------|-----------------|------|
| GET | `/api/master-data` | Get master data | `resources` (string[], required) | `{ [resource]: [{ value, label }] }` | No |

**Example Request:**
```
GET /api/master-data?resources[]=roles&resources[]=permissions
```

**Example Response:**
```json
{
  "roles": [
    { "value": "admin", "label": "Administrator" },
    { "value": "user", "label": "User" }
  ],
  "permissions": [
    { "value": "users.view", "label": "View Users" },
    { "value": "users.create", "label": "Create Users" }
  ]
}
```

---

## Testing Hints

**Frontend Requirements:**
- **MSW Handlers**: Mock master data responses for each resource
- **Key test scenarios**:
  - Fetch multiple resources → all data loaded
  - Cache hit → no duplicate API calls
  - Find label by value → correct label returned

---

## Status
- [ ] Create TypeScript types in `features/master-data/types/master-data.ts`
- [ ] Create API hooks in `features/master-data/hooks/use-master-data-query.ts`
- [ ] Create utility hooks in `features/master-data/hooks/use-role-options.ts`, etc.
- [ ] Create cache store in `features/master-data/stores/master-data-store.ts`
- [ ] Add API constants
- [ ] Add i18n strings
- [ ] Run `pnpm lint`
- [ ] Run `pnpm test:unit`

---

## Acceptance Criteria
1. Master data hook fetches resources by name
2. Data is cached to prevent duplicate requests
3. Utility hooks provide easy access to common resources
4. Hook returns both value and label for select components
5. MSW handlers mock all master data resources

---

## Error Scenarios
- Invalid resource name → Empty array returned
- Server error → Fallback to empty data, log error
- Network error → Retry once, then fail silently

---

## Dependencies
- None (independent task, can run in parallel with Task 01)
