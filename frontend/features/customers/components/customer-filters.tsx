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
import type { CustomerFilters } from '../types'

type CustomerFiltersProps = {
  filters: CustomerFilters
  onChange: (filters: Partial<CustomerFilters>) => void
}

const DEFAULT_FILTERS: Partial<CustomerFilters> = {
  search: '',
  gender: undefined,
  source: undefined,
  status: undefined,
}

function isFiltersActive(filters: CustomerFilters): boolean {
  return !!(filters.search || filters.gender !== undefined || filters.source !== undefined || filters.status !== undefined)
}

export function CustomerFiltersBar({ filters, onChange }: CustomerFiltersProps) {
  const t = useTranslations('customers')
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
      {/* Search */}
      <InputGroup className="flex-1 basis-48">
        <Search
          className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden
        />
        <Input
          ref={searchInputRef}
          id="customer-search"
          type="search"
          placeholder={t('placeholders.search')}
          value={searchDraft}
          onChange={(e) => setSearchDraft(e.target.value)}
          className="pl-8"
          spellCheck={false}
          aria-label={t('placeholders.search')}
        />
      </InputGroup>

      {/* Gender filter */}
      <Select
        className="w-full sm:w-40"
        value={filters.gender !== undefined ? String(filters.gender) : undefined}
        onValueChange={(val) =>
          onChange({ gender: val !== undefined ? Number(val) : undefined, page: 1 })
        }
      >
        <SelectTrigger id="customer-filter-gender" className="w-full! min-w-0" aria-label={t('labels.gender')}>
          <SelectValue placeholder={t('placeholders.gender')} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="1">{t('genders.1')}</SelectItem>
          <SelectItem value="2">{t('genders.2')}</SelectItem>
          <SelectItem value="3">{t('genders.3')}</SelectItem>
        </SelectContent>
      </Select>

      {/* Source filter */}
      <Select
        className="w-full sm:w-44"
        value={filters.source !== undefined ? String(filters.source) : undefined}
        onValueChange={(val) =>
          onChange({ source: val !== undefined ? Number(val) : undefined, page: 1 })
        }
      >
        <SelectTrigger id="customer-filter-source" className="w-full! min-w-0" aria-label={t('labels.source')}>
          <SelectValue placeholder={t('placeholders.source')} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="1">{t('sources.1')}</SelectItem>
          <SelectItem value="2">{t('sources.2')}</SelectItem>
          <SelectItem value="3">{t('sources.3')}</SelectItem>
          <SelectItem value="4">{t('sources.4')}</SelectItem>
          <SelectItem value="5">{t('sources.5')}</SelectItem>
        </SelectContent>
      </Select>

      {/* Status filter */}
      <Select
        className="w-full sm:w-44"
        value={filters.status !== undefined ? String(filters.status) : undefined}
        onValueChange={(val) =>
          onChange({ status: val !== undefined ? Number(val) : undefined, page: 1 })
        }
      >
        <SelectTrigger id="customer-filter-status" className="w-full! min-w-0" aria-label={t('labels.status')}>
          <SelectValue placeholder={t('placeholders.status')} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="1">{t('statuses.1')}</SelectItem>
          <SelectItem value="0">{t('statuses.0')}</SelectItem>
        </SelectContent>
      </Select>

      {/* Reset — only visible when any filter is active */}
      {hasActiveFilters && (
        <Button
          id="customer-filter-reset"
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

