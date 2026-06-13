# Project-specific patterns (read once per session)

Concrete patterns already in this codebase (Next.js 16 App Router). Don't reinvent — extend.
Canonical reference: `features/auth/`.

---

## HTTP layer: `BaseRepository` + `HttpService`

Repositories **extend `BaseRepository`** and call its protected wrappers — they do **not** import
`HttpService` and call axios directly.

```ts
import { BaseRepository } from '@/infra/api/base-repository'   // protected get/post/put/patch/delete
import { HttpService } from '@/infra/api/http-service'         // the axios IHttpAdapter singleton
import type { IHttpAdapter } from '@/infra/api/http-adapter'

class FeatureRepository extends BaseRepository {
  constructor(http: IHttpAdapter = HttpService) { super(http) }
  // this.get<TResponse, TParams>(url, params?)   → returns TResponse (= response.data envelope)
  // this.post<TResponse, TBody>(url, body?, axiosConfig?)
  // this.put / this.patch / this.delete ...
}
```

- Each `BaseRepository` wrapper returns **`response.data`** — i.e. the `ResponseData<T>` envelope.
- Multipart: pass a `FormData` body (see `auth.repository.impl.ts → changePassword`). Axios sets the
  boundary automatically.
- `HttpService` also exposes `getValidated`/`postValidated`(…, schema) helpers that Zod-parse
  `response.data.data` for you — handy for simple reads.

---

## Response envelope (`@/shared/types/common.ts`)

```ts
interface ResponseData<T> { success: boolean; message: string; data: T; errors: Record<string, string[]> | null }
interface ListResponse<T> { data: T[]; total: number; per_page: number; current_page: number; last_page?: number; meta?: {...} }
type Future<T> = Promise<AxiosResponse<ResponseData<T>>>
```

- `success` / `status_code` (some endpoints add `status_code` to the body) drive the **fake-error
  guard** — see api-integration `assertOk`. Read them from the **body**, never `res.status`.
- `message` drives toast copy; `errors` feeds `setError` in forms.
- **Zod runtime guard:** validate the payload before mapping to a domain type.
  ```ts
  // features/<feature>/schemas/<feature>.schema.ts
  export const BackendUserSchema = z.object({ id: z.union([z.string(), z.number()]), name: z.string().nullable().optional(), email: z.string() })

  // in <feature>.repository.impl.ts
  const res = await this.get<ResponseData<unknown>>(`/api/admin/users/${id}`)
  return mapBackendUser(BackendUserSchema.parse(res.data))   // → domain `User`
  ```

- Repository methods return **mapped domain types** (`User`, `boolean`, `{ user }`), not raw envelopes.

---

## List filters (server-side, indexed)

Backend expects array-of-objects style filters and orders:

```
filters[0][key]=search_name
filters[0][data]=acme
filters[1][key]=status
filters[1][data]=3
orders[0][key]=created_at
orders[0][dir]=desc
page=1&per_page=20
```

Build this inside a private `buildListParams` in the repository. Hooks/services pass the typed
`<Feature>Filters` object; the repository owns the wire format.

---

## i18n is MANDATORY — next-intl

All user-visible text goes through **next-intl** `useTranslations`. No `react-i18next`. No hardcoded strings.

### Catalogs

- `messages/vi.json`, `messages/en.json`, `messages/ja.json` — keys MUST exist in **all three**.
- Config under `i18n/` (`@/i18n/routing` exports locale-aware `Link` / `usePathname` / `useRouter`).

### Key structure

- **`action.*`** — shared actions: `save`, `cancel`, `create`, `edit`, `delete`, `search`.
- **`validation.*`** — shared templates with named interpolation: `required` (`{field}`),
  `email` (`{field}`), `minLength` (`{field}`,`{min}`), `maxLength` (`{field}`,`{max}`).
- **`<Namespace>.*`** — per-feature text (titles, labels, messages), e.g. `ChangePassword.title`.

### Schema usage

```ts
import { useTranslations } from 'next-intl'
const t = useTranslations()
z.string().min(1, t('validation.required', { field: t('Feature.fields.name') }))
```

A single schema (covers create + edit) is the norm; split only when create/edit truly diverge.
See `validation-i18n.md` for the full contract.

---

## State: Zustand + Service layer

