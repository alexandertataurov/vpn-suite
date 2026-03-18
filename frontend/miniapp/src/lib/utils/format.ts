// Why: preserve miniapp-local imports while formatter behavior is centralized in shared.
export {
  formatDate,
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
export type { FormatDateTimeOptions, TimeZoneMode } from "@vpn-suite/shared";

