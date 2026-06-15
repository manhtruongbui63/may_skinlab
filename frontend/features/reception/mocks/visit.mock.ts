/**
 * Visit MSW Mocks
 * @module VisitMock
 */
import { http, HttpResponse, delay } from 'msw'
import { BaseMock } from '@/infra/mocks/base-mock'
import type { Visit, PaginatedVisits } from '../types'

/**
 * Mock Visit data
 */
const mockVisits: Visit[] = [
  {
    id: 1,
    code: 'KB260701-0001',
    queue_number: 1,
    registration_type: { value: 1, label: 'Vãng lai' },
    status: { value: 1, label: 'Đang chờ' },
    is_priority: false,
    visited_at: '2026-07-01T08:00:00+07:00',
    appointment_date: null,
    reason: 'Khám da định kỳ',
    customer: { id: 10, code: 'BN000001', full_name: 'Nguyễn Văn A' },
    clinic_room: { id: 1, name: 'Phòng Da Liễu' },
    services: [{ id: 1, name: 'Khám Da Cơ Bản' }],
    packages: [],
    created_at: '2026-07-01T08:00:00+07:00',
  },
  {
    id: 2,
    code: 'KB260701-0002',
    queue_number: 2,
    registration_type: { value: 2, label: 'Đặt lịch trước' },
    status: { value: 2, label: 'Đang khám' },
    is_priority: true,
    visited_at: '2026-07-01T08:30:00+07:00',
    appointment_date: '2026-07-01',
    reason: null,
    customer: { id: 11, code: 'BN000002', full_name: 'Trần Thị B' },
    clinic_room: { id: 2, name: 'Phòng Tư Vấn' },
    services: [],
    packages: [{ id: 1, name: 'Gói Cơ Bản' }],
    created_at: '2026-07-01T08:30:00+07:00',
  },
  {
    id: 3,
    code: 'KB260701-0003',
    queue_number: 3,
    registration_type: { value: 1, label: 'Vãng lai' },
    status: { value: 3, label: 'Đã hoàn thành' },
    is_priority: false,
    visited_at: '2026-07-01T09:00:00+07:00',
    appointment_date: null,
    reason: 'Trị mụn',
    customer: { id: 12, code: 'BN000003', full_name: 'Lê Văn C' },
    clinic_room: { id: 1, name: 'Phòng Da Liễu' },
    services: [{ id: 2, name: 'Trị Mụn Chuyên Sâu' }],
    packages: [],
    created_at: '2026-07-01T09:00:00+07:00',
  },
]

/**
 * MSW Mock for Visit API
 *
 * @description
 * Mocks the Visit endpoints for development and testing
 */
export class VisitMock extends BaseMock {
  private nextId = 4
  private visits = [...mockVisits]

