/**
 * Appointment Repository for Reception Context
 * @module AppointmentRepository
 */
import { BaseRepository } from '@/infra/api/base-repository'
import { HttpService } from '@/infra/api/http-service'
import type { IHttpAdapter } from '@/infra/api/http-adapter'
import type { ResponseData } from '@/shared/types/common'
import type {
  Appointment,
  PaginatedAppointments,
  ListAppointmentFilters,
  ActivityLogEntry,
} from '../types'
import type { Visit } from '../types'
import { BackendVisitSchema } from '../schemas/store-visit.schema'

/**
 * Interface cho Appointment Repository trong Reception context
 */
export interface IReceptionAppointmentRepository {
  /**
   * Lấy danh sách lịch hẹn có phân trang
   * GET /api/v1/appointments
   */
  list(filters: ListAppointmentFilters): Promise<PaginatedAppointments>

  /**
   * Lấy chi tiết lịch hẹn
   * GET /api/v1/appointments/{id}
   */
  get(id: number): Promise<Appointment>

  /**
   * Hủy lịch hẹn
   * PATCH /api/v1/appointments/{id}/cancel
   */
  cancel(id: number): Promise<Appointment>

  /**
   * Check-in lịch hẹn (tạo Visit)
   * POST /api/v1/visits/from-appointment
   */
  checkIn(data: {
    appointment_id: number
    clinic_room_id: number
    is_priority?: boolean
  }): Promise<Visit>
}

/**
 * Appointment Repository Implementation
 */
export class AppointmentRepository
  extends BaseRepository
  implements IReceptionAppointmentRepository
{
  constructor(http: IHttpAdapter = HttpService) {
    super(http)
  }

  /**
   * HTTP 200 Fake-Error Guard
   */
  private assertOk(res: ResponseData<unknown> & { status_code?: number }) {
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

  /**
   * Lấy danh sách lịch hẹn có phân trang
   * GET /api/v1/appointments
   */
  async list(filters: ListAppointmentFilters): Promise<PaginatedAppointments> {
    const params = new URLSearchParams()

    if (filters.search) params.set('search', filters.search)
    if (filters.date_from) params.set('date_from', filters.date_from)
    if (filters.date_to) params.set('date_to', filters.date_to)
    if (filters.status) params.set('status', String(filters.status))
    if (filters.page) params.set('page', String(filters.page))
    if (filters.per_page) params.set('per_page', String(filters.per_page))

    const res = await this.get<ResponseData<PaginatedAppointments>>(
      `/api/appointments?${params.toString()}`,
    )
    return res.data
  }

  /**
   * Lấy chi tiết lịch hẹn
   * GET /api/v1/appointments/{id}
   */
  async get(id: number): Promise<Appointment> {
    const res = await this.get<ResponseData<Appointment>>(`/api/appointments/${id}`)
    return res.data
  }

  /**
   * Hủy lịch hẹn
   * PATCH /api/v1/appointments/{id}/cancel
   */
  async cancel(id: number): Promise<Appointment> {
    const res = await this.patch<ResponseData<Appointment>, Record<string, never>>(
      `/api/appointments/${id}/cancel`,
      {},
    )
    this.assertOk(res)
    return res.data
  }

  /**
   * Check-in lịch hẹn (tạo Visit)
   * POST /api/v1/visits/from-appointment
   */
  async checkIn(data: {
    appointment_id: number
    clinic_room_id: number
    is_priority?: boolean
  }): Promise<Visit> {
    const res = await this.post<
      ResponseData<Visit>,
      { appointment_id: number; clinic_room_id: number; is_priority?: boolean }
    >('/api/visits/from-appointment', data)
    this.assertOk(res)
    return BackendVisitSchema.parse(res.data)
  }
}

/**
 * Singleton instance
 */
export const appointmentRepository: IReceptionAppointmentRepository = new AppointmentRepository()
