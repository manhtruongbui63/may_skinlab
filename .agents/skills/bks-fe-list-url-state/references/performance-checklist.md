# Performance checklist — list URL sync

**Mandatory** after hook + toolbar changes. These are the list-relevant rules from
`../bks-fe-vercel-react-best-practices/SKILL.md` — apply all items below on every URL sync rollout.

For lists **>100 rows** or **Complex tier**, also read the full Vercel skill (virtualization,
memo, content-visibility).

## Search & toolbar (re-render)

| Rule | Apply |
|------|--------|
| `rerender-use-deferred-value` | Only if client-side filter of large in-memory arrays (rare); URL-driven server lists use debounce + URL write instead |
| `rerender-derived-state-no-effect` | Do not mirror URL filters in extra `useState`; derive from `useSearchParams` in hook |
| `rerender-move-effect-to-event` | Select/reset handlers call `onChange` directly — no effect chains for user actions |
| `rerender-no-inline-components` | No components defined inside `*-page-content` or toolbar |
| **Project rule (D12)** | **Never** `key={filters.search}` or composite key on toolbar — causes remount + focus loss |
| **Project rule (D6)** | Debounce search **300ms** before URL commit; single debounce only (no double debounce in hook) |

### Focus-aware draft sync

```tsx
const searchInputRef = useRef<HTMLInputElement>(null)

useEffect(() => {
  if (searchInputRef.current === document.activeElement) return
  setSearchDraft(filters.search ?? '')
}, [filters.search])
```

## Fetch & loading (client data)

| Rule | Apply |
|------|--------|
| `async-defer-await` | Fetch only in hook effect keyed to URL query — not in page shell |
| `async-parallel` | Multi-table pages: start independent fetches in parallel (see `multi-table.md`) |
| **Project rule (D11)** | `isLoading` = skeleton when **no cached rows**; `isFetching` = opacity/`aria-busy` on refetch |

```ts
const hasCachedDataRef = useRef(false)

// on fetch start: if (!hasCachedDataRef.current) setIsLoading(true)
// on success: hasCachedDataRef.current = true
// always: setIsFetching(true/false) around fetch
```

Table must **keep previous rows** during filter/page refetch — no full skeleton flash.

## Rendering

| Rule | Apply |
|------|--------|
| `rendering-usetransition-loading` | Optional for heavy client-side derived UI; prefer `isFetching` overlay for server lists |
| `rendering-content-visibility` | Lists >100 rows — add `content-visibility: auto` on row wrappers |
| `rendering-conditional-render` | Use ternary for numeric counts in badges (`count > 0 ? … : null`) |

## Bundle (page shell)

| Rule | Apply |
|------|--------|
| `bundle-dynamic-imports` | Heavy dialogs (detail, lock) — `next/dynamic` if they block initial list chunk |
| `bundle-barrel-imports` | Import DS components from `@bks/ds-system-sdk` as project already does |

## Suspense (App Router)

Wrap page content that calls `useSearchParams()` in `<Suspense>` on the route page — required by Next.js.

Reference: `app/[locale]/(main)/users/page.tsx`

## Server (multi-surface only)

| Rule | Apply |
|------|--------|
| `server-parallel-fetching` | If RSC prefetches multiple list surfaces, compose parallel child components |
| `server-no-shared-module-state` | Never store request filters in module-level mutable vars |

## Verify manually

- [ ] Type quickly in search — no stutter, no focus loss
- [ ] Pause typing — URL updates after ~300ms
- [ ] Change filter — table dims briefly, rows stay visible
- [ ] First visit — skeleton immediately (no empty flash before fetch); `isLoading` initialized `true`
- [ ] Back/Forward — input + table match URL without remount jank

## Escalate to full vercel-react-best-practices when

- List regularly renders **>100 rows** without server pagination
- Multiple independent fetches on one page (multi-table)
- Measurable jank or bundle regression after URL sync
- Complex derived columns / heavy cell renderers

Read `../bks-fe-vercel-react-best-practices/SKILL.md` and apply: `rerender-memo`, `rendering-content-visibility`, `js-index-maps`, `js-set-map-lookups`, `bundle-dynamic-imports`.
