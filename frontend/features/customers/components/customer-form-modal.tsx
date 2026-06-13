'use client'

import { useTranslations } from 'next-intl'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Users } from 'lucide-react'
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
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
import { mapBackendErrors } from '@/shared/utils/map-backend-errors'
import { useCustomerFormSchema, type CustomerFormInput } from '../schemas/customer-schema'
import type { Customer } from '../types'

// ─── Create / Edit dialog ─────────────────────────────────────────────────────

type CustomerFormModalProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** When provided, the modal is in edit mode. */
  customer?: Customer | null
  isSubmitting: boolean
  onSubmit: (data: CustomerFormInput) => Promise<unknown>
}

export function CustomerFormModal({
  open,
  onOpenChange,
  customer,
  isSubmitting,
  onSubmit,
}: CustomerFormModalProps) {
  const t = useTranslations('customers')
  const isEdit = Boolean(customer)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton
        className="flex max-h-[min(90vh,48rem)] w-[min(calc(100vw-2rem),36rem)] max-w-[calc(100vw-2rem)] flex-col gap-0 overflow-hidden p-0 sm:max-w-[min(calc(100vw-2rem),36rem)]"
      >
        <DialogHeader className="gap-2 border-b border-border px-6 py-5 text-left">
          <div className="flex size-10 items-center justify-center rounded-full border border-border bg-muted">
            <Users className="size-5 text-muted-foreground" aria-hidden />
          </div>
          <DialogTitle className="pr-8 text-foreground">
            {isEdit ? t('form.editTitle') : t('form.createTitle')}
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            {isEdit ? t('form.editDescription') : t('form.createDescription')}
          </DialogDescription>
        </DialogHeader>

        {/* Mount form conditionally so it remounts on open/close — avoids stale setError state */}
        {open && (
          <CustomerForm
            defaultValues={
              customer
                ? {
                    fullName: customer.fullName,
                    phone: customer.phone,
                    birthDate: customer.birthDate ?? '',
                    gender: customer.gender?.value,
                    address: customer.address ?? '',
                    source: customer.source?.value,
                    status: customer.status.value,
                  }
                : undefined
            }
            isSubmitting={isSubmitting}
            onSubmit={onSubmit}
            onCancel={() => onOpenChange(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}

// ─── Inner form (extracted for clean remount lifecycle) ───────────────────────

type CustomerFormProps = {
  defaultValues?: Partial<CustomerFormInput>
  isSubmitting: boolean
  onSubmit: (data: CustomerFormInput) => Promise<unknown>
  onCancel: () => void
}

function CustomerForm({ defaultValues, isSubmitting, onSubmit, onCancel }: CustomerFormProps) {
  const t = useTranslations('customers')
  const schema = useCustomerFormSchema()

  const {
    register,
    handleSubmit,
    control,
    setError,
    formState: { errors },
  } = useForm<CustomerFormInput>({
    resolver: zodResolver(schema),
    defaultValues: {
      fullName: '',
      phone: '',
      birthDate: '',
      gender: undefined,
      address: '',
      source: undefined,
      status: 1,
      ...defaultValues,
    },
  })

  const submit = async (data: CustomerFormInput) => {
    try {
      await onSubmit(data)
    } catch (err: unknown) {
      const responseData = (err as { response?: { data?: Record<string, unknown> } })?.response?.data
      const rawErrors =
        (responseData?.errors as Record<string, string[]> | null) ??
        (responseData?.data as Record<string, string[]> | null)

      // Map backend snake_case fields → form camelCase
      mapBackendErrors(rawErrors, setError, {
        full_name: 'fullName',
        birth_date: 'birthDate',
      })
    }
  }

  return (
    <form
      onSubmit={handleSubmit(submit)}
      className="flex min-h-0 flex-1 flex-col overflow-hidden"
      noValidate
    >
      {/* Scrollable body */}
      <div className="custom-scrollbar min-h-0 flex-1 space-y-4 overflow-y-auto p-6">
        {/* Full Name */}
        <Field className="gap-1">
          <FieldLabel required className="text-muted-foreground" htmlFor="customer-fullName">
            {t('labels.fullName')}
          </FieldLabel>
          <FieldContent>
            <Input
              id="customer-fullName"
              {...register('fullName')}
              aria-invalid={!!errors.fullName}
              placeholder={t('labels.fullName')}
            />
            {errors.fullName && <FieldError>{errors.fullName.message}</FieldError>}
          </FieldContent>
        </Field>

        {/* Phone */}
        <Field className="gap-1">
          <FieldLabel required className="text-muted-foreground" htmlFor="customer-phone">
            {t('labels.phone')}
          </FieldLabel>
          <FieldContent>
            <Input
              id="customer-phone"
              type="tel"
              inputMode="tel"
              {...register('phone')}
              aria-invalid={!!errors.phone}
              placeholder="0987654321"
              spellCheck={false}
            />
            {errors.phone && <FieldError>{errors.phone.message}</FieldError>}
          </FieldContent>
        </Field>

        {/* Birth Date & Gender — 2-column row */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {/* Birth Date */}
          <Field className="gap-1">
            <FieldLabel className="text-muted-foreground" htmlFor="customer-birthDate">
              {t('labels.birthDate')}
            </FieldLabel>
            <FieldContent>
              <Input
                id="customer-birthDate"
                type="date"
                {...register('birthDate')}
                aria-invalid={!!errors.birthDate}
                placeholder={t('placeholders.birthDate')}
              />
              {errors.birthDate && <FieldError>{errors.birthDate.message}</FieldError>}
            </FieldContent>
          </Field>

          {/* Gender */}
          <Field className="gap-1">
            <FieldLabel className="text-muted-foreground" htmlFor="customer-gender-trigger">
              {t('labels.gender')}
            </FieldLabel>
            <FieldContent>
              <Controller
                name="gender"
                control={control}
                render={({ field }) => (
                  <Select
                    className="w-full"
                    value={field.value !== undefined ? String(field.value) : undefined}
                    onValueChange={(val) => field.onChange(val !== undefined ? Number(val) : undefined)}
                  >
                    <SelectTrigger
                      id="customer-gender-trigger"
                      className="w-full! min-w-0"
                      aria-invalid={!!errors.gender}
                    >
                      <SelectValue placeholder={t('placeholders.gender')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">{t('genders.1')}</SelectItem>
                      <SelectItem value="2">{t('genders.2')}</SelectItem>
                      <SelectItem value="3">{t('genders.3')}</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.gender && <FieldError>{errors.gender.message}</FieldError>}
            </FieldContent>
          </Field>
        </div>

        {/* Source */}
        <Field className="gap-1">
          <FieldLabel className="text-muted-foreground" htmlFor="customer-source-trigger">
            {t('labels.source')}
          </FieldLabel>
          <FieldContent>
            <Controller
              name="source"
              control={control}
              render={({ field }) => (
                <Select
                  className="w-full"
                  value={field.value !== undefined ? String(field.value) : undefined}
                  onValueChange={(val) => field.onChange(val !== undefined ? Number(val) : undefined)}
                >
                  <SelectTrigger
                    id="customer-source-trigger"
                    className="w-full! min-w-0"
                    aria-invalid={!!errors.source}
                  >
                    <SelectValue placeholder={t('placeholders.source')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">{t('sources.1')}</SelectItem>
                    <SelectItem value="2">{t('sources.2')}</SelectItem>
                    <SelectItem value="3">{t('sources.3')}</SelectItem>
                    <SelectItem value="4">{t('sources.4')}</SelectItem>
                    <SelectItem value="5">{t('sources.5')}</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
            {errors.source && <FieldError>{errors.source.message}</FieldError>}
          </FieldContent>
        </Field>

        {/* Address */}
        <Field className="gap-1">
          <FieldLabel className="text-muted-foreground" htmlFor="customer-address">
            {t('labels.address')}
          </FieldLabel>
          <FieldContent>
            <Textarea
              id="customer-address"
              {...register('address')}
              aria-invalid={!!errors.address}
              placeholder={t('placeholders.address')}
              rows={3}
              className="resize-none"
            />
            {errors.address && <FieldError>{errors.address.message}</FieldError>}
          </FieldContent>
        </Field>
      </div>

      {/* Footer — outside scroll area */}
      <DialogFooter className="m-0 -mx-0 -mb-0 shrink-0 flex-row justify-end gap-2 px-6 py-4">
        <Button
          id="customer-form-cancel"
          type="button"
          variant="outline"
          onClick={onCancel}
          className="min-w-24"
        >
          {t('form.cancel')}
        </Button>
        <Button
          id="customer-form-submit"
          type="submit"
          loading={isSubmitting}
          className="min-w-24"
        >
          {t('form.submit')}
        </Button>
      </DialogFooter>
    </form>
  )
}

// ─── Delete Confirmation Dialog ───────────────────────────────────────────────

type CustomerDeleteDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  customer: Customer | null
  isDeleting: boolean
  onConfirm: () => void
}

export function CustomerDeleteDialog({
  open,
  onOpenChange,
  customer,
  isDeleting,
  onConfirm,
}: CustomerDeleteDialogProps) {
  const t = useTranslations('customers')

  if (!customer) return null

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogTrigger asChild>
        {/* Trigger is controlled externally — nothing rendered here */}
        <span className="sr-only" />
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t('delete.title')}</AlertDialogTitle>
          <AlertDialogDescription>
            {t('delete.description')}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <Button
            id="customer-delete-cancel"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            {t('delete.cancel')}
          </Button>
          <Button
            id="customer-delete-confirm"
            variant="default"
            tone="destructive"
            loading={isDeleting}
            onClick={onConfirm}
          >
            {t('delete.confirm')}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
