'use client'

import { useTranslations } from 'next-intl'
import { useState } from 'react'
import { Tabs, TabsList, TabsTrigger } from '@/bks/ds-system-sdk/components/ui/tabs'
import { RegistrationForm } from './registration-form'
import { CustomerSearchTab } from './customer-search-tab'
import { ExaminationListTab } from './examination-list-tab'
import { AppointmentListTab } from './appointment-list-tab'
import { cn } from '@/bks/ds-system-sdk/lib/utils'
import { useReceptionFormStore } from '../hooks'
import type { CustomerSummary } from '../types'

/**
 * Tab key type
 */
type TabKey = 'customer' | 'examination' | 'appointment'

export interface ReceptionLayoutProps {
  className?: string
}

/**
 * Reception Page Layout (2-column)
 *
 * Column 1: RegistrationForm (always visible)
 * Column 2: Tab Navigation + Tab Content (Customer/Examination/Appointment)
 *
 * UI-002: Tab switch does NOT reset form state (store persists across tab changes)
 */
export function ReceptionLayout({ className }: ReceptionLayoutProps) {
  const t = useTranslations('reception')
  const [activeTab, setActiveTab] = useState<TabKey>('customer')
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerSummary | null>(null)
  
  const store = useReceptionFormStore()

  const handleTabChange = (value: string) => {
    setActiveTab(value as TabKey)
  }

  const handleCustomerSelect = (customer: CustomerSummary | null) => {
    setSelectedCustomer(customer)
    if (customer) {
      store.setField('customerId', customer.id)
    } else {
      store.reset()
    }
  }

  return (
    <div className={cn('flex flex-col lg:flex-row gap-6 h-full', className)}>
      {/* Column 1: Registration Form (25%) */}
      <div className="w-full lg:w-1/4">
        <RegistrationForm
          onSubmitSuccess={() => setSelectedCustomer(null)}
          className="sticky top-4"
        />
      </div>

      {/* Column 2: Tabs Panel (60%) */}
      <div className="flex-1 min-w-0">
        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
          {/* Tab Navigation */}
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="customer">
              {t('tab.customer.label')}
            </TabsTrigger>
            <TabsTrigger value="examination">
              {t('tab.examination.label')}
            </TabsTrigger>
            <TabsTrigger value="appointment">
              {t('tab.appointment.label')}
            </TabsTrigger>
          </TabsList>

          {/* Tab Content */}
          <div className="bg-card rounded-lg border p-6">
            {activeTab === 'customer' && (
              <CustomerSearchTab
                selectedCustomer={selectedCustomer}
                onCustomerSelect={handleCustomerSelect}
              />
            )}
            {activeTab === 'examination' && (
              <ExaminationListTab onCustomerSelect={handleCustomerSelect} />
            )}
            {activeTab === 'appointment' && (
              <AppointmentListTab onCustomerSelect={handleCustomerSelect} />
            )}
          </div>
        </Tabs>
      </div>
    </div>
  )
}
