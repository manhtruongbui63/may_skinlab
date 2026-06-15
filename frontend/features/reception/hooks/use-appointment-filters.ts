/**
 * Hook for Appointment List Filters with URL State Sync
 * @module useAppointmentFilters
 */
'use client'

import { useSearchParams, useRouter, usePathname } from 'next/navigation'
import { useCallback, useMemo } from 'react'
import type { ListAppointmentFilters } from '../types'

const QUERY_PREFIX = 'appt'

/**
 * Hook quản lý filters cho Tab 3 (Appointment List) với URL sync
 */
export function useAppointmentFilters(): {
  filters: ListAppointmentFilters
  setFilters: (filters: ListAppointmentFilters) => void
} {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  // Parse filters from URL
  const filters = useMemo((): ListAppointmentFilters => {
    const search = searchParams.get(`${QUERY_PREFIX}_search`) || undefined
    const dateFrom = searchParams.get(`${QUERY_PREFIX}_from`) || undefined
    const dateTo = searchParams.get(`${QUERY_PREFIX}_to`) || undefined
    const status = searchParams.get(`${QUERY_PREFIX}_status`)

    return {
      search,
      date_from: dateFrom,
      date_to: dateTo,
      status: status ? parseInt(status, 10) : undefined,
      page: 1,
      per_page: 15,
    }
  }, [searchParams])

  // Update URL with new filters
  const setFilters = useCallback(
    (newFilters: ListAppointmentFilters) => {
      const params = new URLSearchParams(searchParams.toString())

      // Update params
      if (newFilters.search) {
        params.set(`${QUERY_PREFIX}_search`, newFilters.search)
      } else {
        params.delete(`${QUERY_PREFIX}_search`)
      }

      if (newFilters.date_from) {
        params.set(`${QUERY_PREFIX}_from`, newFilters.date_from)
      } else {
        params.delete(`${QUERY_PREFIX}_from`)
      }

      if (newFilters.date_to) {
        params.set(`${QUERY_PREFIX}_to`, newFilters.date_to)
      } else {
        params.delete(`${QUERY_PREFIX}_to`)
      }

      if (newFilters.status) {
        params.set(`${QUERY_PREFIX}_status`, newFilters.status.toString())
      } else {
        params.delete(`${QUERY_PREFIX}_status`)
      }

      // Replace URL without navigation
      router.replace(`${pathname}?${params.toString()}`, { scroll: false })
    },
    [router, pathname, searchParams]
  )

  return { filters, setFilters }
}
