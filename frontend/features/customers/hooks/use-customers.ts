import { useQuery } from '@tanstack/react-query'
import { customerRepository } from '../services/customer-repository'
import type { CustomerFilters } from '../types'

export const useCustomers = (filters: CustomerFilters) => {
  return useQuery({
    queryKey: ['customers', filters],
    queryFn: () => customerRepository.list(filters),
  })
}
