---
task_id: "04"
title: "Master Data Registration: clinic_rooms, services, service_packages"
description: "Đăng ký 3 resources master data mới vào MasterDataService để frontend có thể batch-fetch qua GET /api/v1/master-data."
type: IMPLEMENTATION
phase: 1
status: pending
estimated_effort: S
complexity: low
risk: low
depends_on: ["01"]
rule_refs: []
date: "2026-06-15"
changelog:
  - version: 1.0
    date: "2026-06-15"
    summary: Initial task specification.
---

# Context
- **Requirement**: [reception-management.md](../../requirements/skinlab/reception-management.md) — §11 (GET /api/v1/master-data), §9.4 (`useReceptionMasterData`)
- **Parent Task**: [Index](../2026-06-15-reception-management-implementation-tasks.md)
- **Applicable Workflows**: `/execute-api-task`
- **Applicable Skills**: `bks-be-master-data-standard`

---

# Task 04: Master Data Registration

## Description
Đăng ký 3 lookup resources mới (`clinic_rooms`, `services`, `service_packages`) vào `MasterDataService` để endpoint `GET /api/v1/master-data?resources[]=clinic_rooms&resources[]=services&resources[]=service_packages` trả về dữ liệu dropdown cho form phiếu đăng ký (S1).

## Current State (Already Exists)
- **Service**: `app/Services/Api/MasterDataService.php` — hiện có các resources khác (cần audit).
- **Endpoint**: `GET /api/v1/master-data` — đã tồn tại, chỉ cần đăng ký thêm resources.

## Out of Scope
- Không tạo API CRUD quản lý clinic_rooms/services/service_packages.
- Frontend hook `useReceptionMasterData` được implement ở Task 12.

---

## Requirements

### 1. MasterDataService (MODIFY)

**File**: `app/Services/Api/MasterDataService.php`

Đăng ký 3 resource drivers mới trong registry của `MasterDataService`:

**Resource: `clinic_rooms`**
- Driver type: simple Eloquent query.
- Source: `ClinicRoom::where('is_active', true)->orderBy('name')->get(['id', 'name', 'code'])`.
- Response shape per item: `{ id: int, name: string, code: string|null }`.

**Resource: `services`**
- Driver type: simple Eloquent query.
- Source: `Service::where('is_active', true)->orderBy('name')->get(['id', 'name', 'code', 'price'])`.
- Response shape per item: `{ id: int, name: string, code: string|null, price: string|null }`.

**Resource: `service_packages`**
- Driver type: simple Eloquent query.
- Source: `ServicePackage::where('is_active', true)->orderBy('name')->get(['id', 'name', 'code', 'price'])`.
- Response shape per item: `{ id: int, name: string, code: string|null, price: string|null }`.

> Tham khảo `bks-be-master-data-standard` để biết cách đăng ký driver đúng với project convention (registry pattern hoặc driver class).

### 2. API Endpoints Summary

| Method | URI | Description | Auth |
|--------|-----|-------------|------|
| `GET` | `/api/v1/master-data` | Batch fetch, nhận query param `resources[]` | Authenticated (sanctum) |

**Request**: `?resources[]=clinic_rooms&resources[]=services&resources[]=service_packages`

**Response shape** (ví dụ minh họa):
```json
{
  "data": {
    "clinic_rooms": [ { "id": 1, "name": "Phòng 1", "code": "P1" } ],
    "services": [ { "id": 1, "name": "Khám da", "code": "KD", "price": "150000.00" } ],
    "service_packages": [ { "id": 1, "name": "Gói cơ bản", "code": "GCB", "price": "500000.00" } ]
  }
}
```

---

## Status
- [ ] Đọc `bks-be-master-data-standard` SKILL.md để hiểu registry pattern
- [ ] Audit `MasterDataService` hiện tại để hiểu convention
- [ ] Đăng ký resource `clinic_rooms`
- [ ] Đăng ký resource `services`
- [ ] Đăng ký resource `service_packages`
- [ ] Chạy `php artisan code:format`
- [ ] Chạy `php .agents/scripts/validate-backend.php backend`
- [ ] Chạy `php artisan test --filter=MasterDataTest`

## Acceptance Criteria
1. `GET /api/v1/master-data?resources[]=clinic_rooms` trả về `{ data: { clinic_rooms: [...] } }` HTTP 200.
2. `GET /api/v1/master-data?resources[]=services&resources[]=service_packages` trả về cả 2 resources.
3. Chỉ records có `is_active = true` được trả về.
4. Unauthenticated request → 401.

## Error Scenarios
- Resource name không tồn tại → behavior theo convention hiện tại của MasterDataService (bỏ qua hoặc 422).

## Dependencies
- Task 01 (Master Data Tables) — cần bảng và models tồn tại.
