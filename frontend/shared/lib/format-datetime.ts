import { toValidDate } from "./format-date";

function pad2(value: number): string {
  return String(value).padStart(2, "0");
}

/**
 * Date + time for audit trails: DD/MM/YYYY HH:mm:ss.
 * Returns "" for missing/invalid input instead of rendering "NaN/NaN/NaN".
 * Parsing/validation is shared with format-date.ts via toValidDate().
 */
export function formatDateTime(value: string | Date | undefined | null): string {
  const date = toValidDate(value);
  if (!date) return "";
  return `${pad2(date.getDate())}/${pad2(date.getMonth() + 1)}/${date.getFullYear()} ${pad2(date.getHours())}:${pad2(date.getMinutes())}:${pad2(date.getSeconds())}`;
}
