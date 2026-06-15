/**
 * Registration Type Select Component
 * @module RegistrationTypeSelect
 */
'use client'

import { useTranslations } from 'next-intl'
import { RadioGroup, RadioGroupItem } from '@/bks/ds-system-sdk/components/ui/radio-group'
import { Label } from '@/bks/ds-system-sdk/components/ui/label'
import { cn } from '@/bks/ds-system-sdk/lib/utils'

export interface RegistrationTypeSelectProps {
  value: number | null
  onChange: (value: number) => void
  error?: string
  disabled?: boolean
  required?: boolean
}

/**
 * Component chọn loại đăng ký
 * - WALK_IN (1) = "Chờ khám" / "Vãng lai"
 * - SCHEDULED (2) = "Đặt lịch"
 */
export function RegistrationTypeSelect({ value, onChange, error, disabled, required }: RegistrationTypeSelectProps) {
  const t = useTranslations('reception')

  return (
    <div className={cn('space-y-2', disabled && 'opacity-50 pointer-events-none')}>
      <Label className="text-sm font-medium">
        {t('form.registration_type_label')}
        {required && <span className="text-destructive"> *</span>}
      </Label>
      <RadioGroup
        value={value?.toString() ?? ''}
        onValueChange={(v) => onChange(parseInt(v, 10))}
        disabled={disabled}
        className={cn(
          'flex flex-row gap-6 items-center',
          error && 'border border-destructive rounded-md p-2'
        )}
      >
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="1" id="type-walk-in" />
          <Label htmlFor="type-walk-in" className="cursor-pointer">
            {t('labels.walk_in')}
          </Label>
        </div>
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="2" id="type-scheduled" />
          <Label htmlFor="type-scheduled" className="cursor-pointer">
            {t('labels.scheduled')}
          </Label>
        </div>
      </RadioGroup>
      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}
    </div>
  )
}
