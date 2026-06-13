---
name: bks-fe-api-integration
description: |
  Hướng dẫn đầy đủ để tích hợp API vào một feature trong dự án Next.js 16 (App Router): repository
  pattern (interface `I<Feature>Repository` + impl `extends BaseRepository`), Zod response validation,
  xử lý 422 server errors (mapBackendErrors), service-layer orchestration (Zustand store + sonner toast),
  custom hook, và mock bằng MSW. Đảm bảo logic hoàn chỉnh từ form submit → service → repository →
  validate response → map errors → toast. i18n dùng next-intl.
user-invocable: true
triggers:
  - "api-integration"
  - "ghép api"
  - "tích hợp api"
  - "kết nối api"
  - "api hoàn chỉnh"
allowed-tools: [Read, Glob, Grep, Bash, Edit, Write, ReadLints]
---

# API Integration Skill

Skill này bao gồm **toàn bộ luồng API integration** cho một feature trong codebase Next.js 16 này.
Tầng kiến trúc thực tế (tham chiếu chuẩn: `features/auth/`):

```
Component (RHF + Zod + next-intl)
  └─ hook  use-<feature>.ts            đọc Zustand store, ủy quyền action cho service
       └─ service  <feature>.service.ts   orchestrate store + sonner toast, re-throw 422
            └─ repository impl  <feature>.repository.impl.ts   extends BaseRepository
                 └─ BaseRepository (@/infra/api/base-repository) → HttpService (axios)
```

