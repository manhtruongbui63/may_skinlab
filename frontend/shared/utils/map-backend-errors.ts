import type { UseFormSetError, FieldValues, Path } from 'react-hook-form'

/**
 * Map backend validation errors (Record<string, string[]>) vào RHF setError.
 *
 * Backend trả `errors` dạng: { "email": ["Email không hợp lệ"], "password": ["Mật khẩu quá ngắn"] }
 * Utility này map từng field vào RHF form errors, lấy message đầu tiên.
 *
 * @param errors - Backend errors object (từ response.errors hoặc error.response.data.errors)
 * @param setError - RHF setError function
 * @param fieldMap - Optional: map backend field name → form field name (snake_case → camelCase)
 *
 * @example
 * ```ts
 * // Basic usage
 * mapBackendErrors(backendErrors, setError)
 *
 * // With field mapping (snake_case → camelCase)
 * mapBackendErrors(backendErrors, setError, { user_name: 'userName' })
 * ```
 */
export function mapBackendErrors<T extends FieldValues>(
  errors: Record<string, string[]> | null | undefined,
  setError: UseFormSetError<T>,
  fieldMap?: Record<string, string>
): void {
  if (!errors) return

  Object.entries(errors).forEach(([backendField, messages]) => {
    if (!messages || messages.length === 0) return

    const formField = fieldMap?.[backendField] ?? backendField

    setError(formField as Path<T>, {
      type: 'server',
      message: messages[0],
    })
  })
}
