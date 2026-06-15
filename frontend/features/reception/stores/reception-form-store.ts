import { create } from 'zustand'
import type { ReceptionFormState } from '../types'

/**
 * Initial state for reception form
 * Tất cả fields về giá trị mặc định (null/false/[])
 */
const initialState: Omit<ReceptionFormState, 'setField' | 'reset'> = {
  registrationType: 1,
  appointmentDate: null,
  isPriority: false,
  clinicRoomId: null,
  serviceIds: [],
  servicePackageIds: [],
  reason: '',
  customerId: null,
  mode: 'create',
  visitId: null,
  visitCode: null,
}

/**
 * Zustand store for Reception Form state (Column 1)
 *
 * @description
 * Lưu state form Cột 1 - persistent khi chuyển tab trong cùng session.
 * Store KHÔNG persist giữa page reload (không dùng persist middleware).
 *
 * @example
 * ```ts
 * const { registrationType, setField, reset } = useReceptionFormStore()
 *
 * // Update a field
 * setField('registrationType', 1)
 *
 * // Reset all fields
 * reset()
 * ```
 */
export const useReceptionFormStore = create<ReceptionFormState>((set) => ({
  ...initialState,

  /**
   * Set a specific field value
   * @param field - Field name to update
   * @param value - New value for the field
   */
  setField: (field, value) =>
    set((state) => ({
      ...state,
      [field]: value,
    })),

  /**
   * Reset all form fields to initial state
   * Called after successful form submission
   */
  reset: () => set(initialState),
}))
