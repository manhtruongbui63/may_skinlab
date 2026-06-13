'use client'

import { useTranslations } from 'next-intl'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Calendar } from 'lucide-react'
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
} from '@bks/ds-system-sdk'
import { useCustomers } from '@/features/customers'
import { mapBackendErrors } from '@/shared/utils/map-backend-errors'
import { useAppointmentFormSchema, type AppointmentFormInput } from '../schemas/appointment-form.schema'

type AppointmentCreateModalProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  isSubmitting: boolean
  onSubmit: (data: AppointmentFormInput) => Promise<unknown>
  defaultDate?: string
}

export function AppointmentCreateModal({
  open,
  onOpenChange,
  isSubmitting,
  onSubmit,
  defaultDate,
}: AppointmentCreateModalProps) {
  const t = useTranslations('appointments')

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton
        className="flex max-h-[min(90vh,48rem)] w-[min(calc(100vw-2rem),36rem)] max-w-[calc(100vw-2rem)] flex-col gap-0 overflow-hidden p-0 sm:max-w-[min(calc(100vw-2rem),36rem)]"
      >
        <DialogHeader className="gap-2 border-b border-border px-6 py-5 text-left">
          <div className="flex size-10 items-center justify-center rounded-full border border-border bg-muted">
            <Calendar className="size-5 text-muted-foreground" aria-hidden />
          </div>
          <DialogTitle className="pr-8 text-foreground">
            {t('form.createTitle')}
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            {t('form.createDescription')}
          </DialogDescription>
        </DialogHeader>

        {open && (
          <AppointmentCreateForm
            defaultDate={defaultDate}
            isSubmitting={isSubmitting}
            onSubmit={onSubmit}
            onCancel={() => onOpenChange(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}

type AppointmentCreateFormProps = {
  defaultDate?: string
  isSubmitting: boolean
  onSubmit: (data: AppointmentFormInput) => Promise<unknown>
  onCancel: () => void
}

function AppointmentCreateForm({
  defaultDate,
  isSubmitting,
  onSubmit,
  onCancel,
}: AppointmentCreateFormProps) {
  const t = useTranslations('appointments')
  const schema = useAppointmentFormSchema()

  // Fetch active customers
  const { data: customersData, isLoading: isLoadingCustomers } = useCustomers({
    status: 1, // Active only
    page: 1,
    perPage: 100,
  })

  const customers = customersData?.data ?? []

  const {
    register,
    handleSubmit,
    control,
    setError,
    formState: { errors },
  } = useForm<AppointmentFormInput>({
    resolver: zodResolver(schema),
    defaultValues: {
      customer_id: undefined,
      appointment_date: defaultDate || '',
      appointment_time: '',
      note: '',
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
        {/* Customer Select */}
        <Field className="gap-1">
          <FieldLabel required className="text-muted-foreground" htmlFor="appointment-customer-trigger">
            {t('labels.customer')}
          </FieldLabel>
          <FieldContent>
            <Controller
              name="customer_id"
              control={control}
              render={({ field }) => (
                <Select
                  className="w-full"
                  value={field.value !== undefined ? String(field.value) : undefined}
                  onValueChange={(val) => field.onChange(val !== undefined ? Number(val) : undefined)}
                  disabled={isLoadingCustomers}
                >
                  <SelectTrigger
                    id="appointment-customer-trigger"
                    className="w-full! min-w-0"
                    aria-invalid={!!errors.customer_id}
                  >
                    <SelectValue placeholder={isLoadingCustomers ? t('form.loadingCustomers') : t('placeholders.customer')} />
                  </SelectTrigger>
                  <SelectContent>
                    {customers.map((c) => (
                      <SelectItem key={c.id} value={String(c.id)}>
                        {c.fullName} - {c.phone}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.customer_id && <FieldError>{errors.customer_id.message}</FieldError>}
          </FieldContent>
        </Field>

        {/* Date and Time */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {/* Date Picker */}
          <Field className="gap-1">
            <FieldLabel required className="text-muted-foreground" htmlFor="appointment-date">
              {t('labels.date')}
            </FieldLabel>
            <FieldContent>
              <Input
                id="appointment-date"
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
            <FieldLabel required className="text-muted-foreground" htmlFor="appointment-time-trigger">
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
                      id="appointment-time-trigger"
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
          <FieldLabel className="text-muted-foreground" htmlFor="appointment-note">
            {t('labels.note')}
          </FieldLabel>
          <FieldContent>
            <Textarea
              id="appointment-note"
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

      <DialogFooter className="m-0 -mx-0 -mb-0 shrink-0 flex-row justify-end gap-2 px-6 py-4">
        <Button
          id="appointment-create-cancel"
          type="button"
          variant="outline"
          onClick={onCancel}
          className="min-w-24"
        >
          {useTranslations('action')('cancel')}
        </Button>
        <Button
          id="appointment-create-submit"
          type="submit"
          loading={isSubmitting}
          className="min-w-24"
        >
          {useTranslations('action')('save')}
        </Button>
      </DialogFooter>
    </form>
  )
}
