/**
 * Appointment Filters Component
 * @module AppointmentFilters
 */
'use client'

import { useTranslations } from 'next-intl'
import { Label } from '@/bks/ds-system-sdk/components/ui/label'
import { DatePicker } from '@/bks/ds-system-sdk/components/ui/date-picker'
import { cn } from '@/bks/ds-system-sdk/lib/utils'
import type { ListVisitFilters } from '../types'

export interface AppointmentFiltersProps {
  value: ListVisitFilters
  onChange: (filters: ListVisitFilters) => void
  hideDates?: boolean
  className?: string
}

/**
 * Component filters cho Tab 3 (Lịch hẹn)
 * Chỉ giữ lại: Từ ngày (from) và Đến ngày (to)
 */
export function AppointmentFilters({ value, onChange, hideDates = false, className }: AppointmentFiltersProps) {
  const t = useTranslations('reception')

  const handleFromDateChange = (date: Date | undefined) => {
    if (date) {
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      onChange({ ...value, from: `${year}-${month}-${day}` })
    } else {
      onChange({ ...value, from: undefined })
    }
  }

  const handleToDateChange = (date: Date | undefined) => {
    if (date) {
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      onChange({ ...value, to: `${year}-${month}-${day}` })
    } else {
      onChange({ ...value, to: undefined })
    }
  }

  const fromDate = value.from ? new Date(value.from) : undefined
  const toDate = value.to ? new Date(value.to) : undefined

  return (
    <div className={cn('flex flex-wrap gap-4 items-end', className)}>
      {!hideDates && (
        <>
          {/* From Date */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">{t('tab2.date_from_label') || 'Từ ngày'}</Label>
            <DatePicker
              value={fromDate}
              onChange={handleFromDateChange}
              placeholder={t('tab2.date_from_label') || 'Từ ngày'}
            />
          </div>

          {/* To Date */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">{t('tab2.date_to_label') || 'Đến ngày'}</Label>
            <DatePicker
              value={toDate}
              onChange={handleToDateChange}
              minDate={fromDate}
              placeholder={t('tab2.date_to_label') || 'Đến ngày'}
            />
          </div>
        </>
      )}
    </div>
  )
}
