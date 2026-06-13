import { useTranslations } from 'next-intl'
import { useMemo } from 'react'
import { z } from 'zod'

// ─── Backend Response Schema ──────────────────────────────────────────────
export const BackendAppointmentSchema = z.object({
  id: z.number(),
  customer_id: z.number().nullable().optional(),
  customer: z
    .object({
      id: z.number(),
      full_name: z.string(),
      phone: z.string(),
    })
    .nullable()
    .optional(),
  appointment_at: z.string(),
  appointment_date: z.string(),
  appointment_time: z.string(),
  status: z.object({
    value: z.number(),
    label: z.string(),
  }),
  note: z.string().nullable().optional(),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
})

export type BackendAppointment = z.infer<typeof BackendAppointmentSchema>
export const BackendAppointmentListSchema = z.array(BackendAppointmentSchema)

// ─── Client Form Schema ───────────────────────────────────────────────────
export const useAppointmentFormSchema = () => {
  const t = useTranslations()
  return useMemo(
    () =>
      z.object({
        customer_id: z
          .number({
            required_error: t('appointments.errors.customerId_required'),
            invalid_type_error: t('appointments.errors.customerId_required'),
          })
          .min(1, t('appointments.errors.customerId_required')),
        appointment_date: z
          .string()
          .min(1, t('appointments.errors.appointmentDate_required'))
          .regex(/^\d{4}-\d{2}-\d{2}$/, t('appointments.errors.appointmentDate_invalid')),
        appointment_time: z
          .string()
          .min(1, t('appointments.errors.appointmentTime_required'))
          .regex(/^\d{2}:(00|30)$/, t('appointments.errors.appointmentTime_invalid')),
        note: z
          .string()
          .max(500, t('appointments.errors.note_maxLength'))
          .optional()
          .or(z.literal('')),
      }),
    [t]
  )
}

export type AppointmentFormInput = z.infer<ReturnType<typeof useAppointmentFormSchema>>
