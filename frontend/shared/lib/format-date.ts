/**
 * Format date utilities
 * Formats: DD-MM-YYYY (date only).
 *
 * For date+time use `formatDateTime` from `./format-datetime` (DD/MM/YYYY
 * HH:mm:ss). This module intentionally exports only `formatDate`/`toValidDate`
 * to avoid two `formatDateTime` exports with different formats colliding.
 */

/**
 * Safely coerce a value into a valid Date, or null when it is missing/invalid.
 *
 * Date-only ISO strings ("YYYY-MM-DD") are parsed as LOCAL midnight rather than
 * UTC midnight, so they never shift by a day when formatted with local getters
 * in a timezone offset from UTC.
 */
export function toValidDate(value: string | Date | undefined | null): Date | null {
  if (!value) return null
  let d: Date
  if (typeof value === 'string') {
    d = /^\d{4}-\d{2}-\d{2}$/.test(value)
      ? new Date(`${value}T00:00:00`) // local midnight, not UTC
      : new Date(value)
  } else {
    d = value
  }
  return isNaN(d.getTime()) ? null : d
}

export function formatDate(date: string | Date | undefined | null): string {
  const d = toValidDate(date)
  if (!d) return ''

  const day = d.getDate().toString().padStart(2, '0')
  const month = (d.getMonth() + 1).toString().padStart(2, '0')
  const year = d.getFullYear()
  return `${day}/${month}/${year}`
}
