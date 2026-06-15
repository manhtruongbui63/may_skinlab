/**
 * Priority Toggle Component
 * @module PriorityToggle
 */
'use client'

import { useTranslations } from 'next-intl'
import { Switch } from '@/bks/ds-system-sdk/components/ui/switch'
import { Label } from '@/bks/ds-system-sdk/components/ui/label'

export interface PriorityToggleProps {
  value: boolean
  onChange: (value: boolean) => void
  disabled?: boolean
}

/**
 * Component toggle "Ưu tiên"
 * DS Role: Toggle switch
 */
export function PriorityToggle({ value, onChange, disabled }: PriorityToggleProps) {
  const t = useTranslations('reception')

  return (
    <div className={`flex items-center space-x-2${disabled ? ' opacity-50 pointer-events-none' : ''}`}>
      <Switch
        id="priority-toggle"
        checked={value}
        onCheckedChange={onChange}
        disabled={disabled}
      />
      <Label htmlFor="priority-toggle" className="cursor-pointer">
        {t('form.priority_label')}
      </Label>
    </div>
  )
}
