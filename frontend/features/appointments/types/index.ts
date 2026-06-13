export interface AppointmentCustomer {
  id: number
  full_name: string
  phone: string
}

export interface AppointmentStatus {
  value: number
  label: string
}

export interface Appointment {
  id: number
  customer_id: number
  appointment_at: string
  appointment_date: string
  appointment_time: string
  status: AppointmentStatus
  note: string | null
  customer?: AppointmentCustomer | null
  created_at?: string
  updated_at?: string
}

export interface AppointmentFilters {
  date?: string
  status?: number
  search?: string
  page: number
  perPage: number
}

export interface AppointmentFormData {
  customer_id: number
  appointment_date: string
  appointment_time: string
  note?: string
}

export interface Paginated<T> {
  data: T[]
  total: number
  perPage: number
  currentPage: number
  lastPage: number
}
