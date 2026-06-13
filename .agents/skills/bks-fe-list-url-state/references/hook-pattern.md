# Hook pattern — URL as single source of truth

## Principle

`useSearchParams()` drives list fetch. Local `useState` for filters/pagination that can diverge from URL is **not allowed** on synced list pages.

## Router imports

This project uses next-intl navigation wrappers:

```ts
import { usePathname, useRouter } from '@/i18n/routing'
import { useSearchParams } from 'next/navigation'
```

- `usePathname()` — locale-aware pathname without query
- `useRouter().replace(href, { scroll: false })` — update URL without scroll jump

Build href:

```ts
const qs = serializeUsersListQuery(nextQuery).toString()
const href = qs ? `${pathname}?${qs}` : pathname
router.replace(href, { scroll: false })
```

## Refactoring `useUsers`-style hooks

**Before (local state only):**

```ts
const [filters, setFiltersState] = useState<UserFilters>({})
const [pagination, setPagination] = useState({ page: 1, perPage: 10, ... })
```

**After (URL-driven):**

```ts
const searchParams = useSearchParams()
const pathname = usePathname()
const router = useRouter()

const listQuery = useMemo(
  () => parseUsersListQuery(searchParams),
  [searchParams],
)

const filters = useMemo(() => queryToUserFilters(listQuery), [listQuery])
const pagination = useMemo(
  () => ({
    page: listQuery.page,
    perPage: listQuery.perPage,
    total: 0,
    totalPages: 0,
  }),
  [listQuery.page, listQuery.perPage],
)
```

Fetch effect depends on `listQuery` (or `searchParams.toString()`), not separate filter state.

## setFilters / setPage / setPerPage

Write URL; let `searchParams` change trigger fetch:

```ts
const setFilters = useCallback(
  (patch: Partial<UserFilters>) => {
    const nextFilters = { ...filters, ...patch }
    const nextQuery = userFiltersToQuery(nextFilters, {
      page: 1, // reset page on filter change
      perPage: listQuery.perPage,
    })
    const qs = serializeUsersListQuery(nextQuery).toString()
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false })
  },
  [filters, listQuery.perPage, pathname, router],
)

const setPage = useCallback(
  (page: number) => {
    const nextQuery = { ...listQuery, page }
    const qs = serializeUsersListQuery(nextQuery).toString()
    router.replace(`${pathname}?${qs}`, { scroll: false })
  },
  [listQuery, pathname, router],
)
```

## Fetch timing

Keep existing fetch-on-param-change pattern:

```ts
useEffect(() => {
  fetchUsers(filters, listQuery.page, listQuery.perPage)
}, [listQuery, /* or searchParams */])
```

Avoid double fetch on mount:

- Either initialize `initializedRef` as today, or
- Rely on strict `searchParams` dependency only (prefer one effect keyed to serialized query string)

## Back / Forward

Because URL is SSOT, browser history restores `searchParams` automatically. **No extra popstate listener** needed if hook reads `useSearchParams()` on each render.

Ensure toolbar syncs search draft from `filters.search` when URL changes — see `toolbar-integration.md`.

## Loading and race conditions

Split initial load from refetch:

- **`isLoading`** — true only when fetching and no cached rows yet (show full table skeleton)
- **`isFetching`** — true on every fetch including filter/page changes (keep previous rows visible; subtle opacity on table)

```ts
const hasCachedDataRef = useRef(false)

const [isLoading, setIsLoading] = useState(true) // avoid empty flash before mount fetch effect runs
const [isFetching, setIsFetching] = useState(false)

const fetchUsers = useCallback(async () => {
  if (!hasCachedDataRef.current) setIsLoading(true)
  setIsFetching(true)
  try {
    // ... fetch and setData
    hasCachedDataRef.current = true
  } finally {
    setIsLoading(false)
    setIsFetching(false)
  }
}, [...])
```

**Why `useState(true)` for `isLoading`:** First paint happens before `useEffect` starts the fetch. With `isLoading: false` and `data: []`, the table shows empty state briefly, then skeleton — then data. Initialize loading as `true` until the first fetch settles.

Table: skeleton when `isLoading`; pass `isFetching` for `opacity-60` + `aria-busy` during refetch.

Optional improvements (not required v1):

- AbortController on fetch when query string changes mid-flight

## Hook return shape

Preserve existing public API so page content changes minimally:

```ts
{
  data,
  isLoading,      // initial load only (no cached rows)
  isFetching,     // any in-flight list fetch
  error,
  filters,        // derived from URL
  pagination,     // page/perPage from URL; total from API
  setFilters,
  setPage,
  setPerPage,
  refetch,
  // ... feature actions unchanged
}
```

## Shared util (implement when first feature adopts skill)

Target location:

```
shared/lib/bks-list-url-state/
  types.ts
  parse.ts
  serialize.ts
  use-list-url-state.ts   # optional generic hook
```

Until shared util exists, colocate parse/serialize in `features/<feature>/utils/<feature>-list-query.ts` and extract shared code when second feature copies the same helpers.

## Testing hooks

Unit-test `parseUsersListQuery` and `serializeUsersListQuery` without React:

- Round-trip: serialize(parse(url)) preserves semantic state
- Invalid inputs → defaults
- Omit defaults → empty query string
