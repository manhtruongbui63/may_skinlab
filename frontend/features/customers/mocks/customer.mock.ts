import { http, HttpResponse, delay, type HttpHandler } from 'msw'
import { BaseMock } from '@/infra/mocks/base-mock'

interface MockCustomer {
  id: number
  code: string
  full_name: string
  phone: string
  phone_secondary: string | null
  birth_date: string | null
  age: number | null
  gender: { value: number; label: string } | null
  house_number: string | null
  province: { id: number; name: string } | null
  ward: { id: number; province_id: number; name: string } | null
  address: string | null
  is_address_manually_edited: boolean
  avatar_path: string | null
  source: { value: number; label: string } | null
  status: { value: number; label: string }
  outstanding_amount: number
  created_at: string
  updated_at: string
}

const mockCustomers: MockCustomer[] = [
  {
    id: 1,
    code: 'BN000001',
    full_name: 'Nguyễn Văn A',
    phone: '0987654321',
    phone_secondary: '0901234567',
    birth_date: '1990-05-15',
    age: 36,
    gender: { value: 1, label: 'Nam' },
    house_number: 'Số 10',
    province: { id: 1, name: 'Thành phố Hà Nội' },
    ward: { id: 1, province_id: 1, name: 'Phường Dịch Vọng' },
    address: 'Số 10, Phường Dịch Vọng, Thành phố Hà Nội',
    is_address_manually_edited: false,
    avatar_path: null,
    source: { value: 1, label: 'Facebook' },
    status: { value: 1, label: 'Active' },
    outstanding_amount: 1500000,
    created_at: '2026-06-11T08:00:00+07:00',
    updated_at: '2026-06-11T08:00:00+07:00',
  },
  {
    id: 2,
    code: 'BN000002',
    full_name: 'Trần Thị B',
    phone: '0912345678',
    phone_secondary: null,
    birth_date: '1995-10-20',
    age: 31,
    gender: { value: 2, label: 'Nữ' },
    house_number: '456 Đường XYZ',
    province: { id: 2, name: 'Thành phố Hồ Chí Minh' },
    ward: { id: 3, province_id: 2, name: 'Phường Bến Nghé' },
    address: '456 Đường XYZ, Phường Bến Nghé, Thành phố Hồ Chí Minh',
    is_address_manually_edited: false,
    avatar_path: null,
    source: { value: 2, label: 'Google' },
    status: { value: 1, label: 'Active' },
    outstanding_amount: 0,
    created_at: '2026-06-11T09:00:00+07:00',
    updated_at: '2026-06-11T09:00:00+07:00',
  },
  {
    id: 3,
    code: 'BN000003',
    full_name: 'Lê Văn C',
    phone: '0909090909',
    phone_secondary: null,
    birth_date: '1988-02-28',
    age: 38,
    gender: { value: 1, label: 'Nam' },
    house_number: '789 Đường LMN',
    province: null,
    ward: null,
    address: '789 Đường LMN',
    is_address_manually_edited: true,
    avatar_path: null,
    source: { value: 3, label: 'Website' },
    status: { value: 0, label: 'Inactive' },
    outstanding_amount: 500000,
    created_at: '2026-06-11T10:00:00+07:00',
    updated_at: '2026-06-11T10:00:00+07:00',
  },
]

const GENDERS = {
  1: 'Nam',
  2: 'Nữ',
  3: 'Khác',
}

const SOURCES = {
  1: 'Facebook',
  2: 'Google',
  3: 'Website',
  4: 'Referral',
  5: 'Walk-in',
}

const STATUSES = {
  0: 'Inactive',
  1: 'Active',
}

const mockVisits = [
  {
    id: 1,
    customer_id: 1,
    visit_date: '2026-06-10',
    doctor_name: 'Dr. Nguyễn Văn Kiểm',
    notes: 'Khám định kỳ răng miệng',
    diagnosis: 'Sâu răng nhẹ răng 36',
  },
  {
    id: 2,
    customer_id: 1,
    visit_date: '2026-06-12',
    doctor_name: 'Dr. Nguyễn Văn Kiểm',
    notes: 'Trám răng sâu',
    diagnosis: 'Trám răng 36 hoàn tất',
  },
  {
    id: 3,
    customer_id: 2,
    visit_date: '2026-06-05',
    doctor_name: 'Dr. Lê Kim Anh',
    notes: 'Tư vấn niềng răng',
    diagnosis: 'Hô xương hạng II',
  }
]

