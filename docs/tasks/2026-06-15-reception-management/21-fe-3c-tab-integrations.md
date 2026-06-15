---
task_id: "21"
title: "3c — Tab Integrations (S2 Customer, S3 Examination, S4 Appointment — full flow + URL state)"
description: "Wire tất cả 3 tabs với hooks, URL-synced filters, và full action flows: S2 (search/auto-fill/modal), S3 (list/cancel/delete Visit), S4 (list/check-in/cancel/drawer Appointment)."
type: IMPLEMENTATION
phase: 3
status: pending
estimated_effort: M
complexity: high
risk: medium
depends_on: ["17", "18", "19", "20"]
rule_refs:
  - "PROPOSED_BR:visit-list-date-same-month"
  - "PROPOSED_BR:visit-list-no-future-date"
  - "PROPOSED_BR:appointment-cancel-precheck-only"
  - "PROPOSED_BR:appointment-checkin-on-visit"
date: "2026-06-15"
changelog:
  - version: 1.0
    date: "2026-06-15"
    summary: Initial task specification.
---

# Context
- **Requirement**: [reception-management.md](../../requirements/skinlab/reception-management.md) — §6.4, §6.5, §6.6, §6.7, §9.6, §9.7, §9.8
- **Screens**: S2, S3, S4, S5, S6, S7, S8, S9
- **Layer**: 3c — Integration
- **Parent Task**: [Index](../2026-06-15-reception-management-implementation-tasks.md)
- **Applicable Skills**: `bks-fe-implement-feature`, `bks-fe-list-url-state`
- **Route**: `frontend/app/(main)/reception/page.tsx` (extend từ Task 20)
- **Feature directory**: `frontend/features/reception/`
- **i18n namespace**: `reception`

---

# Task 21: 3c — Tab Integrations

## Description
Wire tất cả 3 tabs với data hooks và action mutations. URL-synced filters cho Tab 2 và Tab 3. Customer auto-fill logic (UI-003). All UI states per §9.6.

---

## Requirements

### 1. Tab 1 — Customer Search Integration (S2 + S5)

Wire `CustomerSearchTab` với `useSearchCustomers`:
- Search query → `useSearchCustomers(query)`.
- `results.length === 1` → auto-fill `useReceptionFormStore.setField('customer_id', results[0].id)` + populate `CustomerInfoCard` (UI-003).
- `results.length > 1` → mở `CustomerSearchModal` (S5).
- `CustomerSearchModal` row click → set customer + close modal.
- `results.length === 0` → empty state "Không tìm thấy" (UI-003).

**UI states** (§9.6 S2, S5): loading spinner, empty, error banner.

### 2. Tab 2 — Examination List Integration (S3 + S6 + S7)

Wire `ExaminationListTab` với `useVisits` + `useCancelVisit` + `useDeleteVisit`:

**Filter URL sync** (PROPOSED_BR:visit-list-date-same-month):
- Filters `from`, `to`, `status` synced với URL `?exam_from=&exam_to=&exam_status=` (cách ly khỏi tab query param).
- Default: `from = to = today`.
- Reload trang → restore filters từ URL.

**Cancel flow**:
1. Click "Hủy" → open `CancelVisitDialog` với `visitId`.
2. Confirm → `useCancelVisit().mutate(visitId)`.
3. On success → close dialog + toast + `useVisits` invalidate.

**Delete flow**:
1. Click "Xóa" (admin/manager only) → open `DeleteVisitDialog`.
2. Confirm → `useDeleteVisit().mutate(visitId)`.
3. On success → close dialog + toast + invalidate.

**`canDelete`** = check auth store user role: `user.roles.includes('admin') || user.roles.includes('manager')`.

**UI states** (§9.6 S3): table skeleton, empty state, error retry, permission-based delete button.

### 3. Tab 3 — Appointment List Integration (S4 + S8 + S9)

Wire `AppointmentListTab` với `useAppointments` + `useCancelAppointment` + `useCreateVisitFromAppointment` + `useAppointmentDetail`:

**Filter URL sync**:
- Filters `search`, `date_from`, `date_to`, `status` synced với URL `?appt_search=&appt_from=&appt_to=&appt_status=`.

**Check-in flow**:
1. Click "Tiếp nhận" (BOOKED only) → `useCreateVisitFromAppointment().mutate({ appointment_id: id })`.
2. On success → toast `reception:toasts.checkin_success` + invalidate `useAppointments` + `useVisits`.

**Cancel flow**:
1. Click "Hủy" (BOOKED only) → open `CancelAppointmentDialog`.
2. Confirm → `useCancelAppointment().mutate(id)`.
3. On success → close dialog + toast + invalidate.

**Detail flow**:
1. Click "Xem chi tiết" → open `AppointmentDetailDrawer` với `appointmentId`.
2. Load `useAppointmentDetail(id)` khi drawer open.

**UI states** (§9.6 S4, S9).

### 4. URL State Summary

| Tab | URL params | Default |
|-----|-----------|---------|
| Active tab | `?tab=1|2|3` | `tab=1` |
| Tab 2 filters | `?exam_from=&exam_to=&exam_status=` | today/today |
| Tab 3 filters | `?appt_search=&appt_from=&appt_to=&appt_status=` | none |

Tham khảo `bks-fe-list-url-state` cho implementation pattern.

---

## Status
- [ ] Wire Tab 1: `useSearchCustomers` + auto-fill + modal open logic (UI-003)
- [ ] Wire Tab 2: `useVisits` với URL-synced filters
- [ ] Wire Tab 2: Cancel Visit flow (S6)
- [ ] Wire Tab 2: Delete Visit flow (S7) với role check
- [ ] Wire Tab 3: `useAppointments` với URL-synced filters
- [ ] Wire Tab 3: Check-in flow (S4 → S3 refresh)
- [ ] Wire Tab 3: Cancel Appointment flow (S8)
- [ ] Wire Tab 3: Detail drawer flow (S9)
- [ ] Chạy `pnpm lint`
- [ ] Chạy `pnpm test`

## Acceptance Criteria
1. Tab 2 filter `from`/`to` sync với URL, restore sau reload.
2. Tab 2 Cancel Visit → dialog confirm → toast → list refresh.
3. Tab 2 Delete → chỉ admin/manager thấy nút Xóa, confirm → 204 → refresh.
4. Tab 3 Check-in BOOKED appointment → Visit xuất hiện trong Tab 2 (sau invalidate).
5. Tab 3 Detail drawer load activity log đúng.
6. Tab 1 search = 1 result → auto-fill (no modal). > 1 result → modal (UI-003).

## Dependencies
- Task 17 (Customer Tab Components).
- Task 18 (Examination Tab Components).
- Task 19 (Appointment Tab Components).
- Task 20 (ReceptionPage Layout).
