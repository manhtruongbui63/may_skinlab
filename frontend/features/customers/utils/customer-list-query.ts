import { z } from 'zod'
import type { CustomerFilters } from '../types'

export const customerListQuerySchema = z.object({
  q: z.string().trim().max(100).optional(),
  gender: z.coerce.number().int().min(1).max(3).optional(),
  source: z.coerce.number().int().min(1).max(5).optional(),
  status: z.coerce.number().int().min(0).max(1).optional(),
  page: z.coerce.number().int().min(1).default(1),
  perPage: z.coerce
    .number()
    .int()
    .refine((v) => [10, 20, 50, 100].includes(v))
    .default(20),
})

export type CustomerListQuery = z.infer<typeof customerListQuerySchema>

export function parseCustomerListQuery(
  searchParams: URLSearchParams | Record<string, string | string[] | undefined>,
): CustomerListQuery {
  const raw = Object.fromEntries(
    searchParams instanceof URLSearchParams
      ? searchParams.entries()
      : Object.entries(searchParams).map(([k, v]) => [k, Array.isArray(v) ? v[0] : v]),
  )
  const result = customerListQuerySchema.safeParse(raw)
  return result.success ? result.data : customerListQuerySchema.parse({})
}

export function serializeCustomerListQuery(query: CustomerListQuery): URLSearchParams {
  const params = new URLSearchParams()

  const q = query.q?.trim()
  if (q) params.set('q', q)

  if (query.gender !== undefined) params.set('gender', String(query.gender))
  if (query.source !== undefined) params.set('source', String(query.source))
  if (query.status !== undefined) params.set('status', String(query.status))

  if (query.page > 1) params.set('page', String(query.page))
  if (query.perPage !== 20) params.set('perPage', String(query.perPage))

  return params
}

export function queryToCustomerFilters(query: CustomerListQuery): CustomerFilters {
  return {
    search: query.q,
    gender: query.gender,
    source: query.source,
    status: query.status,
    page: query.page,
    perPage: query.perPage,
  }
}

export function customerFiltersToQuery(
  filters: CustomerFilters,
): CustomerListQuery {
  return {
    q: filters.search,
    gender: filters.gender,
    source: filters.source,
    status: filters.status,
    page: filters.page,
    perPage: filters.perPage,
  }
}
