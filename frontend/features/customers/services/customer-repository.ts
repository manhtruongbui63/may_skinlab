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
}

export function mapBackendCustomer(item: BackendCustomer): Customer {
  return {
    id: item.id,
    fullName: item.full_name,
    phone: item.phone,
    birthDate: item.birth_date || undefined,
    gender: item.gender || undefined,
    address: item.address || undefined,
    source: item.source || undefined,
    status: item.status,
    outstandingAmount: item.outstanding_amount,
    createdAt: item.created_at,
    updatedAt: item.updated_at,
  }
}

export function mapBackendVisit(item: any): Visit {
  return {
    id: item.id,
    visitDate: item.visit_date,
    doctorName: item.doctor_name,
    notes: item.notes || undefined,
    diagnosis: item.diagnosis || undefined,
  }
}

export function mapBackendTreatmentPlan(item: any): TreatmentPlan {
  return {
    id: item.id,
    planName: item.plan_name,
    status: item.status,
    startDate: item.start_date,
    endDate: item.end_date || undefined,
  }
}

export function mapBackendInvoice(item: any): Invoice {
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

export function mapBackendCustomerDetail(item: any): CustomerDetail {
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
      birth_date: data.birthDate || null,
      gender: data.gender ?? null,
      address: data.address || null,
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
    if (data.birthDate !== undefined) payload.birth_date = data.birthDate || null
    if (data.gender !== undefined) payload.gender = data.gender ?? null
    if (data.address !== undefined) payload.address = data.address || null
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
    const res = await this.get<BackendEnvelope<any>>(`/api/customers/${id}`)
    this.assertOk(res)
    const parsed = BackendCustomerDetailSchema.parse(res.data)
    return mapBackendCustomerDetail(parsed)
  }

  async visits(id: number): Promise<Visit[]> {
    const res = await this.get<BackendEnvelope<any[]>>(`/api/customers/${id}/visits`)
    this.assertOk(res)
    const parsed = BackendVisitListSchema.parse(res.data)
    return parsed.map(mapBackendVisit)
  }

  async treatmentPlans(id: number): Promise<TreatmentPlan[]> {
    const res = await this.get<BackendEnvelope<any[]>>(`/api/customers/${id}/treatment-plans`)
    this.assertOk(res)
    const parsed = BackendTreatmentPlanListSchema.parse(res.data)
    return parsed.map(mapBackendTreatmentPlan)
  }

  async invoices(id: number): Promise<Invoice[]> {
    const res = await this.get<BackendEnvelope<any[]>>(`/api/customers/${id}/invoices`)
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

  private buildListParams(filters: CustomerFilters) {
    const params = new URLSearchParams()
    if (filters.search) params.set('search', filters.search)
    if (filters.gender !== undefined) params.set('gender', String(filters.gender))
    if (filters.source !== undefined) params.set('source', String(filters.source))
    if (filters.status !== undefined) params.set('status', String(filters.status))
    params.set('page', String(filters.page ?? 1))
    params.set('per_page', String(filters.perPage ?? 20))
    return params
  }
}

export const customerRepository: ICustomerRepository = new CustomerRepository()
