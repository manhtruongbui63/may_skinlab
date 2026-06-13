'use client'

import { useTranslations } from 'next-intl'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Empty,
  EmptyTitle,
  EmptyDescription,
  Skeleton,
  Badge,
} from '@bks/ds-system-sdk'
import type { Invoice } from '../types'
import { formatDate } from '@/shared/lib/format-date'

type InvoicesTabProps = {
  invoices?: Invoice[]
  isLoading: boolean
}

function formatOutstandingAmount(amount: number): string {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount)
}

export function InvoicesTab({ invoices, isLoading }: InvoicesTabProps) {
  const t = useTranslations('customers')

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'paid':
      case 'đã thanh toán':
        return <Badge variant="success">{status}</Badge>
      case 'partially paid':
      case 'thanh toán một phần':
        return <Badge variant="warning">{status}</Badge>
      case 'unpaid':
      case 'chưa thanh toán':
      case 'overdue':
      case 'quá hạn':
        return <Badge variant="destructive">{status}</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  if (isLoading) {
    return (
      <div className="p-6">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead><Skeleton className="h-4 w-24" /></TableHead>
              <TableHead><Skeleton className="h-4 w-20" /></TableHead>
              <TableHead className="text-right"><Skeleton className="ml-auto h-4 w-20" /></TableHead>
              <TableHead className="text-right"><Skeleton className="ml-auto h-4 w-20" /></TableHead>
              <TableHead className="text-right"><Skeleton className="ml-auto h-4 w-20" /></TableHead>
              <TableHead className="text-right"><Skeleton className="ml-auto h-4 w-16" /></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: 3 }).map((_, i) => (
              <TableRow key={i} aria-hidden>
                <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                <TableCell className="text-right"><Skeleton className="ml-auto h-4 w-24" /></TableCell>
                <TableCell className="text-right"><Skeleton className="ml-auto h-4 w-24" /></TableCell>
                <TableCell className="text-right"><Skeleton className="ml-auto h-4 w-24" /></TableCell>
                <TableCell className="text-right"><Skeleton className="ml-auto h-5 w-16" /></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    )
  }

  if (!invoices || invoices.length === 0) {
    return (
      <div className="py-12 flex justify-center">
        <Empty>
          <EmptyTitle>{t('labels.emptyInvoices')}</EmptyTitle>
          <EmptyDescription>{t('empty.description')}</EmptyDescription>
        </Empty>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto custom-scrollbar p-6">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t('labels.invoiceNumber')}</TableHead>
            <TableHead>{t('labels.issueDate')}</TableHead>
            <TableHead className="text-right">{t('labels.amount')}</TableHead>
            <TableHead className="text-right">{t('labels.paidAmount')}</TableHead>
            <TableHead className="text-right">{t('labels.outstandingAmount')}</TableHead>
            <TableHead className="text-right">{t('labels.status')}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {invoices.map((invoice) => (
            <TableRow key={invoice.id}>
              <TableCell className="font-semibold text-foreground" dir="ltr">
                {invoice.invoiceNumber}
              </TableCell>
              <TableCell className="text-muted-foreground">
                {formatDate(invoice.issueDate)}
              </TableCell>
              <TableCell className="text-right font-medium tabular-nums">
                {formatOutstandingAmount(invoice.amount)}
              </TableCell>
              <TableCell className="text-right text-success font-medium tabular-nums">
                {formatOutstandingAmount(invoice.paidAmount)}
              </TableCell>
              <TableCell
                className={`text-right font-bold tabular-nums ${
                  invoice.outstandingAmount > 0 ? 'text-destructive' : 'text-muted-foreground'
                }`}
              >
                {formatOutstandingAmount(invoice.outstandingAmount)}
              </TableCell>
              <TableCell className="text-right">
                {getStatusBadge(invoice.status)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
