/**
 * Customer Search Hook with Debounce
 * @module useSearchCustomers
 */
import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { HttpService } from '@/infra/api/http-service'
import type { CustomerSummary } from '../types'

/**
 * Query key for customer search
 */
const CUSTOMER_SEARCH_QUERY_KEY = 'customerSearch' as const

/**
 * Hook to search customers with debounce
 * Dùng cho Tab 1 (S2, S5) - Customer search
 *
 * @param query - Search query string
 * @param debounceMs - Debounce delay in milliseconds (default: 300ms)
 * @returns Object containing results, isLoading, and error
 *
 * @example
 * ```ts
 * const { results, isLoading, error } = useSearchCustomers('John', 300)
 *
 * // results.length === 1 → auto-fill logic in component
 * // results.length > 1 → open modal
 * ```
 */
export function useSearchCustomers(
  query: string,
  debounceMs: number = 300,
): {
  results: CustomerSummary[]
  isLoading: boolean
  error: Error | null
} {
  const [debouncedQuery, setDebouncedQuery] = useState(query)

  // Debounce the query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query)
    }, debounceMs)

    return () => clearTimeout(timer)
  }, [query, debounceMs])

  // Use TanStack Query for data fetching
  const { data, isLoading, error } = useQuery<CustomerSummary[]>({
    queryKey: [CUSTOMER_SEARCH_QUERY_KEY, debouncedQuery],
    queryFn: async () => {
      // Only fetch if query is valid
      if (!debouncedQuery || debouncedQuery.length < 2) {
        return []
      }

      try {
        const response = await HttpService.get<{
          success: boolean
          data: CustomerSummary[]
          message?: string
        }>(`/api/customers/search?search=${encodeURIComponent(debouncedQuery)}`)

        // Laravel trả về { success: true, data: [...], message: '' }
        if (response.success && Array.isArray(response.data)) {
          return response.data
        }

        return []
      } catch (err) {
        console.error('Customer search error:', err)
        throw err
      }
    },
    enabled: debouncedQuery.length >= 2,
    staleTime: 60000,
    gcTime: 300000,
    retry: false,
  })

  return {
    results: data ?? [],
    isLoading,
    error: error instanceof Error ? error : null,
  }
}
