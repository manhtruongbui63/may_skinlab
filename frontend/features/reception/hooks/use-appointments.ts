/**
 * Appointment Hooks - TanStack Query (for Reception Tab 3)
 * @module useAppointments
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { useTranslations } from 'next-intl'
import type { PaginatedAppointments, ListAppointmentFilters, Appointment, Visit } from '../types'
import { appointmentRepository } from '../services/appointment-repository'

// Query keys
const APPOINTMENTS_QUERY_KEY = 'appointments' as const
const VISITS_QUERY_KEY = 'visits' as const

/**
 * Hook để lấy danh sách lịch hẹn (Tab 3)
 * Query: GET /api/v1/appointments
 *
 * @example
 * ```ts
 * const { data: appointments, isLoading } = useAppointments({ status: 1, search: 'John' })
 * ```
 */
export function useAppointments(filters: ListAppointmentFilters) {
  return useQuery<PaginatedAppointments>({
    queryKey: [APPOINTMENTS_QUERY_KEY, filters],
    queryFn: () => appointmentRepository.list(filters),
    staleTime: 30000,
  })
}

/**
 * Hook để lấy chi tiết lịch hẹn (S9 - Detail Drawer)
 * Query: GET /api/v1/appointments/{id}
 *
 * @example
 * ```ts
 * const { data: appointment, isLoading } = useAppointmentDetail(1)
 * ```
 */
export function useAppointmentDetail(id: number) {
  return useQuery<Appointment>({
    queryKey: [APPOINTMENTS_QUERY_KEY, 'detail', id],
    queryFn: () => appointmentRepository.get(id),
    enabled: id > 0,
    staleTime: 60000,
  })
}

/**
 * Hook để hủy lịch hẹn (S8 - Cancel Dialog)
 * Mutation: PATCH /api/v1/appointments/{id}/cancel
 *
 * @example
 * ```ts
 * const { mutate: cancelAppointment, isPending } = useCancelAppointment()
 * cancelAppointment(1)
 * ```
 */
export function useCancelAppointment() {
  const t = useTranslations('reception')
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number) => appointmentRepository.cancel(id),
    onSuccess: () => {
      toast.success(t('toasts.appointment_cancelled'))
      void queryClient.invalidateQueries({ queryKey: [APPOINTMENTS_QUERY_KEY] })
    },
    onError: (error: Error) => {
      if ((error as { response?: { status?: number } })?.response?.status !== 422) {
        toast.error(error.message || 'Có lỗi xảy ra')
      }
    },
  })
}

/**
 * Hook để check-in lịch hẹn (tạo Visit từ Appointment)
 * Mutation: POST /api/v1/visits/from-appointment
 *
 * @example
 * ```ts
 * const { mutate: checkIn, isPending } = useCreateVisitFromAppointment()
 * checkIn({ appointment_id: 1, clinic_room_id: 1 })
 * ```
 */
export function useCreateVisitFromAppointment() {
  const t = useTranslations('reception')
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: { appointment_id: number; clinic_room_id: number; is_priority?: boolean }) =>
      appointmentRepository.checkIn(data),
    onSuccess: () => {
      toast.success(t('toasts.checkin_success'))
      // Invalidate cả appointments và visits
      void queryClient.invalidateQueries({ queryKey: [APPOINTMENTS_QUERY_KEY] })
      void queryClient.invalidateQueries({ queryKey: [VISITS_QUERY_KEY] })
    },
    onError: (error: Error) => {
      if ((error as { response?: { status?: number } })?.response?.status !== 422) {
        toast.error(error.message || 'Có lỗi xảy ra')
      }
    },
  })
}
