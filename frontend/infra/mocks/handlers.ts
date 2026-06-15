import { mockManager } from './mock-manager'
import { AuthMock } from '@/features/auth/mocks/auth.mock'
import { CustomerMock } from '@/features/customers/mocks/customer.mock'
import { ReceptionMasterDataMock } from '@/features/reception/mocks/master-data.mock'
import { VisitMock } from '@/features/reception/mocks/visit.mock'
import { AppointmentMock } from '@/features/reception/mocks/appointment.mock'
import { CustomerSearchMock } from '@/features/reception/mocks/customer.mock'

// Register all mock modules
mockManager.register(new AuthMock())
mockManager.register(new CustomerMock())
mockManager.register(new ReceptionMasterDataMock())
mockManager.register(new VisitMock())
mockManager.register(new AppointmentMock())
mockManager.register(new CustomerSearchMock())

// Export the combined handlers
export const handlers = mockManager.getAllHandlers()
