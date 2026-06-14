export interface Customer {
  id: number
  code: string
  fullName: string
  phone: string
  phoneSecondary?: string
  birthDate?: string
  age?: number
  gender?: {
    value: number
    label: string
  }
  houseNumber?: string
  province?: {
    id: number
    name: string
  }
  ward?: {
    id: number
    provinceId: number
    name: string
  }
  address?: string
  isAddressManuallyEdited: boolean
  avatarPath?: string
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
  provinceId?: number
  source?: number
  status?: number
  page: number
  perPage: number
}

export interface StoreCustomerInput {
  fullName: string
  phone: string
  phoneSecondary?: string
  birthDate?: string
  gender?: number
  houseNumber?: string
  provinceId?: number
  wardId?: number
  address?: string
  isAddressManuallyEdited?: boolean
  avatarPath?: string
  source?: number
  status?: number
}

export interface UpdateCustomerInput {
  fullName?: string
  phone?: string
  phoneSecondary?: string
  birthDate?: string
  gender?: number
  houseNumber?: string
  provinceId?: number
  wardId?: number
  address?: string
  isAddressManuallyEdited?: boolean
  avatarPath?: string
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
