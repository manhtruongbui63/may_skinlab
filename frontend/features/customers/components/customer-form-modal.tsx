'use client'

import { useTranslations } from 'next-intl'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Users, RefreshCw, Calendar as CalendarIcon } from 'lucide-react'
import { useEffect, useState } from 'react'
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
  InputUploadImage,
  Calendar,
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@bks/ds-system-sdk'
import { mapBackendErrors } from '@/shared/utils/map-backend-errors'
import { useCustomerFormSchema, type CustomerFormInput } from '../schemas/customer-schema'
import type { Customer } from '../types'
import { useProvinces, useWards } from '../hooks/use-master-data'
import { customerRepository } from '../services/customer-repository'

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
        className="flex max-h-[min(90vh,54rem)] w-[min(calc(100vw-2rem),42rem)] max-w-[calc(100vw-2rem)] flex-col gap-0 overflow-hidden p-0 sm:max-w-[min(calc(100vw-2rem),42rem)]"
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
            isEdit={isEdit}
            defaultValues={
              customer
                ? {
                    fullName: customer.fullName,
                    phone: customer.phone,
                    phoneSecondary: customer.phoneSecondary ?? '',
                    birthDate: customer.birthDate ?? '',
                    gender: customer.gender?.value,
                    houseNumber: customer.houseNumber ?? '',
                    provinceId: customer.province?.id ?? null,
                    wardId: customer.ward?.id ?? null,
                    address: customer.address ?? '',
                    isAddressManuallyEdited: customer.isAddressManuallyEdited,
                    avatarPath: customer.avatarPath ?? '',
                    source: customer.source?.value,
                    status: customer.status.value,
                  }
                : undefined
            }
            code={customer?.code}
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
  isEdit: boolean
  defaultValues?: Partial<CustomerFormInput>
  code?: string
  isSubmitting: boolean
  onSubmit: (data: CustomerFormInput) => Promise<unknown>
  onCancel: () => void
}

