import { mockManager } from './mock-manager'
import { AuthMock } from '@/features/auth/mocks/auth.mock'
import { CustomerMock } from '@/features/customers/mocks/customer.mock'

// Register all mock modules
mockManager.register(new AuthMock())
mockManager.register(new CustomerMock())

// Export the combined handlers
export const handlers = mockManager.getAllHandlers()
