import { useQuery } from '@tanstack/react-query'
import { customerRepository } from '../services/customer-repository'

export const useCustomerInvoices = (id: number) => {
  return useQuery({
    queryKey: ['customer-invoices', id],
    queryFn: () => customerRepository.invoices(id),
    enabled: !!id,
  })
}
