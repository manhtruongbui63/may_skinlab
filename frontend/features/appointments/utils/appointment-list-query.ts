import { z } from 'zod'
import type { AppointmentFilters } from '../types'

export const appointmentListQuerySchema = z.object({
  view: z.enum(['calendar', 'table']).default('calendar'),
  q: z.string().trim().max(100).optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().or(z.literal('')),
  status: z.coerce.number().int().min(1).max(6).optional(),
  page: z.coerce.number().int().min(1).default(1),
  perPage: z.coerce
    .number()
    .int()
    .refine((v) => [10, 15, 20, 50, 100].includes(v))
    .default(15),
})

export type AppointmentListQuery = z.infer<typeof appointmentListQuerySchema>

export function parseAppointmentListQuery(
  searchParams: URLSearchParams | Record<string, string | string[] | undefined>,
): AppointmentListQuery {
  const raw = Object.fromEntries(
    searchParams instanceof URLSearchParams
      ? searchParams.entries()
      : Object.entries(searchParams).map(([k, v]) => [k, Array.isArray(v) ? v[0] : v]),
  )
  const result = appointmentListQuerySchema.safeParse(raw)
  return result.success ? result.data : appointmentListQuerySchema.parse({})
}

export function serializeAppointmentListQuery(query: AppointmentListQuery): URLSearchParams {
  const params = new URLSearchParams()

  if (query.view !== 'calendar') params.set('view', query.view)
  
  const q = query.q?.trim()
  if (q) params.set('q', q)

  if (query.date) params.set('date', query.date)
  if (query.status !== undefined) params.set('status', String(query.status))

  if (query.page > 1) params.set('page', String(query.page))
  if (query.perPage !== 15) params.set('perPage', String(query.perPage))

  return params
}

export function queryToAppointmentFilters(query: AppointmentListQuery): AppointmentFilters {
  return {
    search: query.q,
    date: query.date,
    status: query.status,
    page: query.page,
    perPage: query.perPage,
  }
}

export function appointmentFiltersToQuery(
  filters: AppointmentFilters,
  view: 'calendar' | 'table',
): AppointmentListQuery {
  return {
    view,
    q: filters.search,
    date: filters.date,
    status: filters.status,
    page: filters.page,
    perPage: filters.perPage,
  }
}
