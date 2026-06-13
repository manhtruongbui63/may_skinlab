# Project Documentation

Documentation map cho AI agents và developers. Bắt đầu với **System Documentation** để hiểu project, sau đó dùng các thư mục khác khi cần.

---

## Directory Overview

| Directory | Purpose | Khi nào đọc |
|---|---|---|
| [`system/`](system/overview.md) | Architecture, domain model, business rules | **Đầu tiên** — trước mọi implementation |
| [`api/`](api/index.md) | API endpoints, request/response specs | Khi implement/modify endpoints |
| [`logic/`](logic/index.md) | Business logic flows, rules, edge cases | Khi implement/debug business logic |
| [`deployment/`](system/deployment-frontend.md) | Hướng dẫn triển khai frontend | Khi cần deploy sản phẩm |

### Implementation Pipeline (Không đọc hàng ngày)

| Directory | Purpose | Khi nào dùng |
|---|---|---|
| `draft/` | Raw requirement drafts từ stakeholders | Input cho PM analysis workflow |
| `requirements/` | Formal technical specifications | Output từ PM analysis → input cho task decomposition |
| `tasks/` | Granular implementation tasks | Input cho execution workflows |
| `testing/` | Testing setup guide | Khi cần config/run tests |

---

## Reading Order for New Contributors

1. [System Overview](system/overview.md) — Features, user roles, directory map
2. [Business Rules](system/business-rules.md) — Auth
3. [Architecture](system/architecture.md) — Backend flow, service layer, frontend structure
4. [Domain Model](system/domain-model.md) — All entities, relationships, enums

---

## Related Resources

- **[AGENTS.md](../AGENTS.md)** — AI agent entry point with tech stack, skills, and rules
- **[`.agents/skills/`](../.agents/skills/)** — Implementation standards and coding conventions
- **[`.agents/workflows/`](../.agents/workflows/)** — Step-by-step workflows for common tasks
- **Scramble API Docs** — Auto-generated at `APP_URL/docs/api`
