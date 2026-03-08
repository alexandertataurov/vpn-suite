// Why: preserve compatibility with both admin and miniapp formatter call shapes
// while centralizing behavior in one shared utility surface.

export type TimeZoneMode = "local" | "utc";

export interface FormatDateTimeOptions {
  timeZone?: string;
  dateStyle?: Intl.DateTimeFormatOptions["dateStyle"];
  timeStyle?: Intl.DateTimeFormatOptions["timeStyle"];
}

function toDate(value: string | number | Date): Date | null {
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function fallbackString(value: string | number | Date): string {
  return typeof value === "string" ? value : String(value);
}

export function formatDate(value: string | Date, options?: FormatDateTimeOptions): string {
  const date = toDate(value);
  if (!date) return fallbackString(value);
  return date.toLocaleDateString(undefined, {
    timeZone: options?.timeZone,
    dateStyle: options?.dateStyle,
  });
}

export function formatDateLong(value: string | Date, options?: FormatDateTimeOptions): string {
  const date = toDate(value);
  if (!date) return fallbackString(value);
  return date.toLocaleDateString(undefined, {
    timeZone: options?.timeZone,
    dateStyle: options?.dateStyle ?? "long",
  });
}

export function formatDateTime(value: string | Date, options?: FormatDateTimeOptions): string {
  const date = toDate(value);
  if (!date) return fallbackString(value);
  return date.toLocaleString(undefined, {
    timeZone: options?.timeZone,
    dateStyle: options?.dateStyle,
    timeStyle: options?.timeStyle,
  });
}

/** Relative time: "just now", "5 min ago", "2 h ago", or locale date. */
export function formatRelative(iso: string | null): string {
  if (!iso) return "—";
  const date = toDate(iso);
  if (!date) return "—";
  const sec = Math.floor((Date.now() - date.getTime()) / 1000);
  if (sec < 60) return "just now";
  if (sec < 3600) return `${Math.floor(sec / 60)} min ago`;
  if (sec < 86400) return `${Math.floor(sec / 3600)} h ago`;
  return date.toLocaleDateString();
}

function digitsFrom(input: number | { digits?: number } | undefined, fallback: number): number {
  if (typeof input === "number") return input;
  return input?.digits ?? fallback;
}

// Supports `formatPct(v, 1)` and `formatPct(v, { digits: 1 })`.
export function formatPct(valuePct: number, digitsOrOptions?: number | { digits?: number }): string {
  const value = Number.isFinite(valuePct) ? valuePct : 0;
  const digits = digitsFrom(digitsOrOptions, Math.abs(value) < 0.5 ? 1 : 0);
  return `${value.toFixed(digits)}%`;
}

// Supports `formatPercent01(v, 0)` and `formatPercent01(v, { digits: 0 })`.
export function formatPercent01(ratio: number, digitsOrOptions?: number | { digits?: number }): string {
  const value = Number.isFinite(ratio) ? ratio : 0;
  const digits = digitsFrom(digitsOrOptions, Math.abs(value) < 0.005 ? 1 : 0);
  return `${(value * 100).toFixed(digits)}%`;
}

function formatUtcOffset(minutesEastOfUtc: number): string {
  const sign = minutesEastOfUtc >= 0 ? "+" : "-";
  const abs = Math.abs(minutesEastOfUtc);
  const hh = String(Math.floor(abs / 60)).padStart(2, "0");
  const mm = String(abs % 60).padStart(2, "0");
  return `UTC${sign}${hh}:${mm}`;
}

/**
 * Overloaded behavior:
 * - miniapp legacy: `formatTime(isoString)`
 * - admin: `formatTime(tsMs, { tz, withSeconds })`
 */
export function formatTime(
  value: number | string | Date,
  options?: { tz?: TimeZoneMode; withSeconds?: boolean }
): string {
  const date = toDate(value);
  if (!date) return fallbackString(value);

  if (typeof value === "string" && !options) {
    return date.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
  }

  const tz = options?.tz ?? "local";
  const withSeconds = options?.withSeconds ?? false;

  if (tz === "utc") {
    const yyyy = date.getUTCFullYear();
    const mm = String(date.getUTCMonth() + 1).padStart(2, "0");
    const dd = String(date.getUTCDate()).padStart(2, "0");
    const hh = String(date.getUTCHours()).padStart(2, "0");
    const mi = String(date.getUTCMinutes()).padStart(2, "0");
    const ss = String(date.getUTCSeconds()).padStart(2, "0");
    return withSeconds
      ? `${yyyy}-${mm}-${dd} ${hh}:${mi}:${ss} UTC`
      : `${yyyy}-${mm}-${dd} ${hh}:${mi} UTC`;
  }

  const base = date.toLocaleString(undefined, {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: withSeconds ? "2-digit" : undefined,
  });
  const minutesEast = -date.getTimezoneOffset();
  return `${base} local (${formatUtcOffset(minutesEast)})`;
}

/**
 * Overloaded behavior:
 * - miniapp legacy: `formatTimeAxis(isoString)`
 * - admin: `formatTimeAxis(tsMs, { tz, rangeMs })`
 */
export function formatTimeAxis(
  value: number | string | Date,
  options?: { tz?: TimeZoneMode; rangeMs?: number }
): string {
  const date = toDate(value);
  if (!date) return fallbackString(value);

  if (typeof value === "string" && !options) {
    return date.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
  }

  const tz = options?.tz ?? "local";
  const rangeMs = options?.rangeMs ?? 0;
  const showDate = rangeMs >= 36 * 60 * 60 * 1000;

  if (tz === "utc") {
    const mm = String(date.getUTCMonth() + 1).padStart(2, "0");
    const dd = String(date.getUTCDate()).padStart(2, "0");
    const hh = String(date.getUTCHours()).padStart(2, "0");
    const mi = String(date.getUTCMinutes()).padStart(2, "0");
    return showDate ? `${mm}-${dd} ${hh}:${mi}` : `${hh}:${mi}`;
  }

  const hh = String(date.getHours()).padStart(2, "0");
  const mi = String(date.getMinutes()).padStart(2, "0");
  if (!showDate) return `${hh}:${mi}`;
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${mm}-${dd} ${hh}:${mi}`;
}

// Supports admin ms input and optional miniapp seconds input via `unit: "s"`.
export function formatDurationShort(value: number, options?: { unit?: "ms" | "s" }): string {
  if (!Number.isFinite(value) || value < 0) return "0s";
  const ms = (options?.unit ?? "ms") === "s" ? value * 1000 : value;
  const s = Math.floor(ms / 1000);
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  const ss = s % 60;
  if (m < 60) return ss > 0 ? `${m}m ${ss}s` : `${m}m`;
  const h = Math.floor(m / 60);
  const mm = m % 60;
  if (h < 48) return mm > 0 ? `${h}h ${mm}m` : `${h}h`;
  const d = Math.floor(h / 24);
  const hh = h % 24;
  return hh > 0 ? `${d}d ${hh}h` : `${d}d`;
}

const UNITS = ["B", "KB", "MB", "GB", "TB"] as const;

export function formatBytes(bytes: number | null | undefined, options?: { digits?: number }): string {
  if (bytes == null || !Number.isFinite(bytes)) return "—";
  if (bytes === 0) return "0 B";

  let value = Math.abs(bytes);
  let unitIndex = 0;
  while (value >= 1024 && unitIndex < UNITS.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }

  const digits = options?.digits ?? (value >= 100 ? 0 : value >= 10 ? 1 : 2);
  const sign = bytes < 0 ? "-" : "";
  return `${sign}${value.toFixed(digits)} ${UNITS[unitIndex]}`;
}

export function formatRate(bytesPerSecond: number | null | undefined): string {
  if (bytesPerSecond == null || !Number.isFinite(bytesPerSecond)) return "—";
  return `${formatBytes(bytesPerSecond)}/s`;
}

export function safeNumber(value: unknown): number;
export function safeNumber(value: unknown, fallback: number): number;
export function safeNumber(value: unknown, fallback: null): number | null;
export function safeNumber(value: unknown, fallback: number | null = 0): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  const parsed = Number(value);
  if (Number.isFinite(parsed)) return parsed;
  return fallback;
}

