export interface Customer {
  id: number
  fullName: string
  phone: string
  birthDate?: string
  gender?: {
    value: number
    label: string
  }
  address?: string
  source?: {
    value: number
    label: string
  }
  status: {
    value: number
    label: string
  }
  outstandingAmount: number
  createdAt?: string
  updatedAt?: string
}

export interface CustomerFilters {
  search?: string
  gender?: number
  source?: number
  status?: number
  page: number
  perPage: number
}

export interface StoreCustomerInput {
  fullName: string
  phone: string
  birthDate?: string
  gender?: number
  address?: string
  source?: number
  status?: number
}

export interface UpdateCustomerInput {
  fullName?: string
  phone?: string
  birthDate?: string
  gender?: number
  address?: string
  source?: number
  status?: number
}

export interface Paginated<T> {
  data: T[]
  total: number
  perPage: number
  currentPage: number
  lastPage: number
}

export interface Visit {
  id: number
  visitDate: string
  doctorName: string
  notes?: string
  diagnosis?: string
}

export interface TreatmentPlan {
  id: number
  planName: string
  status: string
  startDate: string
  endDate?: string
}

export interface Invoice {
  id: number
  invoiceNumber: string
  amount: number
  paidAmount: number
  outstandingAmount: number
  issueDate: string
  status: string
}

export interface CustomerDetail extends Customer {
  visits?: Visit[]
  treatmentPlans?: TreatmentPlan[]
  invoices?: Invoice[]
}
