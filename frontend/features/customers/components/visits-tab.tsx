'use client'

import { useTranslations } from 'next-intl'
import { Calendar, User, FileText, ClipboardList } from 'lucide-react'
import { Empty, EmptyTitle, EmptyDescription, Skeleton } from '@bks/ds-system-sdk'
import type { Visit } from '../types'
import { formatDate } from '@/shared/lib/format-date'

type VisitsTabProps = {
  visits?: Visit[]
  isLoading: boolean
}

export function VisitsTab({ visits, isLoading }: VisitsTabProps) {
  const t = useTranslations('customers')

  if (isLoading) {
    return (
      <div className="space-y-4 p-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex gap-4 items-start">
            <Skeleton className="size-8 rounded-full shrink-0" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-1/4" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (!visits || visits.length === 0) {
    return (
      <div className="py-12 flex justify-center">
        <Empty>
          <EmptyTitle>{t('labels.emptyVisits')}</EmptyTitle>
          <EmptyDescription>{t('empty.description')}</EmptyDescription>
        </Empty>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="relative pl-6 border-l-2 border-border space-y-8">
        {visits.map((visit) => (
          <div key={visit.id} className="relative group">
            {/* Timeline Dot */}
            <div className="absolute -left-[31px] top-1.5 size-4 rounded-full border-2 border-primary bg-card transition-all group-hover:bg-primary" />

            <div className="space-y-2">
              {/* Visit Date */}
              <div className="flex items-center gap-2 text-sm text-muted-foreground font-semibold">
                <Calendar className="size-4" />
                <span>{formatDate(visit.visitDate)}</span>
              </div>

              {/* Diagnosis and Doctor */}
              <div className="bg-muted/30 border border-border rounded-xl p-4 space-y-3">
                <div className="flex items-start justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2 text-foreground font-bold text-base">
                    <ClipboardList className="size-4 text-primary shrink-0" />
                    <span>{visit.diagnosis || t('labels.noDiagnosis')}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-sm text-muted-foreground bg-card px-2.5 py-1 rounded-md border border-border">
                    <User className="size-3.5" />
                    <span className="font-medium">{visit.doctorName}</span>
                  </div>
                </div>

                {/* Notes */}
                {visit.notes && (
                  <div className="text-sm text-muted-foreground border-t border-border/60 pt-2 flex gap-1.5 items-start">
                    <FileText className="size-4 mt-0.5 shrink-0" />
                    <p className="leading-relaxed">{visit.notes}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
