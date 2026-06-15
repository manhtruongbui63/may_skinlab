---
task_id: "17"
title: "3b — S2 Customer Tab + S5 Modal Components"
description: "Tạo components Tab 1 (CustomerSearchBar, CustomerInfoCard) và S5 CustomerSearchModal. Xử lý 3 trạng thái tìm kiếm: không có KH, 1 KH (auto-fill), nhiều KH (mở modal)."
type: IMPLEMENTATION
phase: 3
status: pending
estimated_effort: S
complexity: medium
risk: low
depends_on: ["15"]
rule_refs: []
date: "2026-06-15"
changelog:
  - version: 1.0
    date: "2026-06-15"
    summary: Initial task specification.
---

# Context
- **Requirement**: [reception-management.md](../../requirements/skinlab/reception-management.md) — §6.4, §9.3 (S2, S5), §9.7 (UI-003, UI-007)
- **Screens**: S2 (Customer Tab), S5 (Customer Search Modal)
- **Layer**: 3b — Components
- **Parent Task**: [Index](../2026-06-15-reception-management-implementation-tasks.md)
- **Applicable Skills**: `bks-fe-implement-feature`, `bks-fe-ds-sdk-consumer`
- **Feature directory**: `frontend/features/reception/components/`
- **i18n namespace**: `reception`

---

# Task 17: 3b — S2 Customer Tab + S5 Modal Components

## Description
Tạo component tree cho Tab 1 (Thông tin Khách Hàng). Search bar với debounce, info card readonly, và modal multi-result. Logic auto-fill và open modal ở Task 21.

## Out of Scope
- `useSearchCustomers` hook (Task 15).
- Tab integration và auto-fill wiring (Task 21).

---

## Requirements

### 1. Component: `CustomerSearchTab` (container — NEW)

**File**: `frontend/features/reception/components/customer-search-tab.tsx`

**Props**:
```ts
interface CustomerSearchTabProps {
  selectedCustomer: CustomerSummary | null;
  onCustomerSelect: (customer: CustomerSummary) => void;
}
```

Composes: `CustomerSearchBar` + `CustomerInfoCard` + `CustomerSearchModal`.

**UI states** (§9.6 S2):
- Loading: search spinner trong `CustomerSearchBar`.
- Empty: empty-state "Không tìm thấy khách hàng" + link tạo mới.
- Error: inline error banner.

### 2. Component: `CustomerSearchBar` (presentational — NEW)

**File**: `frontend/features/reception/components/customer-search-bar.tsx`

**Props**: `value: string`, `onChange: (v: string) => void`, `isLoading: boolean`

**DS Role**: Input với search icon, loading spinner khi `isLoading`. Placeholder: "Tìm theo mã BN, tên, hoặc SĐT".

### 3. Component: `CustomerInfoCard` (presentational — NEW)

**File**: `frontend/features/reception/components/customer-info-card.tsx`

**Props**: `customer: CustomerSummary | null`

Hiển thị: code, full_name, phone, gender, date_of_birth, address. Tất cả fields `disabled` (readonly).

**UI state**: null → hiển thị empty placeholder.

### 4. Component: `CustomerSearchModal` (S5 — NEW)

**File**: `frontend/features/reception/components/customer-search-modal.tsx`

**Props**:
```ts
interface CustomerSearchModalProps {
  isOpen: boolean;
  results: CustomerSummary[];
  onSelect: (customer: CustomerSummary) => void;
  onClose: () => void;
}
```

**DS Role**: Dialog/Modal với danh sách KH (code, full_name, phone, province). Click row → `onSelect(customer)`.

**UI states**: list skeleton khi loading (parent controls), empty state nếu `results = []`.

### 5. i18n Keys (NEW)

```
reception:tab1.search_placeholder
reception:tab1.no_customer_found
reception:tab1.create_customer_link
reception:tab1.customer_code_label
reception:tab1.customer_name_label
reception:tab1.phone_label
reception:tab1.select_customer_hint
```

---

## Status
- [ ] Tạo `CustomerSearchTab` container
- [ ] Tạo `CustomerSearchBar`
- [ ] Tạo `CustomerInfoCard` với disabled fields
- [ ] Tạo `CustomerSearchModal` (S5)
- [ ] Thêm i18n keys
- [ ] Chạy `pnpm lint`
- [ ] Chạy `pnpm test`

## Acceptance Criteria
1. `CustomerSearchBar` hiển thị spinner khi `isLoading = true`.
2. `CustomerInfoCard` render null state khi `customer = null`.
3. `CustomerSearchModal` mở/đóng đúng, click row gọi `onSelect`.
4. Tất cả fields trong `CustomerInfoCard` là `disabled`.

## Dependencies
- Task 15 (Customer Search Data Layer) — types `CustomerSummary`.
