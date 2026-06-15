/**
 * Zod Schemas for Visit
 * @module VisitSchemas
 */
import { z } from 'zod'
import { useTranslations } from 'next-intl'
import { useMemo } from 'react'

// Registration Type Enum
export const RegistrationTypeEnum = {
  WALK_IN: 1,
  SCHEDULED: 2,
} as const

/**
 * Hook for Visit form validation schema
 * Sử dụng next-intl cho i18n error messages
 *
 * @returns Zod schema cho form tạo lượt khám
 *
 * @example
 * ```ts
 * const schema = useStoreVisitSchema()
 * const form = useForm({ resolver: zodResolver(schema) })
 * ```
 */
export function useStoreVisitSchema() {
  const t = useTranslations('reception')

  return useMemo(() => {
    return z
      .object({
        registration_type: z.number().refine(
          (val) => val === RegistrationTypeEnum.WALK_IN || val === RegistrationTypeEnum.SCHEDULED,
          {
            message: t('errors.registration_type_required'),
          },
        ),
        appointment_date: z.string().nullable().optional(),
        is_priority: z.boolean().default(false),
        clinic_room_id: z.number().nullable().optional(),
        service_ids: z.array(z.number()).default([]),
        service_package_ids: z.array(z.number()).default([]),
        reason: z.string().max(500, t('errors.reason_too_long')).nullable().optional(),
        customer_id: z.number().nullable().optional(),
      })
      .refine(
        (data) => {
          // WALK_IN requires clinic_room_id
          if (data.registration_type === RegistrationTypeEnum.WALK_IN) {
            return data.clinic_room_id != null
          }
          return true
        },
        {
          message: t('errors.room_required'),
          path: ['clinic_room_id'],
        },
      )
      .refine(
        (data) => {
          // WALK_IN requires at least one service
          if (data.registration_type === RegistrationTypeEnum.WALK_IN) {
            return data.service_ids.length > 0
          }
          return true
        },
        {
          message: t('errors.service_required'),
          path: ['service_ids'],
        },
      )
      .refine(
        (data) => {
          // SCHEDULED requires appointment_date in the future
          if (data.registration_type === RegistrationTypeEnum.SCHEDULED) {
            if (!data.appointment_date) return false
            const appointmentDate = new Date(data.appointment_date)
            const today = new Date()
            today.setHours(0, 0, 0, 0)
            return appointmentDate >= today
          }
          return true
        },
        {
          message: t('errors.date_must_be_future'),
          path: ['appointment_date'],
        },
      )
  }, [t])
}

export type StoreVisitFormInput = z.infer<ReturnType<typeof useStoreVisitSchema>>

/**
 * Backend Visit Response Schema (Zod guard)
 * Validate response từ API
 */
export const BackendVisitSchema = z.object({
  id: z.number(),
  code: z.string(),
  queue_number: z.number(),
  registration_type: z.object({
    value: z.number(),
    label: z.string(),
  }),
  status: z.object({
    value: z.number(),
    label: z.string(),
  }),
  is_priority: z.boolean(),
  visited_at: z.string(),
  appointment_date: z.string().nullable(),
  reason: z.string().nullable(),
  customer: z
    .object({
      id: z.number(),
      code: z.string(),
      full_name: z.string(),
      phone: z.string().optional().nullable(),
      gender: z
        .object({
          value: z.number(),
          label: z.string(),
        })
        .optional()
        .nullable(),
    })
    .nullable(),
  clinic_room: z
    .object({
      id: z.number(),
      name: z.string(),
    })
    .nullable(),
  services: z.array(
    z.object({
      id: z.number(),
      name: z.string(),
    }),
  ),
  packages: z.array(
    z.object({
      id: z.number(),
      name: z.string(),
    }),
  ),
  created_at: z.string(),
})

export type BackendVisit = z.infer<typeof BackendVisitSchema>

/**
 * Backend Paginated Visits Response Schema
 */
export const BackendPaginatedVisitsSchema = z.object({
  data: z.array(BackendVisitSchema),
  meta: z.object({
    current_page: z.number(),
    last_page: z.number(),
    per_page: z.number(),
    total: z.number(),
  }),
})

export type BackendPaginatedVisits = z.infer<typeof BackendPaginatedVisitsSchema>
