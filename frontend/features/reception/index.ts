/**
 * Reception Feature - Exports
 * @module ReceptionFeature
 */

// Types
export type {
  ClinicRoom,
  Service,
  ServicePackage,
  MasterDataResponse,
  ReceptionFormState,
  Visit,
  PaginatedVisits,
  ListVisitFilters,
  StoreVisitInput,
  Appointment,
  ActivityLogEntry,
  PaginatedAppointments,
  ListAppointmentFilters,
  CustomerSummary,
} from './types'

// Store
export { useReceptionFormStore } from './stores/reception-form-store'

// Hooks
export { useReceptionMasterData } from './hooks/use-reception-master-data'
export {
  useCreateVisit,
  useUpdateVisit,
  useCheckInFromAppointment,
  useVisits,
  useCancelVisit,
  useDeleteVisit,
} from './hooks/use-visits'
export {
  useAppointments,
  useAppointmentDetail,
  useCancelAppointment,
  useCreateVisitFromAppointment,
} from './hooks/use-appointments'
export { useSearchCustomers } from './hooks/use-search-customers'

// Repository
export type { IVisitRepository } from './services/i-visit-repository'
export { VisitRepository, visitRepository } from './services/visit-repository'
export type { IReceptionAppointmentRepository } from './services/appointment-repository'
export { AppointmentRepository, appointmentRepository } from './services/appointment-repository'

// Schemas
export {
  useStoreVisitSchema,
  BackendVisitSchema,
  BackendPaginatedVisitsSchema,
  RegistrationTypeEnum,
} from './schemas/store-visit.schema'

// Components
export * from './components'
