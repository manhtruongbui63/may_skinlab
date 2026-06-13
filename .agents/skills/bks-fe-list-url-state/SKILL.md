---
name: bks-fe-list-url-state
description: |
  Sync list-page filters and pagination with URL search params in Next.js App Router + next-intl.
  Use when implementing or refactoring CRUD list pages (search, selects, page, perPage) so reload,
  share links, and browser Back/Forward restore state. Covers single-table (default) and multi-table
  spec. Applies curated vercel-react-best-practices for search UX and loading. Read references before
  writing hook or URL logic.
---

# BKS List URL State

Use this skill when a list page has **filters and/or pagination** that should survive reload, be shareable via URL, or work with browser history.

## When to apply

- User asks to sync filters/search with URL query params
- Refactoring `*-page-content` / `use-*` hooks that today use local `useState` only
- Implementing Flow B/C list pages (`fe-implement-feature`)
- Adding debounced search that must restore on reload

## When NOT to apply

- Detail-page sub-tables bound to route param (`/feature/[id]`) with no independent filter toolbar
- Dialog/modal-only filters
- Client-only ephemeral UI (column visibility toggles with no product requirement to persist)
- Static lists with no server fetch

## Mandatory read order

Read **before** writing URL sync code:

1. `references/single-table.md` — **always** (default case)
2. `references/query-schema.md` — param naming, Zod, omit rules
3. `references/hook-pattern.md` — URL as single source of truth
4. `references/toolbar-integration.md` — debounced search + Back/Forward
5. `references/performance-checklist.md` — **required** curated rules from `vercel-react-best-practices`
6. `references/checklist.md` — verify before merge

Read **only when the page has 2+ independent list surfaces**:

7. `references/multi-table.md`

## Core concepts

### List Surface

A **List Surface** is one independently filterable, paginated list:

- Own filters (search, selects, dates, …)
- Own pagination (`page`, `perPage`)
- Own fetch to API

**Single-table pages** = one List Surface (no URL namespace prefix).

**Multi-table pages** = 2+ List Surfaces → each gets a **namespace** prefix on query params. See `multi-table.md`.

### URL is the source of truth

```
searchParams → parse → fetch
setFilters/setPage → serialize → router.replace (scroll: false) → searchParams change → fetch
```

Do **not** mirror URL in separate local filter state that can drift from `searchParams`.

### Layer boundaries

| Layer | URL logic? |
|-------|------------|
| `*-list-query.ts` | parse + serialize + Zod |
| `use-*` hook (or `use-*-list-url`) | read/write URL, trigger fetch |
| `*-filters-toolbar.tsx` | controlled props only; debounce search draft |
| `*-table.tsx` | **never** |

UI layout for list pages still follows `bks-ds-sdk-consumer` (table card shell, filter toolbar grid).

## Reference implementation shape

> ⚠️ **Illustrative naming convention only.** As of now the repo has no list feature built
> (`features/auth/` is the only feature and has no table). The paths below show the target file
> shape for a `<feature>` list — they do not yet exist; don't try to open them.

- `features/<feature>/components/<feature>-page-content.tsx`
- `features/<feature>/components/<feature>-filters-toolbar.tsx`
- `features/<feature>/hooks/use-<feature>.ts`
- `features/<feature>/utils/<feature>-list-query.ts` — parse/serialize the URL query

## Workflow for agents

1. Confirm page has **one** List Surface (default) or read `multi-table.md`.
2. Define `*-list-query.ts` schema from feature filter types.
3. Refactor hook: derive filters/pagination from `useSearchParams()`, not isolated `useState`.
4. Wire `setFilters` / `setPage` / `setPerPage` to `router.replace`.
5. Update toolbar: debounce search; focus-aware draft sync when URL changes (Back/Forward).
6. **Performance pass (mandatory):** Read `references/performance-checklist.md` and apply every item. For list >100 rows or Complex tier, also read `../bks-fe-vercel-react-best-practices/SKILL.md` (virtualization, memo, content-visibility).
7. Run `references/checklist.md`.
8. Manual test: reload, paste URL, reset filters, change page, browser Back, smooth search typing.

## Decision log (project standard)

| ID | Decision |
|----|----------|
| D1 | URL = single source of truth |
| D2 | Search param key = `q` (maps to `filters.search` in code) |
| D3 | Sync **filters + pagination** (`page`, `perPage`) |
| D4 | Omit default values from URL (`page=1`, default `perPage`, empty `q`, "all" selects) |
| D5 | `router.replace` + `{ scroll: false }` |
| D6 | Search debounce 300ms before URL write |
| D7 | Invalid URL params → safe defaults (Zod), never throw in UI |
| D8 | Multi-table: spec only until a real page needs it |
| D9 | No `nuqs` in phase 1 — use `useSearchParams` + shared utils when added |
| D10 | Locale stays on path (`/vi/...`); query is locale-agnostic |
| D11 | `isLoading` (initial skeleton) vs `isFetching` (refetch overlay) — never full skeleton on filter change |
| D12 | No toolbar `key` remount tied to search/filters — use focus-aware draft sync |
| D13 | Every URL sync rollout runs `performance-checklist.md` (subset of vercel-react-best-practices) |
| D14 | Reset filter button: `ghost` + `destructive` tone + `Trash2` icon; show only when filters active |

## Sister skills

- `../bks-fe-ds-sdk-consumer/SKILL.md` — list layout, toolbar, table card shell, pagination footer
- `../bks-fe-implement-feature/SKILL.md` — feature scaffolding, i18n, repository pattern
- `../bks-fe-vercel-react-best-practices/SKILL.md` — **mandatory read for step 6 when list >100 rows or Complex tier**; always apply curated subset via `references/performance-checklist.md`