1. [Repository layer](#1-repository-layer) — interface + impl `extends BaseRepository` + Zod guard
2. [Client-side validation](#2-client-side-validation-zod--react-hook-form) — Zod schema + RHF + next-intl
3. [Store + Service orchestration](#3-store--service-orchestration) — Zustand + sonner, 422 handling
4. [Hook + Form component wiring](#4-hook--form-component-wiring) — setError pattern
5. [Mock bằng MSW](#5-mock-bằng-msw)
6. [Checklist](#6-checklist)

> **Khi nào dùng skill này?**
> - Ghép API thật vào một feature đang mock
> - Xây feature mới cần full API flow (create/update/delete + list)
> - Debug lỗi 422, Zod crash, toast sai, setError không chạy
> - Review API integration của feature đã build

---

## Quick decision

| Câu hỏi | Chọn |
|---------|------|
| API đã có hay chưa? | Luôn viết HTTP repository. API chưa sẵn → thêm MSW handler để dev/test. |
| Bật mock cách nào? | `NEXT_PUBLIC_USE_MOCK=true` → MSW intercept network. **Không** đổi repository. |
| Repository trả gì? | **Domain type** đã map (vd `User`, `boolean`, `{ user }`), KHÔNG trả raw envelope. |
| Gọi HTTP ở đâu? | Qua `this.get/post/put/patch/delete` của `BaseRepository` — không gọi `axios` trực tiếp. |

> ⚠️ Codebase này **không** có `MockRepository` class hay repository factory. Mock = **MSW** (xem §5).

---

## 1. Repository layer

### 1.1 File structure

```
features/<feature>/
├── types.ts                              # Domain types: Feature, CreateInput, UpdateInput, Filters
├── schemas/<feature>.schema.ts           # Zod: Backend<X>Schema (response guard) + form schema
├── services/
│   ├── <feature>.repository.ts           # interface I<Feature>Repository (port — hook/service phụ thuộc)
│   ├── <feature>.repository.impl.ts      # class extends BaseRepository implements interface + singleton
│   ├── <feature>.service.ts              # orchestrate store + toast
│   └── <feature>.server.ts               # (optional) repo cho Server Components
├── stores/<feature>.store.ts             # Zustand store (chỉ khi cần state cross-component)
├── hooks/use-<feature>.ts
├── mocks/<feature>.mock.ts               # MSW handlers (extends BaseMock)
└── components/<feature>-form.tsx
```

### 1.2 Interface (port)

Interface trả **domain types**, mô tả endpoint qua JSDoc.

```ts
// features/<feature>/services/<feature>.repository.ts
import type { Feature, CreateInput, UpdateInput, FeatureFilters } from '../types'
import type { ListResponse } from '@/shared/types/common'

export interface IFeatureRepository {
  /** GET /api/features */
  list(filters: FeatureFilters): Promise<ListResponse<Feature>>
  /** GET /api/features/:id */
  getById(id: number): Promise<Feature>
  /** POST /api/features */
  create(input: CreateInput): Promise<Feature>
  /** PUT /api/features/:id */
  update(id: number, input: UpdateInput): Promise<Feature>
  /** DELETE /api/features/:id */
  delete(id: number): Promise<void>
}
```

### 1.3 Implementation (`extends BaseRepository`)

`BaseRepository` (`@/infra/api/base-repository`) nhận một `IHttpAdapter` qua constructor và cung cấp
các wrapper protected `get/post/put/patch/delete`. **Mỗi wrapper trả về `response.data` — tức là
envelope `ResponseData<T>`** (`{ success, message, data, errors }` từ `@/shared/types/common`).

```ts
// features/<feature>/services/<feature>.repository.impl.ts
import { BaseRepository } from '@/infra/api/base-repository'
import { HttpService } from '@/infra/api/http-service'
import type { IHttpAdapter } from '@/infra/api/http-adapter'
import type { ResponseData, ListResponse } from '@/shared/types/common'
import type { Feature, CreateInput, UpdateInput, FeatureFilters } from '../types'
import type { IFeatureRepository } from './<feature>.repository'
import { BackendFeatureSchema, BackendFeatureListSchema } from '../schemas/<feature>.schema'

export class FeatureRepository extends BaseRepository implements IFeatureRepository {
  constructor(http: IHttpAdapter = HttpService) {
    super(http)
  }

  // ─── MANDATORY: HTTP 200 Fake-Error Guard ────────────────────────────────
  // Backend (Laravel) có thể nhúng 422/lỗi vào HTTP 200 body. BaseRepository đã
  // unwrap về envelope, nên ĐỌC `status_code`/`success` TỪ BODY, KHÔNG dựa res.status.
  private assertOk(res: ResponseData<unknown> & { status_code?: number }) {
    const statusCode = res?.status_code
    const isError = statusCode === 422 || res?.success === false
    if (isError || statusCode === 401) {
      const error = new Error(res?.message || 'Request failed') as Error & {
        response?: { data?: unknown; status?: number }
      }
      error.response = { data: res, status: statusCode ?? (res?.success === false ? 422 : 500) }
      throw error
    }
  }

  async list(filters: FeatureFilters): Promise<ListResponse<Feature>> {
    // GET read-only: parse data, không cần assertOk
    const res = await this.get<ResponseData<ListResponse<Feature>>>(
      '/api/features',
      this.buildListParams(filters),
    )
    return { ...res.data, data: BackendFeatureListSchema.parse(res.data.data) }
  }

  async getById(id: number): Promise<Feature> {
    const res = await this.get<ResponseData<Feature>>(`/api/features/${id}`)
    return BackendFeatureSchema.parse(res.data)
  }

  async create(input: CreateInput): Promise<Feature> {
    const res = await this.post<ResponseData<Feature>, CreateInput>('/api/features', input)
    this.assertOk(res)                       // ← TRƯỚC khi parse (bắt buộc cho mutations)
    return BackendFeatureSchema.parse(res.data)
  }

  async update(id: number, input: UpdateInput): Promise<Feature> {
    const res = await this.put<ResponseData<Feature>, UpdateInput>(`/api/features/${id}`, input)
    this.assertOk(res)
    return BackendFeatureSchema.parse(res.data)
  }

  async delete(id: number): Promise<void> {
    const res = await this.delete<ResponseData<null>>(`/api/features/${id}`)
    this.assertOk(res)
  }

  // ─── Indexed filter wire format: filters[0][key]=x&filters[0][data]=y ──────
  private buildListParams(filters: FeatureFilters) {
    const params = new URLSearchParams()
    const entries: Array<{ key: string; data: string }> = []
    if (filters.search) entries.push({ key: 'search_name', data: filters.search })
    if (filters.status) entries.push({ key: 'status', data: String(filters.status) })
    entries.forEach(({ key, data }, i) => {
      params.set(`filters[${i}][key]`, key)
      params.set(`filters[${i}][data]`, data)
    })
    params.set('orders[0][key]', 'created_at')
    params.set('orders[0][dir]', 'desc')
    params.set('page', String(filters.page ?? 1))
    params.set('per_page', String(filters.perPage ?? 20))
    return params
  }
}

/** Client-side singleton — import trong service/hook. */
export const featureRepository: IFeatureRepository = new FeatureRepository()
```

> **Server Components:** nếu cần fetch phía server, tạo `createServerFeatureRepository()` trong
> `<feature>.server.ts` inject một `IHttpAdapter` server-side (xem `features/auth/services/auth.server.ts`).

> **⚠️ Dấu hiệu HTTP 200 Fake Error:** thấy `ZodError: ... received undefined/null` trong stack của
> repository method → backend trả lỗi trong HTTP 200 body. Fix: gọi `this.assertOk(res)` TRƯỚC `parse()`.

### 1.4 Boolean / `data === true` endpoints

Một số endpoint (toggle/block/change-password) trả `data: true` hoặc `data: {}`/`null`. Đừng
`z.boolean().parse(res.data)` cứng — kiểm `success`/`status_code` rồi trả boolean:

```ts
async toggle(id: number): Promise<boolean> {
  const res = await this.post<ResponseData<unknown> & { status_code?: number }>(`/api/features/${id}/toggle`)
  this.assertOk(res)
  return res.success === true || res.status_code === 200 || res.data === true
}
```

---

## 2. Client-side validation (Zod + React Hook Form)

### 2.1 Response schema (runtime guard)

Schema validate envelope hoặc data trả về. Theo backend Laravel, field có thể `nullable().optional()`.

```ts
// features/<feature>/schemas/<feature>.schema.ts
import { z } from 'zod'

export const BackendFeatureSchema = z.object({
  id: z.union([z.string(), z.number()]),
  name: z.string().nullable().optional(),
  email: z.string(),
  status: z.number().nullable().optional(),
})
export type BackendFeature = z.infer<typeof BackendFeatureSchema>

export const BackendFeatureListSchema = z.array(BackendFeatureSchema)
```

### 2.2 Form schema (next-intl)

i18n dùng **next-intl** (`useTranslations`), KHÔNG dùng `react-i18next`. Schema khai báo trong
component (xem `change-password-dialog.tsx`) hoặc tách thành hook nhận `t`. Message lấy từ:
- namespace dùng chung **`validation`** (`{field}`, `{min}`, `{max}` interpolation) và **`action`**;
- namespace riêng của feature (vd `Feature.fields.*`).

```ts
import { z } from 'zod'
import { useTranslations } from 'next-intl'
import { useMemo } from 'react'

export const useFeatureSchema = () => {
  const t = useTranslations()            // root, để gọi 'validation.*' và 'Feature.*'
  return useMemo(
    () =>
      z.object({
        name: z.string().min(1, t('validation.required', { field: t('Feature.fields.name') })),
        email: z
          .string()
          .min(1, t('validation.required', { field: t('Feature.fields.email') }))
          .email(t('validation.email', { field: t('Feature.fields.email') })),
      }),
    [t],
  )
}
export type FeatureFormInput = z.infer<ReturnType<typeof useFeatureSchema>>
```

> Thêm key vào **cả ba** `messages/vi.json`, `messages/en.json`, `messages/ja.json`. Không hardcode string.

---

## 3. Store + Service orchestration

### 3.1 Zustand store (khi cần state dùng lại nhiều nơi)

```ts
// features/<feature>/stores/<feature>.store.ts
import { create } from 'zustand'
import type { Feature } from '@/features/<feature>/types'

interface FeatureState {
  items: Feature[]
  isLoading: boolean
  error: string | null
  fieldErrors: Record<string, string[]> | null
  setItems: (items: Feature[]) => void
  setLoading: (v: boolean) => void
  setError: (error: string | null, fieldErrors?: Record<string, string[]> | null) => void
  reset: () => void
}

const initialState = { items: [], isLoading: false, error: null, fieldErrors: null }

export const useFeatureStore = create<FeatureState>((set) => ({
  ...initialState,
  setItems: (items) => set({ items, isLoading: false }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error, fieldErrors = null) => set({ error, fieldErrors, isLoading: false }),
  reset: () => set(initialState),
}))
```

### 3.2 Service — orchestrate repository ↔ store ↔ toast

Service là nơi DUY NHẤT gọi repository, cập nhật store, và bắn toast (`sonner`). Quy ước 422:
**re-throw** để form (component) tự map vào RHF `setError`; lỗi khác → toast + nuốt.

```ts
// features/<feature>/services/<feature>.service.ts
import { toast } from 'sonner'
import { handleApiError } from '@/infra/api/error-handler'
import { useFeatureStore } from '@/features/<feature>/stores/<feature>.store'
import { FeatureRepository } from './<feature>.repository.impl'
import type { IFeatureRepository } from './<feature>.repository'
import type { Feature, CreateInput, FeatureFilters } from '@/features/<feature>/types'

export class FeatureService {
  constructor(private readonly repository: IFeatureRepository) {}

  async fetchList(filters: FeatureFilters): Promise<void> {
    const store = useFeatureStore.getState()
    store.setLoading(true)
    try {
      const res = await this.repository.list(filters)
      store.setItems(res.data)
    } catch (error) {
      handleApiError(error)            // 401 → redirect; 5xx → toast
    } finally {
      store.setLoading(false)
    }
  }

  async create(input: CreateInput): Promise<Feature | null> {
    const store = useFeatureStore.getState()
    store.setLoading(true)
    try {
      const item = await this.repository.create(input)
      toast.success('Tạo thành công.')   // ưu tiên message backend / key i18n nếu có
      return item
    } catch (error: unknown) {
      const status = (error as { response?: { status?: number } })?.response?.status
      const responseData = (error as { response?: { data?: Record<string, unknown> } })?.response?.data
      if (status === 422 || responseData?.status_code === 422) {
        throw error                      // ← re-throw cho form map vào setError
      }
      toast.error((responseData?.message as string) ?? 'Có lỗi xảy ra.')
      return null
    } finally {
      store.setLoading(false)
    }
  }
}

/** Singleton — import trong hook. */
export const featureService = new FeatureService(new FeatureRepository())
```

### 3.3 Toast policy

| Tình huống | Action |
|-----------|--------|
| Mutation success | `toast.success(...)` — ưu tiên `message` backend hoặc key i18n |
| 422 validation | ❌ Không toast — service **re-throw**, form gọi `mapBackendErrors` → inline |
| 401 | `handleApiError` xử lý redirect login |
| 5xx / network | `toast.error(message)` ở service |

`toast` import từ **`sonner`** (`import { toast } from 'sonner'`). Không có helper `shouldShowToast`.

---

## 4. Hook + Form component wiring

### 4.1 Hook — đọc store, ủy quyền service

```ts
// features/<feature>/hooks/use-feature.ts
import { useFeatureStore } from '@/features/<feature>/stores/<feature>.store'
import { featureService } from '@/features/<feature>/services/<feature>.service'
import type { CreateInput, FeatureFilters } from '@/features/<feature>/types'

export const useFeature = () => {
  const { items, isLoading, error } = useFeatureStore()
  return {
    items,
    isLoading,
    error,
    fetchList: (filters: FeatureFilters) => featureService.fetchList(filters),
    create: (input: CreateInput) => featureService.create(input),
  }
}
```

### 4.2 Form component — RHF + next-intl + setError

```tsx
'use client'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useTranslations } from 'next-intl'
import { Button, Field, FieldContent, FieldError, FieldLabel, Input } from '@bks/ds-system-sdk'
import { mapBackendErrors } from '@/shared/utils/map-backend-errors'
import { useFeatureSchema, type FeatureFormInput } from '../schemas/<feature>.schema'

type Props = {
  defaultValues?: Partial<FeatureFormInput>
  isSubmitting: boolean
  onSubmit: (data: FeatureFormInput) => Promise<unknown>
  onCancel?: () => void
}

export function FeatureForm({ defaultValues, isSubmitting, onSubmit, onCancel }: Props) {
  const t = useTranslations('Feature')
  const schema = useFeatureSchema()

  // Local state phụ (nếu có) — KHỞI TẠO LAZY từ defaultValues, KHÔNG useEffect + reset()
  const [touched] = useState(() => false)

  const { register, handleSubmit, setError, formState: { errors } } = useForm<FeatureFormInput>({
    resolver: zodResolver(schema),
    defaultValues: { name: '', email: '', ...defaultValues },  // spread trực tiếp
  })

  const submit = async (data: FeatureFormInput) => {
    try {
      const result = await onSubmit(data)
      // success → caller đóng dialog
      return result
    } catch (err: unknown) {
      const responseData = (err as { response?: { data?: Record<string, unknown> } })?.response?.data
      const rawErrors =
        (responseData?.errors as Record<string, string[]> | null) ??
        (responseData?.data as Record<string, string[]> | null)
      // fieldMap khi backend snake_case ≠ form camelCase
      mapBackendErrors(rawErrors, setError, { full_name: 'name' })
    }
  }

  return (
    <form onSubmit={handleSubmit(submit)} noValidate>
      <Field className="gap-1">
        <FieldLabel htmlFor="name">{t('fields.name')}</FieldLabel>
        <FieldContent>
          <Input id="name" {...register('name')} aria-invalid={!!errors.name} />
          {errors.name && <FieldError>{errors.name.message}</FieldError>}
        </FieldContent>
      </Field>
      <Button type="submit" loading={isSubmitting}>{useTranslations('action')('save')}</Button>
    </form>
  )
}
```

### 4.3 Dialog mount form CÓ ĐIỀU KIỆN

Form unmount/remount khi đóng/mở → state reset tự nhiên, tránh `useEffect` + `reset()`:

```tsx
<Dialog open={open} onOpenChange={onOpenChange}>
  <DialogContent ...>
    <DialogHeader>...</DialogHeader>
    {open && (                                  // ← mount/unmount theo `open`
      <FeatureForm
        defaultValues={selected ? { name: selected.name } : undefined}
        isSubmitting={isLoading}
        onSubmit={async (data) => { const r = await create(data); if (r) onOpenChange(false); return r }}
        onCancel={() => onOpenChange(false)}
      />
    )}
  </DialogContent>
</Dialog>
```

> **❌ KHÔNG** dùng `useEffect(() => reset(defaultValues), [defaultValues])` để sync local state:
> `defaultValues` thường là object literal mới mỗi render → `reset()` xóa sạch `setError` (lỗi 422 biến mất).
> Dùng lazy `useState(() => …)` + spread `defaultValues` vào `useForm`.

---

## 5. Mock bằng MSW

Codebase này mock ở **tầng network bằng MSW**, không có MockRepository class.

```ts
// features/<feature>/mocks/<feature>.mock.ts
import { http, HttpResponse, delay, type HttpHandler } from 'msw'
import { BaseMock } from '@/infra/mocks/base-mock'

export class FeatureMock extends BaseMock {
  public getHandlers(): HttpHandler[] {
    return [
      http.get('*/api/features', async () => {
        await delay(300)
        return HttpResponse.json({ success: true, message: 'OK', errors: null, data: { data: [], total: 0, per_page: 20, current_page: 1 } })
      }),
      http.post('*/api/features', async ({ request }) => {
        const body = await request.json()
        // ví dụ 422
        // return HttpResponse.json({ success:false, message:'...', errors:{ name:['...'] }, data:null }, { status: 422 })
        return HttpResponse.json({ success: true, message: 'Tạo thành công.', errors: null, data: body })
      }),
    ]
  }
}
```

Đăng ký vào registry:

```ts
// infra/mocks/handlers.ts
import { FeatureMock } from '@/features/<feature>/mocks/<feature>.mock'
mockManager.register(new FeatureMock())
```

Bật bằng env: `NEXT_PUBLIC_USE_MOCK=true` (MSW provider trong `app/providers.tsx`). Tắt → gọi API thật.
Repository **không đổi** giữa hai chế độ.

---

## 6. Checklist

Chạy trước khi merge. **🔴 Blockers phải pass hết.**

### 🔴 Blockers

- [ ] Interface `I<Feature>Repository` tồn tại; impl `extends BaseRepository implements I<Feature>Repository`
- [ ] Repository method trả **domain type** đã map, không trả raw envelope
- [ ] Dùng `this.get/post/put/patch/delete` của `BaseRepository` (không gọi `axios`/`HttpService` trực tiếp)
- [ ] `this.assertOk(res)` (đọc `status_code`/`success` từ **body**) được gọi TRƯỚC `Schema.parse()` trong MỌI mutation
- [ ] **KHÔNG** dựa `res.status` cho fake-error (BaseRepository unwrap rồi → res.status không còn ở đây)
- [ ] Zod `Backend<X>Schema` validate response trước khi map/return
- [ ] Boolean/`data===true` endpoint kiểm `success`/`status_code` thay vì `z.boolean().parse()` cứng
- [ ] Service bắt 422 → **re-throw**; form gọi `mapBackendErrors(rawErrors, setError)` (không toast.error 422)
- [ ] Lỗi 401 qua `handleApiError`; 5xx/network → `toast.error` ở service
- [ ] Toast dùng `sonner` (`import { toast } from 'sonner'`)
- [ ] **Form: KHÔNG** `useEffect` + `reset()` sync từ `defaultValues` — dùng lazy `useState` + spread
- [ ] Dialog mount form có điều kiện: `{open && <FeatureForm ... />}`

### 🟡 Required

- [ ] `repository`/`service` export singleton ở module scope
- [ ] `rawErrors` trích từ cả `response.data.errors` lẫn `response.data.data`
- [ ] `fieldMap` truyền cho `mapBackendErrors` khi backend snake_case ≠ form camelCase
- [ ] i18n dùng **next-intl** (`useTranslations`) — không `react-i18next`, không hardcode
- [ ] Key i18n có đủ trong `vi.json`, `en.json`, `ja.json`; dùng namespace chung `validation`/`action`
- [ ] Mock (nếu có) là MSW (`extends BaseMock`) + đăng ký trong `infra/mocks/handlers.ts`
- [ ] `isLoading` ở store cho cả fetch & submit (hoặc tách rõ nếu cần)

### 🟢 Recommended

- [ ] Auto-check: `rg "react-router|react-i18next" features/<name>` — rỗng
- [ ] Auto-check: `rg "assertOk" features/<name>` — có trong mọi mutation method
- [ ] Server repo (`*.server.ts`) khi cần fetch trong Server Component

---

## References

| File | Đọc khi |
|------|---------|
| `../bks-fe-implement-feature/references/project-patterns.md` | Xem `BaseRepository`/`HttpService` API, envelope, filter wire format |
| `../bks-fe-implement-feature/references/validation-i18n.md` | Thêm/mở rộng key `validation.*` hoặc `<Feature>.fields.*` (next-intl) |
| `../bks-fe-implement-feature/references/mock-repo-patterns.md` | Viết MSW mock cho feature |

---

## Real-world references trong codebase

> **⚠️ LƯU Ý:** Các file dưới là **ví dụ tham khảo** tại thời điểm viết skill. Nếu bị xoá/đổi tên,
> skill vẫn giữ giá trị — đừng cố đọc nếu không tồn tại.

| File (Ví dụ) | Patterns demo |
|------|-------------------|
| `infra/api/base-repository.ts` | `BaseRepository` wrappers (`get/post/...`) |
| `infra/api/http-service.ts` | `HttpService` singleton (axios adapter) |
| `shared/types/common.ts` | `ResponseData<T>`, `ListResponse<T>`, `Future<T>` |
| `shared/utils/map-backend-errors.ts` | `mapBackendErrors(errors, setError, fieldMap?)` |
| `features/auth/services/*` | interface + impl + service + server repo |
| `features/auth/stores/auth.store.ts` | Zustand store pattern |
| `features/auth/components/change-password-dialog.tsx` | RHF + zodResolver + next-intl + setError + `{open && ...}` |
| `features/auth/mocks/auth.mock.ts` | MSW mock (`extends BaseMock`) |
