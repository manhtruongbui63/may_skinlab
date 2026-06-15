---
module: visit
title: Visit Module Index
description: Index cho các tài liệu logic liên quan đến Visit (lượt khám).
type: index
priority: high
---

# Visit Module Logic

Tài liệu logic cho module Visit — Quản lý lượt khám tại phòng khám.

---

## Files

| File | Feature | Priority |
|---|---|---|
| [visit-management.md](visit-management.md) | Visit CRUD — Walk-in, Check-in từ Appointment, Cancel | high |

---

## Related Business Rules

| BR ID | Mô tả |
|---|---|
| BR-VISIT-001 | Code lượt khám format `KByyMMdd-NNNN` |
| BR-VISIT-002 | Queue number tính theo phòng và ngày |
| BR-VISIT-003 | Chỉ hủy được khi status là WAITING hoặc IN_PROGRESS |
| BR-VISIT-004 | Check-in appointment chỉ khi status = BOOKED |
| BR-VISIT-005 | Race condition handling với lockForUpdate |
| BR-APPT-003 | Visit tạo từ appointment → appointment chuyển CHECKED_IN |
