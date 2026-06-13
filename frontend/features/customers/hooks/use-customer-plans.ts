import { useQuery } from '@tanstack/react-query'
import { customerRepository } from '../services/customer-repository'

export const useCustomerTreatmentPlans = (id: number) => {
  return useQuery({
    queryKey: ['customer-treatment-plans', id],
    queryFn: () => customerRepository.treatmentPlans(id),
    enabled: !!id,
  })
}
