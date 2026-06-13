import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { useTranslations } from 'next-intl'
import { appointmentRepository } from '../services/appointment.repository'
import type { AppointmentFilters, AppointmentFormData } from '../types'

export const useAppointments = (filters: AppointmentFilters) => {
  return useQuery({
    queryKey: ['appointments', filters],
    queryFn: () => appointmentRepository.list(filters),
  })
}

export const useCreateAppointment = () => {
  const queryClient = useQueryClient()
  const t = useTranslations()

  return useMutation({
    mutationFn: (data: AppointmentFormData) => appointmentRepository.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] })
      toast.success(t('appointments.toasts.createSuccess'))
    },
    onError: (error: unknown) => {
      const err = error as { response?: { status?: number; data?: { status_code?: number } }; message?: string }
      const isValidationError =
        err.response?.status === 422 || err.response?.data?.status_code === 422
      if (!isValidationError) {
        toast.error(err.message || t('Api.errors.default'))
      }
    },
  })
}

export const useUpdateAppointment = () => {
  const queryClient = useQueryClient()
  const t = useTranslations()

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<AppointmentFormData> & { status?: number } }) =>
      appointmentRepository.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] })
      toast.success(t('appointments.toasts.updateSuccess'))
    },
    onError: (error: unknown) => {
      const err = error as { response?: { status?: number; data?: { status_code?: number } }; message?: string }
      const isValidationError =
        err.response?.status === 422 || err.response?.data?.status_code === 422
      if (!isValidationError) {
        toast.error(err.message || t('Api.errors.default'))
      }
    },
  })
}

export const useDeleteAppointment = () => {
  const queryClient = useQueryClient()
  const t = useTranslations()

  return useMutation({
    mutationFn: (id: number) => appointmentRepository.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] })
      toast.success(t('appointments.toasts.deleteSuccess'))
    },
    onError: (error: unknown) => {
      const err = error as { message?: string }
      toast.error(err.message || t('Api.errors.default'))
    },
  })
}
