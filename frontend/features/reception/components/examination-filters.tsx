import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { Label } from '@/bks/ds-system-sdk/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/bks/ds-system-sdk/components/ui/select'
import { DatePicker } from '@/bks/ds-system-sdk/components/ui/date-picker'
import { Button } from '@/bks/ds-system-sdk/components/ui/button'
import { cn } from '@/bks/ds-system-sdk/lib/utils'
import { toast } from 'sonner'
import type { ListVisitFilters } from '../types'

export interface ExaminationFiltersProps {
  value: ListVisitFilters
  onChange: (filters: ListVisitFilters) => void
  className?: string
}

const getTodayString = () => {
  const date = new Date()
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/**
 * Component filters cho Tab 2
 * UI-005: Auto-clamp to date về cuối tháng của from date
 */
export function ExaminationFilters({ value, onChange, className }: ExaminationFiltersProps) {
  const t = useTranslations('reception')

  // Local state for filters to apply on clicking Search button
  const [localFrom, setLocalFrom] = useState<string | undefined>(value.from)
  const [localTo, setLocalTo] = useState<string | undefined>(value.to)
  const [localStatus, setLocalStatus] = useState<number | undefined>(value.status)
  const [validationError, setValidationError] = useState<string | null>(null)

  // Sync local state when props change (e.g., reset)
  useEffect(() => {
    const timer = setTimeout(() => {
      setLocalFrom(value.from)
      setLocalTo(value.to)
      setLocalStatus(value.status)
      setValidationError(null)
    }, 0)
    return () => clearTimeout(timer)
  }, [value])

  const handleFromDateChange = (date: Date | undefined) => {
    setValidationError(null)
    if (date) {
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      const fromDate = `${year}-${month}-${day}`

      // If to date is set and in different month, clamp to end of from month
      let toDate = localTo
      if (toDate) {
        const toDateObj = new Date(toDate)
        const fromDateObj = new Date(fromDate)

        if (
          toDateObj.getFullYear() !== fromDateObj.getFullYear() ||
          toDateObj.getMonth() !== fromDateObj.getMonth()
        ) {
          // Clamp to end of from month
          const lastDay = new Date(fromDateObj.getFullYear(), fromDateObj.getMonth() + 1, 0)
          const toYear = lastDay.getFullYear()
          const toMonth = String(lastDay.getMonth() + 1).padStart(2, '0')
          const toDay = String(lastDay.getDate()).padStart(2, '0')
          toDate = `${toYear}-${toMonth}-${toDay}`
        }
      }

      setLocalFrom(fromDate)
      setLocalTo(toDate)
    } else {
      setLocalFrom(undefined)
    }
  }

  const handleToDateChange = (date: Date | undefined) => {
    setValidationError(null)
    if (date) {
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      setLocalTo(`${year}-${month}-${day}`)
    } else {
      setLocalTo(undefined)
    }
  }

  const handleStatusChange = (status: string) => {
    setLocalStatus(status ? parseInt(status, 10) : undefined)
  }

  const handleSearch = () => {
    if (localFrom && localTo) {
      const fromDateObj = new Date(localFrom)
      const toDateObj = new Date(localTo)
      if (fromDateObj > toDateObj) {
        const errorMsg = t('errors.from_date_must_be_before_to_date')
        setValidationError(errorMsg)
        toast.error(errorMsg)
        return
      }
    }
    setValidationError(null)
    onChange({
      from: localFrom,
      to: localTo,
      status: localStatus,
    })
  }

  const handleReset = () => {
    const todayStr = getTodayString()
    setLocalFrom(todayStr)
    setLocalTo(todayStr)
    setLocalStatus(undefined)
    setValidationError(null)
    onChange({
      from: todayStr,
      to: todayStr,
      status: undefined,
    })
  }

  const fromDate = localFrom ? new Date(localFrom) : undefined
  const toDate = localTo ? new Date(localTo) : undefined

  const todayStr = getTodayString()
  const isDefault =
    localFrom === todayStr &&
    localTo === todayStr &&
    localStatus === undefined

  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex flex-wrap gap-4 items-end">
        {/* From Date */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">{t('tab2.date_from_label')}</Label>
          <DatePicker
            value={fromDate}
            onValueChange={handleFromDateChange}
            placeholder={t('tab2.date_from_label')}
          />
        </div>

        {/* To Date */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">{t('tab2.date_to_label')}</Label>
          <DatePicker
            value={toDate}
            onValueChange={handleToDateChange}
            minDate={fromDate}
            placeholder={t('tab2.date_to_label')}
          />
        </div>

        {/* Status */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">{t('tab2.status_label')}</Label>
          <Select
            value={localStatus?.toString() ?? ''}
            onValueChange={handleStatusChange}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder={t('tab2.status_label')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">{t('statuses.all')}</SelectItem>
              <SelectItem value="1">{t('statuses.waiting')}</SelectItem>
              <SelectItem value="2">{t('statuses.examining')}</SelectItem>
              <SelectItem value="3">{t('statuses.completed')}</SelectItem>
              <SelectItem value="4">{t('statuses.cancelled')}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Actions Button Group */}
        <div className="flex gap-2">
          <Button onClick={handleSearch} type="button">
            {t('action.search')}
          </Button>
          <Button
            onClick={handleReset}
            variant="outline"
            type="button"
            disabled={isDefault}
          >
            {t('tab2.reset_button')}
          </Button>
        </div>
      </div>

      {/* Validation Error Message */}
      {validationError && (
        <p className="text-sm text-destructive font-medium">{validationError}</p>
      )}
    </div>
  )
}
