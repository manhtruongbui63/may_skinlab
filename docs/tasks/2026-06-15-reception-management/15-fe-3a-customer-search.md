---
task_id: "15"
title: "3a — Customer Search Data Layer (useSearchCustomers hook)"
description: "Tạo useSearchCustomers debounced hook để tra cứu khách hàng theo code/tên/SĐT cho Tab 1 (S2, S5)."
type: IMPLEMENTATION
phase: 3
status: completed
estimated_effort: S
complexity: low
risk: low
depends_on: []
rule_refs:
  - "BR-CUST-001"
date: "2026-06-15"
changelog:
  - version: 1.0
    date: "2026-06-15"
    summary: Initial task specification.
  - version: 1.1
    date: "2026-06-15"
    summary: "Implemented Customer Search data layer: CustomerSummary type, useSearchCustomers hook with TanStack Query + debounce, MSW mock with 0/1/n scenarios. Added i18n keys to vi/en/ja.json. Lint passed with 0 errors."
---

# Context
- **Requirement**: [reception-management.md](../../requirements/skinlab/reception-management.md) — §6.4, §9.4 (`useSearchCustomers`)
- **Screens**: S2 (Customer tab), S5 (Customer modal)
- **Layer**: 3a — Data
- **Parent Task**: [Index](../2026-06-15-reception-management-implementation-tasks.md)
- **Applicable Skills**: `bks-fe-api-integration`, `bks-fe-implement-feature`
- **Feature directory**: `frontend/features/reception/`
- **i18n namespace**: `reception`

---

# Task 15: 3a — Customer Search Data Layer

## Description
Tạo hook `useSearchCustomers` với debounce 300ms để tra cứu KH theo code/tên/SĐT. Audit `frontend/features/customer/` trước — tái sử dụng `CustomerRepository` nếu đã có, chỉ tạo hook mới trong reception context.

## Out of Scope
- CustomerInfoCard component (Task 17).
- Customer CRUD (module khác).

---

## Requirements

### 1. Types (AUDIT/EXTEND)

**Audit**: `frontend/features/customer/types/` — tái sử dụng `Customer` type nếu đã có.

Customer type cần:
```ts
export interface CustomerSummary {
  id: number;
  code: string;
  full_name: string;
  phone: string;
  province?: string;
  gender?: { value: number; label: string };
  date_of_birth?: string;
  email?: string | null;
  address?: string | null;
}
```

### 2. Repository (AUDIT/EXTEND)

**Audit**: `frontend/features/customer/services/customer-repository.ts` — nếu `list(filters)` đã có với `search` param thì tái sử dụng trực tiếp.

Nếu chưa có phương thức search phù hợp, thêm method `search(query: string): Promise<CustomerSummary[]>` trong repository context của reception.

- Endpoint: `GET /api/v1/customers?search={query}`.
- Response: array (không paginate vì chỉ dùng để chọn).

### 3. Hook: `useSearchCustomers` (NEW)

**File**: `frontend/features/reception/hooks/use-search-customers.ts`

**Signature**:
```ts
function useSearchCustomers(query: string): {
  results: CustomerSummary[];
  isLoading: boolean;
  error: Error | null;
}
```

**Behavior**:
- Debounce 300ms (UI-007).
- Chỉ gọi API khi `query.length >= 2`.
- `results.length === 1` → auto-fill (logic ở component Task 17, hook chỉ trả data).
- `results.length > 1` → trả về array (component mở modal).

### 4. MSW Mock (NEW)

**File**: `frontend/features/reception/mocks/customer.mock.ts`

Handler: `GET /api/v1/customers?search=:query` → 0, 1, hoặc nhiều kết quả tùy query value trong fixture.

### 5. i18n Keys

```
reception:customer_search.no_results_hint  // "Không tìm thấy khách hàng. Tạo mới tại module KH."
```

---

## Status
- [ ] Audit `frontend/features/customer/` để tái sử dụng types/repository
- [ ] Tạo/extend `CustomerSummary` type
- [ ] Tạo `useSearchCustomers` hook với debounce 300ms
- [ ] Tạo MSW mock với các scenarios 0/1/nhiều kết quả
- [ ] Thêm i18n key
- [ ] Chạy `pnpm lint`
- [ ] Chạy `pnpm test`

## Acceptance Criteria
1. `useSearchCustomers` không gọi API khi `query.length < 2`.
2. Gọi API sau 300ms debounce.
3. Trả về `CustomerSummary[]` đúng.
4. `isLoading = true` trong khi fetch.

## Dependencies
- Không có hard dependency — có thể chạy song song với Tasks 12, 13, 14.
