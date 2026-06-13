import { useTranslations } from 'next-intl'
import { useMemo } from 'react'
import { z } from 'zod'

export const BackendCustomerSchema = z.object({
  id: z.number(),
  full_name: z.string(),
  phone: z.string(),
  birth_date: z.string().nullable().optional(),
  gender: z
    .object({
      value: z.number(),
      label: z.string(),
    })
    .nullable()
    .optional(),
  address: z.string().nullable().optional(),
  source: z
    .object({
      value: z.number(),
      label: z.string(),
    })
    .nullable()
    .optional(),
  status: z.object({
    value: z.number(),
    label: z.string(),
  }),
  outstanding_amount: z.union([z.string(), z.number()]).transform((val) => Number(val)),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
})

export type BackendCustomer = z.infer<typeof BackendCustomerSchema>

export const BackendCustomerListSchema = z.array(BackendCustomerSchema)

export const BackendVisitSchema = z.object({
  id: z.number(),
  visit_date: z.string(),
  doctor_name: z.string(),
  notes: z.string().nullable().optional(),
  diagnosis: z.string().nullable().optional(),
})
export const BackendVisitListSchema = z.array(BackendVisitSchema)

export const BackendTreatmentPlanSchema = z.object({
  id: z.number(),
  plan_name: z.string(),
  status: z.string(),
  start_date: z.string(),
  end_date: z.string().nullable().optional(),
})
export const BackendTreatmentPlanListSchema = z.array(BackendTreatmentPlanSchema)

export const BackendInvoiceSchema = z.object({
  id: z.number(),
  invoice_number: z.string(),
  amount: z.union([z.string(), z.number()]).transform((val) => Number(val)),
  paid_amount: z.union([z.string(), z.number()]).transform((val) => Number(val)),
  outstanding_amount: z.union([z.string(), z.number()]).transform((val) => Number(val)),
  issue_date: z.string(),
  status: z.string(),
})
export const BackendInvoiceListSchema = z.array(BackendInvoiceSchema)

export const BackendCustomerDetailSchema = BackendCustomerSchema.extend({
  visits: BackendVisitListSchema.optional(),
  treatment_plans: BackendTreatmentPlanListSchema.optional(),
  invoices: BackendInvoiceListSchema.optional(),
})


export const customerFilterSchema = z.object({
  search: z.string().optional(),
  gender: z.number().optional(),
  source: z.number().optional(),
  status: z.number().optional(),
  page: z.number().default(1),
  perPage: z.number().default(20),
})

export const useCustomerFormSchema = () => {
  const t = useTranslations()
  return useMemo(
    () =>
      z.object({
        fullName: z
          .string()
          .min(1, t('customers.errors.fullName_required'))
          .max(255),
        phone: z
          .string()
          .min(1, t('customers.errors.phone_invalid'))
          .regex(/^\+?[0-9]{7,15}$/, t('customers.errors.phone_invalid')),
        birthDate: z
          .string()
          .regex(/^\d{4}-\d{2}-\d{2}$/, t('customers.errors.birthDate_invalid'))
          .or(z.literal(''))
          .optional(),
        gender: z.number().min(1).max(3).optional(),
        address: z.string().max(1000).optional(),
        source: z.number().min(1).max(5).optional(),
        status: z.number().min(0).max(1).optional(),
      }),
    [t]
  )
}

export type CustomerFormInput = z.infer<ReturnType<typeof useCustomerFormSchema>>
