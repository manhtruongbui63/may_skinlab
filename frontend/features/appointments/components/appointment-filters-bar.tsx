'use client'

import { useState, useEffect, useRef } from 'react'
import { useTranslations } from 'next-intl'
import { Search, Trash2 } from 'lucide-react'
import {
  Button,
  Input,
  InputGroup,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@bks/ds-system-sdk'
import type { AppointmentFilters } from '../types'

type AppointmentFiltersBarProps = {
  filters: AppointmentFilters
  onChange: (filters: Partial<AppointmentFilters>) => void
}

const DEFAULT_FILTERS: Partial<AppointmentFilters> = {
  search: '',
  date: '',
  status: undefined,
}

function isFiltersActive(filters: AppointmentFilters): boolean {
  return !!(filters.search || filters.date || filters.status !== undefined)
}

export function AppointmentFiltersBar({ filters, onChange }: AppointmentFiltersBarProps) {
  const t = useTranslations('appointments')
  const hasActiveFilters = isFiltersActive(filters)

  const searchInputRef = useRef<HTMLInputElement>(null)
  const [searchDraft, setSearchDraft] = useState(filters.search ?? '')

  // Debounce search input changes
  useEffect(() => {
    const timer = window.setTimeout(() => {
      const normalized = searchDraft.trim()
      const current = filters.search?.trim() ?? ''
      if (normalized !== current) {
        onChange({ search: normalized || undefined, page: 1 })
      }
    }, 300)
    return () => window.clearTimeout(timer)
  }, [searchDraft, filters.search, onChange])

  // Sync draft from URL, but only if search input is not active/focused
  useEffect(() => {
    if (searchInputRef.current === document.activeElement) return
    setSearchDraft(filters.search ?? '')
  }, [filters.search])

  const handleReset = () => {
    setSearchDraft('')
    onChange({ ...DEFAULT_FILTERS, page: 1 })
  }

  return (
    <div className="flex flex-wrap items-center gap-2 px-4 py-3 md:px-6">
      {/* Search query */}
      <InputGroup className="flex-1 basis-48">
        <Search
          className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden
        />
        <Input
          ref={searchInputRef}
          id="appointment-search"
          type="search"
          placeholder={t('placeholders.search')}
          value={searchDraft}
          onChange={(e) => setSearchDraft(e.target.value)}
          className="pl-8"
          spellCheck={false}
          aria-label={t('placeholders.search')}
        />
      </InputGroup>

      {/* Date filter */}
      <Input
        id="appointment-filter-date"
        type="date"
        value={filters.date || ''}
        onChange={(e) => onChange({ date: e.target.value || undefined, page: 1 })}
        className="w-full sm:w-44"
        aria-label={t('labels.date')}
      />

      {/* Status filter */}
      <Select
        className="w-full sm:w-44"
        value={filters.status !== undefined ? String(filters.status) : undefined}
        onValueChange={(val) =>
          onChange({ status: val !== undefined ? Number(val) : undefined, page: 1 })
        }
      >
        <SelectTrigger id="appointment-filter-status" className="w-full! min-w-0" aria-label={t('table.columns.status')}>
          <SelectValue placeholder={t('placeholders.status')} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="1">{t('statuses.1')}</SelectItem>
          <SelectItem value="2">{t('statuses.2')}</SelectItem>
          <SelectItem value="3">{t('statuses.3')}</SelectItem>
          <SelectItem value="4">{t('statuses.4')}</SelectItem>
          <SelectItem value="5">{t('statuses.5')}</SelectItem>
          <SelectItem value="6">{t('statuses.6')}</SelectItem>
        </SelectContent>
      </Select>

      {/* Reset */}
      {hasActiveFilters && (
        <Button
          id="appointment-filter-reset"
          variant="ghost"
          tone="destructive"
          onClick={handleReset}
          aria-label={t('filters.reset')}
        >
          <Trash2 className="mr-1.5 size-4" aria-hidden />
          {t('filters.reset')}
        </Button>
      )}
    </div>
  )
}
