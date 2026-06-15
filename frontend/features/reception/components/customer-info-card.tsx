/**
 * Customer Info Card Component
 * @module CustomerInfoCard
 */
'use client'

import { useTranslations } from 'next-intl'
import { User, Plus } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/bks/ds-system-sdk/components/ui/card'
import { Input } from '@/bks/ds-system-sdk/components/ui/input'
import { Label } from '@/bks/ds-system-sdk/components/ui/label'
import { Button } from '@/bks/ds-system-sdk/components/ui/button'
import { cn } from '@/bks/ds-system-sdk/lib/utils'
import type { CustomerSummary } from '../types'

export interface CustomerInfoCardProps {
  customer: CustomerSummary | null
  onReset?: () => void
  onAddCustomer?: () => void
  className?: string
}

/**
 * Component hiển thị thông tin khách hàng (readonly)
 * Tất cả fields disabled
 */
export function CustomerInfoCard({ customer, onReset, onAddCustomer, className }: CustomerInfoCardProps) {
  const t = useTranslations('reception')

  // Empty state
  if (!customer) {
    return (
      <Card className={cn('w-full', className)}>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between w-full">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <User className="h-4 w-4" />
              {t('tab1.detail_title')}
            </CardTitle>
            {onAddCustomer && (
              <Button
                size="xs"
                onClick={onAddCustomer}
                className="h-7 text-xs px-2 gap-1"
              >
                <Plus className="h-3.5 w-3.5" />
                Thêm khách hàng
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <p className="text-sm">{t('tab1.select_customer_hint')}</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={cn('w-full', className)}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between w-full">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <User className="h-4 w-4" />
            {t('tab1.detail_title')}
          </CardTitle>
          <div className="flex items-center gap-2">
            {onReset && (
              <Button
                variant="outline"
                size="xs"
                onClick={onReset}
                className="h-7 text-xs px-2"
              >
                {t('tab1.reset_button')}
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Code */}
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">{t('tab1.customer_code_label')}</Label>
          <Input value={customer.code} disabled />
        </div>

        {/* Name */}
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">{t('tab1.customer_name_label')}</Label>
          <Input value={customer.full_name} disabled />
        </div>

        {/* Phone */}
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">{t('tab1.phone_label')}</Label>
          <Input value={customer.phone} disabled />
        </div>

        {/* Gender & DOB */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">{t('tab1.gender_label')}</Label>
            <Input value={customer.gender?.label || '—'} disabled />
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">{t('tab1.dob_label')}</Label>
            <Input value={customer.birth_date || '—'} disabled />
          </div>
        </div>

        {/* Address */}
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">{t('tab1.address_label')}</Label>
          <Input value={customer.address || '—'} disabled />
        </div>
      </CardContent>
    </Card>
  )
}
