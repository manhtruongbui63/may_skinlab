'use client'

import { useMemo, useState } from 'react'
import { useTranslations } from 'next-intl'
import { usePathname, useRouter } from '@/i18n/routing'
import { useSearchParams } from 'next/navigation'
import { Plus, AlertCircle, Calendar as CalendarIcon, Table as TableIcon } from 'lucide-react'
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
  ButtonGroup,
} from '@bks/ds-system-sdk'

import {
  AppointmentFiltersBar,
  AppointmentsCalendarView,
  AppointmentsTableView,
  AppointmentCreateModal,
  AppointmentDetailModal,
  useAppointments,
  useCreateAppointment,
  useUpdateAppointment,
  useDeleteAppointment,
  parseAppointmentListQuery,
  serializeAppointmentListQuery,
  queryToAppointmentFilters,
  appointmentFiltersToQuery,
  type Appointment,
  type AppointmentFilters,
  type AppointmentFormInput,
} from '@/features/appointments'

export default function AppointmentsPage() {
  const t = useTranslations('appointments')
  const tApi = useTranslations('Api.errors')
  const pathname = usePathname()
  const router = useRouter()
  const searchParams = useSearchParams()

  // 1. Sync URL state
  const listQuery = useMemo(() => parseAppointmentListQuery(searchParams), [searchParams])
  const filters = useMemo(() => queryToAppointmentFilters(listQuery), [listQuery])
  const currentView = listQuery.view

  // 2. Fetch data
  const { data: paginatedData, isLoading, isError, refetch } = useAppointments(filters)

  // 3. Mutations
  const createMutation = useCreateAppointment()
  const updateMutation = useUpdateAppointment()
  const deleteMutation = useDeleteAppointment()

  // 4. Modal states
  const [createOpen, setCreateOpen] = useState(false)
  const [detailOpen, setDetailOpen] = useState(false)
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null)
  const [selectedDate, setSelectedDate] = useState<string | undefined>(undefined)

  const handleFiltersChange = (patch: Partial<AppointmentFilters>) => {
    const nextFilters = { ...filters, ...patch }
    const nextQuery = appointmentFiltersToQuery(
      {
        ...nextFilters,
        page: patch.page ?? 1,
      },
      currentView
    )
    const qs = serializeAppointmentListQuery(nextQuery).toString()
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false })
  }

  const handlePageChange = (page: number) => {
    const nextQuery = { ...listQuery, page }
    const qs = serializeAppointmentListQuery(nextQuery).toString()
    router.replace(`${pathname}?${qs}`, { scroll: false })
  }

  const handleViewChange = (view: 'calendar' | 'table') => {
    const nextQuery = { ...listQuery, view, page: 1 }
    const qs = serializeAppointmentListQuery(nextQuery).toString()
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false })
  }

  const handleSelectAppointment = (appt: Appointment) => {
    setSelectedAppointment(appt)
    setDetailOpen(true)
  }

  const handleCreateAppointmentOnDate = (date: string) => {
    setSelectedDate(date)
    setCreateOpen(true)
  }

  const handleCreateSubmit = async (formData: AppointmentFormInput) => {
    await createMutation.mutateAsync(formData)
    setCreateOpen(false)
    setSelectedDate(undefined)
  }

  const handleUpdateSubmit = async (id: number, patchData: Partial<AppointmentFormInput> & { status?: number }) => {
    await updateMutation.mutateAsync({ id, data: patchData })
  }

  const handleDeleteConfirm = async (id: number) => {
    await deleteMutation.mutateAsync(id)
  }

  const handleStartVisit = (appt: Appointment) => {
    router.push(`/visits/create?appointment_id=${appt.id}`)
  }

  // Calculate pagination pages array
  const currentPage = paginatedData?.currentPage ?? 1
  const lastPage = paginatedData?.lastPage ?? 1

  const renderPaginationItems = () => {
    const items = []
    const maxVisible = 5
    const rawStartPage = Math.max(1, currentPage - Math.floor(maxVisible / 2))
    const endPage = Math.min(lastPage, rawStartPage + maxVisible - 1)
    const startPage = Math.max(1, endPage - maxVisible + 1)

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
        <div className="flex items-center gap-3">
          {/* View Switcher Toggle */}
          <ButtonGroup>
            <Button
              variant={currentView === 'calendar' ? 'default' : 'secondary'}
              size="icon"
              onClick={() => handleViewChange('calendar')}
              aria-label={t('view.calendar')}
            >
              <CalendarIcon className="size-4" />
            </Button>
            <Button
              variant={currentView === 'table' ? 'default' : 'secondary'}
              size="icon"
              onClick={() => handleViewChange('table')}
              aria-label={t('view.table')}
            >
              <TableIcon className="size-4" />
            </Button>
          </ButtonGroup>

          <Button
            id="add-appointment-btn"
            onClick={() => {
              setSelectedDate(undefined)
              setCreateOpen(true)
            }}
          >
            <Plus className="mr-2 size-4" aria-hidden />
            {t('createButton')}
          </Button>
        </div>
      </div>

      {/* Filter and Content Container */}
      <div className="rounded-xl border border-border bg-card shadow-xs overflow-hidden">
        <AppointmentFiltersBar filters={filters} onChange={handleFiltersChange} />

        {isError ? (
          <div className="p-6">
            <Alert variant="destructive" className="max-w-lg mx-auto">
              <AlertCircle className="size-4" />
              <AlertTitle>{t('table.noResults')}</AlertTitle>
              <AlertDescription className="mt-2 flex items-center justify-between gap-4">
                <span>{tApi('default')}</span>
                <Button variant="outline" size="sm" onClick={() => refetch()}>
                  {t('table.retry')}
                </Button>
              </AlertDescription>
            </Alert>
          </div>
        ) : (
          <>
            {currentView === 'calendar' ? (
              <div className="p-4 md:p-6">
                <AppointmentsCalendarView
                  appointments={paginatedData?.data ?? []}
                  onSelectAppointment={handleSelectAppointment}
                  onCreateAppointmentOnDate={handleCreateAppointmentOnDate}
                />
              </div>
            ) : (
              <>
                <AppointmentsTableView
                  appointments={paginatedData?.data ?? []}
                  isLoading={isLoading}
                  onView={handleSelectAppointment}
                  onEdit={handleSelectAppointment}
                  onDelete={(appt) => {
                    setSelectedAppointment(appt)
                    if (confirm(t('delete.description'))) {
                      handleDeleteConfirm(appt.id)
                    }
                  }}
                />

                {/* Pagination Footer */}
                {!isLoading && paginatedData && paginatedData.total > 0 && (
                  <div className="flex flex-col sm:flex-row items-center justify-between border-t border-border px-4 py-4 md:px-6 gap-4">
                    <div className="text-sm text-muted-foreground">
                      {t('table.pagination', {
                        from: (currentPage - 1) * paginatedData.perPage + 1,
                        to: Math.min(currentPage * paginatedData.perPage, paginatedData.total),
                        total: paginatedData.total,
                      })}
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
          </>
        )}
      </div>

      {/* Create Modal */}
      <AppointmentCreateModal
        open={createOpen}
        onOpenChange={setCreateOpen}
        isSubmitting={createMutation.isPending}
        onSubmit={handleCreateSubmit}
        defaultDate={selectedDate}
      />

      {/* Detail Modal */}
      <AppointmentDetailModal
        open={detailOpen}
        onOpenChange={setDetailOpen}
        appointment={selectedAppointment}
        isSubmitting={updateMutation.isPending}
        isDeleting={deleteMutation.isPending}
        onUpdate={async (id, data) => {
          await handleUpdateSubmit(id, data)
          // Refresh details state or let react-query refetch
          refetch()
        }}
        onDelete={async (id) => {
          await handleDeleteConfirm(id)
          refetch()
        }}
        onStartVisit={handleStartVisit}
      />
    </div>
  )
}
