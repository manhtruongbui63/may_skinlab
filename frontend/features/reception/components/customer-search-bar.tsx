/**
 * Customer Search Bar Component with Button
 * @module CustomerSearchBar
 */
'use client'

import { useTranslations } from 'next-intl'
import { Search, Loader2 } from 'lucide-react'
import { Input } from '@/bks/ds-system-sdk/components/ui/input'
import { Button } from '@/bks/ds-system-sdk/components/ui/button'
import { cn } from '@/bks/ds-system-sdk/lib/utils'

export interface CustomerSearchBarProps {
  value: string
  onChange: (value: string) => void
  onSearch?: () => void
  isLoading?: boolean
  className?: string
}

/**
 * Component input tìm kiếm khách hàng với button search
 * Chỉ gọi API khi click button hoặc nhấn Enter
 */
export function CustomerSearchBar({ value, onChange, onSearch, isLoading, className }: CustomerSearchBarProps) {
  const t = useTranslations('reception')

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && onSearch) {
      onSearch()
    }
  }

  return (
    <div className={cn('flex gap-2', className)}>
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={t('tab1.search_placeholder')}
          className="pl-10"
        />
      </div>
      <Button 
        onClick={onSearch} 
        disabled={isLoading || value.length < 2}
        className="shrink-0"
      >
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <>
            <Search className="h-4 w-4 mr-2" />
            {t('action.search')}
          </>
        )}
      </Button>
    </div>
  )
}
