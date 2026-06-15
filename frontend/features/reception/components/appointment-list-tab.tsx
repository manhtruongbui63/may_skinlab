/**
 * Appointment List Tab Container (S4 + S8 + S9)
 * @module AppointmentListTab
 */
'use client'

import { useState, useCallback } from 'react'
import { useTranslations } from 'next-intl'
import dayjs from 'dayjs'
import { Card, CardContent } from '@/bks/ds-system-sdk/components/ui/card'
import { Spinner } from '@/bks/ds-system-sdk/components/ui/spinner'
import { Alert, AlertDescription } from '@/bks/ds-system-sdk/components/ui/alert'
import { Button } from '@/bks/ds-system-sdk/components/ui/button'
import { cn } from '@/bks/ds-system-sdk/lib/utils'
import { List, Calendar as CalendarIcon } from 'lucide-react'

import { AppointmentFilters } from './appointment-filters'
import { AppointmentTable } from './appointment-table'
import { AppointmentCalendar } from './appointment-calendar'
import { useVisits, useCancelVisit, useDeleteVisit, useReceptionFormStore } from '../hooks'
import type { ListVisitFilters, Visit, CustomerSummary } from '../types'

export interface AppointmentListTabProps {
  onCustomerSelect?: (customer: CustomerSummary | null) => void
  className?: string
}

/**
 * Container component cho Tab 3 (Lịch hẹn)
 * Triển khai hiển thị danh sách khám ở trạng thái Đặt lịch chờ khám
 */
export function AppointmentListTab({ onCustomerSelect, className }: AppointmentListTabProps) {
  const t = useTranslations('reception')
  const tAppt = useTranslations('appointments')
  const [viewMode, setViewMode] = useState<'table' | 'calendar'>('table')

  const getTodayString = () => {
    const date = new Date()
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  const [tableFilters, setTableFilters] = useState<ListVisitFilters>(() => {
    const todayStr = getTodayString()
    return {
      from: todayStr,
      to: todayStr,
    }
  })

  const [calendarRange, setCalendarRange] = useState<ListVisitFilters>({})

  // Form store for editing and double-click actions
  const store = useReceptionFormStore()

  // Query visits (which includes both Walk-in and Scheduled)
  // When in calendar view, we completely disregard the table filters' from/to values.
  const activeFilters = viewMode === 'table' ? tableFilters : calendarRange
  const { data: visitsData, isLoading, error } = useVisits(activeFilters)

  // Cancel & Delete Mutations
  const cancelMutation = useCancelVisit()
  const deleteMutation = useDeleteVisit()

  const handleCancel = (id: number) => {
    if (window.confirm(t('tab2.cancel_confirm_message'))) {
      cancelMutation.mutate(id)
    }
  }

  const handleDelete = (id: number) => {
    if (window.confirm(t('tab2.delete_confirm_message'))) {
      deleteMutation.mutate(id)
    }
  }

  const handleEdit = (visit: Visit) => {
    store.setField('mode', 'edit')
    store.setField('visitId', visit.id)
    store.setField('visitCode', visit.code)
    store.setField('customerId', visit.customer?.id || null)
    store.setField('registrationType', visit.registration_type.value)
    const formattedDateTime = visit.appointment_date
      ? dayjs(visit.appointment_date).format('YYYY-MM-DD HH:mm')
      : (visit.created_at ? dayjs(visit.created_at).format('YYYY-MM-DD HH:mm') : null)
    store.setField('appointmentDate', formattedDateTime)
    store.setField('isPriority', visit.is_priority)
    store.setField('clinicRoomId', visit.clinic_room?.id || null)
    store.setField('serviceIds', visit.services.map((s) => s.id))
    store.setField('servicePackageIds', visit.packages.map((p) => p.id))
    store.setField('reason', visit.reason || '')

    if (visit.customer) {
      onCustomerSelect?.({
        id: visit.customer.id,
        code: visit.customer.code,
        full_name: visit.customer.full_name,
        phone: visit.customer.phone || '',
        gender: visit.customer.gender || undefined,
        birth_date: ((visit.customer as Record<string, unknown>).birth_date as string) || null,
        address: ((visit.customer as Record<string, unknown>).address as string) || null,
      })
    }
  }

  const handleDateDoubleClick = (date: string) => {
    // Đặt loại đăng ký là Đặt lịch trước (value = 2)
    store.setField('registrationType', 2)
    // Thiết lập ngày hẹn tương ứng
    store.setField('appointmentDate', date)
  }

  const handleMonthRangeChange = useCallback((dateFrom: string, dateTo: string) => {
    setCalendarRange({
      from: dateFrom,
      to: dateTo,
    })
  }, [])

  // Filter scheduled visits waiting for exam (registration_type = 2, status = 1)
  const scheduledVisits = visitsData?.data.filter(
    (visit) => visit.registration_type.value === 2 && visit.status.value === 1
  ) || []

  return (
    <div className={cn('space-y-4', className)}>
      {/* View Switcher & Filters */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <AppointmentFilters
          value={tableFilters}
          onChange={setTableFilters}
          hideDates={viewMode === 'calendar'}
          className="flex-1"
        />

        <div className="flex items-center border rounded-lg p-1 bg-muted shrink-0 self-start md:self-end h-10">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setViewMode('table')}
            className={cn(
              'h-8 px-3 gap-1.5',
              viewMode === 'table' && 'bg-background shadow-sm hover:bg-background'
            )}
          >
            <List className="h-4 w-4" />
            {tAppt('view.table') || 'Bảng'}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setViewMode('calendar')}
            className={cn(
              'h-8 px-3 gap-1.5',
              viewMode === 'calendar' && 'bg-background shadow-sm hover:bg-background'
            )}
          >
            <CalendarIcon className="h-4 w-4" />
            {tAppt('view.calendar') || 'Lịch'}
          </Button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error.message}</AlertDescription>
        </Alert>
      )}

      {/* Main Content Area */}
      {isLoading ? (
        <div className="flex justify-center items-center py-12">
          <Spinner className="h-8 w-8" />
        </div>
      ) : viewMode === 'table' ? (
        scheduledVisits.length ? (
          <AppointmentTable
            visits={scheduledVisits}
            onCancel={handleCancel}
            onDelete={handleDelete}
            onEdit={handleEdit}
          />
        ) : (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              {t('tab3.empty_state')}
            </CardContent>
          </Card>
        )
      ) : (
        <AppointmentCalendar
          visits={scheduledVisits}
          onSelectAppointment={handleEdit}
          onDateDoubleClick={handleDateDoubleClick}
          onMonthRangeChange={handleMonthRangeChange}
        />
      )}
    </div>
  )
}
