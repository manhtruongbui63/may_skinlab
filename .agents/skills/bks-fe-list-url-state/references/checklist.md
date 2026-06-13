# Pre-merge checklist — BKS list URL state

Run before marking a list URL sync task complete. Performance items are detailed in
`performance-checklist.md` (mandatory step 6 in `SKILL.md`).

## Schema & utils

- [ ] `features/<feature>/utils/<feature>-list-query.ts` exists
- [ ] Zod validates all synced params
- [ ] Invalid URL values fall back safely
- [ ] Defaults omitted from serialized URL
- [ ] Search uses `q` in URL, maps to feature filter field in code
- [ ] `page` and `perPage` synced

## Hook

- [ ] Filters and pagination derived from `useSearchParams()` (URL = SSOT)
- [ ] `setFilters` resets page to 1
- [ ] `setPerPage` resets page to 1
- [ ] Updates use `router.replace` with `{ scroll: false }`
- [ ] Uses `@/i18n/routing` for pathname/router
- [ ] Fetch re-runs when query changes (including Back/Forward)
- [ ] `isLoading` vs `isFetching` split (skeleton only on initial load)
- [ ] Public hook API unchanged for page content where possible

## Toolbar

- [ ] Search debounced 300ms before `onChange`
- [ ] `searchDraft` syncs from URL when input **not focused** (no toolbar `key` remount)
- [ ] Select changes immediate
- [ ] Reset clears filters and URL keys
- [ ] Reset button: `variant="ghost"` + `tone="destructive"` + `Trash2` + `t('filters.reset')` (see `toolbar-integration.md`)
- [ ] Reset shown only when `hasActiveFilters`
- [ ] No router imports in toolbar

## Table & page

- [ ] `*-table.tsx` has no URL logic
- [ ] Refetch shows stale rows + subtle loading (not full skeleton)
- [ ] `*-page-content.tsx` has no direct URL logic
- [ ] BKS table card shell unchanged

## Manual QA

- [ ] Apply filters → URL updates
- [ ] Reload → filters + table match URL
- [ ] Copy URL → open new tab → same results
- [ ] Browser Back/Forward restores filters and input text
- [ ] Typing in search stays smooth (no focus loss / stutter)
- [ ] Filter refetch does not flash full skeleton
- [ ] Reset → clean URL (no filter params)
- [ ] Invalid query (`?status=999`) → page still works with defaults
- [ ] Locale switch preserves query string (path locale changes, query intact)

## Tests (recommended)

- [ ] Unit tests for parse/serialize round-trip
- [ ] Optional: one Playwright smoke — set filter, reload, assert row count or empty state

## Multi-table (only if applicable)

- [ ] Read `multi-table.md` and matched correct pattern
- [ ] Namespaces do not collide
- [ ] Tab param present for tabbed pattern
- [ ] Inactive tab params preserved when switching tabs

## Performance (vercel-react-best-practices subset)

- [ ] `references/performance-checklist.md` applied (all items)
- [ ] Route page wraps list content in `<Suspense>` when using `useSearchParams`
- [ ] List >100 rows or Complex tier → full `vercel-react-best-practices/SKILL.md` reviewed

## Out of scope verification

- [ ] Dialog state NOT in URL
- [ ] Detail `[id]` sub-tables NOT synced unless explicitly required
