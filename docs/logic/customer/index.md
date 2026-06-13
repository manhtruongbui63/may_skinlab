---
module: customer
title: Customer Module BR Index
description: Tổng hợp business rules và logic docs cho Customer module.
type: guide
priority: high
version: "1.0.0"
changelog:
  - version: "1.0.0"
    date: "2026-06-11"
    summary: "Initial customer module logic docs."
related_files:
  - backend/app/Http/Controllers/Api/CustomerController.php
  - backend/app/Services/Api/CustomerService.php
  - backend/app/Models/Customer.php
  - backend/app/Http/Resources/Customer/CustomerResource.php
  - backend/routes/api.php
---

# Customer Module — Logic Documentation

Tổng quan logic quản lý khách hàng: danh sách, tạo mới, cập nhật, xóa, và tính toán công nợ.

---

| File | Feature | Priority |
|---|---|---|
| [index.md](index.md) | Module BR Index | high |
| [customer-management.md](customer-management.md) | Customer CRUD — Quản Lý Khách Hàng | high |
