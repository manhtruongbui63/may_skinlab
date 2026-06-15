/**
 * Hook for Examination List Filters with URL State Sync
 * @module useExaminationFilters
 */
'use client'

import { useSearchParams, useRouter, usePathname } from 'next/navigation'
import { useCallback, useMemo } from 'react'
import type { ListVisitFilters } from '../types'

const QUERY_PREFIX = 'exam'

/**
 * Hook quản lý filters cho Tab 2 (Examination List) với URL sync
 * PROPOSED_BR:visit-list-date-same-month
 * Default: from = to = today
 */
export function useExaminationFilters(): {
  filters: ListVisitFilters
  setFilters: (filters: ListVisitFilters) => void
} {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  // Get today's date in YYYY-MM-DD format
  const today = useMemo(() => {
    const date = new Date()
    return date.toISOString().split('T')[0]
  }, [])

  // Parse filters from URL
  const filters = useMemo((): ListVisitFilters => {
    const from = searchParams.get(`${QUERY_PREFIX}_from`) || today
    const to = searchParams.get(`${QUERY_PREFIX}_to`) || today
    const status = searchParams.get(`${QUERY_PREFIX}_status`)

    return {
      from,
      to,
      status: status ? parseInt(status, 10) : undefined,
      page: 1,
      per_page: 15,
    }
  }, [searchParams, today])

  // Update URL with new filters
  const setFilters = useCallback(
    (newFilters: ListVisitFilters) => {
      const params = new URLSearchParams(searchParams.toString())

      // Update params
      if (newFilters.from) {
        params.set(`${QUERY_PREFIX}_from`, newFilters.from)
      } else {
        params.delete(`${QUERY_PREFIX}_from`)
      }

      if (newFilters.to) {
        params.set(`${QUERY_PREFIX}_to`, newFilters.to)
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
