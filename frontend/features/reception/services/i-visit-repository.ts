/**
 * Visit Repository Interface
 * @module IVisitRepository
 */
import type { Visit, StoreVisitInput, PaginatedVisits, ListVisitFilters } from '../types'

/**
 * Interface cho Visit Repository
 * Định nghĩa các methods cho Visit CRUD operations
 */
export interface IVisitRepository {
  /**
   * Tạo lượt khám mới (Walk-in)
   * POST /api/v1/visits
   */
  create(data: StoreVisitInput): Promise<Visit>

  /**
   * Cập nhật lượt khám
   * PUT /api/visits/{id}
   */
  update(id: number, data: StoreVisitInput): Promise<Visit>

  /**
   * Tạo lượt khám từ lịch hẹn (Check-in)
   * POST /api/v1/visits/from-appointment
   */
  createFromAppointment(data: {
    appointment_id: number
    clinic_room_id: number
    is_priority?: boolean
  }): Promise<Visit>

  /**
   * Lấy danh sách lượt khám có phân trang
   * GET /api/v1/visits
   */
  list(filters: ListVisitFilters): Promise<PaginatedVisits>

  /**
   * Hủy lượt khám
   * POST /api/v1/visits/{id}/cancel
   */
  cancel(id: number): Promise<Visit>

  /**
   * Xóa lượt khám (soft delete)
   * DELETE /api/v1/visits/{id}
   */
  delete(id: number): Promise<void>
}
