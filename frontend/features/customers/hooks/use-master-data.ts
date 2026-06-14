import { useQuery } from '@tanstack/react-query'
import { masterDataRepository } from '../services/master-data-repository'

export const useProvinces = () => {
  return useQuery({
    queryKey: ['provinces'],
    queryFn: () => masterDataRepository.provinces(),
    staleTime: 5 * 60 * 1000, // 5 minutes cache
  })
}

export const useWards = (provinceId?: number) => {
  return useQuery({
    queryKey: ['wards', provinceId],
    queryFn: () => masterDataRepository.wards(provinceId),
    enabled: !!provinceId,
    staleTime: 5 * 60 * 1000,
  })
}
