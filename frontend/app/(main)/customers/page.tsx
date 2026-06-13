'use client'

import { useMemo, useState } from 'react'
import { useTranslations } from 'next-intl'
import { usePathname, useRouter } from '@/i18n/routing'
import { useSearchParams } from 'next/navigation'
import { Plus, AlertCircle } from 'lucide-react'
import {
  Button,
  Alert,
  AlertTitle,
  AlertDescription,
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis,
} from '@bks/ds-system-sdk'

import {
  CustomerFiltersBar,
  CustomerTable,
  CustomerFormModal,
  CustomerDeleteDialog,
  useCustomers,
  useCustomerMutations,
  parseCustomerListQuery,
  serializeCustomerListQuery,
  queryToCustomerFilters,
  customerFiltersToQuery,
  type Customer,
  type CustomerFilters,
} from '@/features/customers'

export default function CustomersPage() {
  const t = useTranslations('customers')
  const pathname = usePathname()
  const router = useRouter()
  const searchParams = useSearchParams()

  // 1. Sync URL state
  const listQuery = useMemo(() => parseCustomerListQuery(searchParams), [searchParams])
  const filters = useMemo(() => queryToCustomerFilters(listQuery), [listQuery])

  // 2. Fetch data
  const { data: paginatedData, isLoading, isError, refetch } = useCustomers(filters)

  // 3. Mutations
  const { createMutation, updateMutation, deleteMutation } = useCustomerMutations()

  // 4. Modal and Dialog states
  const [modalOpen, setModalOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [activeCustomer, setActiveCustomer] = useState<Customer | null>(null)

  // Handlers for URL parameter updates
  const handleFiltersChange = (patch: Partial<CustomerFilters>) => {
    const nextFilters = { ...filters, ...patch }
    // Reset page to 1 on filter changes
    const nextQuery = customerFiltersToQuery({
      ...nextFilters,
      page: patch.page ?? 1,
    })
    const qs = serializeCustomerListQuery(nextQuery).toString()
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false })
  }

  const handlePageChange = (page: number) => {
    const nextQuery = { ...listQuery, page }
    const qs = serializeCustomerListQuery(nextQuery).toString()
    router.replace(`${pathname}?${qs}`, { scroll: false })
  }

  // Row action handlers
  const handleView = (customer: Customer) => {
    router.push(`/customers/${customer.id}`)
  }

  const handleEdit = (customer: Customer) => {
    setActiveCustomer(customer)
    setModalOpen(true)
  }

  const handleDelete = (customer: Customer) => {
    setActiveCustomer(customer)
    setDeleteDialogOpen(true)
  }

  const handleToggleStatus = async (id: number, newStatus: number) => {
    try {
      await updateMutation.mutateAsync({
        id,
        data: { status: newStatus },
      })
    } catch {
      // Errors are handled by the mutation toast policy
    }
  }

  const handleFormSubmit = async (formData: any) => {
    if (activeCustomer) {
      await updateMutation.mutateAsync({
        id: activeCustomer.id,
        data: formData,
      })
    } else {
      await createMutation.mutateAsync(formData)
    }
    setModalOpen(false)
  }

  const handleDeleteConfirm = async () => {
    if (activeCustomer) {
      await deleteMutation.mutateAsync(activeCustomer.id)
      setDeleteDialogOpen(false)
    }
  }

  // Calculate pagination pages array
  const currentPage = paginatedData?.currentPage ?? 1
  const lastPage = paginatedData?.lastPage ?? 1

  const renderPaginationItems = () => {
    const items = []
    
    // We show at most 5 page buttons or ellipses
    const maxVisible = 5
    let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2))
    let endPage = Math.min(lastPage, startPage + maxVisible - 1)

    if (endPage - startPage + 1 < maxVisible) {
      startPage = Math.max(1, endPage - maxVisible + 1)
    }

    if (startPage > 1) {
      items.push(
        <PaginationItem key={1}>
          <PaginationLink onClick={() => handlePageChange(1)} isActive={currentPage === 1}>
            1
          </PaginationLink>
        </PaginationItem>
      )
      if (startPage > 2) {
        items.push(
          <PaginationItem key="ellipsis-start">
            <PaginationEllipsis />
          </PaginationItem>
        )
      }
    }

    for (let p = startPage; p <= endPage; p++) {
      items.push(
        <PaginationItem key={p}>
          <PaginationLink onClick={() => handlePageChange(p)} isActive={currentPage === p}>
            {p}
          </PaginationLink>
        </PaginationItem>
      )
    }

    if (endPage < lastPage) {
      if (endPage < lastPage - 1) {
        items.push(
          <PaginationItem key="ellipsis-end">
            <PaginationEllipsis />
          </PaginationItem>
        )
      }
      items.push(
        <PaginationItem key={lastPage}>
          <PaginationLink onClick={() => handlePageChange(lastPage)} isActive={currentPage === lastPage}>
            {lastPage}
          </PaginationLink>
        </PaginationItem>
      )
    }

    return items
  }

  return (
    <div className="space-y-6 py-6">
      {/* Header section */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between px-4 md:px-6">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">
            {t('title')}
          </h1>
        </div>
        <div>
          <Button
            id="add-customer-btn"
            onClick={() => {
              setActiveCustomer(null)
              setModalOpen(true)
            }}
          >
            <Plus className="mr-2 size-4" aria-hidden />
            {t('createButton')}
          </Button>
        </div>
      </div>

      {/* Filter and Table container */}
      <div className="rounded-xl border border-border bg-card shadow-xs overflow-hidden">
        <CustomerFiltersBar filters={filters} onChange={handleFiltersChange} />

        {isError ? (
          <div className="p-6">
            <Alert variant="destructive" className="max-w-lg mx-auto">
              <AlertCircle className="size-4" />
              <AlertTitle>{t('table.noResults')}</AlertTitle>
              <AlertDescription className="mt-2 flex items-center justify-between gap-4">
                <span>{useTranslations('Api.errors')('default')}</span>
                <Button variant="outline" size="sm" onClick={() => refetch()}>
                  Thử lại
                </Button>
              </AlertDescription>
            </Alert>
          </div>
        ) : (
          <>
            <CustomerTable
              customers={paginatedData?.data ?? []}
              isLoading={isLoading}
              onView={handleView}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onToggleStatus={handleToggleStatus}
            />

            {/* Pagination Footer */}
            {!isLoading && paginatedData && paginatedData.total > 0 && (
              <div className="flex flex-col sm:flex-row items-center justify-between border-t border-border px-4 py-4 md:px-6 gap-4">
                <div className="text-sm text-muted-foreground">
                  Hiển thị {(currentPage - 1) * (paginatedData.perPage) + 1} -{' '}
                  {Math.min(currentPage * paginatedData.perPage, paginatedData.total)} trong tổng số{' '}
                  {paginatedData.total} khách hàng
                </div>
                {lastPage > 1 && (
                  <Pagination>
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious
                          onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                          className={currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                        />
                      </PaginationItem>
                      {renderPaginationItems()}
                      <PaginationItem>
                        <PaginationNext
                          onClick={() => handlePageChange(Math.min(lastPage, currentPage + 1))}
                          className={currentPage === lastPage ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* Modals */}
      <CustomerFormModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        customer={activeCustomer}
        isSubmitting={createMutation.isPending || updateMutation.isPending}
        onSubmit={handleFormSubmit}
      />

      <CustomerDeleteDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        customer={activeCustomer}
        isDeleting={deleteMutation.isPending}
        onConfirm={handleDeleteConfirm}
      />
    </div>
  )
}
