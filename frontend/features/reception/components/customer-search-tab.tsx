/**
 * Customer Search Tab Container (S2 + S5)
 * @module CustomerSearchTab
 */
'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { Alert, AlertDescription } from '@/bks/ds-system-sdk/components/ui/alert'
import { cn } from '@/bks/ds-system-sdk/lib/utils'

import { CustomerSearchBar } from './customer-search-bar'
import { CustomerInfoCard } from './customer-info-card'
import { CustomerSearchModal } from './customer-search-modal'
import { HttpService } from '@/infra/api/http-service'
import type { CustomerSummary } from '../types'
import { CustomerFormModal, useCustomerMutations, type CustomerFormInput } from '@/features/customers'

export interface CustomerSearchTabProps {
  selectedCustomer?: CustomerSummary | null
  onCustomerSelect?: (customer: CustomerSummary | null) => void
  className?: string
}

/**
 * Container component cho Tab 1 (Thông tin Khách Hàng)
 * Chỉ gọi API khi click button Search
 */
export function CustomerSearchTab({
  selectedCustomer: externalSelectedCustomer,
  onCustomerSelect,
  className,
}: CustomerSearchTabProps) {
  const t = useTranslations('reception')
  const [internalSelectedCustomer, setInternalSelectedCustomer] = useState<CustomerSummary | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchKeyword, setSearchKeyword] = useState('') // Keyword đã search
  const [results, setResults] = useState<CustomerSummary[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)

  // Customer Mutations
  const { createMutation } = useCustomerMutations()

  // Use external or internal state
  const selectedCustomer = externalSelectedCustomer ?? internalSelectedCustomer

  // Reset internal search states when selectedCustomer is cleared externally (e.g. on successful form submit)
  useEffect(() => {
    if (externalSelectedCustomer === null) {
      const timer = setTimeout(() => {
        setSearchQuery('')
        setSearchKeyword('')
        setResults([])
        setHasSearched(false)
        setError(null)
        setInternalSelectedCustomer(null)
      }, 0)
      return () => clearTimeout(timer)
    }
  }, [externalSelectedCustomer])

  // Handle search button click
  const handleSearch = async () => {
    if (searchQuery.length < 2) return

    // Clear old data before calling API
    setInternalSelectedCustomer(null)
    onCustomerSelect?.(null)
    setResults([])

    setIsLoading(true)
    setError(null)
    setHasSearched(true)
    setSearchKeyword(searchQuery)

    try {
      const axiosResponse = await HttpService.get<never, {
        data: {
          success: boolean
          data: CustomerSummary[]
          message?: string
        }
      }>(`/api/customers/search?search=${encodeURIComponent(searchQuery)}`)

      const response = axiosResponse.data

      if (response.success && Array.isArray(response.data)) {
        const customers = response.data
        setResults(customers)

        if (customers.length === 1) {
          // S2: Auto-fill single result
          setInternalSelectedCustomer(customers[0])
          onCustomerSelect?.(customers[0])
        } else if (customers.length > 1) {
          // S5: Open modal for multiple results
          setIsModalOpen(true)
        }
        // If 0 results, show empty state
      } else {
        setResults([])
      }
    } catch (err) {
      console.error('Search error:', err)
      setError(err instanceof Error ? err : new Error('Search failed'))
      setResults([])
    } finally {
      setIsLoading(false)
    }
  }

  // Handle customer selection from modal
  const handleModalSelect = (customer: CustomerSummary) => {
    setInternalSelectedCustomer(customer)
    onCustomerSelect?.(customer)
    setIsModalOpen(false)
  }

  // Reset all customer search state and notify parent
  const handleReset = () => {
    setSearchQuery('')
    setSearchKeyword('')
    setResults([])
    setHasSearched(false)
    setError(null)
    setInternalSelectedCustomer(null)
    onCustomerSelect?.(null)
  }

  // Handle submit from CustomerFormModal
  const handleCreateSubmit = async (formData: CustomerFormInput) => {
    const response = await createMutation.mutateAsync(formData)
    if (response) {
      const newCustomer: CustomerSummary = {
        id: response.id,
        code: response.code,
        full_name: response.fullName,
        phone: response.phone || '',
        gender: response.gender ? { value: response.gender.value, label: response.gender.label } : undefined,
        birth_date: response.birthDate || null,
        address: response.address || null,
      }
      setInternalSelectedCustomer(newCustomer)
      onCustomerSelect?.(newCustomer)
    }
    setIsCreateModalOpen(false)
  }

  return (
    <div className={cn('space-y-4', className)}>
      {/* Search Bar với Button */}
      <CustomerSearchBar
        value={searchQuery}
        onChange={setSearchQuery}
        onSearch={handleSearch}
        isLoading={isLoading}
      />

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error.message}</AlertDescription>
        </Alert>
      )}

      {/* No results hint - chỉ hiện khi đã search và không có kết quả */}
      {hasSearched && !isLoading && !error && searchKeyword.length >= 2 && results.length === 0 && (
        <Alert>
          <AlertDescription>
            {t('customer_search.no_results_hint')}
          </AlertDescription>
        </Alert>
      )}

      {/* Customer Info Card */}
      <CustomerInfoCard
        customer={selectedCustomer}
        onReset={handleReset}
        onAddCustomer={() => setIsCreateModalOpen(true)}
      />

      {/* Search Modal (S5) */}
      <CustomerSearchModal
        isOpen={isModalOpen}
        results={results}
        isLoading={isLoading}
        onSelect={handleModalSelect}
        onClose={() => setIsModalOpen(false)}
      />

      {/* Create Customer Modal */}
      <CustomerFormModal
        open={isCreateModalOpen}
        onOpenChange={setIsCreateModalOpen}
        customer={null}
        isSubmitting={createMutation.isPending}
        onSubmit={handleCreateSubmit}
      />
    </div>
  )
}
