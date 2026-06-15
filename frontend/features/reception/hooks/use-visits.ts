/**
 * Visit Hooks - TanStack Query
 * @module useVisits
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { useTranslations } from 'next-intl'
import type { StoreVisitInput, PaginatedVisits, ListVisitFilters } from '../types'
import { visitRepository } from '../services/visit-repository'

// Query keys
const VISITS_QUERY_KEY = 'visits' as const

/**
 * Hook để tạo lượt khám mới
 * Mutation: POST /api/v1/visits
 *
 * @example
 * ```ts
 * const { mutate: createVisit, isPending } = useCreateVisit()
 * createVisit({ registration_type: 1, clinic_room_id: 1, service_ids: [1] })
 * ```
 */
export function useCreateVisit() {
  const t = useTranslations('reception')
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: StoreVisitInput) => visitRepository.create(data),
    onSuccess: () => {
      toast.success(t('toasts.visit_created'))
      // Invalidate visits list query
      void queryClient.invalidateQueries({ queryKey: [VISITS_QUERY_KEY] })
    },
    onError: (error: Error) => {
      // 422 errors are re-thrown for form handling
      // Other errors show toast
      if ((error as { response?: { status?: number } })?.response?.status !== 422) {
        toast.error(error.message || 'Có lỗi xảy ra')
      }
    },
  })
}

/**
 * Hook để cập nhật lượt khám
 * Mutation: PUT /api/visits/{id}
 */
export function useUpdateVisit() {
  const t = useTranslations('reception')
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: StoreVisitInput }) =>
      visitRepository.update(id, data),
    onSuccess: () => {
      toast.success(t('toasts.visit_updated') || 'Cập nhật phiếu khám thành công')
      void queryClient.invalidateQueries({ queryKey: [VISITS_QUERY_KEY] })
    },
    onError: (error: Error) => {
      if ((error as { response?: { status?: number } })?.response?.status !== 422) {
        toast.error(error.message || 'Có lỗi xảy ra')
      }
    },
  })
}

/**
 * Hook để tạo lượt khám từ lịch hẹn (Check-in)
 * Mutation: POST /api/v1/visits/from-appointment
 *
 * @example
 * ```ts
 * const { mutate: checkIn, isPending } = useCheckInFromAppointment()
 * checkIn({ appointment_id: 1, clinic_room_id: 1 })
 * ```
 */
export function useCheckInFromAppointment() {
  const t = useTranslations('reception')
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: { appointment_id: number; clinic_room_id: number; is_priority?: boolean }) =>
      visitRepository.createFromAppointment(data),
    onSuccess: () => {
      toast.success(t('toasts.visit_created_from_appointment'))
      void queryClient.invalidateQueries({ queryKey: [VISITS_QUERY_KEY] })
    },
    onError: (error: Error) => {
      if ((error as { response?: { status?: number } })?.response?.status !== 422) {
        toast.error(error.message || 'Có lỗi xảy ra')
      }
    },
  })
}

/**
 * Hook để lấy danh sách lượt khám
 * Query: GET /api/v1/visits
 *
 * @example
 * ```ts
 * const { data: visits, isLoading } = useVisits({ from: '2026-07-01', to: '2026-07-01' })
 * ```
 */
export function useVisits(filters: ListVisitFilters) {
  return useQuery<PaginatedVisits>({
    queryKey: [VISITS_QUERY_KEY, filters],
    queryFn: () => visitRepository.list(filters),
    staleTime: 30000, // 30 seconds
  })
}

/**
 * Hook để hủy lượt khám
 * Mutation: POST /api/v1/visits/{id}/cancel
 *
 * @example
 * ```ts
 * const { mutate: cancelVisit, isPending } = useCancelVisit()
 * cancelVisit(1)
 * ```
 */
export function useCancelVisit() {
  const t = useTranslations('reception')
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number) => visitRepository.cancel(id),
    onSuccess: () => {
      toast.success(t('toasts.visit_cancelled'))
      void queryClient.invalidateQueries({ queryKey: [VISITS_QUERY_KEY] })
    },
    onError: (error: Error) => {
      if ((error as { response?: { status?: number } })?.response?.status !== 422) {
        toast.error(error.message || 'Có lỗi xảy ra')
      }
    },
  })
}

/**
 * Hook để xóa lượt khám
 * Mutation: DELETE /api/v1/visits/{id}
 *
 * @example
 * ```ts
 * const { mutate: deleteVisit, isPending } = useDeleteVisit()
 * deleteVisit(1)
 * ```
 */
export function useDeleteVisit() {
  const t = useTranslations('reception')
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number) => visitRepository.delete(id),
    onSuccess: () => {
      toast.success(t('toasts.visit_deleted'))
      void queryClient.invalidateQueries({ queryKey: [VISITS_QUERY_KEY] })
    },
    onError: (error: Error) => {
      if ((error as { response?: { status?: number } })?.response?.status !== 422) {
        toast.error(error.message || 'Có lỗi xảy ra')
      }
    },
  })
}
