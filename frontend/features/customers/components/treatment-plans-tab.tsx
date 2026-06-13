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
import type { TreatmentPlan } from '../types'
import { formatDate } from '@/shared/lib/format-date'

type TreatmentPlansTabProps = {
  plans?: TreatmentPlan[]
  isLoading: boolean
}

export function TreatmentPlansTab({ plans, isLoading }: TreatmentPlansTabProps) {
  const t = useTranslations('customers')

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
      case 'đã hoàn thành':
        return <Badge variant="success">{status}</Badge>
      case 'in progress':
      case 'đang tiến hành':
        return <Badge variant="info">{status}</Badge>
      case 'suspended':
      case 'tạm dừng':
        return <Badge variant="warning">{status}</Badge>
      case 'canceled':
      case 'đã hủy':
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
              <TableHead><Skeleton className="h-4 w-32" /></TableHead>
              <TableHead><Skeleton className="h-4 w-20" /></TableHead>
              <TableHead><Skeleton className="h-4 w-20" /></TableHead>
              <TableHead className="text-right"><Skeleton className="ml-auto h-4 w-20" /></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: 3 }).map((_, i) => (
              <TableRow key={i} aria-hidden>
                <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                <TableCell className="text-right"><Skeleton className="ml-auto h-5 w-16" /></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    )
  }

  if (!plans || plans.length === 0) {
    return (
      <div className="py-12 flex justify-center">
        <Empty>
          <EmptyTitle>{t('labels.emptyPlans')}</EmptyTitle>
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
            <TableHead>{t('labels.planName')}</TableHead>
            <TableHead>{t('labels.startDate')}</TableHead>
            <TableHead>{t('labels.endDate')}</TableHead>
            <TableHead className="text-right">{t('labels.status')}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {plans.map((plan) => (
            <TableRow key={plan.id}>
              <TableCell className="font-semibold text-foreground">{plan.planName}</TableCell>
              <TableCell className="text-muted-foreground">{formatDate(plan.startDate)}</TableCell>
              <TableCell className="text-muted-foreground">{plan.endDate ? formatDate(plan.endDate) : '—'}</TableCell>
              <TableCell className="text-right">{getStatusBadge(plan.status)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
