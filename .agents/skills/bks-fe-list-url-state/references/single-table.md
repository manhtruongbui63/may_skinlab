# Single-table list (default)

Use this for pages with **one** filter toolbar + **one** paginated table inside the table card shell.

Applies to any single-table list feature (`features/<feature>/`). Note: no list feature is built in
this repo yet (`features/auth/` has no table), so treat the file names here as a naming convention.

## URL shape

```
/{locale}/users?q=0912&status=1&kyc=0&page=2&perPage=20
```

Locale is on the **path** (next-intl). Query params are **not** prefixed with a namespace.

## Standard query params

| URL param | Code field | Type | Omit from URL when |
|-----------|------------|------|---------------------|
| `q` | `filters.search` | string | empty / whitespace only |
| `status`, `kyc`, … | matching filter | int enum | undefined / "all" |
| `page` | `pagination.page` | int ≥ 1 | `1` |
| `perPage` | `pagination.perPage` | int from allowlist | equals feature default (usually `10`) |

Feature-specific filter keys use **short stable names** (`status`, `kyc`, `type`, `role`). Document them in the feature's `*-list-query.ts`.

## File layout (required)

```
features/<feature>/
  utils/<feature>-list-query.ts       # parseListQuery, serializeListQuery, schema
  hooks/use-<feature>.ts              # fetch; state from URL
  components/
    <feature>-filters-toolbar.tsx     # controlled; debounced search draft
    <feature>-table.tsx               # presentation only
    <feature>-page-content.tsx        # composes card shell; no URL logic
```

Optional split if hook grows large:

```
hooks/use-<feature>-list-url.ts       # URL read/write only
hooks/use-<feature>.ts                # fetch + actions; consumes list-url hook
```

## Example: users feature

**Filter type** (`UserFilters`):

```ts
{ search?: string; status?: number; kyc?: number }
```

**URL mapping:**

| Code | URL |
|------|-----|
| `search: 'nguyen'` | `?q=nguyen` |
| `status: 1` | `&status=1` |
| `kyc: undefined` | *(omit `kyc`)* |
| `page: 2, perPage: 20` | `&page=2&perPage=20` |

**Reset filters:** remove `q`, `status`, `kyc` from query; reset `page` to omit (page 1). Keep or reset `perPage` per product — default: **keep current perPage**.

## Page content responsibilities

`*-page-content.tsx` should:

- Call the feature hook (`useUsers`, etc.)
- Pass `filters` + `onChange={setFilters}` to toolbar
- Pass pagination handlers to footer
- **Not** import `useSearchParams` directly (keep URL logic in hook/utils)

## Pagination footer

When URL sync is enabled, **always** sync `page` and `perPage`:

- Changing filter → serialize with `page: 1`
- Changing `perPage` → serialize with `page: 1`
- Changing page via pagination controls → update `page` only

Footer visibility rule (unchanged from BKS layout): show when `!error && total > 0`.

## SSR (optional enhancement)

For faster first paint without filter flash:

```tsx
// app/[locale]/(main)/users/page.tsx
export default async function UsersPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const initialQuery = parseUsersListQuery(await searchParams)
  return <UsersPageContent initialQuery={initialQuery} />
}
```

Client hook uses `initialQuery` only on first render if `searchParams` match. **Not required for v1** — client-only URL read is acceptable.

## Anti-patterns

- Storing filters in `useState` that is **not** derived from `searchParams`
- Submit button required to apply search (prefer debounced auto-apply + URL write)
- Putting `useSearchParams` inside `*-table.tsx`
- Using `router.push` for every keystroke (debounce first; use `replace` for filter changes)
- Serializing `"all"` or empty string into URL
