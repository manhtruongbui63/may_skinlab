/**
 * Tab Navigation Component
 * @module TabNavigation
 */
'use client'

import { useTranslations } from 'next-intl'
import { Tabs, TabsList, TabsTrigger } from '@/bks/ds-system-sdk/components/ui/tabs'
import { cn } from '@/bks/ds-system-sdk/lib/utils'

export interface TabNavigationProps {
  activeTab: 1 | 2 | 3
  onTabChange: (tab: 1 | 2 | 3) => void
  className?: string
}

/**
 * Component tab navigation cho ReceptionPage
 * 3 tabs: Thông tin KH (1), Danh sách khám (2), Lịch hẹn (3)
 */
export function TabNavigation({ activeTab, onTabChange, className }: TabNavigationProps) {
  const t = useTranslations('reception')

  return (
    <Tabs
      value={activeTab.toString()}
      onValueChange={(v) => onTabChange(parseInt(v, 10) as 1 | 2 | 3)}
      className={cn('w-full', className)}
    >
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="1">{t('tabs.tab1_label')}</TabsTrigger>
        <TabsTrigger value="2">{t('tabs.tab2_label')}</TabsTrigger>
        <TabsTrigger value="3">{t('tabs.tab3_label')}</TabsTrigger>
      </TabsList>
    </Tabs>
  )
}
