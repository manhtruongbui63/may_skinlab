/**
 * Examination List Tab Container
 * @module ExaminationListTab
 */
'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import dayjs from 'dayjs'
import { Card, CardContent } from '@/bks/ds-system-sdk/components/ui/card'
import { Spinner } from '@/bks/ds-system-sdk/components/ui/spinner'
import { Alert, AlertDescription } from '@/bks/ds-system-sdk/components/ui/alert'
import { cn } from '@/bks/ds-system-sdk/lib/utils'

import { ExaminationFilters } from './examination-filters'
import { ExaminationTable } from './examination-table'
import { useVisits, useCancelVisit, useDeleteVisit, useReceptionFormStore } from '../hooks'
import type { ListVisitFilters, Visit } from '../types'

export interface ExaminationListTabProps {
  onCustomerSelect?: (customer: CustomerSummary | null) => void
  className?: string
}

export function ExaminationListTab({ onCustomerSelect, className }: ExaminationListTabProps) {
  const t = useTranslations('reception')
  const getTodayString = () => {
    const date = new Date()
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  const [filters, setFilters] = useState<ListVisitFilters>(() => {
    const todayStr = getTodayString()
    return {
      from: todayStr,
      to: todayStr,
    }
  })

  // Query visits
  const { data: visitsData, isLoading, error } = useVisits(filters)

  // Cancel & Delete Mutations
  const cancelMutation = useCancelVisit()
  const deleteMutation = useDeleteVisit()

  // Access the Zustand form store
  const store = useReceptionFormStore()

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

  // Lọc bỏ danh sách lượt khám có loại đăng ký là Đặt lịch (value = 2)
  const filteredVisits = visitsData?.data.filter(visit => visit.registration_type.value !== 2) || []

  return (
    <div className={cn('space-y-4', className)}>
      {/* Filters */}
      <ExaminationFilters value={filters} onChange={setFilters} />

      {/* Error */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error.message}</AlertDescription>
        </Alert>
      )}

      {/* Table */}
      {isLoading ? (
        <div className="flex justify-center items-center py-12">
          <Spinner className="h-8 w-8" />
        </div>
      ) : filteredVisits.length ? (
        <ExaminationTable
          visits={filteredVisits}
          onCancel={handleCancel}
          onDelete={handleDelete}
          onEdit={handleEdit}
        />
      ) : (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            {t('tab2.empty_state')}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
