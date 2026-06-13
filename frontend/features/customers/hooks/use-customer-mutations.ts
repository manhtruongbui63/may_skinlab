import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { useTranslations } from 'next-intl'
import { customerRepository } from '../services/customer-repository'
import type { StoreCustomerInput, UpdateCustomerInput } from '../types'

export const useCustomerMutations = () => {
  const queryClient = useQueryClient()
  const t = useTranslations()

  const createMutation = useMutation({
    mutationFn: (data: StoreCustomerInput) => customerRepository.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] })
      toast.success(t('customers.toasts.createSuccess'))
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

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateCustomerInput }) =>
      customerRepository.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] })
      toast.success(t('customers.toasts.updateSuccess'))
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

  const deleteMutation = useMutation({
    mutationFn: (id: number) => customerRepository.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] })
      toast.success(t('customers.toasts.deleteSuccess'))
    },
    onError: (error: unknown) => {
      const err = error as { message?: string }
      toast.error(err.message || t('Api.errors.default'))
    },
  })

  return {
    createMutation,
    updateMutation,
    deleteMutation,
  }
}