- Cross-component feature state lives in a **Zustand** store (`stores/<feature>.store.ts`, `create`
  from `zustand`). Components read via the store hook; **mutations happen in the service layer** via
  `useStore.getState()` (see `auth.store.ts` + `auth.service.ts`). No Redux.
- The **service** (`<feature>.service.ts`) orchestrates repository ↔ store ↔ toast and decides
  error policy (re-throw 422 for forms, toast 5xx, `handleApiError` for 401).
- The **hook** (`use-<feature>.ts`) reads the store and delegates actions to the service.

---

## Hook contract (return shape)

**Hooks return an object with named fields. Never positional tuples for >2 values.**

```ts
export function useFeature() {
  const { items, isLoading, error } = useFeatureStore()
  return {
    items, isLoading, error,
    fetchList: (filters: FeatureFilters) => featureService.fetchList(filters),
    create: (input: CreateInput) => featureService.create(input),   // → Feature | null
    update: (id: number, input: UpdateInput) => featureService.update(id, input),
    remove: (id: number) => featureService.remove(id),              // → boolean
  }
}
```

### Rules

- **Naming:** boolean flags `isX` / `hasX` / `canX`; mutations are verbs (`create`, `update`,
  `remove`, `fetchList`); setters `setX`.
- **Error surface:** the service converts thrown errors to store `error` + toast and returns the
  success value or `null` / `false` — **except 422, which the service re-throws** so the form maps
  it into RHF `setError`.
- **Loading granularity:** if mutations need their own pending flag, add `isSubmitting` separate
  from `isLoading`.
- **Return type:** export `UseFeatureReturn` when consumed by 2+ files.
- **No tuple returns** for non-trivial hooks.

---

## Repository instantiation & mocking

- One HTTP repository per feature, exported as a **module-scope singleton**
  (`export const featureRepository = new FeatureRepository()`). The service injects it.
- **There is no repository factory and no `MockRepository` class.** Mocking is done at the network
  layer with **MSW**: a `mocks/<feature>.mock.ts` (`extends BaseMock`, `getHandlers()`) registered in
  `infra/mocks/handlers.ts`, toggled by `NEXT_PUBLIC_USE_MOCK=true`. The repository is identical in
  both modes. See `mock-repo-patterns.md`.

---

## Toast policy

- `import { toast } from 'sonner'` — used directly (no `shouldShowToast` helper exists).
- Prefer the backend `message` (or an `Api` / feature i18n key) over inventing client strings.
- **Never toast on 422** — those become inline field errors via `mapBackendErrors`.
- 401 → `handleApiError` (`@/infra/api/error-handler`) handles the login redirect.

---

## Pages, layout & navigation (App Router)

- Routes are file-system based: `app/(main)/<feature>/page.tsx`, `app/(main)/<feature>/[id]/page.tsx`.
  No central route-registry file; no `React.lazy`. Interactive components need `"use client"`.
- Shared shell: `shared/components/layout/app-shell.tsx`; sidebar: `shared/components/menu/sidebar-menu.tsx`
  (menu config from `@/shared/types/menu` + `@/shared/lib/menu-utils.ts`).
- **Navigation:** locale-aware `Link` / `usePathname` from `@/i18n/routing`, or `useRouter` /
  `useSearchParams` from `next/navigation`. **No `react-router-dom`.**
- Create/edit/detail-section forms: `Dialog` + `DialogContent` from `@bks/ds-system-sdk` (see
  `change-password-dialog.tsx`). Mount conditionally: `{open && <FeatureForm … />}`.

---

## Detail pages

- Lazy-load each tab's data with its own hook.
- Tab state via URL query param (`?tab=…`) using `useSearchParams` so deep links work.
- Hard skeleton on first load; per-tab skeleton afterwards.
- Edit a section → open a `Dialog`; never inline a form on the detail page.

---

## Anti-patterns to avoid

- `result as any` to bypass typed shapes — declare a proper `ListResponse<T>` / domain type.
- Importing `HttpService` and calling axios directly from a repository — go through `BaseRepository`.
- Cross-feature hook imports — put shared logic in `@/shared/services` / `@/shared/utils`.
- `react-router-dom`, Redux, `react-i18next`, `~/` alias, `import.meta.env` — **none exist** here
  (Next.js + next-intl + Zustand + `@/` alias + `process.env.NEXT_PUBLIC_*`).
- Hardcoded strings in toasts/validation — go through next-intl `t()` + server `message`.
- Positional tuple returns from non-trivial hooks.