const mockTreatmentPlans = [
  {
    id: 1,
    customer_id: 1,
    plan_name: 'Điều trị sâu răng',
    status: 'Completed',
    start_date: '2026-06-10',
    end_date: '2026-06-12',
  },
  {
    id: 2,
    customer_id: 2,
    plan_name: 'Niềng răng mắc cài kim loại',
    status: 'In Progress',
    start_date: '2026-06-05',
    end_date: null,
  }
]

const mockInvoices = [
  {
    id: 1,
    customer_id: 1,
    invoice_number: 'HD-2026-0001',
    amount: 500000,
    paid_amount: 500000,
    outstanding_amount: 0,
    issue_date: '2026-06-12',
    status: 'Paid',
  },
  {
    id: 2,
    customer_id: 2,
    invoice_number: 'HD-2026-0002',
    amount: 30000000,
    paid_amount: 5000000,
    outstanding_amount: 25000000,
    issue_date: '2026-06-05',
    status: 'Partially Paid',
  }
]

// Mock databases for Master Data
const mockProvinces = [
  { id: 1, name: 'Thành phố Hà Nội' },
  { id: 2, name: 'Thành phố Hồ Chí Minh' },
]

const mockWards = [
  { id: 1, province_id: 1, name: 'Phường Dịch Vọng' },
  { id: 2, province_id: 1, name: 'Phường Dịch Vọng Hậu' },
  { id: 3, province_id: 2, name: 'Phường Bến Nghé' },
  { id: 4, province_id: 2, name: 'Phường Bến Thành' },
]

