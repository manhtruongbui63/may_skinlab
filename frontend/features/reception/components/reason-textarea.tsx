/**
 * Reason Textarea Component
 * @module ReasonTextarea
 */
'use client'

import { useTranslations } from 'next-intl'
import { Textarea } from '@/bks/ds-system-sdk/components/ui/textarea'
import { Label } from '@/bks/ds-system-sdk/components/ui/label'
import { cn } from '@/bks/ds-system-sdk/lib/utils'

const MAX_LENGTH = 500

export interface ReasonTextareaProps {
  value: string
  onChange: (value: string) => void
  error?: string
  disabled?: boolean
}

/**
 * Component nhập lý do khám
 * UI-008: Show remaining characters
 */
export function ReasonTextarea({ value, onChange, error, disabled }: ReasonTextareaProps) {
  const t = useTranslations('reception')
  const remainingChars = MAX_LENGTH - value.length

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value
    if (newValue.length <= MAX_LENGTH) {
      onChange(newValue)
    }
  }

  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium">
        {t('form.reason_label')}
      </Label>
      <Textarea
        value={value}
        onChange={handleChange}
        placeholder={t('labels.reason')}
        disabled={disabled}
        className={cn(
          'min-h-[100px] resize-y',
          error && 'border-destructive'
        )}
      />
      <div className="flex justify-between items-center">
        {error ? (
          <p className="text-sm text-destructive">{error}</p>
        ) : (
          <span />
        )}
        <span
          className={cn(
            'text-xs',
            remainingChars < 50 ? 'text-destructive' : 'text-muted-foreground'
          )}
        >
          {remainingChars} {t('form.characters_remaining')}
        </span>
      </div>
    </div>
  )
}
