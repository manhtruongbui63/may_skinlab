# AI Agent Guide — Beki AI Project

## Project Overview

Built with **Laravel 13** (backend) and **Next.js** (frontend).

| Path | Description |
|---|---|
| `backend/` | Laravel 13 API |
| `frontend/` | Next.js frontend |
| `.agents/` | Skills, workflows, and agent config |
| `docs/` | Project documentation |

---

## ⚠️ Mandatory Reading

> [!IMPORTANT]
> **Before making any changes**, you MUST read the system documentation in this order. These are the single source of truth for understanding the project:
> 1. [System Overview](docs/system/overview.md) — Features, user roles, directory map
> 2. [Business Rules](docs/system/business-rules.md) — Auth, tenancy, permissions, validation
> 3. [Business Rule Registry](docs/system/br-registry.md) — Global registry for BR IDs, ownership, and traceability
> 4. [Architecture](docs/system/architecture.md) — Backend flow, service layer, frontend structure, API bridge
> 5. [Domain Model](docs/system/domain-model.md) — All entities, key columns, relationships, enums
> 6. [Logic Index](docs/logic/index.md) — Entry point for current business logic documents and implementation patterns
> 7. [Docker Environment](docs/system/docker.md) — Docker container configuration, host ports, and execution rules for AI Agents

---

## Tech Stack

| Layer | Technologies |
|---|---|
| **Backend** | Laravel 13, PHP 8.3+, MySQL, Sanctum, Socialite, Spatie Permission, Scramble (`/docs/api`) |
| **Frontend** | Next.js 16, React 19, TanStack Query, Zustand, Zod, shadcn/ui, Tailwind CSS v4, Axios |
| **Testing** | PHPUnit (BE), Vitest + React Testing Library + MSW (FE unit/integration), Playwright (FE e2e) |

---

## Architecture Quick Reference

**Backend**: `Route → Middleware → FormRequest → Controller → Service → JsonResource → JSON Response`

Full details: [Architecture](docs/system/architecture.md)

---

## Skills & Workflows

The project uses specialized **skills** (`/.agents/skills/`) and **workflows** (`/.agents/workflows/`) that define implementation standards and step-by-step procedures. You **must** check and follow the relevant skill or workflow before starting any implementation.

---

## Common Commands

> [!IMPORTANT]
> **Docker Command Execution:** AI Agents MUST execute all backend and frontend commands inside their respective Docker containers (using user `-u www-data` for backend classes to prevent permission issues).

### Backend (via `bks-app` container)

- `docker compose exec -it -u www-data app php artisan code:format` — Format code (Laravel Pint)
- `docker compose exec -it -u www-data app php artisan migrate` — Run migrations
- `docker compose exec -it -u www-data app php artisan test` — Run test suite

### Frontend (via `bks-node` container)

- `docker compose exec -it node pnpm test:run` — Run all tests (Vitest)
- `docker compose exec -it node pnpm test:unit` — Run unit tests
- `docker compose exec -it node pnpm test:integration` — Run integration tests
- `docker compose exec -it node pnpm test:e2e` — Run Playwright E2E tests
- `docker compose exec -it node pnpm test:coverage` — Run tests with coverage
- `docker compose exec -it node pnpm quality:check` — Full quality gate (typecheck + lint + format + test)

---

## Rules for AI Agents

1. **No `mixed` types** — Always use explicit types or Docblocks (PHP).
2. **Naming** — `PascalCase` for BE classes, `kebab-case` for FE files.
3. **Formatting** — Run `php artisan code:format` (BE) and `pnpm run lint` (FE) before committing.
4. **Language** — All content (code, comments, UI) MUST be in **English**, but documentation in `docs/` MUST be in **Vietnamese**.
5. **Imports** — ALWAYS use explicit imports (no FQN). Resolve all linting errors before completing a task.
6. **Logic Docs** — ALWAYS follow `bks-doc-logic-standard` for `docs/logic/` with required YAML frontmatter.
7. **Stay Proactive** — Propose fixes if you find bugs in skills or missing documentation.
8. **System Intelligence** — ALWAYS use `docs/logic/` as the primary source of truth for existing business logic, workflows, and technical patterns. Refer to these documents before proposing changes or analyzing new requirements.
9. **Drafts & Tasks Ignored** — Do NOT read `docs/draft`, `docs/requirements`, or `docs/tasks` for project logic unless directly mentioned (e.g., `@[path]`). These directories contains implementation history or future plans, not the current system's source of truth.
10. **BR Traceability** — Any `BR-*` referenced in docs/logic, docs/requirements, docs/tasks, workflows, or skills MUST exist in `docs/system/br-registry.md`. New rules MUST be written as `PROPOSED_BR:{slug}` until officially registered.
11. **Git Convention** — ALWAYS follow `bks-git-convention` as the final step before pushing: branch `<type>/<task-id>-<slug>`, Conventional Commits with `Task: <id>` footer linking the Excel task (`001`, `002`...) and its `docs/draft/{id}-{slug}.md`, and PR title `<type>(<scope>): <subject> (#<task-id>)`. Covers feat / fix / hotfix.
