import { http, HttpResponse, delay } from 'msw'
import { BaseMock } from '@/infra/mocks/base-mock'
import type { ClinicRoom, Service, ServicePackage } from '../types'

/**
 * Mock data for clinic rooms
 */
const clinicRooms: ClinicRoom[] = [
  { id: 1, name: 'Phòng Da Liễu', code: 'P01' },
  { id: 2, name: 'Phòng Tư Vấn', code: 'P02' },
  { id: 3, name: 'Phòng Laser', code: 'P03' },
  { id: 4, name: 'Phòng Trị Mụn', code: 'P04' },
  { id: 5, name: 'Phòng Thẩm Mỹ', code: 'P05' },
  { id: 6, name: 'Phòng Chăm Sóc Da', code: 'P06' },
]

/**
 * Mock data for services
 */
const services: Service[] = [
  { id: 1, name: 'Khám Da Cơ Bản', code: 'SVC01', price: '150000.00' },
  { id: 2, name: 'Laser CO2 Fractional', code: 'SVC02', price: '1500000.00' },
  { id: 3, name: 'Trị Mụn Chuyên Sâu', code: 'SVC03', price: '800000.00' },
  { id: 4, name: 'Chăm Sóc Da Cao Cấp', code: 'SVC04', price: '500000.00' },
  { id: 5, name: 'Tư Vấn Da Miễn Phí', code: 'SVC05', price: null },
  { id: 6, name: 'Lăn Kim Vi Điểm', code: 'SVC06', price: '1200000.00' },
  { id: 7, name: 'Peel Da Hóa Học', code: 'SVC07', price: '600000.00' },
  { id: 8, name: 'Trị Nám Melasma', code: 'SVC08', price: '2000000.00' },
  { id: 9, name: 'Điều Trị Sẹo Rỗ', code: 'SVC09', price: '1800000.00' },
  { id: 10, name: 'Trẻ Hóa Da RF', code: 'SVC10', price: '2500000.00' },
]

/**
 * Mock data for service packages
 */
const servicePackages: ServicePackage[] = [
  { id: 1, name: 'Gói Cơ Bản', code: 'PKG01', price: '500000.00' },
  { id: 2, name: 'Gói Nâng Cao', code: 'PKG02', price: '1200000.00' },
  { id: 3, name: 'Gói Cao Cấp', code: 'PKG03', price: '2500000.00' },
  { id: 4, name: 'Gói Trị Mụn 10 Buổi', code: 'PKG04', price: '3500000.00' },
  { id: 5, name: 'Gói Laser Toàn Mặt', code: 'PKG05', price: '5000000.00' },
  { id: 6, name: 'Gói Trẻ Hóa 6 Tháng', code: 'PKG06', price: '8000000.00' },
  { id: 7, name: 'Gói Skincare VIP', code: 'PKG07', price: '15000000.00' },
]

/**
 * MSW Mock for Reception Master Data
 *
 * @description
 * Mocks the GET /api/v1/master-data endpoint for reception form.
 * Returns fixture data for clinic_rooms, services, and service_packages.
 */
export class ReceptionMasterDataMock extends BaseMock {
  /**
   * Returns MSW handlers for master data endpoint
   */
  public getHandlers() {
    return [
      http.get('*/api/master-data', async ({ request }) => {
        // Simulate network delay
        await delay(300)

        const url = new URL(request.url)

        // Backend expects resources[clinic_rooms]={} key-based params
        // Extract resource names from keys like resources[clinic_rooms]
        const resourceKeys: string[] = []
        url.searchParams.forEach((_, key) => {
          const match = key.match(/^resources\[(.+)\]$/)
          if (match) resourceKeys.push(match[1])
        })

        // Build response based on requested resources
        const responseData: Record<string, unknown> = {}

        // Return all if no specific resources requested
        const hasClinicRooms = resourceKeys.length === 0 || resourceKeys.includes('clinic_rooms')
        const hasServices = resourceKeys.length === 0 || resourceKeys.includes('services')
        const hasServicePackages = resourceKeys.length === 0 || resourceKeys.includes('service_packages')

        if (hasClinicRooms) {
          responseData.clinic_rooms = clinicRooms
        }

        if (hasServices) {
          responseData.services = services
        }

        if (hasServicePackages) {
          responseData.service_packages = servicePackages
        }

        return HttpResponse.json({
          success: true,
          message: '',
          errors: null,
          data: responseData,
        })
      }),
    ]
  }
}
