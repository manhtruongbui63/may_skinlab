/**
 * Examination Table Component
 * @module ExaminationTable
 */
'use client'

import { useTranslations } from 'next-intl'
import dayjs from 'dayjs'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/bks/ds-system-sdk/components/ui/table'
import { Button } from '@/bks/ds-system-sdk/components/ui/button'
import { Badge } from '@/bks/ds-system-sdk/components/ui/badge'
import { cn } from '@/bks/ds-system-sdk/lib/utils'
import type { Visit } from '../types'

export interface ExaminationTableProps {
  visits: Visit[]
  onCancel: (id: number) => void
  onDelete: (id: number) => void
  onEdit?: (visit: Visit) => void
}

/**
 * Get status badge variant based on status value
 */
function getStatusBadgeVariant(statusValue: number): {
  variant: 'default' | 'secondary' | 'destructive' | 'outline'
  className?: string
} {
  switch (statusValue) {
    case 1: // WAITING / Chờ khám
      return { variant: 'secondary', className: 'bg-blue-100 text-blue-800 hover:bg-blue-100' }
    case 2: // EXAMINING / Đang khám
      return { variant: 'default', className: 'bg-green-100 text-green-800 hover:bg-green-100' }
    case 3: // COMPLETED / Đã hoàn thành
      return { variant: 'secondary', className: 'bg-gray-100 text-gray-800 hover:bg-gray-100' }
    case 4: // CANCELLED / Đã hủy
      return { variant: 'destructive', className: 'bg-red-100 text-red-800 hover:bg-red-100' }
    default:
      return { variant: 'secondary' }
  }
}

export function ExaminationTable({ visits, onCancel, onDelete, onEdit }: ExaminationTableProps) {
  const t = useTranslations('reception')

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t('tab2.column_queue')}</TableHead>
            <TableHead>{t('tab2.column_customer_code')}</TableHead>
            <TableHead>{t('tab2.column_visit_code')}</TableHead>
            <TableHead>{t('tab2.column_name')}</TableHead>
            <TableHead>{t('tab2.column_registered_at')}</TableHead>
            <TableHead>{t('tab2.column_gender')}</TableHead>
            <TableHead>{t('tab2.column_phone')}</TableHead>
            <TableHead>{t('tab2.column_status')}</TableHead>
            <TableHead>{t('tab2.column_actions')}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {visits.map((visit) => {
            const statusStyle = getStatusBadgeVariant(visit.status.value)
            const showCancel = visit.status.value === 1 || visit.status.value === 2

            // Format appointment_date time
            let timeStr = '—'
            const displayTimeSource = visit.appointment_date || visit.created_at
            if (displayTimeSource) {
              try {
                timeStr = dayjs(displayTimeSource).format('DD/MM/YYYY HH:mm')
              } catch {
                // Ignore
              }
            }

            return (
              <TableRow key={visit.id}>
                <TableCell className="font-medium">{visit.queue_number}</TableCell>
                <TableCell>{visit.customer?.code || '—'}</TableCell>
                <TableCell>
                  <button
                    type="button"
                    onClick={() => onEdit?.(visit)}
                    className="text-primary hover:underline font-medium text-left cursor-pointer"
                  >
                    {visit.code}
                  </button>
                </TableCell>
                <TableCell>{visit.customer?.full_name || '—'}</TableCell>
                <TableCell>{timeStr}</TableCell>
                <TableCell>{visit.customer?.gender?.label || '—'}</TableCell>
                <TableCell>{visit.customer?.phone || '—'}</TableCell>
                <TableCell>
                  <Badge variant={statusStyle.variant} className={cn(statusStyle.className)}>
                    {visit.status.label}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    {showCancel && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onCancel(visit.id)}
                      >
                        {t('tab2.cancel_button')}
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      tone="destructive"
                      size="sm"
                      onClick={() => onDelete(visit.id)}
                    >
                      {t('tab2.delete_button')}
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}
