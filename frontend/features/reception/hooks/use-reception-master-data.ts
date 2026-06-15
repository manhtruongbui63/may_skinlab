import { useQuery } from '@tanstack/react-query'
import { HttpService } from '@/infra/api/http-service'
import type { ClinicRoom, Service, ServicePackage, MasterDataResponse } from '../types'

/**
 * Query key for reception master data
 */
const MASTER_DATA_QUERY_KEY = ['reception', 'master-data'] as const

/**
 * Fetch master data for reception form
 * Batch fetch clinic_rooms, services, service_packages
 *
 * @returns Master data response with clinic rooms, services, and service packages
 */
async function fetchReceptionMasterData(): Promise<MasterDataResponse> {
  const params = new URLSearchParams()
  params.append('resources[clinic_rooms]', '{}')
  params.append('resources[services]', '{}')
  params.append('resources[service_packages]', '{}')

  const axiosResponse = await HttpService.get<
    never,
    { data: { success: boolean; data: MasterDataResponse; message?: string } }
  >(`/api/master-data?${params.toString()}`)

  const response = axiosResponse.data

  if (!response.success) {
    throw new Error(response.message || 'Failed to fetch master data')
  }

  return response.data
}

/**
 * Hook to fetch and cache reception master data
 *
 * @description
 * Batch fetch clinic rooms, services, and service packages for reception form dropdowns.
 * Data is cached via TanStack Query with staleTime: Infinity (master data rarely changes).
 *
 * @returns Object containing clinicRooms, services, servicePackages, isLoading, and error
 *
 * @example
 * ```tsx
 * function RegistrationForm() {
 *   const { clinicRooms, services, servicePackages, isLoading } = useReceptionMasterData()
 *
 *   if (isLoading) return <Loading />
 *
 *   return (
 *     <Select>
 *       {clinicRooms.map(room => (
 *         <Option key={room.id} value={room.id}>{room.name}</Option>
 *       ))}
 *     </Select>
 *   )
 * }
 * ```
 */
export function useReceptionMasterData(): {
  clinicRooms: ClinicRoom[]
  services: Service[]
  servicePackages: ServicePackage[]
  isLoading: boolean
  error: Error | null
} {
  const { data, isLoading, error } = useQuery({
    queryKey: MASTER_DATA_QUERY_KEY,
    queryFn: fetchReceptionMasterData,
    staleTime: Number.POSITIVE_INFINITY, // Master data rarely changes
    retry: 1,
  })

  return {
    clinicRooms: data?.clinic_rooms ?? [],
    services: data?.services ?? [],
    servicePackages: data?.service_packages ?? [],
    isLoading,
    error: error instanceof Error ? error : null,
  }
}
