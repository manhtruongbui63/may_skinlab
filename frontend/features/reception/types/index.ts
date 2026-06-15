/**
 * Types for Reception feature
 * @module ReceptionTypes
 */

/**
 * Clinic Room - Phòng khám
 */
export interface ClinicRoom {
  id: number
  name: string
  code: string | null
}

/**
 * Service - Dịch vụ khám
 */
export interface Service {
  id: number
  name: string
  code: string | null
  price: string | null
}

/**
 * Service Package - Gói dịch vụ
 */
export interface ServicePackage {
  id: number
  name: string
  code: string | null
  price: string | null
}

/**
 * Master Data Response from backend
 */
export interface MasterDataResponse {
  clinic_rooms?: ClinicRoom[]
  services?: Service[]
  service_packages?: ServicePackage[]
  [key: string]: unknown
}

/**
 * Reception Form State
 * Lưu state của form Cột 1 - persistent khi chuyển tab
 */
export interface ReceptionFormState {
  // Form fields
  registrationType: number | null
  appointmentDate: string | null
  isPriority: boolean
  clinicRoomId: number | null
  serviceIds: number[]
  servicePackageIds: number[]
  reason: string
  customerId: number | null
  mode: 'create' | 'edit'
  visitId: number | null
  visitCode: string | null

  // Actions
  setField: <K extends keyof Omit<ReceptionFormState, 'setField' | 'reset'>>(
    field: K,
    value: ReceptionFormState[K],
  ) => void
  reset: () => void
}

/**
 * Visit - Lượt khám
 */
export interface Visit {
  id: number
  code: string
  queue_number: number
  registration_type: { value: number; label: string }
  status: { value: number; label: string }
  is_priority: boolean
  visited_at: string
  appointment_date: string | null
  reason: string | null
  customer: {
    id: number
    code: string
    full_name: string
    phone?: string | null
    gender?: { value: number; label: string } | null
  } | null
  clinic_room: { id: number; name: string } | null
  services: { id: number; name: string }[]
  packages: { id: number; name: string }[]
  created_at: string
}

/**
 * Paginated Visits Response
 */
export interface PaginatedVisits {
  data: Visit[]
  meta: { current_page: number; last_page: number; per_page: number; total: number }
}

/**
 * List Visit Filters
 */
export interface ListVisitFilters {
  from?: string
  to?: string
  status?: number
  per_page?: number
  page?: number
}

/**
 * Store Visit Input (Create)
 */
export interface StoreVisitInput {
  registration_type: number
  appointment_date?: string | null
  is_priority?: boolean
  clinic_room_id?: number | null
  service_ids?: number[]
  service_package_ids?: number[]
  reason?: string | null
  customer_id?: number | null
}

/**
 * Appointment - Lịch hẹn (dùng trong Tab 3)
 */
export interface Appointment {
  id: number
  code: string
  status: { value: number; label: string }
  appointment_date: string
  customer: { id: number; code: string; full_name: string; phone: string } | null
  clinic_room: { id: number; name: string } | null
  services: { id: number; name: string }[]
  created_at: string
  // Activity log (cho S9):
  activity_log?: ActivityLogEntry[]
}

/**
 * Activity Log Entry
 */
export interface ActivityLogEntry {
  id: number
  description: string
  causer: { name: string } | null
  created_at: string
}

/**
 * List Appointment Filters
 */
export interface ListAppointmentFilters {
  search?: string
  date_from?: string
  date_to?: string
  status?: number
  per_page?: number
  page?: number
}

/**
 * Paginated Appointments Response
 */
export interface PaginatedAppointments {
  data: Appointment[]
  meta: { current_page: number; last_page: number; per_page: number; total: number }
}

/**
 * Customer Summary - Dùng cho customer search trong Reception
 */
export interface CustomerSummary {
  id: number
  code: string
  full_name: string
  phone: string
  province?: { id: number; name: string } | null
  gender?: { value: number; label: string } | null
  birth_date?: string | null
  email?: string | null
  address?: string | null
}
