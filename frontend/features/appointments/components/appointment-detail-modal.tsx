'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Info, Pencil, Trash2, Check, X, ShieldAlert, ArrowLeft } from 'lucide-react'
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Field,
  FieldContent,
  FieldError,
  FieldLabel,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Textarea,
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  Badge,
} from '@bks/ds-system-sdk'
import type { Appointment, AppointmentFormData } from '../types'
import { useAppointmentFormSchema, type AppointmentFormInput } from '../schemas/appointment-form.schema'
import { mapBackendErrors } from '@/shared/utils/map-backend-errors'

type AppointmentDetailModalProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  appointment: Appointment | null
  isSubmitting: boolean
  isDeleting: boolean
  onUpdate: (id: number, data: Partial<AppointmentFormData> & { status?: number }) => Promise<unknown>
  onDelete: (id: number) => Promise<unknown>
  onStartVisit?: (appointment: Appointment) => void
}

export function AppointmentDetailModal({
  open,
  onOpenChange,
  appointment,
  isSubmitting,
  isDeleting,
  onUpdate,
  onDelete,
  onStartVisit,
}: AppointmentDetailModalProps) {
  const t = useTranslations('appointments')
  const tAction = useTranslations('action')
  const [isEditing, setIsEditing] = useState(false)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)

  if (!appointment) return null

  const isFinalState = [4, 5, 6].includes(appointment.status.value) // COMPLETED, CANCELLED, NO_SHOW

  const getBadgeVariant = (statusValue: number) => {
    switch (statusValue) {
      case 1:
        return 'secondary'
      case 2:
        return 'info'
      case 3:
        return 'warning'
      case 4:
        return 'success'
      case 5:
        return 'destructive'
      case 6:
        return 'default'
      default:
        return 'outline'
    }
  }

  const handleStatusTransition = async (newStatus: number) => {
    try {
      await onUpdate(appointment.id, { status: newStatus })
    } catch {
      // Handled by mutation error policy
    }
  }

  const handleDeleteConfirm = async () => {
    try {
      await onDelete(appointment.id)
      setDeleteConfirmOpen(false)
      onOpenChange(false)
    } catch {
      // Handled by mutation error policy
    }
  }

  return (
    <>
      <Dialog open={open} onOpenChange={(val) => {
        onOpenChange(val)
        if (!val) setIsEditing(false)
      }}>
        <DialogContent
          showCloseButton
          className="flex max-h-[min(90vh,48rem)] w-[min(calc(100vw-2rem),36rem)] max-w-[calc(100vw-2rem)] flex-col gap-0 overflow-hidden p-0 sm:max-w-[min(calc(100vw-2rem),36rem)]"
        >
          <DialogHeader className="gap-2 border-b border-border px-6 py-5 text-left">
            <div className="flex size-10 items-center justify-center rounded-full border border-border bg-muted">
              <Info className="size-5 text-muted-foreground" aria-hidden />
            </div>
            <div className="flex items-center justify-between gap-4 flex-wrap w-full pr-8">
              <div>
                <DialogTitle className="text-foreground">
                  {isEditing ? t('detail.editTitle') : t('detail.title')}
                </DialogTitle>
                <DialogDescription className="text-muted-foreground">
                  {appointment.customer?.full_name} - {appointment.customer?.phone}
                </DialogDescription>
              </div>
              {!isEditing && (
                <Badge variant={getBadgeVariant(appointment.status.value)}>
                  {appointment.status.label}
                </Badge>
              )}
            </div>
          </DialogHeader>

          {/* Conditional form vs details */}
          {open && (
            isEditing ? (
              <AppointmentEditForm
                appointment={appointment}
                isSubmitting={isSubmitting}
                onSubmit={async (data) => {
                  await onUpdate(appointment.id, data)
                  setIsEditing(false)
                }}
                onCancel={() => setIsEditing(false)}
              />
            ) : (
              <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
                <div className="custom-scrollbar min-h-0 flex-1 space-y-6 overflow-y-auto p-6">
                  {/* Appointment Details Grid */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-xs text-muted-foreground font-semibold block uppercase tracking-wider">
                        {t('labels.date')}
                      </span>
                      <span className="text-sm font-medium text-foreground">
                        {appointment.appointment_date}
                      </span>
                    </div>
                    <div>
                      <span className="text-xs text-muted-foreground font-semibold block uppercase tracking-wider">
                        {t('labels.time')}
                      </span>
                      <span className="text-sm font-medium text-foreground">
                        {appointment.appointment_time}
                      </span>
                    </div>
                  </div>

                  {/* Note */}
                  <div>
                    <span className="text-xs text-muted-foreground font-semibold block uppercase tracking-wider">
                      {t('labels.note')}
                    </span>
                    <p className="text-sm text-foreground bg-muted p-3 rounded-lg border border-border mt-1 min-h-16 whitespace-pre-wrap">
                      {appointment.note || t('detail.noNote')}
                    </p>
                  </div>

                  {/* Transition Actions */}
                  {!isFinalState && (
                    <div className="border-t border-border pt-4">
                      <span className="text-xs text-muted-foreground font-semibold block uppercase tracking-wider mb-3">
                        {t('detail.transitions')}
                      </span>
                      <div className="flex flex-wrap gap-2">
                        {appointment.status.value === 1 && ( // BOOKED
                          <>
                            <Button
                              id="btn-confirm"
                              size="sm"
                              onClick={() => handleStatusTransition(2)}
                            >
                              <Check className="mr-1.5 size-4" />
                              {t('actions.confirm')}
                            </Button>
                            <Button
                              id="btn-cancel"
                              variant="destructive"
                              size="sm"
                              onClick={() => handleStatusTransition(5)}
                            >
                              <X className="mr-1.5 size-4" />
                              {t('actions.cancel')}
                            </Button>
                          </>
                        )}
                        {appointment.status.value === 2 && ( // CONFIRMED
                          <>
                            <Button
                              id="btn-checkin"
                              size="sm"
                              onClick={() => handleStatusTransition(3)}
                            >
                              <Check className="mr-1.5 size-4" />
                              {t('actions.checkin')}
                            </Button>
                            <Button
                              id="btn-noshow"
                              variant="outline"
                              size="sm"
                              onClick={() => handleStatusTransition(6)}
                            >
                              {t('actions.noshow')}
                            </Button>
                            <Button
                              id="btn-cancel"
                              variant="destructive"
                              size="sm"
                              onClick={() => handleStatusTransition(5)}
                            >
                              <X className="mr-1.5 size-4" />
                              {t('actions.cancel')}
                            </Button>
                          </>
                        )}
                        {appointment.status.value === 3 && ( // CHECKED_IN
                          <>
                            {onStartVisit && (
                              <Button
                                id="btn-start-visit"
                                size="sm"
                                onClick={() => onStartVisit(appointment)}
                              >
                                {t('actions.startVisit')}
                              </Button>
                            )}
                            <Button
                              id="btn-cancel"
                              variant="destructive"
                              size="sm"
                              onClick={() => handleStatusTransition(5)}
                            >
                              <X className="mr-1.5 size-4" />
                              {t('actions.cancel')}
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Footer with Edit / Delete / Close buttons */}
                <DialogFooter className="m-0 -mx-0 -mb-0 shrink-0 flex-row justify-between gap-2 px-6 py-4 border-t border-border bg-muted/30">
                  <div>
                    {!isFinalState && (
                      <Button
                        id="appointment-delete-trigger"
                        variant="destructive"
                        size="icon"
                        onClick={() => setDeleteConfirmOpen(true)}
                        aria-label={t('actions.delete')}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      id="appointment-detail-close"
                      variant="outline"
                      onClick={() => onOpenChange(false)}
                      className="min-w-24"
                    >
                      {tAction('close')}
                    </Button>
                    {!isFinalState && (
                      <Button
                        id="appointment-detail-edit"
                        onClick={() => setIsEditing(true)}
                        className="min-w-24"
                      >
                        <Pencil className="mr-1.5 size-4" />
                        {t('actions.edit')}
                      </Button>
                    )}
                  </div>
                </DialogFooter>
              </div>
            )
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirm Alert Dialog */}
      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <ShieldAlert className="size-5 text-destructive" />
              {t('delete.title')}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t('delete.description')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <Button
              id="appointment-delete-cancel"
              variant="outline"
              onClick={() => setDeleteConfirmOpen(false)}
            >
              {t('delete.cancel')}
            </Button>
            <Button
              id="appointment-delete-confirm"
              variant="default"
              tone="destructive"
              loading={isDeleting}
              onClick={handleDeleteConfirm}
            >
              {t('delete.confirm')}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

type AppointmentEditFormProps = {
  appointment: Appointment
  isSubmitting: boolean
  onSubmit: (data: AppointmentFormInput) => Promise<unknown>
  onCancel: () => void
}

function AppointmentEditForm({
  appointment,
  isSubmitting,
  onSubmit,
  onCancel,
}: AppointmentEditFormProps) {
  const t = useTranslations('appointments')
  const tAction = useTranslations('action')
  const schema = useAppointmentFormSchema()

  const {
    register,
    handleSubmit,
    control,
    setError,
    formState: { errors },
  } = useForm<AppointmentFormInput>({
    resolver: zodResolver(schema),
    defaultValues: {
      customer_id: appointment.customer_id,
      appointment_date: appointment.appointment_date,
      appointment_time: appointment.appointment_time,
      note: appointment.note || '',
    },
  })

  // Generate 30-minute slots from 08:00 to 20:00
  const timeSlots = []
  for (let hour = 8; hour <= 20; hour++) {
    const hh = String(hour).padStart(2, '0')
    timeSlots.push(`${hh}:00`)
    if (hour < 20) {
      timeSlots.push(`${hh}:30`)
    }
  }

  const submit = async (data: AppointmentFormInput) => {
    try {
      await onSubmit(data)
    } catch (err: unknown) {
      const responseData = (err as { response?: { data?: Record<string, unknown> } })?.response?.data
      const rawErrors =
        (responseData?.errors as Record<string, string[]> | null) ??
        (responseData?.data as Record<string, string[]> | null)

      mapBackendErrors(rawErrors, setError, {
        customer_id: 'customer_id',
        appointment_date: 'appointment_date',
        appointment_time: 'appointment_time',
      })
    }
  }

  return (
    <form
      onSubmit={handleSubmit(submit)}
      className="flex min-h-0 flex-1 flex-col overflow-hidden"
      noValidate
    >
      <div className="custom-scrollbar min-h-0 flex-1 space-y-4 overflow-y-auto p-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {/* Date Picker */}
          <Field className="gap-1">
            <FieldLabel required className="text-muted-foreground" htmlFor="edit-appointment-date">
              {t('labels.date')}
            </FieldLabel>
            <FieldContent>
              <Input
                id="edit-appointment-date"
                type="date"
                {...register('appointment_date')}
                aria-invalid={!!errors.appointment_date}
                placeholder={t('placeholders.date')}
              />
              {errors.appointment_date && <FieldError>{errors.appointment_date.message}</FieldError>}
            </FieldContent>
          </Field>

          {/* Time Picker */}
          <Field className="gap-1">
            <FieldLabel required className="text-muted-foreground" htmlFor="edit-appointment-time-trigger">
              {t('labels.time')}
            </FieldLabel>
            <FieldContent>
              <Controller
                name="appointment_time"
                control={control}
                render={({ field }) => (
                  <Select
                    className="w-full"
                    value={field.value || undefined}
                    onValueChange={(val) => field.onChange(val || undefined)}
                  >
                    <SelectTrigger
                      id="edit-appointment-time-trigger"
                      className="w-full! min-w-0"
                      aria-invalid={!!errors.appointment_time}
                    >
                      <SelectValue placeholder={t('placeholders.time')} />
                    </SelectTrigger>
                    <SelectContent>
                      {timeSlots.map((slot) => (
                        <SelectItem key={slot} value={slot}>
                          {slot}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.appointment_time && <FieldError>{errors.appointment_time.message}</FieldError>}
            </FieldContent>
          </Field>
        </div>

        {/* Note */}
        <Field className="gap-1">
          <FieldLabel className="text-muted-foreground" htmlFor="edit-appointment-note">
            {t('labels.note')}
          </FieldLabel>
          <FieldContent>
            <Textarea
              id="edit-appointment-note"
              {...register('note')}
              aria-invalid={!!errors.note}
              placeholder={t('placeholders.note')}
              rows={3}
              className="resize-none"
            />
            {errors.note && <FieldError>{errors.note.message}</FieldError>}
          </FieldContent>
        </Field>
      </div>

      <DialogFooter className="m-0 -mx-0 -mb-0 shrink-0 flex-row justify-between gap-2 px-6 py-4 border-t border-border bg-muted/30">
        <Button
          id="appointment-edit-back"
          type="button"
          variant="outline"
          onClick={onCancel}
        >
          <ArrowLeft className="mr-1.5 size-4" />
          {t('actions.backToDetail')}
        </Button>
        <div className="flex gap-2">
          <Button
            id="appointment-edit-cancel"
            type="button"
            variant="outline"
            onClick={onCancel}
            className="min-w-24"
          >
            {tAction('cancel')}
          </Button>
          <Button
            id="appointment-edit-submit"
            type="submit"
            loading={isSubmitting}
            className="min-w-24"
          >
            {tAction('save')}
          </Button>
        </div>
      </DialogFooter>
    </form>
  )
}
