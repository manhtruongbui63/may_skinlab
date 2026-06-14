'use client'

import * as React from 'react'
import { useTranslations } from 'next-intl'
import { notFound } from 'next/navigation'
import { usePathname, useRouter } from '@/i18n/routing'
import { useSearchParams } from 'next/navigation'
import { ArrowLeft, Edit2 } from 'lucide-react'
import {
  Button,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
  Skeleton,
} from '@bks/ds-system-sdk'
import {
  useCustomerDetail,
  useCustomerVisits,
  useCustomerTreatmentPlans,
  useCustomerInvoices,
  CustomerProfileCard,
  VisitsTab,
  TreatmentPlansTab,
  InvoicesTab,
  CustomerFormModal,
  useCustomerMutations,
  type CustomerFormInput,
} from '@/features/customers'

type CustomerDetailPageProps = {
  params: Promise<{ id: string }>
}

export default function CustomerDetailPage({ params }: CustomerDetailPageProps) {
  const t = useTranslations('customers')
  const pathname = usePathname()
  const router = useRouter()
  const searchParams = useSearchParams()

  const resolvedParams = React.use(params)
  const id = Number(resolvedParams.id)

  // Redirect to 404 if ID is not a valid number
  if (isNaN(id) || id <= 0) {
    notFound()
  }

  // 1. Fetch main customer detail and sub-resource data in parallel
  const { data: customer, isLoading: isDetailLoading, isError: isDetailError } = useCustomerDetail(id)
  const { data: visits, isLoading: isVisitsLoading } = useCustomerVisits(id)
  const { data: plans, isLoading: isPlansLoading } = useCustomerTreatmentPlans(id)
  const { data: invoices, isLoading: isInvoicesLoading } = useCustomerInvoices(id)

  // 2. Edit Mutation
  const { updateMutation } = useCustomerMutations()
  const [editModalOpen, setEditModalOpen] = React.useState(false)

  // 3. Tab Syncing with URL Search Params
  const activeTab = searchParams.get('tab') || 'visits'

  const handleTabChange = (val: string) => {
    router.replace(`${pathname}?tab=${val}`, { scroll: false })
  }

  // Handle errors
  if (isDetailError) {
    notFound()
  }

  const handleFormSubmit = async (formData: CustomerFormInput) => {
    await updateMutation.mutateAsync({
      id,
      data: formData,
    })
    setEditModalOpen(false)
  }

  return (
    <div className="space-y-6 py-6 px-4 md:px-6">
      {/* Header section with back navigation and edit button */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="icon"
            onClick={() => router.push('/customers')}
            className="rounded-full shadow-xs hover:bg-muted"
            aria-label={t('labels.actions')}
          >
            <ArrowLeft className="size-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">
              {isDetailLoading ? (
                <Skeleton className="h-8 w-48" />
              ) : (
                customer?.fullName
              )}
            </h1>
          </div>
        </div>
        {!isDetailLoading && customer && (
          <div>
            <Button
              id="edit-customer-btn"
              onClick={() => setEditModalOpen(true)}
              className="shadow-xs"
            >
              <Edit2 className="mr-2 size-4" />
              Chỉnh sửa
            </Button>
          </div>
        )}
      </div>

      {/* Main Content Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left Column - Profile Card */}
        <div className="lg:col-span-1">
          {isDetailLoading ? (
            <div className="rounded-xl border border-border bg-card p-6 space-y-6">
              <div className="flex items-center gap-4 border-b border-border pb-4">
                <Skeleton className="size-16 rounded-full" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-6 w-32" />
                  <Skeleton className="h-4 w-20" />
                </div>
              </div>
              <Skeleton className="h-16 w-full rounded-xl" />
              <div className="space-y-4">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
                <Skeleton className="h-4 w-2/3" />
              </div>
            </div>
          ) : customer ? (
            <CustomerProfileCard customer={customer} />
          ) : null}
        </div>

        {/* Right Column - Sub-resource Tabs */}
        <div className="lg:col-span-2 rounded-xl border border-border bg-card shadow-xs overflow-hidden">
          <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
            <div className="border-b border-border px-6 py-2.5 bg-muted/20">
              <TabsList variant="line">
                <TabsTrigger value="visits">
                  {t('labels.tabVisits')}
                </TabsTrigger>
                <TabsTrigger value="plans">
                  {t('labels.tabPlans')}
                </TabsTrigger>
                <TabsTrigger value="invoices">
                  {t('labels.tabInvoices')}
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="visits" className="focus-visible:outline-hidden">
              <VisitsTab visits={visits} isLoading={isVisitsLoading} />
            </TabsContent>

            <TabsContent value="plans" className="focus-visible:outline-hidden">
              <TreatmentPlansTab plans={plans} isLoading={isPlansLoading} />
            </TabsContent>

            <TabsContent value="invoices" className="focus-visible:outline-hidden">
              <InvoicesTab invoices={invoices} isLoading={isInvoicesLoading} />
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Edit Form Modal */}
      {!isDetailLoading && customer && (
        <CustomerFormModal
          open={editModalOpen}
          onOpenChange={setEditModalOpen}
          customer={customer}
          isSubmitting={updateMutation.isPending}
          onSubmit={handleFormSubmit}
        />
      )}
    </div>
  )
}
