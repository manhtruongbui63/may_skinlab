import { useTranslations, useLocale } from 'next-intl'
import { useMemo } from 'react'
import { z } from 'zod'

export const BackendCustomerSchema = z.object({
  id: z.number(),
  code: z.string(),
  full_name: z.string(),
  phone: z.string(),
  phone_secondary: z.string().nullable().optional(),
  birth_date: z.string().nullable().optional(),
  age: z.number().nullable().optional(),
  gender: z
    .object({
      value: z.number(),
      label: z.string(),
    })
    .nullable()
    .optional(),
  house_number: z.string().nullable().optional(),
  province: z
    .object({
      id: z.number(),
      name: z.string(),
    })
    .nullable()
    .optional(),
  ward: z
    .object({
      id: z.number(),
      province_id: z.number().optional(),
      name: z.string(),
    })
    .nullable()
    .optional(),
  address: z.string().nullable().optional(),
  is_address_manually_edited: z
    .union([z.boolean(), z.number()])
    .nullable()
    .optional()
    .transform((v) => Boolean(v)),
  avatar_path: z.string().nullable().optional(),
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
export type BackendVisit = z.infer<typeof BackendVisitSchema>
export const BackendVisitListSchema = z.array(BackendVisitSchema)

export const BackendTreatmentPlanSchema = z.object({
  id: z.number(),
  plan_name: z.string(),
  status: z.string(),
  start_date: z.string(),
  end_date: z.string().nullable().optional(),
})
export type BackendTreatmentPlan = z.infer<typeof BackendTreatmentPlanSchema>
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
export type BackendInvoice = z.infer<typeof BackendInvoiceSchema>
export const BackendInvoiceListSchema = z.array(BackendInvoiceSchema)

export const BackendCustomerDetailSchema = BackendCustomerSchema.extend({
  visits: BackendVisitListSchema.optional(),
  treatment_plans: BackendTreatmentPlanListSchema.optional(),
  invoices: BackendInvoiceListSchema.optional(),
})
export type BackendCustomerDetail = z.infer<typeof BackendCustomerDetailSchema>

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
  const locale = useLocale()

  return useMemo(
    () => {
      // phone validation regex based on UI language locale
      let phoneRegex = /^\+?[0-9]{7,15}$/
      const phoneMessage = t('customers.errors.phone_invalid')
      if (locale === 'vi') {
        phoneRegex = /^(0|\+84)(3|5|7|8|9)[0-9]{8}$/
      } else if (locale === 'ja') {
        phoneRegex = /^(0|\+81)[0-9]{9,10}$/
      }

      return z
        .object({
          fullName: z
            .string()
            .min(1, t('customers.errors.fullName_required'))
            .max(255),
          phone: z
            .string()
            .min(1, t('customers.errors.phone_invalid'))
            .regex(phoneRegex, phoneMessage),
          phoneSecondary: z
            .string()
            .regex(phoneRegex, phoneMessage)
            .or(z.literal(''))
            .optional(),
          birthDate: z
            .string()
            .regex(/^\d{4}-\d{2}-\d{2}$/, t('customers.errors.birthDate_invalid')),
          gender: z
            .any()
            .refine((val) => val !== undefined && val !== null && val !== '', {
              message: t('customers.errors.gender_required'),
            })
            .transform((val) => Number(val))
            .refine((val) => val >= 1 && val <= 3, {
              message: t('customers.errors.gender_required'),
            }),
          houseNumber: z.string().max(255).optional(),
          provinceId: z.number().optional().nullable(),
          wardId: z.number().optional().nullable(),
          address: z.string().max(1000).optional(),
          isAddressManuallyEdited: z.boolean().default(false),
          avatarPath: z.string().max(255).optional().nullable(),
          source: z.number().min(1).max(5).optional(),
          status: z.number().min(0).max(1),
        })
        .refine(
          (data) => {
            if (data.provinceId && !data.wardId) {
              return false
            }
            return true
          },
          {
            message: t('customers.errors.ward_required', { defaultValue: 'Phường/Xã là bắt buộc khi chọn Tỉnh/Thành.' }),
            path: ['wardId'],
          }
        )
    },
    [t, locale]
  )
}

export type CustomerFormInput = z.infer<ReturnType<typeof useCustomerFormSchema>>