export class CustomerMock extends BaseMock {
  public getHandlers(): HttpHandler[] {
    return [
      // POST /api/upload-image
      http.post('*/api/upload-image', async () => {
        await delay(200)
        return HttpResponse.json({
          success: true,
          message: 'Operation successful',
          errors: null,
          data: {
            url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200&h=200',
            thumb: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=100&h=100',
            type: 'avatar',
            id: Math.floor(Math.random() * 1000)
          }
        })
      }),

      // GET /api/customers
      http.get('*/api/customers', async ({ request }) => {
        await delay(200)

        const url = new URL(request.url)
        const search = url.searchParams.get('search')?.toLowerCase()
        const provinceId = url.searchParams.get('province_id')
        const source = url.searchParams.get('source')
        const status = url.searchParams.get('status')
        const page = parseInt(url.searchParams.get('page') || '1', 10)
        const perPage = parseInt(url.searchParams.get('per_page') || '10', 10)

        let filtered = [...mockCustomers]

        if (search) {
          filtered = filtered.filter(
            (c) =>
              c.full_name.toLowerCase().includes(search) ||
              c.phone.includes(search),
          )
        }

        if (provinceId) {
          const provinceIdVal = parseInt(provinceId, 10)
          filtered = filtered.filter((c) => c.province?.id === provinceIdVal)
        }

        if (source) {
          const sourceVal = parseInt(source, 10)
          filtered = filtered.filter((c) => c.source?.value === sourceVal)
        }

        if (status) {
          const statusVal = parseInt(status, 10)
          filtered = filtered.filter((c) => c.status.value === statusVal)
        }

        const total = filtered.length
        const totalPages = Math.ceil(total / perPage)
        const start = (page - 1) * perPage
        const end = start + perPage
        const pageData = filtered.slice(start, end)

        return HttpResponse.json({
          success: true,
          message: '',
          errors: null,
          data: pageData,
          meta: {
            current_page: page,
            last_page: totalPages || 1,
            per_page: perPage,
            total,
          },
        })
      }),

      // GET /api/customers/:id
      http.get('*/api/customers/:id', async ({ params }) => {
        await delay(100)
        const id = parseInt(params.id as string, 10)
        const customer = mockCustomers.find((c) => c.id === id)

        if (!customer) {
          return HttpResponse.json(
            {
              success: false,
              message: 'Resource not found.',
              errors: null,
              data: null,
            },
            { status: 404 },
          )
        }

        return HttpResponse.json({
          success: true,
          message: '',
          errors: null,
          data: customer,
        })
      }),

      // POST /api/customers
      http.post('*/api/customers', async ({ request }) => {
        await delay(300)
        const body = (await request.json()) as {
          full_name?: string
          phone?: string
          phone_secondary?: string
          birth_date?: string
          gender?: number
          house_number?: string
          province_id?: number
          ward_id?: number
          address?: string
          is_address_manually_edited?: boolean
          avatar_path?: string
          source?: number
          status?: number
        }

        const errors: Record<string, string[]> = {}
        if (!body.full_name) {
          errors.full_name = ['The full name field is required.']
        }
        if (!body.phone) {
          errors.phone = ['The phone field is required.']
        } else if (!/^\+?[0-9]{7,15}$/.test(body.phone)) {
          // General fallback check in mock
          errors.phone = ['The phone format is invalid.']
        } else {
          const isDup = mockCustomers.some((c) => c.phone === body.phone)
          if (isDup) {
            errors.phone = ['The phone has already been taken.']
          }
        }

        if (Object.keys(errors).length > 0) {
          return HttpResponse.json(
            {
              success: false,
              message: 'Validation failed.',
              errors,
              data: null,
            },
            { status: 422 },
          )
        }

        const newId = mockCustomers.length > 0 ? Math.max(...mockCustomers.map((c) => c.id)) + 1 : 1
        const genderObj = body.gender && GENDERS[body.gender as keyof typeof GENDERS]
          ? { value: body.gender, label: GENDERS[body.gender as keyof typeof GENDERS] }
          : null

        const sourceObj = body.source && SOURCES[body.source as keyof typeof SOURCES]
          ? { value: body.source, label: SOURCES[body.source as keyof typeof SOURCES] }
          : null

        const statusVal = body.status !== undefined ? body.status : 1
        const statusObj = { value: statusVal, label: STATUSES[statusVal as keyof typeof STATUSES] || 'Active' }

        const provinceObj = body.province_id ? mockProvinces.find(p => p.id === body.province_id) || null : null
        const wardObj = body.ward_id ? mockWards.find(w => w.id === body.ward_id) || null : null

        let finalAddress = body.address || null
        const isAddressManual = Boolean(body.is_address_manually_edited)
        if (!isAddressManual && (body.house_number || provinceObj || wardObj)) {
          const parts = []
          if (body.house_number) parts.push(body.house_number)
          if (wardObj) parts.push(wardObj.name)
          if (provinceObj) parts.push(provinceObj.name)
          finalAddress = parts.join(', ')
        }

        let calculatedAge = null
        if (body.birth_date) {
          const birthYear = new Date(body.birth_date).getFullYear()
          calculatedAge = new Date().getFullYear() - birthYear
        }

        const newCustomer: MockCustomer = {
          id: newId,
          code: `BN${String(newId).padStart(6, '0')}`,
          full_name: body.full_name || '',
          phone: body.phone || '',
          phone_secondary: body.phone_secondary || null,
          birth_date: body.birth_date || null,
          age: calculatedAge,
          gender: genderObj,
          house_number: body.house_number || null,
          province: provinceObj,
          ward: wardObj,
          address: finalAddress,
          is_address_manually_edited: isAddressManual,
          avatar_path: body.avatar_path || null,
          source: sourceObj,
          status: statusObj,
          outstanding_amount: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }

        mockCustomers.push(newCustomer)

        return HttpResponse.json(
          {
            success: true,
            message: 'Customer created successfully.',
            errors: null,
            data: newCustomer,
          },
          { status: 201 },
        )
      }),

      // PATCH /api/customers/:id
      http.patch('*/api/customers/:id', async ({ params, request }) => {
        await delay(300)
        const id = parseInt(params.id as string, 10)
        const index = mockCustomers.findIndex((c) => c.id === id)

        if (index === -1) {
          return HttpResponse.json(
            {
              success: false,
              message: 'Resource not found.',
              errors: null,
              data: null,
            },
            { status: 404 },
          )
        }

        const body = (await request.json()) as {
          full_name?: string
          phone?: string
          phone_secondary?: string
          birth_date?: string
          gender?: number
          house_number?: string
          province_id?: number
          ward_id?: number
          address?: string
          is_address_manually_edited?: boolean
          avatar_path?: string
          source?: number
          status?: number
        }

        const errors: Record<string, string[]> = {}
        if (body.phone !== undefined) {
          if (!body.phone) {
            errors.phone = ['The phone field is required.']
          } else if (!/^\+?[0-9]{7,15}$/.test(body.phone)) {
            errors.phone = ['The phone format is invalid.']
          } else {
            const isDup = mockCustomers.some((c) => c.phone === body.phone && c.id !== id)
            if (isDup) {
              errors.phone = ['The phone has already been taken.']
            }
          }
        }

        if (Object.keys(errors).length > 0) {
          return HttpResponse.json(
            {
              success: false,
              message: 'Validation failed.',
              errors,
              data: null,
            },
            { status: 422 },
          )
        }

        const existing = mockCustomers[index]

        const genderObj = body.gender !== undefined
          ? (body.gender && GENDERS[body.gender as keyof typeof GENDERS]
              ? { value: body.gender, label: GENDERS[body.gender as keyof typeof GENDERS] }
              : null)
          : existing.gender

        const sourceObj = body.source !== undefined
          ? (body.source && SOURCES[body.source as keyof typeof SOURCES]
              ? { value: body.source, label: SOURCES[body.source as keyof typeof SOURCES] }
              : null)
          : existing.source

        const statusObj = body.status !== undefined
          ? { value: body.status, label: STATUSES[body.status as keyof typeof STATUSES] || 'Active' }
          : existing.status

        const provinceObj = body.province_id !== undefined
          ? (body.province_id ? mockProvinces.find(p => p.id === body.province_id) || null : null)
          : existing.province

        const wardObj = body.ward_id !== undefined
          ? (body.ward_id ? mockWards.find(w => w.id === body.ward_id) || null : null)
          : existing.ward

        const isAddressManual = body.is_address_manually_edited !== undefined
          ? Boolean(body.is_address_manually_edited)
          : existing.is_address_manually_edited

        let finalAddress = existing.address
        if (body.address !== undefined && isAddressManual) {
          finalAddress = body.address || null
        } else if (!isAddressManual) {
          const houseNum = body.house_number !== undefined ? body.house_number : existing.house_number
          const parts = []
          if (houseNum) parts.push(houseNum)
          if (wardObj) parts.push(wardObj.name)
          if (provinceObj) parts.push(provinceObj.name)
          finalAddress = parts.join(', ')
        }

        let calculatedAge = existing.age
        if (body.birth_date !== undefined) {
          if (body.birth_date) {
            const birthYear = new Date(body.birth_date).getFullYear()
            calculatedAge = new Date().getFullYear() - birthYear
          } else {
            calculatedAge = null
          }
        }

        const updatedCustomer: MockCustomer = {
          ...existing,
          full_name: body.full_name !== undefined ? body.full_name : existing.full_name,
          phone: body.phone !== undefined ? body.phone : existing.phone,
          phone_secondary: body.phone_secondary !== undefined ? (body.phone_secondary || null) : existing.phone_secondary,
          birth_date: body.birth_date !== undefined ? (body.birth_date || null) : existing.birth_date,
          age: calculatedAge,
          gender: genderObj,
          house_number: body.house_number !== undefined ? (body.house_number || null) : existing.house_number,
          province: provinceObj,
          ward: wardObj,
          address: finalAddress,
          is_address_manually_edited: isAddressManual,
          avatar_path: body.avatar_path !== undefined ? (body.avatar_path || null) : existing.avatar_path,
          source: sourceObj,
          status: statusObj,
          updated_at: new Date().toISOString(),
        }

        mockCustomers[index] = updatedCustomer

        return HttpResponse.json({
          success: true,
          message: 'Customer updated successfully.',
          errors: null,
          data: updatedCustomer,
        })
      }),

      // DELETE /api/customers/:id
      http.delete('*/api/customers/:id', async ({ params }) => {
        await delay(200)
        const id = parseInt(params.id as string, 10)
        const index = mockCustomers.findIndex((c) => c.id === id)

        if (index === -1) {
          return HttpResponse.json(
            {
              success: false,
              message: 'Resource not found.',
              errors: null,
              data: null,
            },
            { status: 404 },
          )
        }

        // Soft delete: remove from mock list in-memory
        mockCustomers.splice(index, 1)

        return new HttpResponse(null, { status: 204 })
      }),

      // GET /api/customers/:id/visits
      http.get('*/api/customers/:id/visits', async ({ params }) => {
        await delay(100)
        const id = parseInt(params.id as string, 10)
        const visits = mockVisits.filter((v) => v.customer_id === id)
        return HttpResponse.json({
          success: true,
          message: '',
          errors: null,
          data: visits,
        })
      }),

      // GET /api/customers/:id/treatment-plans
      http.get('*/api/customers/:id/treatment-plans', async ({ params }) => {
        await delay(100)
        const id = parseInt(params.id as string, 10)
        const plans = mockTreatmentPlans.filter((p) => p.customer_id === id)
        return HttpResponse.json({
          success: true,
          message: '',
          errors: null,
          data: plans,
        })
      }),

      // GET /api/customers/:id/invoices
      http.get('*/api/customers/:id/invoices', async ({ params }) => {
        await delay(100)
        const id = parseInt(params.id as string, 10)
        const invoices = mockInvoices.filter((i) => i.customer_id === id)
        return HttpResponse.json({
          success: true,
          message: '',
          errors: null,
          data: invoices,
        })
      }),

    ]
  }
}
