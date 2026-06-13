import { useQuery } from '@tanstack/react-query'
import { customerRepository } from '../services/customer-repository'

export const useCustomerVisits = (id: number) => {
  return useQuery({
    queryKey: ['customer-visits', id],
    queryFn: () => customerRepository.visits(id),
    enabled: !!id,
  })
}
