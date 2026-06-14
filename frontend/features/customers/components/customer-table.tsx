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
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@bks/ds-system-sdk'
import type { Customer } from '../types'
import { formatDate } from '@/shared/lib/format-date'

type CustomerTableProps = {
  customers: Customer[]
  isLoading: boolean
  onView: (customer: Customer) => void
  onEdit: (customer: Customer) => void
  onDelete: (customer: Customer) => void
}

export function CustomerTable({
  customers,
  isLoading,
  onView,
  onEdit,
  onDelete,
}: CustomerTableProps) {
  const t = useTranslations('customers')

  return (
    <div className="overflow-x-auto custom-scrollbar">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t('labels.createdAt')}</TableHead>
            <TableHead>{t('labels.code')}</TableHead>
            <TableHead>{t('labels.fullName')}</TableHead>
            <TableHead>{t('labels.birthDate')}</TableHead>
            <TableHead>{t('labels.gender')}</TableHead>
            <TableHead>{t('labels.phone')}</TableHead>
            <TableHead>{t('labels.province')}</TableHead>
            <TableHead className="text-center">{t('labels.status')}</TableHead>
            <TableHead className="text-right">{t('labels.actions')}</TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {/* Loading state with spinner */}
          {isLoading && (
            <TableRow>
              <TableCell colSpan={9} className="py-16 text-center">
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
              <TableCell colSpan={9} className="py-16">
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
            customers.map((customer) => {
              const initials = customer.fullName
                .split(' ')
                .map((n) => n[0])
                .join('')
                .toUpperCase()
                .slice(0, 2)

              return (
                <TableRow key={customer.id}>
                  {/* Created At */}
                  <TableCell className="text-muted-foreground">
                    {customer.createdAt ? formatDate(customer.createdAt) : '—'}
                  </TableCell>

                  {/* Patient Code */}
                  <TableCell className="font-semibold text-muted-foreground">
                    {customer.code}
                  </TableCell>

                  {/* Full Name & Avatar */}
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-3">
                      <Avatar size="sm" className="size-8">
                        {customer.avatarPath && (
                          <AvatarImage src={customer.avatarPath} alt={customer.fullName} />
                        )}
                        <AvatarFallback className="bg-primary/10 text-primary text-xs">
                          {initials}
                        </AvatarFallback>
                      </Avatar>
                      <button
                        type="button"
                        className="text-left hover:underline focus:outline-none focus-visible:underline font-semibold"
                        onClick={() => onView(customer)}
                        aria-label={`${t('actions.view')} ${customer.fullName}`}
                      >
                        {customer.fullName}
                      </button>
                    </div>
                  </TableCell>

                  {/* Birth Date */}
                  <TableCell className="text-muted-foreground">
                    {customer.birthDate ? formatDate(customer.birthDate) : '—'}
                  </TableCell>

                  {/* Gender */}
                  <TableCell>
                    {customer.gender ? (
                      <span className="text-sm text-foreground">{customer.gender.label}</span>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>

                  {/* Phone */}
                  <TableCell className="text-muted-foreground" dir="ltr">
                    {customer.phone}
                  </TableCell>

                  {/* Province */}
                  <TableCell className="text-muted-foreground">
                    {customer.province?.name || '—'}
                  </TableCell>

                  {/* Status Badge */}
                  <TableCell className="text-center">
                    <Badge variant={customer.status.value === 1 ? 'success' : 'secondary'}>
                      {customer.status.label}
                    </Badge>
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
              )
            })}
        </TableBody>
      </Table>
    </div>
  )
}
