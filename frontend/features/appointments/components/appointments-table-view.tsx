'use client'

import { useTranslations } from 'next-intl'
import { MoreHorizontal, Pencil, Trash2, Eye } from 'lucide-react'
import {
  Badge,
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Empty,
  EmptyTitle,
  EmptyDescription,
  Spinner,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@bks/ds-system-sdk'
import type { Appointment } from '../types'

type AppointmentsTableViewProps = {
  appointments: Appointment[]
  isLoading: boolean
  onView: (appointment: Appointment) => void
  onEdit: (appointment: Appointment) => void
  onDelete: (appointment: Appointment) => void
}

export function AppointmentsTableView({
  appointments,
  isLoading,
  onView,
  onEdit,
  onDelete,
}: AppointmentsTableViewProps) {
  const t = useTranslations('appointments')

  const getBadgeVariant = (statusValue: number) => {
    switch (statusValue) {
      case 1: // BOOKED
        return 'secondary'
      case 2: // CONFIRMED
        return 'info'
      case 3: // CHECKED_IN
        return 'warning'
      case 4: // COMPLETED
        return 'success'
      case 5: // CANCELLED
        return 'destructive'
      case 6: // NO_SHOW
        return 'default'
      default:
        return 'outline'
    }
  }

  return (
    <div className="overflow-x-auto custom-scrollbar">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t('table.columns.customer')}</TableHead>
            <TableHead>{t('table.columns.phone')}</TableHead>
            <TableHead>{t('table.columns.date')}</TableHead>
            <TableHead>{t('table.columns.time')}</TableHead>
            <TableHead className="text-center">{t('table.columns.status')}</TableHead>
            <TableHead className="text-right">{t('table.columns.actions')}</TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {/* Loading state */}
          {isLoading && (
            <TableRow>
              <TableCell colSpan={6} className="py-16 text-center">
                <div className="flex flex-col items-center justify-center gap-3">
                  <Spinner className="size-8 text-primary animate-spin" />
                  <span className="text-sm text-muted-foreground">{t('table.loading')}</span>
                </div>
              </TableCell>
            </TableRow>
          )}

          {/* Empty state */}
          {!isLoading && appointments.length === 0 && (
            <TableRow>
              <TableCell colSpan={6} className="py-16">
                <div className="flex justify-center w-full">
                  <Empty>
                    <EmptyTitle>{t('empty.title')}</EmptyTitle>
                    <EmptyDescription>{t('empty.description')}</EmptyDescription>
                  </Empty>
                </div>
              </TableCell>
            </TableRow>
          )}

          {/* Data rows */}
          {!isLoading &&
            appointments.map((appt) => (
              <TableRow key={appt.id}>
                {/* Customer name */}
                <TableCell className="font-medium">
                  <button
                    type="button"
                    onClick={() => onView(appt)}
                    className="text-left hover:underline focus:outline-none focus-visible:underline"
                  >
                    {appt.customer?.full_name || t('calendar.noCustomer')}
                  </button>
                </TableCell>

                {/* Phone */}
                <TableCell className="text-muted-foreground" dir="ltr">
                  {appt.customer?.phone || '—'}
                </TableCell>

                {/* Date */}
                <TableCell className="text-muted-foreground">
                  {appt.appointment_date}
                </TableCell>

                {/* Time */}
                <TableCell className="text-muted-foreground">
                  {appt.appointment_time}
                </TableCell>

                {/* Status */}
                <TableCell className="text-center">
                  <Badge variant={getBadgeVariant(appt.status.value)}>
                    {appt.status.label}
                  </Badge>
                </TableCell>

                {/* Actions */}
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        id={`appointment-actions-${appt.id}`}
                        aria-label={`${t('table.columns.actions')} — ${appt.customer?.full_name || ''}`}
                      >
                        <MoreHorizontal className="size-4" aria-hidden />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        id={`appointment-view-${appt.id}`}
                        onClick={() => onView(appt)}
                        className="whitespace-nowrap"
                      >
                        <Eye className="mr-2 size-4" aria-hidden />
                        {t('actions.view')}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        id={`appointment-edit-${appt.id}`}
                        onClick={() => onEdit(appt)}
                        className="whitespace-nowrap"
                      >
                        <Pencil className="mr-2 size-4" aria-hidden />
                        {t('actions.edit')}
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        id={`appointment-delete-${appt.id}`}
                        onClick={() => onDelete(appt)}
                        className="text-destructive focus:text-destructive whitespace-nowrap"
                      >
                        <Trash2 className="mr-2 size-4" aria-hidden />
                        {t('actions.delete')}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
        </TableBody>
      </Table>
    </div>
  )
}
