/**
 * Customer Search Modal (S5)
 * @module CustomerSearchModal
 */
'use client'

import { useTranslations } from 'next-intl'
import { X } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/bks/ds-system-sdk/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/bks/ds-system-sdk/components/ui/table'
import { Skeleton } from '@/bks/ds-system-sdk/components/ui/skeleton'
import { cn } from '@/bks/ds-system-sdk/lib/utils'
import type { CustomerSummary } from '../types'

export interface CustomerSearchModalProps {
  isOpen: boolean
  results: CustomerSummary[]
  isLoading?: boolean
  onSelect: (customer: CustomerSummary) => void
  onClose: () => void
}

/**
 * Modal hiển thị danh sách khách hàng (S5)
 * Click row để chọn khách hàng
 */
export function CustomerSearchModal({
  isOpen,
  results,
  isLoading,
  onSelect,
  onClose,
}: CustomerSearchModalProps) {
  const t = useTranslations('reception')

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-full h-full rounded-none sm:rounded-lg sm:h-auto sm:max-h-[90vh] sm:max-w-2xl lg:max-w-[1024px] overflow-auto">
        <DialogHeader>
          <DialogTitle>{t('tab1.select_customer_hint')}</DialogTitle>
        </DialogHeader>

        {isLoading ? (
          // Loading skeleton
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : results.length === 0 ? (
          // Empty state
          <div className="text-center py-8 text-muted-foreground">
            <p className="text-sm">{t('tab1.no_customer_found')}</p>
          </div>
        ) : (
          // Results table
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('tab1.customer_code_label')}</TableHead>
                <TableHead>{t('tab1.customer_name_label')}</TableHead>
                <TableHead>{t('tab1.phone_label')}</TableHead>
                <TableHead>Tỉnh/Thành</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {results.map((customer) => (
                <TableRow
                  key={customer.id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => onSelect(customer)}
                >
                  <TableCell className="font-medium">{customer.code}</TableCell>
                  <TableCell>{customer.full_name}</TableCell>
                  <TableCell>{customer.phone}</TableCell>
                  <TableCell className="text-muted-foreground">{customer.province?.name || '—'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </DialogContent>
    </Dialog>
  )
}
