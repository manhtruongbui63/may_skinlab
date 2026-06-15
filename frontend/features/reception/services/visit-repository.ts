/**
 * Visit Repository Implementation
 * @module VisitRepository
 */
import { BaseRepository } from '@/infra/api/base-repository'
import { HttpService } from '@/infra/api/http-service'
import type { IHttpAdapter } from '@/infra/api/http-adapter'
import type { ResponseData } from '@/shared/types/common'
import type {
  Visit,
  StoreVisitInput,
  PaginatedVisits,
  ListVisitFilters,
} from '../types'
import type { IVisitRepository } from './i-visit-repository'
import { BackendVisitSchema, BackendPaginatedVisitsSchema } from '../schemas/store-visit.schema'

/**
 * Visit Repository Implementation
 * Extends BaseRepository, implements IVisitRepository
 */
export class VisitRepository extends BaseRepository implements IVisitRepository {
  constructor(http: IHttpAdapter = HttpService) {
    super(http)
  }

  /**
   * HTTP 200 Fake-Error Guard
   * Backend Laravel có thể nhúng 422/lỗi vào HTTP 200 body
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
   * Tạo lượt khám mới (Walk-in)
   * POST /api/v1/visits
   */
  async create(data: StoreVisitInput): Promise<Visit> {
    const res = await this.post<ResponseData<Visit>, StoreVisitInput>('/api/visits', data)
    this.assertOk(res)
    return BackendVisitSchema.parse(res.data)
  }

  /**
   * Cập nhật lượt khám
   * PUT /api/visits/{id}
   */
  async update(id: number, data: StoreVisitInput): Promise<Visit> {
    const res = await this.put<ResponseData<Visit>, StoreVisitInput>(`/api/visits/${id}`, data)
    this.assertOk(res)
    return BackendVisitSchema.parse(res.data)
  }

  /**
   * Tạo lượt khám từ lịch hẹn (Check-in)
   * POST /api/v1/visits/from-appointment
   */
  async createFromAppointment(data: {
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

  /**
   * Lấy danh sách lượt khám có phân trang
   * GET /api/v1/visits
   */
  async list(filters: ListVisitFilters): Promise<PaginatedVisits> {
    const params = new URLSearchParams()

    if (filters.from) params.set('from', filters.from)
    if (filters.to) params.set('to', filters.to)
    if (filters.status) params.set('status', String(filters.status))
    if (filters.page) params.set('page', String(filters.page))
    if (filters.per_page) params.set('per_page', String(filters.per_page))

    const res = await this.get<
      ResponseData<unknown[]> & {
        meta: { current_page: number; last_page: number; per_page: number; total: number }
      }
    >(`/api/visits?${params.toString()}`)

    const paginatedData = {
      data: res.data,
      meta: res.meta,
    }

    return BackendPaginatedVisitsSchema.parse(paginatedData)
  }

  /**
   * Hủy lượt khám
   * POST /api/v1/visits/{id}/cancel
   */
  async cancel(id: number): Promise<Visit> {
    const res = await this.patch<ResponseData<Visit>, Record<string, never>>(
      `/api/visits/${id}/cancel`,
      {},
    )
    this.assertOk(res)
    return BackendVisitSchema.parse(res.data)
  }

  /**
   * Xóa lượt khám (soft delete)
   * DELETE /api/v1/visits/{id}
   */
  async delete(id: number): Promise<void> {
    const res = await this.delete<ResponseData<null>>(`/api/visits/${id}`)
    this.assertOk(res)
  }
}

/**
 * Singleton instance - import trong service/hook
 */
export const visitRepository: IVisitRepository = new VisitRepository()
