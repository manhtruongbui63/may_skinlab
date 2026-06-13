# Mock Patterns (MSW)

When the API is not ready, mock at the **network layer with MSW** — not with a `MockRepository`
class. The repository and service stay identical; MSW intercepts the HTTP request. Canonical
reference: `features/auth/mocks/auth.mock.ts`.

> This codebase has **no** `Mock<Feature>Repository`, no repository factory, and no `import.meta.env`
> / `@/infra/storage` (those are not part of this Next.js project). Toggle mocks with the env flag.

---

## Goals

- Same endpoints/shapes the real backend returns, wrapped in the `ResponseData<T>` envelope
  (`{ success, message, data, errors }`).
- Realistic latency (`delay`) to expose loading-state bugs.
- Triggerable error paths (401 / 422 / 5xx) to validate `setError` mapping and toast policy.
- A non-empty `message` on responses so toasts are observable during dev.

---

## Skeleton (`extends BaseMock`)

```ts
// features/<feature>/mocks/<feature>.mock.ts
import { http, HttpResponse, delay, type HttpHandler } from 'msw'
import { BaseMock } from '@/infra/mocks/base-mock'

const LATENCY = 300

export class FeatureMock extends BaseMock {
  public getHandlers(): HttpHandler[] {
    return [
      // LIST
      http.get('*/api/features', async () => {
        await delay(LATENCY)
        return HttpResponse.json({
          success: true,
          message: '',                                  // read calls: no toast
          errors: null,
          data: { data: [], total: 0, per_page: 20, current_page: 1 },  // ListResponse<T>
        })
      }),

      // CREATE
      http.post('*/api/features', async ({ request }) => {
        await delay(LATENCY)
        const body = await request.json()
        return HttpResponse.json({
          success: true,
          message: 'Tạo thành công.',                   // mutations: real message
          errors: null,
          data: body,
        })
      }),
    ]
  }
}
```

---

## Patterns

### Server-side validation error (422)

Exercises `mapBackendErrors` → RHF `setError`:

```ts
return HttpResponse.json(
  { success: false, message: 'Dữ liệu không hợp lệ.', errors: { name: ['Tên đã tồn tại.'] }, data: null },
  { status: 422 },
)
```

> Backend may also embed errors in `data` instead of `errors` — forms read both
> (`response.data.errors ?? response.data.data`).

### Auth / 401 and 5xx

```ts
return HttpResponse.json({ message: 'Unauthorized' }, { status: 401 })
return HttpResponse.json({ message: 'Internal Server Error' }, { status: 500 })
```

### In-memory session / dataset

Use a module-scoped flag or `Map` to keep list → create → list consistent within a session (see the
`mockSessionActive` flag in `auth.mock.ts`).

---

## Wiring & toggling

Register the mock in the central registry:

```ts
// infra/mocks/handlers.ts
import { FeatureMock } from '@/features/<feature>/mocks/<feature>.mock'
mockManager.register(new FeatureMock())
```

Enable with the env flag (MSW provider lives in `app/providers.tsx`):

```bash
NEXT_PUBLIC_USE_MOCK=true   # MSW intercepts; set false (or unset) to hit the real API
```

The repository/service do **not** change between mock and real mode.

---

## Anti-patterns

- ❌ Writing a `MockRepository` class or repository factory — mock with MSW instead.
- ❌ `import.meta.env` / `@/infra/storage` — not part of this project (use `process.env.NEXT_PUBLIC_*`).
- ❌ Zero-latency handlers in dev — hides loading/skeleton bugs.
- ❌ Returning a bare payload without the `ResponseData<T>` envelope — breaks toast/error mapping.
- ❌ Forgetting to register the mock in `infra/mocks/handlers.ts` — handlers won't load.
