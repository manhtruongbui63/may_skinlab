/**
 * Appointment Date Picker Component
 * @module AppointmentDatePicker
 */
'use client'

import { useTranslations, useLocale } from 'next-intl'
import { DatePicker } from '@/bks/ds-system-sdk/components/ui/date-picker'
import { Label } from '@/bks/ds-system-sdk/components/ui/label'
import { cn } from '@/bks/ds-system-sdk/lib/utils'
import { vi, enUS, ja } from 'react-day-picker/locale'

const localeMap = {
  vi: vi,
  en: enUS,
  jp: ja,
}

export interface AppointmentDatePickerProps {
  value: string | null
  onChange: (value: string | null) => void
  error?: string
  disabled?: boolean
  required?: boolean
}

/**
 * Component chọn ngày hẹn
 * UI-001: Only visible when registration_type = SCHEDULED
 * minDate = tomorrow (only future dates)
 */
export function AppointmentDatePicker({ value, onChange, error, disabled, required }: AppointmentDatePickerProps) {
  const t = useTranslations('reception')
  const locale = useLocale()
  const localeObj = localeMap[locale as keyof typeof localeMap] || vi

  // Calculate tomorrow for minDate
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  tomorrow.setHours(0, 0, 0, 0)

  const handleChange = (date: Date | undefined) => {
    if (date) {
      let hours = date.getHours()
      // Nếu không chọn giờ (giờ bằng 0), mặc định sẽ lấy giờ hiện tại
      if (hours === 0) {
        hours = new Date().getHours()
      }
      
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      const hh = String(hours).padStart(2, '0')
      
      // Phút luôn là 00
      onChange(`${year}-${month}-${day} ${hh}:00`)
    } else {
      onChange(null)
    }
  }

  const selectedDate = value ? new Date(value) : undefined

  return (
    <div className={cn("space-y-2", disabled && "opacity-50 pointer-events-none")}>
      <Label className="text-sm font-medium">
        {t('form.appointment_date_label')}
        {required && <span className="text-destructive"> *</span>}
      </Label>
      <DatePicker
        value={selectedDate}
        onValueChange={handleChange}
        calendarProps={{
          disabled: (date) => date < tomorrow,
          locale: localeObj,
        }}
        showTime={true}
        timePrecision="hour"
        placeholder={t('labels.appointment_date')}
        className={cn(
          error && 'border-destructive'
        )}
        disabled={disabled}
      />
      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}
    </div>
  )
}
