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
  Skeleton,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@bks/ds-system-sdk'
import type { Customer } from '../types'

type CustomerTableProps = {
  customers: Customer[]
  isLoading: boolean
  onView: (customer: Customer) => void
  onEdit: (customer: Customer) => void
  onDelete: (customer: Customer) => void
  onToggleStatus: (id: number, newStatus: number) => void
}

function calculateAge(birthDate: string | undefined): string {
  if (!birthDate) return '—'
  const birth = new Date(birthDate)
  if (isNaN(birth.getTime())) return '—'
  const today = new Date()
  let age = today.getFullYear() - birth.getFullYear()
  const m = today.getMonth() - birth.getMonth()
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
    age--
  }
  return String(age)
}

function formatOutstandingAmount(amount: number): string {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount)
}

const SKELETON_ROWS = 5

export function CustomerTable({
  customers,
  isLoading,
  onView,
  onEdit,
  onDelete,
  onToggleStatus,
}: CustomerTableProps) {
  const t = useTranslations('customers')

  return (
    <div className="overflow-x-auto custom-scrollbar">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t('labels.fullName')}</TableHead>
            <TableHead>{t('labels.phone')}</TableHead>
            <TableHead>{t('labels.age')}</TableHead>
            <TableHead>{t('labels.gender')}</TableHead>
            <TableHead>{t('labels.source')}</TableHead>
            <TableHead className="text-right">{t('labels.outstandingAmount')}</TableHead>
            <TableHead className="text-center">{t('labels.status')}</TableHead>
            <TableHead className="text-right">{t('labels.actions')}</TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {/* Loading state with spinner */}
          {isLoading && (
            <TableRow>
              <TableCell colSpan={8} className="py-16 text-center">
                <div className="flex flex-col items-center justify-center gap-3">
                  <Spinner className="size-8 text-primary animate-spin" />
                  <span className="text-sm text-muted-foreground">{t('table.loading')}</span>
                </div>
              </TableCell>
            </TableRow>
          )}

          {/* Empty state (not loading, no data) */}
          {!isLoading && customers.length === 0 && (
            <TableRow>
              <TableCell colSpan={8} className="py-16">
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
            customers.map((customer) => (
              <TableRow key={customer.id}>
                {/* Full Name */}
                <TableCell className="font-medium">
                  <button
                    type="button"
                    className="text-left hover:underline focus:outline-none focus-visible:underline"
                    onClick={() => onView(customer)}
                    aria-label={`${t('actions.view')} ${customer.fullName}`}
                  >
                    {customer.fullName}
                  </button>
                </TableCell>

                {/* Phone */}
                <TableCell className="text-muted-foreground" dir="ltr">
                  {customer.phone}
                </TableCell>

                {/* Age calculated from birthDate */}
                <TableCell className="text-muted-foreground">
                  {calculateAge(customer.birthDate)}
                </TableCell>

                {/* Gender */}
                <TableCell>
                  {customer.gender ? (
                    <span className="text-sm text-foreground">{customer.gender.label}</span>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </TableCell>

                {/* Source */}
                <TableCell>
                  {customer.source ? (
                    <Badge variant="secondary">{customer.source.label}</Badge>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </TableCell>

                {/* Outstanding Amount */}
                <TableCell className="text-right font-medium tabular-nums">
                  {formatOutstandingAmount(customer.outstandingAmount)}
                </TableCell>

                {/* Status toggle */}
                <TableCell className="text-center">
                  <Switch
                    id={`customer-status-${customer.id}`}
                    checked={customer.status.value === 1}
                    onCheckedChange={(checked: boolean) =>
                      onToggleStatus(customer.id, checked ? 1 : 0)
                    }
                    aria-label={`${t('labels.status')}: ${customer.status.label}`}
                  />
                </TableCell>

                {/* Actions dropdown */}
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        id={`customer-actions-${customer.id}`}
                        aria-label={`${t('labels.actions')} — ${customer.fullName}`}
                      >
                        <MoreHorizontal className="size-4" aria-hidden />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        id={`customer-view-${customer.id}`}
                        onClick={() => onView(customer)}
                        className="whitespace-nowrap"
                      >
                        <Eye className="mr-2 size-4" aria-hidden />
                        {t('actions.view')}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        id={`customer-edit-${customer.id}`}
                        onClick={() => onEdit(customer)}
                        className="whitespace-nowrap"
                      >
                        <Pencil className="mr-2 size-4" aria-hidden />
                        {t('actions.edit')}
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        id={`customer-delete-${customer.id}`}
                        onClick={() => onDelete(customer)}
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
