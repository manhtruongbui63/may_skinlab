'use client'

import { ReceptionLayout } from '@/features/reception'

/**
 * Reception Page
 *
 * Main entry point for reception management feature.
 * Displays 2-column layout:
 * - Column 1: Registration form
 * - Column 2: Tabbed view (Customer Info, Examination List, Appointments)
 */
export default function ReceptionPage() {
  return (
    <div className="h-full p-0">
      <ReceptionLayout className="h-full" />
    </div>
  )
}
