# Query schema — naming, parse, serialize

## Global naming rules

| Rule | Detail |
|------|--------|
| Search key | Always `q` in URL; map to `filters.search` (or feature-specific name) in TypeScript |
| Filter keys | Short, stable, lowercase: `status`, `kyc`, `type`, `role` |
| Pagination keys | `page`, `perPage` (camelCase in URL — matches existing pagination select labels in i18n) |
| Namespace | `{namespace}_` prefix only when page has 2+ List Surfaces |
| Booleans | Prefer `1` / `0` int enums for selects; avoid `true`/`false` strings unless API requires |
| Dates | ISO date `YYYY-MM-DD` or feature-documented format; validate with Zod |

## Omit from URL (clean links)

Do **not** write params when value equals default:

```ts
const DEFAULTS = {
  page: 1,
  perPage: 10,
  // filters: undefined / missing = "all"
}
```

Examples:

| State | URL |
|-------|-----|
| No filters, page 1, perPage 10 | `/vi/users` (no query) |
| Search only | `/vi/users?q=abc` |
| Page 3 | `/vi/users?page=3` |

## Parse (URL → state)

1. Read `useSearchParams()` or server `searchParams` prop.
2. Build plain object from entries (handle `string[]` — take first value).
3. Validate with Zod schema; `.safeParse`.
4. On failure: use defaults for invalid fields; never crash render.

```ts
import { z } from 'zod'

const usersListQuerySchema = z.object({
  q: z.string().trim().max(200).optional(),
  status: z.coerce.number().int().min(0).max(2).optional(),
  kyc: z.coerce.number().int().min(0).max(1).optional(),
  page: z.coerce.number().int().min(1).default(1),
  perPage: z.coerce
    .number()
    .int()
    .refine((v) => [10, 20, 50, 100].includes(v))
    .default(10),
})

export type UsersListQuery = z.infer<typeof usersListQuerySchema>

export function parseUsersListQuery(
  searchParams: URLSearchParams | Record<string, string | string[] | undefined>,
): UsersListQuery {
  const raw = Object.fromEntries(
    searchParams instanceof URLSearchParams
      ? searchParams.entries()
      : Object.entries(searchParams).map(([k, v]) => [k, Array.isArray(v) ? v[0] : v]),
  )
  const result = usersListQuerySchema.safeParse(raw)
  return result.success ? result.data : usersListQuerySchema.parse({})
}
```

## Serialize (state → URL)

1. Start from current `searchParams` if preserving unrelated params (multi-table).
2. Set or delete each managed key.
3. Delete keys when value is default/empty.
4. Return `URLSearchParams` or query string.

```ts
export function serializeUsersListQuery(query: UsersListQuery): URLSearchParams {
  const params = new URLSearchParams()

  const q = query.q?.trim()
  if (q) params.set('q', q)

  if (query.status !== undefined) params.set('status', String(query.status))
  if (query.kyc !== undefined) params.set('kyc', String(query.kyc))

  if (query.page > 1) params.set('page', String(query.page))
  if (query.perPage !== 10) params.set('perPage', String(query.perPage))

  return params
}
```

## Map query ↔ feature filter types

Keep explicit mappers so API types stay separate from URL shape:

```ts
export function queryToUserFilters(query: UsersListQuery): UserFilters {
  return {
    search: query.q,
    status: query.status,
    kyc: query.kyc,
  }
}

export function userFiltersToQuery(
  filters: UserFilters,
  pagination: { page: number; perPage: number },
): UsersListQuery {
  return {
    q: filters.search,
    status: filters.status,
    kyc: filters.kyc,
    page: pagination.page,
    perPage: pagination.perPage,
  }
}
```

## Namespace helper (multi-table future)

When implementing shared util:

```ts
function namespacedKey(namespace: string | undefined, key: string): string {
  return namespace ? `${namespace}_${key}` : key
}
// namespacedKey('pending', 'q') → 'pending_q'
// namespacedKey(undefined, 'q') → 'q'
```

## Invalid param handling

| Input | Behavior |
|-------|----------|
| `status=99` | Omit / ignore → undefined (all) |
| `page=-1` | Fallback to `1` |
| `perPage=999` | Fallback to default `10` |
| `q=` empty | Treat as no search |

Log dev warnings optionally; never show parse errors to end users.

## Do not sync to URL

- Dialog open state
- Selected row for inline actions
- Sort (until sort UI exists and product requests persistence)
- Transient validation errors
