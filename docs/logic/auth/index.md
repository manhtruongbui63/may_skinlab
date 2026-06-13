---
module: auth
title: Auth Module BR Index
description: Tổng hợp business rules và logic docs cho Auth module.
type: guide
priority: high
version: "1.0.0"
changelog:
  - version: "1.0.0"
    date: "2026-05-06"
    summary: "Initial auth module logic docs."
related_files:
  - backend/app/Http/Controllers/User/AuthController.php
  - backend/app/Services/User/AuthService.php
  - backend/app/Models/User.php
  - backend/app/Enums/UserStatus.php
  - backend/routes/api.php
---

# Auth Module — Logic Documentation

Tổng quan logic xác thực người dùng: đăng ký, đăng nhập, đăng xuất, cập nhật profile, đổi mật khẩu.

---

| File | Feature | Priority |
|---|---|---|
| [index.md](index.md) | Module BR Index | high |
| [login-flow.md](login-flow.md) | Login Flow — Xác Thực Người Dùng | high |
| [register-flow.md](register-flow.md) | Register Flow — Tạo Tài Khoản Mới | high |
| [logout-flow.md](logout-flow.md) | Logout Flow — Thu Hồi Token | high |
| [profile-update.md](profile-update.md) | Update Profile — Cập Nhật Thông Tin | medium |
| [change-password.md](change-password.md) | Change Password — Đổi Mật Khẩu | medium |
| [reset-password.md](reset-password.md) | Reset Password — Quên & Đặt Lại Mật Khẩu | high |
