/**
 * Cancel Appointment Dialog (S8)
 * @module CancelAppointmentDialog
 */
'use client'

import { useTranslations } from 'next-intl'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/bks/ds-system-sdk/components/ui/alert-dialog'
import { Spinner } from '@/bks/ds-system-sdk/components/ui/spinner'

export interface CancelAppointmentDialogProps {
  isOpen: boolean
  appointmentId: number | null
  onConfirm: () => void
  onClose: () => void
  isPending?: boolean
}

/**
 * Dialog xác nhận hủy lịch hẹn (S8)
 */
export function CancelAppointmentDialog({
  isOpen,
  onConfirm,
  onClose,
  isPending,
}: CancelAppointmentDialogProps) {
  const t = useTranslations('reception')

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t('tab3.cancel_confirm_title')}</AlertDialogTitle>
          <AlertDialogDescription>
            {t('tab3.cancel_confirm_message')}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onClose} disabled={isPending}>
            Hủy
          </AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm} disabled={isPending}>
            {isPending && <Spinner className="mr-2 h-4 w-4" />}
            Xác nhận
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
