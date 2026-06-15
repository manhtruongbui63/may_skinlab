/**
 * Tab Panel Component (Lazy Loaded Tabs)
 * @module TabPanel
 */
'use client'

import { Suspense, lazy } from 'react'
import { Skeleton } from '@/bks/ds-system-sdk/components/ui/skeleton'
import { cn } from '@/bks/ds-system-sdk/lib/utils'

// Lazy load tab components
const CustomerSearchTab = lazy(() =>
  import('./customer-search-tab').then((mod) => ({ default: mod.CustomerSearchTab }))
)

const ExaminationListTab = lazy(() =>
  import('./examination-list-tab').then((mod) => ({ default: mod.ExaminationListTab }))
)

const AppointmentListTab = lazy(() =>
  import('./appointment-list-tab').then((mod) => ({ default: mod.AppointmentListTab }))
)

export interface TabPanelProps {
  activeTab: 1 | 2 | 3
  className?: string
}

/**
 * Component render tab content dựa vào activeTab
 * - activeTab = 1: CustomerSearchTab
 * - activeTab = 2: ExaminationListTab
 * - activeTab = 3: AppointmentListTab
 *
 * Lazy loading cho performance
 */
export function TabPanel({ activeTab, className }: TabPanelProps) {
  return (
    <div className={cn('mt-4', className)}>
      <Suspense
        fallback={
          <div className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        }
      >
        {activeTab === 1 && <CustomerSearchTab />}
        {activeTab === 2 && <ExaminationListTab />}
        {activeTab === 3 && <AppointmentListTab />}
      </Suspense>
    </div>
  )
}
