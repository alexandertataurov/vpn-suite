// Why: preserve miniapp-local imports while keeping date formatting explicit in the miniapp layer.
import {
  formatDateDisplay,
  formatDateLong,
  formatDateTime,
  formatPct,
  formatPercent01,
  formatTime,
  formatTimeAxis,
  formatDurationShort,
  formatBytes,
  formatRate,
  safeNumber,
} from "@vpn-suite/shared";

function toDate(value: string | Date): Date | null {
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function formatDate(value: string | Date, locale = "en-US"): string {
  const date = toDate(value);
  if (!date) return typeof value === "string" ? value : String(value);
  const includeYear = date.getFullYear() !== new Date().getFullYear();
  return new Intl.DateTimeFormat(locale, {
    month: "short",
    day: "numeric",
    ...(includeYear ? { year: "numeric" } : {}),
  }).format(date);
}

export {
  formatDateDisplay,
  formatDateLong,
  formatDateTime,
  formatPct,
  formatPercent01,
  formatTime,
  formatTimeAxis,
  formatDurationShort,
  formatBytes,
  formatRate,
  safeNumber,
};
export type { FormatDateTimeOptions, TimeZoneMode } from "@vpn-suite/shared";