function CustomerForm({ isEdit, defaultValues, code, isSubmitting, onSubmit, onCancel }: CustomerFormProps) {
  const t = useTranslations('customers')
  const schema = useCustomerFormSchema()
  const [isUploading, setIsUploading] = useState(false)
  const [popoverOpen, setPopoverOpen] = useState(false)

  const {
    register,
    handleSubmit,
    control,
    setValue,
    watch,
    setError,
    formState: { errors },
  } = useForm<CustomerFormInput>({
    resolver: zodResolver(schema),
    defaultValues: {
      fullName: '',
      phone: '',
      phoneSecondary: '',
      birthDate: '',
      gender: undefined,
      houseNumber: '',
      provinceId: null,
      wardId: null,
      address: '',
      isAddressManuallyEdited: false,
      avatarPath: '',
      source: undefined,
      status: 1,
      ...defaultValues,
    },
  })

  // Real-time Age Calculation
  const watchedBirthDate = watch('birthDate')
  const calculatedAge = (() => {
    if (!watchedBirthDate) return '—'
    const birthYear = new Date(watchedBirthDate).getFullYear()
    if (isNaN(birthYear)) return '—'
    const currentYear = new Date().getFullYear()
    return String(currentYear - birthYear)
  })()

  // Dynamic Provinces & Wards from Master Data
  const watchedProvinceId = watch('provinceId')
  const watchedWardId = watch('wardId')
  const watchedHouseNumber = watch('houseNumber')
  const watchedIsAddressManuallyEdited = watch('isAddressManuallyEdited')

  const { data: provinces = [], isLoading: isProvincesLoading } = useProvinces()
  const { data: wards = [], isLoading: isWardsLoading } = useWards(watchedProvinceId || undefined)

  // Address Auto Generation logic
  useEffect(() => {
    if (watchedIsAddressManuallyEdited) return

    const parts: string[] = []
    if (watchedHouseNumber) {
      parts.push(watchedHouseNumber)
    }

    if (watchedProvinceId && provinces.length > 0) {
      if (watchedWardId && wards.length > 0) {
        const wd = wards.find((w) => w.id === watchedWardId)
        if (wd) {
          parts.push(wd.name)
        }
      }
      const prov = provinces.find((p) => p.id === watchedProvinceId)
      if (prov) {
        parts.push(prov.name)
      }
    }

    const assembledAddress = parts.join(', ')
    setValue('address', assembledAddress)
  }, [watchedHouseNumber, watchedProvinceId, watchedWardId, watchedIsAddressManuallyEdited, provinces, wards, setValue])

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
        phone_secondary: 'phoneSecondary',
        birth_date: 'birthDate',
        house_number: 'houseNumber',
        province_id: 'provinceId',
        ward_id: 'wardId',
        is_address_manually_edited: 'isAddressManuallyEdited',
        avatar_path: 'avatarPath',
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
        {/* Avatar and Code Row */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 items-center border-b border-border pb-4">
          <div className="sm:col-span-1 flex flex-col items-center">
            <Field className="gap-1 items-center">
              <FieldLabel className="text-muted-foreground text-xs">{t('labels.avatar')}</FieldLabel>
              <FieldContent className="flex flex-col items-center">
                <Controller
                  name="avatarPath"
                  control={control}
                  render={({ field }) => {
                    const getFileName = (url: string) => {
                      if (!url) return ''
                      return url.substring(url.lastIndexOf('/') + 1)
                    };
                    return (
                      <>
                        <InputUploadImage
                          value={field.value}
                          disabled={isUploading || isSubmitting}
                          size="sm"
                          className="size-24 rounded-full! [&_button:not([tone=destructive])]:hidden [&_[data-slot=input-upload-image-placeholder]]:hidden"
                          placeholder={t('labels.avatar')}
                          removeLabel={t('delete.confirm')}
                          description={null}
                          onValueChange={async (change) => {
                            if (change.file) {
                              try {
                                setIsUploading(true)
                                const uploadRes = await customerRepository.uploadAvatar(change.file)
                                field.onChange(uploadRes.url)
                              } catch {
                                // Handled by API error boundaries
                              } finally {
                                setIsUploading(false)
                              }
                            } else {
                              field.onChange('')
                            }
                          }}
                        />
                        {field.value && (
                          <span className="text-xs font-semibold text-foreground mt-1.5 truncate max-w-[10rem] block text-center" title={getFileName(field.value)}>
                            {getFileName(field.value)}
                          </span>
                        )}
                      </>
                    )
                  }}
                />
                <span className="text-xs text-muted-foreground mt-2 text-center max-w-[12rem]">
                  {t('labels.avatarDescription')}
                </span>
              </FieldContent>
            </Field>
          </div>

          <div className="sm:col-span-2 space-y-4">
            {/* Code */}
            <Field className="gap-1">
              <FieldLabel className="text-muted-foreground" htmlFor="customer-code">
                {t('labels.code')}
              </FieldLabel>
              <FieldContent>
                <Input
                  id="customer-code"
                  value={code || ''}
                  disabled
                  placeholder={t('placeholders.code')}
                  className="bg-muted text-muted-foreground"
                />
              </FieldContent>
            </Field>
          </div>
        </div>

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

        {/* Phone & Secondary Phone */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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

          {/* Secondary Phone */}
          <Field className="gap-1">
            <FieldLabel className="text-muted-foreground" htmlFor="customer-phoneSecondary">
              {t('labels.phoneSecondary')}
            </FieldLabel>
            <FieldContent>
              <Input
                id="customer-phoneSecondary"
                type="tel"
                inputMode="tel"
                {...register('phoneSecondary')}
                aria-invalid={!!errors.phoneSecondary}
                placeholder={t('placeholders.phoneSecondary')}
                spellCheck={false}
              />
              {errors.phoneSecondary && <FieldError>{errors.phoneSecondary.message}</FieldError>}
            </FieldContent>
          </Field>
        </div>

        {/* Birth Date & Gender */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {/* Birth Date */}
          <div className="sm:col-span-2">
            <Field className="gap-1">
              <FieldLabel required className="text-muted-foreground" htmlFor="customer-birthDate">
                {t('labels.birthDate')}
              </FieldLabel>
              <FieldContent>
                <div className="flex gap-2 items-center">
                  <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
                    <div className="flex-1 relative flex items-center">
                      <Input
                        id="customer-birthDate"
                        type="text"
                        {...register('birthDate')}
                        aria-invalid={!!errors.birthDate}
                        placeholder={t('placeholders.birthDate')}
                        className="pr-10"
                      />
                      <PopoverTrigger asChild>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute right-0 top-0 h-10 w-10 px-0 hover:bg-transparent"
                          aria-label={t('labels.birthDate')}
                        >
                          <CalendarIcon className="size-4 text-muted-foreground hover:text-foreground" />
                        </Button>
                      </PopoverTrigger>
                    </div>
                    <PopoverContent align="end" className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={watchedBirthDate ? new Date(watchedBirthDate) : undefined}
                        captionLayout="dropdown"
                        startMonth={new Date(1900, 0)}
                        endMonth={new Date()}
                        fixedWeeks
                        onSelect={(date) => {
                          if (date) {
                            const formatted = date.toLocaleDateString('en-CA') // outputs YYYY-MM-DD
                            setValue('birthDate', formatted, { shouldValidate: true })
                          } else {
                            setValue('birthDate', '')
                          }
                          setPopoverOpen(false)
                        }}
                      />
                    </PopoverContent>
                  </Popover>
                  <div className="flex h-10 items-center justify-center rounded-lg border border-input bg-muted px-3 text-sm text-muted-foreground whitespace-nowrap min-w-24">
                    {t('labels.age')}: {calculatedAge}
                  </div>
                </div>
                {errors.birthDate && <FieldError>{errors.birthDate.message}</FieldError>}
              </FieldContent>
            </Field>
          </div>

          {/* Gender */}
          <Field className="gap-1">
            <FieldLabel required className="text-muted-foreground" htmlFor="customer-gender-trigger">
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

        {/* Source & Status */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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

          {/* Status */}
          <Field className="gap-1">
            <FieldLabel required className="text-muted-foreground" htmlFor="customer-status-trigger">
              {t('labels.status')}
            </FieldLabel>
            <FieldContent>
              <Controller
                name="status"
                control={control}
                render={({ field }) => (
                  <Select
                    className="w-full"
                    value={field.value !== undefined ? String(field.value) : '1'}
                    onValueChange={(val) => field.onChange(val !== undefined ? Number(val) : 1)}
                    disabled={!isEdit}
                  >
                    <SelectTrigger
                      id="customer-status-trigger"
                      className="w-full! min-w-0"
                      aria-invalid={!!errors.status}
                    >
                      <SelectValue placeholder={t('placeholders.status')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">{t('statuses.1')}</SelectItem>
                      <SelectItem value="0">{t('statuses.0')}</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.status && <FieldError>{errors.status.message}</FieldError>}
            </FieldContent>
          </Field>
        </div>

        {/* Detailed Address - 3 columns for house_number, province, ward */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 border-t border-border pt-4">
          {/* House Number */}
          <Field className="gap-1">
            <FieldLabel className="text-muted-foreground" htmlFor="customer-houseNumber">
              {t('labels.houseNumber')}
            </FieldLabel>
            <FieldContent>
              <Input
                id="customer-houseNumber"
                {...register('houseNumber')}
                placeholder={t('placeholders.houseNumber')}
              />
            </FieldContent>
          </Field>

          {/* Province */}
          <Field className="gap-1">
            <FieldLabel className="text-muted-foreground" htmlFor="customer-provinceId-trigger">
              {t('labels.province')}
            </FieldLabel>
            <FieldContent>
              <Controller
                name="provinceId"
                control={control}
                render={({ field }) => (
                  <Select
                    className="w-full"
                    value={field.value ? String(field.value) : undefined}
                    onValueChange={(val) => {
                      field.onChange(val ? Number(val) : null)
                      setValue('wardId', null) // clear ward selection
                    }}
                    disabled={isProvincesLoading}
                  >
                    <SelectTrigger id="customer-provinceId-trigger" className="w-full! min-w-0">
                      <SelectValue
                        placeholder={isProvincesLoading ? t('Common.loading') : t('placeholders.province')}
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {provinces.length === 0 ? (
                        <SelectItem value="none" disabled>
                          {t('placeholders.noProvince')}
                        </SelectItem>
                      ) : (
                        provinces.map((p) => (
                          <SelectItem key={p.id} value={String(p.id)}>
                            {p.name}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                )}
              />
            </FieldContent>
          </Field>

          {/* Ward */}
          <Field className="gap-1">
            <FieldLabel className="text-muted-foreground" htmlFor="customer-wardId-trigger">
              {t('labels.ward')}
            </FieldLabel>
            <FieldContent>
              <Controller
                name="wardId"
                control={control}
                render={({ field }) => (
                  <Select
                    className="w-full"
                    value={field.value ? String(field.value) : undefined}
                    onValueChange={(val) => field.onChange(val ? Number(val) : null)}
                    disabled={!watchedProvinceId || isWardsLoading}
                  >
                    <SelectTrigger id="customer-wardId-trigger" className="w-full! min-w-0" aria-invalid={!!errors.wardId}>
                      <SelectValue
                        placeholder={
                          !watchedProvinceId
                            ? t('placeholders.wardDisabled')
                            : isWardsLoading
                              ? t('Common.loading')
                              : t('placeholders.ward')
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {wards.length === 0 ? (
                        <SelectItem value="none" disabled>
                          {t('placeholders.noWard')}
                        </SelectItem>
                      ) : (
                        wards.map((w) => (
                          <SelectItem key={w.id} value={String(w.id)}>
                            {w.name}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.wardId && <FieldError>{errors.wardId.message}</FieldError>}
            </FieldContent>
          </Field>
        </div>

        {/* Assembled Full Address */}
        <Field className="gap-1">
          <div className="flex justify-between items-center">
            <FieldLabel className="text-muted-foreground" htmlFor="customer-address">
              {t('labels.address')}
            </FieldLabel>
            {watchedIsAddressManuallyEdited && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-7 text-xs px-2"
                onClick={() => setValue('isAddressManuallyEdited', false)}
              >
                <RefreshCw className="mr-1.5 size-3" />
                {t('placeholders.addressAutoBtn')}
              </Button>
            )}
          </div>
          <FieldContent>
            <Textarea
              id="customer-address"
              {...register('address', {
                onChange: () => {
                  setValue('isAddressManuallyEdited', true)
                },
              })}
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
      <DialogFooter className="m-0 -mx-0 -mb-0 shrink-0 flex-row justify-end gap-2 px-6 py-4 border-t border-border">
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
          loading={isSubmitting || isUploading}
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
