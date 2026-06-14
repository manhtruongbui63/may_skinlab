import { BaseRepository } from '@/infra/api/base-repository'
import { HttpService } from '@/infra/api/http-service'
import type { IHttpAdapter } from '@/infra/api/http-adapter'
import type { AxiosResponse } from 'axios'
import type {
  Customer,
  CustomerFilters,
  StoreCustomerInput,
  UpdateCustomerInput,
  Paginated,
  Visit,
  TreatmentPlan,
  Invoice,
  CustomerDetail,
} from '../types'
import {
  BackendCustomerSchema,
  BackendCustomerListSchema,
  BackendCustomerDetailSchema,
  BackendVisitListSchema,
  BackendTreatmentPlanListSchema,
  BackendInvoiceListSchema,
  type BackendCustomer,
  type BackendVisit,
  type BackendTreatmentPlan,
  type BackendInvoice,
  type BackendCustomerDetail,
} from '../schemas/customer-schema'

type BackendEnvelope<T> = {
  status_code?: number
  success?: boolean
  message?: string | null
  errors?: Record<string, string[]> | null
  data: T
}

type BackendPaginatedEnvelope<T> = BackendEnvelope<T[]> & {
  meta: {
    current_page: number
    last_page: number
    per_page: number
    total: number
  }
}

export interface ICustomerRepository {
  /** GET /api/customers */
  list(filters: CustomerFilters): Promise<Paginated<Customer>>
  /** POST /api/customers */
  create(data: StoreCustomerInput): Promise<Customer>
  /** PATCH /api/customers/{id} */
  update(id: number, data: UpdateCustomerInput): Promise<Customer>
  /** DELETE /api/customers/{id} */
  delete(id: number): Promise<void>
  /** GET /api/customers/{id} */
  detail(id: number): Promise<CustomerDetail>
  /** GET /api/customers/{id}/visits */
  visits(id: number): Promise<Visit[]>
  /** GET /api/customers/{id}/treatment-plans */
  treatmentPlans(id: number): Promise<TreatmentPlan[]>
  /** GET /api/customers/{id}/invoices */
  invoices(id: number): Promise<Invoice[]>
  /** POST /api/upload-image */
  uploadAvatar(file: File): Promise<{ url: string; thumb: string; id: number }>
}

export function mapBackendCustomer(item: BackendCustomer): Customer {
  return {
    id: item.id,
    code: item.code,
    fullName: item.full_name,
    phone: item.phone,
    phoneSecondary: item.phone_secondary || undefined,
    birthDate: item.birth_date || undefined,
    age: item.age || undefined,
    gender: item.gender || undefined,
    houseNumber: item.house_number || undefined,
    province: item.province || undefined,
    ward: item.ward || undefined,
    address: item.address || undefined,
    isAddressManuallyEdited: Boolean(item.is_address_manually_edited),
    avatarPath: item.avatar_path || undefined,
    source: item.source || undefined,
    status: item.status,
    outstandingAmount: item.outstanding_amount,
    createdAt: item.created_at,
    updatedAt: item.updated_at,
  }
}

export function mapBackendVisit(item: BackendVisit): Visit {
  return {
    id: item.id,
    visitDate: item.visit_date,
    doctorName: item.doctor_name,
    notes: item.notes || undefined,
    diagnosis: item.diagnosis || undefined,
  }
}

export function mapBackendTreatmentPlan(item: BackendTreatmentPlan): TreatmentPlan {
  return {
    id: item.id,
    planName: item.plan_name,
    status: item.status,
    startDate: item.start_date,
    endDate: item.end_date || undefined,
  }
}

export function mapBackendInvoice(item: BackendInvoice): Invoice {
  return {
    id: item.id,
    invoiceNumber: item.invoice_number,
    amount: item.amount,
    paidAmount: item.paid_amount,
    outstandingAmount: item.outstanding_amount,
    issueDate: item.issue_date,
    status: item.status,
  }
}

export function mapBackendCustomerDetail(item: BackendCustomerDetail): CustomerDetail {
  return {
    ...mapBackendCustomer(item),
    visits: item.visits ? item.visits.map(mapBackendVisit) : undefined,
    treatmentPlans: item.treatment_plans ? item.treatment_plans.map(mapBackendTreatmentPlan) : undefined,
    invoices: item.invoices ? item.invoices.map(mapBackendInvoice) : undefined,
  }
}


export class CustomerRepository extends BaseRepository implements ICustomerRepository {
  constructor(http: IHttpAdapter = HttpService) {
    super(http)
  }

  private assertOk(res: BackendEnvelope<unknown>) {
    const statusCode = res?.status_code
    const isError = statusCode === 422 || res?.success === false
    if (isError || statusCode === 401) {
      const error = new Error(res?.message || 'Request failed') as Error & {
        response?: { data?: unknown; status?: number }
      }
      error.response = { data: res, status: statusCode ?? (res?.success === false ? 422 : 500) }
      throw error
    }
  }

  async list(filters: CustomerFilters): Promise<Paginated<Customer>> {
    const res = await this.get<BackendPaginatedEnvelope<BackendCustomer[]>>(
      '/api/customers',
      this.buildListParams(filters),
    )
    this.assertOk(res)

    const parsedData = BackendCustomerListSchema.parse(res.data)

    return {
      data: parsedData.map(mapBackendCustomer),
      total: res.meta.total,
      perPage: res.meta.per_page,
      currentPage: res.meta.current_page,
      lastPage: res.meta.last_page,
    }
  }

