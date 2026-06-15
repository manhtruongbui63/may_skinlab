/**
 * Customer Search MSW Mock
 * @module CustomerSearchMock
 */
import { http, HttpResponse, delay } from 'msw'
import { BaseMock } from '@/infra/mocks/base-mock'
import type { CustomerSummary } from '../types'

/**
 * Mock customer data for search
 */
const mockCustomers: CustomerSummary[] = [
  {
    id: 1,
    code: 'BN000001',
    full_name: 'Nguyễn Văn A',
    phone: '0901234567',
    province: { id: 79, name: 'Thành phố Hồ Chí Minh' },
    gender: { value: 1, label: 'Nam' },
    birth_date: '1990-05-15',
    email: 'nguyenvana@example.com',
    address: '123 Nguyễn Văn A, Quận 1',
  },
  {
    id: 2,
    code: 'BN000002',
    full_name: 'Trần Thị B',
    phone: '0912345678',
    province: { id: 1, name: 'Hà Nội' },
    gender: { value: 2, label: 'Nữ' },
    birth_date: '1985-08-20',
    email: 'tranthib@example.com',
    address: '456 Trần Thị B, Quận Hoàn Kiếm',
  },
  {
    id: 3,
    code: 'BN000003',
    full_name: 'Lê Văn C',
    phone: '0923456789',
    province: { id: 48, name: 'Đà Nẵng' },
    gender: { value: 1, label: 'Nam' },
    birth_date: '1995-03-10',
    email: null,
    address: '789 Lê Văn C, Quận Hải Châu',
  },
  {
    id: 4,
    code: 'BN000004',
    full_name: 'Phạm Thị D',
    phone: '0934567890',
    province: { id: 92, name: 'Cần Thơ' },
    gender: { value: 2, label: 'Nữ' },
    birth_date: '1988-12-25',
    email: 'phamthid@example.com',
    address: null,
  },
  {
    id: 5,
    code: 'BN000005',
    full_name: 'Nguyễn Văn E',
    phone: '0945678901',
    province: { id: 31, name: 'Hải Phòng' },
    gender: { value: 1, label: 'Nam' },
    birth_date: '1992-07-08',
    email: 'nguyenvane@example.com',
    address: '321 Nguyễn Văn E, Quận Ngô Quyền',
  },
]

/**
 * MSW Mock for Customer Search
 *
 * @description
 * Mocks the GET /api/customers/search?search=:query endpoint
 * Returns different results based on query:
 * - Empty or < 2 chars: empty array
 * - Exact match (e.g., "BN000001"): 1 result
 * - Partial match: multiple results
 * - No match: empty array
 */
export class CustomerSearchMock extends BaseMock {
  public getHandlers() {
    return [
      http.get('*/api/customers/search', async ({ request }) => {
        await delay(300)

        const url = new URL(request.url)
        const search = url.searchParams.get('search') || ''

        // Return empty if query is too short
        if (search.length < 2) {
          return HttpResponse.json({
            success: true,
            message: '',
            errors: null,
            data: [],
          })
        }

        const searchLower = search.toLowerCase()

        // Filter customers by code, name, or phone
        const filtered = mockCustomers.filter((customer) => {
          const codeMatch = customer.code.toLowerCase().includes(searchLower)
          const nameMatch = customer.full_name.toLowerCase().includes(searchLower)
          const phoneMatch = customer.phone.includes(search)
          return codeMatch || nameMatch || phoneMatch
        })

        return HttpResponse.json({
          success: true,
          message: '',
          errors: null,
          data: filtered,
        })
      }),
    ]
  }
}
