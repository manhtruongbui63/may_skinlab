import { BaseRepository } from '@/infra/api/base-repository'
import { HttpService } from '@/infra/api/http-service'
import type { IHttpAdapter } from '@/infra/api/http-adapter'
import type { AxiosResponse } from 'axios'
import type {
  Appointment,
  AppointmentFilters,
  AppointmentFormData,
  Paginated,
} from '../types'
import {
  BackendAppointmentSchema,
  BackendAppointmentListSchema,
} from '../schemas/appointment-form.schema'

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

export interface IAppointmentRepository {
  /** GET /api/appointments */
  list(filters: AppointmentFilters): Promise<Paginated<Appointment>>
  /** POST /api/appointments */
  create(data: AppointmentFormData): Promise<Appointment>
  /** PUT /api/appointments/{id} */
  update(id: number, data: Partial<AppointmentFormData> & { status?: number }): Promise<Appointment>
  /** DELETE /api/appointments/{id} */
  delete(id: number): Promise<void>
}

export class AppointmentRepository extends BaseRepository implements IAppointmentRepository {
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

  async list(filters: AppointmentFilters): Promise<Paginated<Appointment>> {
    const res = await this.get<BackendPaginatedEnvelope<unknown>>(
      '/api/appointments',
      this.buildListParams(filters),
    )
    this.assertOk(res)

    const parsedData = BackendAppointmentListSchema.parse(res.data)

    return {
      data: parsedData,
      total: res.meta.total,
      perPage: res.meta.per_page,
      currentPage: res.meta.current_page,
      lastPage: res.meta.last_page,
    }
  }

  async create(data: AppointmentFormData): Promise<Appointment> {
    const payload = {
      customer_id: data.customer_id,
      appointment_date: data.appointment_date,
      appointment_time: data.appointment_time,
      note: data.note || null,
    }

    const res = await this.post<BackendEnvelope<unknown>, typeof payload>(
      '/api/appointments',
      payload,
    )
    this.assertOk(res)

    const parsedAppointment = BackendAppointmentSchema.parse(res.data)
    return parsedAppointment
  }

  async update(id: number, data: Partial<AppointmentFormData> & { status?: number }): Promise<Appointment> {
    const payload: Record<string, unknown> = {}
    if (data.customer_id !== undefined) payload.customer_id = data.customer_id
    if (data.appointment_date !== undefined) payload.appointment_date = data.appointment_date
    if (data.appointment_time !== undefined) payload.appointment_time = data.appointment_time
    if (data.note !== undefined) payload.note = data.note || null
    if (data.status !== undefined) payload.status = data.status

    const res = await this.put<BackendEnvelope<unknown>, typeof payload>(
      `/api/appointments/${id}`,
      payload,
    )
    this.assertOk(res)

    const parsedAppointment = BackendAppointmentSchema.parse(res.data)
    return parsedAppointment
  }

  async delete(id: number): Promise<void> {
    const response = await this.http.delete<unknown, AxiosResponse<BackendEnvelope<null>>>(
      this.buildUrl(`/api/appointments/${id}`),
    )
    this.assertOk(response.data)
  }

  private buildListParams(filters: AppointmentFilters) {
    const params = new URLSearchParams()
    if (filters.search) params.set('search', filters.search)
    if (filters.date) params.set('date', filters.date)
    if (filters.status !== undefined) params.set('status', String(filters.status))
    params.set('page', String(filters.page ?? 1))
    params.set('per_page', String(filters.perPage ?? 15))
    return params
  }
}

export const appointmentRepository: IAppointmentRepository = new AppointmentRepository()
