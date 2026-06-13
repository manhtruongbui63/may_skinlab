# Multi-table pages (spec only)

**Do not implement** until a real page has **2+ List Surfaces**. This document defines conventions so agents apply them consistently when the need arises.

## List Surface recap

Each surface has:

- `namespace` — short stable id (`pending`, `members`, `orders`)
- Independent filters + pagination + fetch

## Decision tree

```
How many independently filterable/paginated lists on this page?
├─ 1 → single-table.md (no namespace)
└─ 2+
     ├─ Same toolbar filters both lists?
     │    └─ Yes → Pattern C (shared filters)
     └─ No
          ├─ Lists shown in tabs (one visible)?
          │    └─ Yes → Pattern B (tabs)
          └─ No → Pattern A (independent side-by-side or stacked)
```

## Pattern A — Independent surfaces

Two filter bars or two fully independent lists on one page.

**URL:**

```
/vi/reports?pending_q=abc&pending_page=2&done_status=1&done_page=1
```

**Naming rule:** `{namespace}_{param}`

| Param suffix | Meaning |
|--------------|---------|
| `{ns}_q` | search |
| `{ns}_status`, `{ns}_type`, … | feature filters |
| `{ns}_page` | page |
| `{ns}_perPage` | page size |

Each surface gets its own:

- `*-list-query.ts` config with `namespace: 'pending'`
- Hook instance or `useListUrlState({ namespace: 'pending', schema })`

**Fetch rule:** each surface fetches independently; no cross-surface blocking.

## Pattern B — Tabbed lists

One tab visible at a time; each tab owns a list surface.

**URL:**

```
/vi/overview?tab=members&members_q=nguyen&members_page=2
/vi/overview?tab=commissions&commissions_status=1
```

**Rules:**

1. Always serialize active tab: `tab=<tabId>`.
2. Prefix filter/pagination params with **tab id**: `members_q`, `commissions_page`.
3. **Keep inactive tab params** in URL when switching tabs (user returns with filters intact). Recommended default.
4. Fetch only the **active** tab's list on load and on tab change.
5. Tab change updates `tab` via `replace`; does not clear sibling tab params.

**Toolbar:** one toolbar per tab content panel, or shared header that swaps fields by tab.

## Pattern C — Shared filters, separate pagination

One search/filter bar; two tables show different datasets with same filter context.

**URL:**

```
/vi/search?q=nguyen&users_page=2&admins_page=1
```

**Rules:**

1. Shared filter keys have **no namespace**: `q`, `status`, …
2. Pagination keys are **namespaced**: `users_page`, `admins_page`, `users_perPage`, …
3. Changing shared filter resets **all** surfaces to page 1 in one `replace`.
4. One `SharedFilters` component; two hooks read shared + own pagination slice.

## Excluded: detail sub-tables

Route: `/hrm/request-withdrawal/[id]` with commissions table inside detail.

- Entity id is on the **path**, not query.
- Sub-table has no independent filter toolbar → **do not** apply `bks-list-url-state`.
- Exception: if product adds filter/pagination on that sub-table independent of `[id]`, treat it as a List Surface with namespace e.g. `commissions_q` on the detail page URL.

## URL length guidance

Multi-table URLs grow quickly. Mitigations:

- Omit all default values
- Use short namespace ids (`p`, `d` only if documented in feature — prefer readable `pending`, `done`)
- Prefer tabs over two simultaneous full filter bars on mobile
- Do not sync low-value UI toggles

## Example skeleton (Pattern A — documentation only)

```ts
// features/reports/utils/pending-list-query.ts
export const pendingListQuery = createListQueryConfig({
  namespace: 'pending',
  filters: { q: stringField, status: enumField([1, 2, 3]) },
  pagination: { page: 1, perPage: 10 },
})

// features/reports/hooks/use-pending-report-list.ts
export function usePendingReportList() {
  return useListUrlState(pendingListQuery, fetchPendingReports)
}
```

Implement `createListQueryConfig` / `useListUrlState` in `shared/lib/bks-list-url-state/` when the first multi-table page is built — not before.

## Testing multi-table

- [ ] Each surface restores independently after reload
- [ ] Switching tabs preserves inactive tab params
- [ ] Shared-filter pattern resets all pages when `q` changes
- [ ] No param name collision between surfaces
- [ ] Back/Forward restores tab + active surface filters