  async create(data: StoreCustomerInput): Promise<Customer> {
    const payload = {
      full_name: data.fullName,
      phone: data.phone,
      phone_secondary: data.phoneSecondary || null,
      birth_date: data.birthDate || null,
      gender: data.gender ?? null,
      house_number: data.houseNumber || null,
      province_id: data.provinceId ?? null,
      ward_id: data.wardId ?? null,
      address: data.address || null,
      is_address_manually_edited: data.isAddressManuallyEdited ?? false,
      avatar_path: data.avatarPath || null,
      source: data.source ?? null,
      status: data.status ?? 1,
    }

    const res = await this.post<BackendEnvelope<BackendCustomer>, typeof payload>(
      '/api/customers',
      payload,
    )
    this.assertOk(res)

    const parsedCustomer = BackendCustomerSchema.parse(res.data)
    return mapBackendCustomer(parsedCustomer)
  }

  async update(id: number, data: UpdateCustomerInput): Promise<Customer> {
    const payload: Record<string, unknown> = {}
    if (data.fullName !== undefined) payload.full_name = data.fullName
    if (data.phone !== undefined) payload.phone = data.phone
    if (data.phoneSecondary !== undefined) payload.phone_secondary = data.phoneSecondary || null
    if (data.birthDate !== undefined) payload.birth_date = data.birthDate || null
    if (data.gender !== undefined) payload.gender = data.gender ?? null
    if (data.houseNumber !== undefined) payload.house_number = data.houseNumber || null
    if (data.provinceId !== undefined) payload.province_id = data.provinceId ?? null
    if (data.wardId !== undefined) payload.ward_id = data.wardId ?? null
    if (data.address !== undefined) payload.address = data.address || null
    if (data.isAddressManuallyEdited !== undefined)
      payload.is_address_manually_edited = data.isAddressManuallyEdited
    if (data.avatarPath !== undefined) payload.avatar_path = data.avatarPath || null
    if (data.source !== undefined) payload.source = data.source ?? null
    if (data.status !== undefined) payload.status = data.status ?? null

    const res = await this.patch<BackendEnvelope<BackendCustomer>, typeof payload>(
      `/api/customers/${id}`,
      payload,
    )
    this.assertOk(res)

    const parsedCustomer = BackendCustomerSchema.parse(res.data)
    return mapBackendCustomer(parsedCustomer)
  }

  async detail(id: number): Promise<CustomerDetail> {
    const res = await this.get<BackendEnvelope<BackendCustomerDetail>>(`/api/customers/${id}`)
    this.assertOk(res)
    const parsed = BackendCustomerDetailSchema.parse(res.data)
    return mapBackendCustomerDetail(parsed)
  }

  async visits(id: number): Promise<Visit[]> {
    const res = await this.get<BackendEnvelope<BackendVisit[]>>(`/api/customers/${id}/visits`)
    this.assertOk(res)
    const parsed = BackendVisitListSchema.parse(res.data)
    return parsed.map(mapBackendVisit)
  }

  async treatmentPlans(id: number): Promise<TreatmentPlan[]> {
    const res = await this.get<BackendEnvelope<BackendTreatmentPlan[]>>(`/api/customers/${id}/treatment-plans`)
    this.assertOk(res)
    const parsed = BackendTreatmentPlanListSchema.parse(res.data)
    return parsed.map(mapBackendTreatmentPlan)
  }

  async invoices(id: number): Promise<Invoice[]> {
    const res = await this.get<BackendEnvelope<BackendInvoice[]>>(`/api/customers/${id}/invoices`)
    this.assertOk(res)
    const parsed = BackendInvoiceListSchema.parse(res.data)
    return parsed.map(mapBackendInvoice)
  }

  async delete(id: number): Promise<void> {
    // Avoid name clash with BaseRepository.delete wrapper by calling http.delete directly
    const response = await this.http.delete<unknown, AxiosResponse<BackendEnvelope<null>>>(
      this.buildUrl(`/api/customers/${id}`),
    )
    this.assertOk(response.data)
  }

  async uploadAvatar(file: File): Promise<{ url: string; thumb: string; id: number }> {
    const formData = new FormData()
    formData.append('image', file)
    formData.append('type', 'avatar')

    const res = await this.post<
      BackendEnvelope<{ url: string; thumb: string; type: string; id: number }>
    >('/api/upload-image', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    this.assertOk(res)
    return res.data
  }

  private buildListParams(filters: CustomerFilters) {
    const params = new URLSearchParams()
    if (filters.search) params.set('search', filters.search)
    if (filters.provinceId !== undefined) params.set('province_id', String(filters.provinceId))
    if (filters.source !== undefined) params.set('source', String(filters.source))
    if (filters.status !== undefined) params.set('status', String(filters.status))
    params.set('page', String(filters.page ?? 1))
    params.set('per_page', String(filters.perPage ?? 20))
    return params
  }
}

export const customerRepository: ICustomerRepository = new CustomerRepository()
