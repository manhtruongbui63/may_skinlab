/**
 * Appointment MSW Mocks (for Reception Tab 3)
 * @module AppointmentMock
 */
import { http, HttpResponse, delay } from 'msw'
import { BaseMock } from '@/infra/mocks/base-mock'
import type { Appointment, PaginatedAppointments, ActivityLogEntry } from '../types'

/**
 * Mock Activity Log
 */
const mockActivityLog: ActivityLogEntry[] = [
  {
    id: 1,
    description: 'Đặt lịch hẹn mới',
    causer: { name: 'Nguyễn Văn A' },
    created_at: '2026-06-28T10:00:00+07:00',
  },
  {
    id: 2,
    description: 'Cập nhật ngày hẹn',
    causer: { name: 'Trần Thị B' },
    created_at: '2026-06-29T14:30:00+07:00',
  },
]

/**
 * Mock Appointment data
 */
const mockAppointments: Appointment[] = [
  {
    id: 1,
    code: 'LH000001',
    status: { value: 1, label: 'Đã đặt lịch' },
    appointment_date: '2026-07-01',
    customer: { id: 10, code: 'BN000001', full_name: 'Nguyễn Văn A', phone: '0901234567' },
    clinic_room: { id: 1, name: 'Phòng Da Liễu' },
    services: [{ id: 1, name: 'Khám Da Cơ Bản' }],
    created_at: '2026-06-28T10:00:00+07:00',
    activity_log: mockActivityLog,
  },
  {
    id: 2,
    code: 'LH000002',
    status: { value: 7, label: 'Quá hạn' }, // OVERDUE
    appointment_date: '2026-06-25',
    customer: { id: 11, code: 'BN000002', full_name: 'Trần Thị B', phone: '0912345678' },
    clinic_room: { id: 2, name: 'Phòng Tư Vấn' },
    services: [{ id: 2, name: 'Trị Mụn Chuyên Sâu' }],
    created_at: '2026-06-20T09:00:00+07:00',
    activity_log: [],
  },
  {
    id: 3,
    code: 'LH000003',
    status: { value: 1, label: 'Đã đặt lịch' },
    appointment_date: '2026-07-02',
    customer: { id: 12, code: 'BN000003', full_name: 'Lê Văn C', phone: '0923456789' },
    clinic_room: null,
    services: [],
    created_at: '2026-06-29T15:00:00+07:00',
    activity_log: mockActivityLog.slice(0, 1),
  },
]

/**
 * MSW Mock for Appointment API (Reception context)
 *
 * @description
 * Mocks the Appointment endpoints for Tab 3 (S4, S8, S9)
 */
export class AppointmentMock extends BaseMock {
  private appointments = [...mockAppointments]

  public getHandlers() {
    return [
      /**
       * GET /api/v1/appointments - List appointments
       */
      http.get('*/api/appointments', async ({ request }) => {
        await delay(300)

        const url = new URL(request.url)
        const search = url.searchParams.get('search') || ''
        const status = url.searchParams.get('status')
        const page = parseInt(url.searchParams.get('page') || '1', 10)
        const perPage = parseInt(url.searchParams.get('per_page') || '15', 10)

        // Filter appointments
        let filtered = this.appointments

        // Filter by search (code, customer code, name, phone)
        if (search) {
          const searchLower = search.toLowerCase()
          filtered = filtered.filter(
            (a) =>
              a.code.toLowerCase().includes(searchLower) ||
              a.customer?.code.toLowerCase().includes(searchLower) ||
              a.customer?.full_name.toLowerCase().includes(searchLower) ||
              a.customer?.phone.includes(search),
          )
        }

        // Filter by status
        if (status) {
          filtered = filtered.filter((a) => a.status.value === parseInt(status, 10))
        }

        // Pagination
        const total = filtered.length
        const lastPage = Math.ceil(total / perPage)
        const start = (page - 1) * perPage
        const paginatedData = filtered.slice(start, start + perPage)

        const response: PaginatedAppointments = {
          data: paginatedData,
          meta: {
            current_page: page,
            last_page: lastPage,
            per_page: perPage,
            total,
          },
        }

        return HttpResponse.json({
          success: true,
          message: '',
          errors: null,
          data: response,
        })
      }),

      /**
       * GET /api/v1/appointments/:id - Get appointment detail
       */
      http.get('*/api/appointments/:id', async ({ params }) => {
        await delay(300)

        const id = parseInt(params.id as string, 10)
        const appointment = this.appointments.find((a) => a.id === id)

        if (!appointment) {
          return HttpResponse.json(
            { success: false, message: 'Appointment not found', errors: null, data: null },
            { status: 404 },
          )
        }

        return HttpResponse.json({
          success: true,
          message: '',
          errors: null,
          data: appointment,
        })
      }),

      /**
       * PATCH /api/v1/appointments/:id/cancel - Cancel appointment
       */
      http.patch('*/api/appointments/:id/cancel', async ({ params }) => {
        await delay(200)

        const id = parseInt(params.id as string, 10)
        const appointment = this.appointments.find((a) => a.id === id)

        if (!appointment) {
          return HttpResponse.json(
            { success: false, message: 'Appointment not found', errors: null, data: null },
            { status: 404 },
          )
        }

        // Update status to CANCELLED (5)
        appointment.status = { value: 5, label: 'Đã hủy' }

        return HttpResponse.json({
          success: true,
          message: 'Lịch hẹn đã được hủy.',
          errors: null,
          data: appointment,
        })
      }),
    ]
  }
}
