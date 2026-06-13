---
module: user
title: User Module BR Index
description: Tổng hợp business rules và logic docs cho User module.
type: guide
priority: high
version: "1.0.0"
changelog:
  - version: "1.0.0"
    date: "2026-05-06"
    summary: "Initial user module logic docs."
related_files:
  - backend/app/Http/Controllers/User/UserController.php
  - backend/app/Services/User/UserTableService.php
  - backend/app/Services/User/UserService.php
  - backend/app/Models/User.php
  - backend/routes/api.php
---

# User Module — Logic Documentation

Tổng quan logic quản lý người dùng: danh sách, master data.

---

| File | Feature | Priority |
|---|---|---|
| [index.md](index.md) | Module BR Index | high |
| [user-listing.md](user-listing.md) | User Listing — Danh Sách Người Dùng | high |
| [master-data.md](master-data.md) | Master Data — Dữ Liệu Tham Chiếu | low |
