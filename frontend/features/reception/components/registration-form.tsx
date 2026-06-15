/**
 * Registration Form Container (Cột 1)
 * @module RegistrationForm
 */
import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Button } from '@/bks/ds-system-sdk/components/ui/button'
import { Spinner } from '@/bks/ds-system-sdk/components/ui/spinner'
import { Card, CardContent, CardHeader, CardTitle } from '@/bks/ds-system-sdk/components/ui/card'
import { Input } from '@/bks/ds-system-sdk/components/ui/input'
import { Label } from '@/bks/ds-system-sdk/components/ui/label'
import { cn } from '@/bks/ds-system-sdk/lib/utils'
import { ConfirmDialog } from '@/shared/components/ui/confirm-dialog'

// Sub-components
import { RegistrationTypeSelect } from './registration-type-select'
import { AppointmentDatePicker } from './appointment-date-picker'
import { ClinicRoomSelect } from './clinic-room-select'
import { ServiceMultiSelect } from './service-multi-select'
import { PackageMultiSelect } from './package-multi-select'
import { PriorityToggle } from './priority-toggle'
import { ReasonTextarea } from './reason-textarea'

import { useReceptionFormStore, useReceptionMasterData, useCreateVisit, useUpdateVisit } from '../hooks'

export interface RegistrationFormProps {
  onSubmitSuccess?: () => void
  className?: string
}

/**
 * Registration Form Container
 * Orchestrates all sub-components for Cột 1
 * Uses Zustand store for state management
 */