  public getHandlers() {
    return [
      /**
       * GET /api/v1/visits - List visits
       */
      http.get('*/api/visits', async ({ request }) => {
        await delay(300)

        const url = new URL(request.url)
        const status = url.searchParams.get('status')
        const page = parseInt(url.searchParams.get('page') || '1', 10)
        const perPage = parseInt(url.searchParams.get('per_page') || '15', 10)

        // Filter visits
        let filtered = this.visits

        if (status) {
          filtered = filtered.filter((v) => v.status.value === parseInt(status, 10))
        }

        // Pagination
        const total = filtered.length
        const lastPage = Math.ceil(total / perPage)
        const start = (page - 1) * perPage
        const paginatedData = filtered.slice(start, start + perPage)

        return HttpResponse.json({
          success: true,
          message: '',
          errors: null,
          data: paginatedData,
          meta: {
            current_page: page,
            last_page: lastPage,
            per_page: perPage,
            total,
          },
        })
      }),

      /**
       * POST /api/v1/visits - Create visit
       */
      http.post('*/api/visits', async ({ request }) => {
        await delay(300)

        const body = (await request.json()) as {
          registration_type: number
          appointment_date?: string | null
          is_priority?: boolean
          clinic_room_id?: number
          service_ids?: number[]
          service_package_ids?: number[]
          reason?: string
          customer_id?: number
        }

        const newVisit: Visit = {
          id: this.nextId++,
          code: `KB260701-${String(this.nextId - 1).padStart(4, '0')}`,
          queue_number: this.nextId - 1,
          registration_type: {
            value: body.registration_type,
            label: body.registration_type === 1 ? 'Vãng lai' : 'Đặt lịch trước',
          },
          status: { value: 1, label: 'Đang chờ' },
          is_priority: body.is_priority ?? false,
          visited_at: new Date().toISOString(),
          appointment_date: body.appointment_date || null,
          reason: body.reason || null,
          customer: body.customer_id
            ? { id: body.customer_id, code: `BN${String(body.customer_id).padStart(6, '0')}`, full_name: 'Khách hàng mới' }
            : null,
          clinic_room: body.clinic_room_id ? { id: body.clinic_room_id, name: 'Phòng khám' } : null,
          services: (body.service_ids || []).map((id) => ({ id, name: `Dịch vụ ${id}` })),
          packages: (body.service_package_ids || []).map((id) => ({ id, name: `Gói ${id}` })),
          created_at: new Date().toISOString(),
        }

        this.visits.push(newVisit)

        return HttpResponse.json(
          {
            success: true,
            message: 'Lượt khám đã được tạo thành công.',
            errors: null,
            data: newVisit,
          },
          { status: 201 },
        )
      }),

      /**
       * POST /api/v1/visits/from-appointment - Create visit from appointment
       */
      http.post('*/api/visits/from-appointment', async ({ request }) => {
        await delay(300)

        const body = (await request.json()) as {
          appointment_id: number
          clinic_room_id: number
          is_priority?: boolean
        }

        const newVisit: Visit = {
          id: this.nextId++,
          code: `KB260701-${String(this.nextId - 1).padStart(4, '0')}`,
          queue_number: this.nextId - 1,
          registration_type: { value: 2, label: 'Đặt lịch trước' },
          status: { value: 1, label: 'Đang chờ' },
          is_priority: body.is_priority ?? false,
          visited_at: new Date().toISOString(),
          appointment_date: '2026-07-01',
          reason: null,
          customer: { id: body.appointment_id, code: `BN${String(body.appointment_id).padStart(6, '0')}`, full_name: 'Khách từ lịch hẹn' },
          clinic_room: { id: body.clinic_room_id, name: 'Phòng khám' },
          services: [],
          packages: [],
          created_at: new Date().toISOString(),
        }

        this.visits.push(newVisit)

        return HttpResponse.json(
          {
            success: true,
            message: 'Check-in từ lịch hẹn thành công.',
            errors: null,
            data: newVisit,
          },
          { status: 201 },
        )
      }),

      /**
       * POST /api/v1/visits/:id/cancel - Cancel visit
       */
      http.patch('*/api/visits/:id/cancel', async ({ params }) => {
        await delay(200)

        const id = parseInt(params.id as string, 10)
        const visit = this.visits.find((v) => v.id === id)

        if (!visit) {
          return HttpResponse.json(
            { success: false, message: 'Visit not found', errors: null, data: null },
            { status: 404 },
          )
        }

        visit.status = { value: 4, label: 'Đã hủy' }

        return HttpResponse.json({
          success: true,
          message: 'Lượt khám đã được hủy.',
          errors: null,
          data: visit,
        })
      }),

      /**
       * DELETE /api/v1/visits/:id - Delete visit
       */
      http.delete('*/api/visits/:id', async ({ params }) => {
        await delay(200)

        const id = parseInt(params.id as string, 10)
        const index = this.visits.findIndex((v) => v.id === id)

        if (index === -1) {
          return HttpResponse.json(
            { success: false, message: 'Visit not found', errors: null, data: null },
            { status: 404 },
          )
        }

        this.visits.splice(index, 1)

        return new HttpResponse(null, { status: 204 })
      }),
    ]
  }
}
