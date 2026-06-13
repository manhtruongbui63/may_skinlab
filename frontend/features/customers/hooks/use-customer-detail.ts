import { useQuery } from '@tanstack/react-query'
import { customerRepository } from '../services/customer-repository'

export const useCustomerDetail = (id: number) => {
  return useQuery({
    queryKey: ['customer-detail', id],
    queryFn: () => customerRepository.detail(id),
    enabled: !!id,
  })
}
