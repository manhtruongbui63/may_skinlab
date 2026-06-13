# System Overview

Base project — Laravel 13 backend + Next.js 16 frontend scaffold.

Hệ thống bao gồm **Laravel 13** backend và **Next.js 16** frontend.

---

## Directory Map

| Path | Mô tả |
|---|---|
| `backend/` | Laravel 13 API — Auth, User listing, Master data, File upload |
| `frontend/` | Next.js 16 frontend — Auth, Dashboard, Master data |
| `docs/` | Centralized documentation |
| `.agents/` | AI agent configuration (skills, workflows) |

---

## System Documentation Map

| Tài liệu | Mô tả |
|---|---|
| [System Overview](overview.md) | Tổng quan hệ thống và cấu trúc thư mục chính |
| [Business Rules](business-rules.md) | Quy tắc nghiệp vụ (Auth, validation, v.v.) |
| [Business Rule Registry](br-registry.md) | Danh sách quản lý mã BR của dự án |
| [Architecture](architecture.md) | Luồng xử lý Backend, Frontend và API bridge |
| [Domain Model](domain-model.md) | Mô hình thực thể và cấu trúc DB chính |
| [Docker Environment](docker.md) | Môi trường Docker và quy chuẩn thực thi lệnh cho AI Agent |
