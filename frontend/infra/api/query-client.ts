import { QueryClient, QueryCache, MutationCache } from '@tanstack/react-query'
import { handleApiError } from './error-handler'
import { cache } from 'react'
import { AxiosError } from 'axios'

export const createQueryClient = () => {
  return new QueryClient({
    queryCache: new QueryCache({
      onError: (error) => {
        handleApiError(error)
      },
    }),
    mutationCache: new MutationCache({
      onError: (error) => {
        handleApiError(error)
      },
    }),
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000, // 1 minute
        retry: (failureCount, error: unknown) => {
          if (failureCount >= 3) return false
          
          if (error instanceof AxiosError) {
            const status = error.response?.status
            // Do not retry for specific client errors
            if (status && [401, 403, 404].includes(status)) return false
          }
          
          return true
        },
        retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 30000),
        refetchOnWindowFocus: false,
      },
      mutations: {
        retry: false, // Usually mutations shouldn't retry automatically unless idempotent
      },
    },
  })
}

// getQueryClient returns a new QueryClient if one doesn't exist for the current request.
// This ensures that data is not shared between different users and different requests.
export const getQueryClient = cache(() => createQueryClient())