export function RegistrationForm({ onSubmitSuccess, className }: RegistrationFormProps) {
  const t = useTranslations('reception')

  // Store access
  const store = useReceptionFormStore()

  // Master data
  const { clinicRooms, services, servicePackages, isLoading: isLoadingMasterData } =
    useReceptionMasterData()

  // Submit Mutations
  const { mutateAsync: createVisit, isPending: isCreating } = useCreateVisit()
  const { mutateAsync: updateVisit, isPending: isUpdating } = useUpdateVisit()
  const isSubmitting = isCreating || isUpdating

  // Errors state
  const [formErrors, setFormErrors] = useState<Record<string, string | undefined>>({})
  const [isConfirmOpen, setIsConfirmOpen] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormErrors({})

    if (!store.customerId) return

    // Client-side validations
    const errorsMap: Record<string, string | undefined> = {}
    if (store.registrationType === null) {
      errorsMap.registration_type = t('errors.registration_type_required')
    }
    if (store.registrationType === 1 && !store.clinicRoomId) {
      errorsMap.clinic_room_id = t('errors.room_required')
    }
    if (store.registrationType === 2 && !store.appointmentDate) {
      errorsMap.appointment_date = t('errors.date_must_be_future')
    }
    if (!store.serviceIds || store.serviceIds.length === 0) {
      errorsMap.service_ids = t('errors.service_required')
    }

    if (Object.keys(errorsMap).length > 0) {
      setFormErrors(errorsMap)
      return
    }

    setIsConfirmOpen(true)
  }

  const handleConfirmSubmit = async () => {
    setIsConfirmOpen(false)
    const now = new Date()
    const year = now.getFullYear()
    const month = String(now.getMonth() + 1).padStart(2, '0')
    const day = String(now.getDate()).padStart(2, '0')
    const hh = String(now.getHours()).padStart(2, '0')
    const mm = String(now.getMinutes()).padStart(2, '0')
    const ss = String(now.getSeconds()).padStart(2, '0')
    const nowStr = `${year}-${month}-${day} ${hh}:${mm}:${ss}`
    let apptDateToSend = null

    if (store.registrationType === 1) {
      apptDateToSend = nowStr
    } else if (store.registrationType === 2) {
      apptDateToSend = store.appointmentDate
        ? (store.appointmentDate.length === 16 ? `${store.appointmentDate}:00` : store.appointmentDate)
        : null
    }

    const inputData = {
      registration_type: store.registrationType as number,
      appointment_date: apptDateToSend,
      is_priority: store.isPriority,
      clinic_room_id: store.clinicRoomId,
      service_ids: store.serviceIds,
      service_package_ids: store.servicePackageIds,
      reason: store.reason,
      customer_id: store.customerId,
    }

    try {
      if (store.mode === 'create') {
        await createVisit(inputData)
      } else {
        if (!store.visitId) return
        await updateVisit({ id: store.visitId, data: inputData })
      }
      store.reset()
      onSubmitSuccess?.()
    } catch (error) {
      console.error('Submit error:', error)
      const err = error as { response?: { data?: { errors?: Record<string, unknown> } } }
      if (err.response?.data?.errors) {
        const backendErrors: Record<string, string> = {}
        const errorsObj = err.response.data.errors
        Object.keys(errorsObj).forEach((key) => {
          const val = errorsObj[key]
          if (Array.isArray(val) && val.length > 0) {
            backendErrors[key] = String(val[0])
          } else if (typeof val === 'string') {
            backendErrors[key] = val
          }
        })
        setFormErrors(backendErrors)
      }
    }
  }

  // Conditional rendering based on registration type
  const isScheduled = store.registrationType === 2 // SCHEDULED

  // Disable form if no customer is selected
  const isFormDisabled = !store.customerId

  return (
    <>
      <Card className={cn('w-full', className)}>
      <CardHeader>
        <CardTitle className="text-lg">
          {t('form.registration_code_label')}
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Visit Code (Always visible, readonly) */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">{t('tab2.column_visit_code')}</Label>
            <Input
              value={store.mode === 'edit' ? (store.visitCode || '') : ''}
              placeholder={store.mode === 'create' ? 'KBxxxxx' : undefined}
              readOnly
              disabled
              className="bg-muted text-muted-foreground cursor-not-allowed"
            />
          </div>

          {/* Block 1: Loại đăng ký, Ngày hẹn & Ưu tiên */}
          <div className="p-4 border rounded-lg bg-muted/20 space-y-4">
            {/* Registration Type */}
            <RegistrationTypeSelect
              value={store.registrationType}
              onChange={(v) => store.setField('registrationType', v)}
              error={formErrors.registration_type}
              disabled={isFormDisabled}
              required
            />

            {isScheduled && (
              <>
                <AppointmentDatePicker
                  value={store.appointmentDate}
                  onChange={(v) => store.setField('appointmentDate', v)}
                  error={formErrors.appointment_date}
                  disabled={isFormDisabled}
                  required
                />

                <div className="space-y-2">
                  <Label className="text-sm font-medium">{t('form.appointment_time_label')}</Label>
                  <Input
                    value={store.appointmentDate && store.appointmentDate.includes(' ') ? store.appointmentDate.split(' ')[1] : '—'}
                    readOnly
                    disabled
                    className="bg-muted text-muted-foreground cursor-not-allowed"
                  />
                </div>
              </>
            )}

            {/* Priority Toggle */}
            <PriorityToggle
              value={store.isPriority}
              onChange={(v) => store.setField('isPriority', v)}
              disabled={isFormDisabled}
            />
          </div>

          {/* Block 2: Phòng khám, Dịch vụ & Gói dịch vụ */}
          <div className="p-4 border rounded-lg bg-muted/20 space-y-4">
            {/* Clinic Room */}
            <ClinicRoomSelect
              options={clinicRooms}
              value={store.clinicRoomId}
              onChange={(v) => store.setField('clinicRoomId', v)}
              error={formErrors.clinic_room_id}
              disabled={isFormDisabled}
              required={store.registrationType === 1}
            />

            {/* Services */}
            <ServiceMultiSelect
              options={services}
              value={store.serviceIds}
              onChange={(v) => store.setField('serviceIds', v)}
              error={formErrors.service_ids}
              disabled={isFormDisabled}
              required
            />

            {/* Packages */}
            <PackageMultiSelect
              options={servicePackages}
              value={store.servicePackageIds}
              onChange={(v) => store.setField('servicePackageIds', v)}
              disabled={isFormDisabled}
            />
          </div>

          {/* Reason Textarea */}
          <ReasonTextarea
            value={store.reason}
            onChange={(v) => store.setField('reason', v)}
            error={formErrors.reason}
            disabled={isFormDisabled}
          />

          {/* Submit Button */}
          <div className="pt-4">
            <Button
              type="submit"
              className="w-full"
              disabled={isSubmitting || isLoadingMasterData || isFormDisabled}
            >
              {isSubmitting && <Spinner className="mr-2 h-4 w-4" />}
              {store.mode === 'create' ? t('form.submit_create') : t('form.submit_edit')}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>

      {/* Confirm Submit Dialog */}
      <ConfirmDialog
        open={isConfirmOpen}
        onOpenChange={setIsConfirmOpen}
        onConfirm={handleConfirmSubmit}
        title={store.mode === 'create' ? t('form.submit_create') : t('form.submit_edit')}
        description={
          store.mode === 'create'
            ? t('form.confirm_create_message')
            : t('form.confirm_edit_message')
        }
        confirmText={store.mode === 'create' ? t('form.submit_create') : t('form.submit_edit')}
        disabled={isSubmitting}
      />
    </>
  )
}
