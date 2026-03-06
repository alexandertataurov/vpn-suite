/**
 * Shared date/time formatters. Use for consistent display across admin and miniapp.
 */

export function formatDate(value: string | Date): string {
  const d = typeof value === "string" ? new Date(value) : value;
  return d.toLocaleDateString();
}

/** Long date format: "1 Jan 2025" */
export function formatDateLong(value: string | Date): string {
  const d = typeof value === "string" ? new Date(value) : value;
  return d.toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export interface FormatDateTimeOptions {
  timeZone?: string;
  dateStyle?: Intl.DateTimeFormatOptions["dateStyle"];
  timeStyle?: Intl.DateTimeFormatOptions["timeStyle"];
}

export function formatDateTime(
  value: string | Date,
  opts?: FormatDateTimeOptions
): string {
  const d = typeof value === "string" ? new Date(value) : value;
  return d.toLocaleString(undefined, {
    timeZone: opts?.timeZone,
    dateStyle: opts?.dateStyle,
    timeStyle: opts?.timeStyle,
  });
}

/** Relative time: "just now", "5 min ago", "2 h ago", or locale date. */
export function formatRelative(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  const sec = Math.floor((Date.now() - d.getTime()) / 1000);
  if (sec < 60) return "just now";
  if (sec < 3600) return `${Math.floor(sec / 60)} min ago`;
  if (sec < 86400) return `${Math.floor(sec / 3600)} h ago`;
  return d.toLocaleDateString();
}

// --- Chart / numeric formatters ---

export type TimeZoneMode = "local" | "utc";

/** valuePct in 0..100 (Docker telemetry uses percent units). */
export function formatPct(valuePct: number, opts?: { digits?: number }): string {
  const v = Number.isFinite(valuePct) ? valuePct : 0;
  const digits = opts?.digits ?? (Math.abs(v) < 0.5 ? 1 : 0);
  return `${v.toFixed(digits)}%`;
}

/** ratio in 0..1, for generic percent rendering. */
export function formatPercent01(ratio: number, opts?: { digits?: number }): string {
  const v = Number.isFinite(ratio) ? ratio : 0;
  const digits = opts?.digits ?? (Math.abs(v) < 0.005 ? 1 : 0);
  return `${(v * 100).toFixed(digits)}%`;
}

function formatUtcOffset(minutesEastOfUtc: number): string {
  const sign = minutesEastOfUtc >= 0 ? "+" : "-";
  const abs = Math.abs(minutesEastOfUtc);
  const hh = String(Math.floor(abs / 60)).padStart(2, "0");
  const mm = String(abs % 60).padStart(2, "0");
  return `UTC${sign}${hh}:${mm}`;
}

export function formatTime(tsMs: number, opts?: { tz?: TimeZoneMode; withSeconds?: boolean }): string {
  const tz = opts?.tz ?? "local";
  const withSeconds = opts?.withSeconds ?? false;
  const d = new Date(tsMs);

  if (tz === "utc") {
    const yyyy = d.getUTCFullYear();
    const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
    const dd = String(d.getUTCDate()).padStart(2, "0");
    const hh = String(d.getUTCHours()).padStart(2, "0");
    const mi = String(d.getUTCMinutes()).padStart(2, "0");
    const ss = String(d.getUTCSeconds()).padStart(2, "0");
    return withSeconds ? `${yyyy}-${mm}-${dd} ${hh}:${mi}:${ss} UTC` : `${yyyy}-${mm}-${dd} ${hh}:${mi} UTC`;
  }

  const base = d.toLocaleString(undefined, {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: withSeconds ? "2-digit" : undefined,
  });
  const minutesEast = -d.getTimezoneOffset();
  return `${base} local (${formatUtcOffset(minutesEast)})`;
}

export function formatTimeAxis(tsMs: number, opts: { tz: TimeZoneMode; rangeMs?: number }): string {
  const rangeMs = opts.rangeMs ?? 0;
  const d = new Date(tsMs);
  const showDate = rangeMs >= 36 * 60 * 60 * 1000;

  if (opts.tz === "utc") {
    const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
    const dd = String(d.getUTCDate()).padStart(2, "0");
    const hh = String(d.getUTCHours()).padStart(2, "0");
    const mi = String(d.getUTCMinutes()).padStart(2, "0");
    return showDate ? `${mm}-${dd} ${hh}:${mi}` : `${hh}:${mi}`;
  }

  const hh = String(d.getHours()).padStart(2, "0");
  const mi = String(d.getMinutes()).padStart(2, "0");
  if (!showDate) return `${hh}:${mi}`;
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${mm}-${dd} ${hh}:${mi}`;
}

export function formatDurationShort(ms: number): string {
  if (!Number.isFinite(ms) || ms < 0) return "0s";
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

export function formatBytes(bytes: number | null | undefined, opts?: { digits?: number }): string {
  if (bytes == null || !Number.isFinite(bytes)) return "—";
  if (bytes === 0) return "0 B";

  let v = Math.abs(bytes);
  let i = 0;
  while (v >= 1024 && i < UNITS.length - 1) {
    v /= 1024;
    i += 1;
  }

  const digits = opts?.digits ?? (v >= 100 ? 0 : v >= 10 ? 1 : 2);
  const sign = bytes < 0 ? "-" : "";
  return `${sign}${v.toFixed(digits)} ${UNITS[i]}`;
}

export function formatRate(bytesPerSecond: number | null | undefined): string {
  if (bytesPerSecond == null || !Number.isFinite(bytesPerSecond)) return "—";
  return `${formatBytes(bytesPerSecond)}/s`;
}

export function safeNumber(v: unknown): number | null {
  if (typeof v !== "number") return null;
  return Number.isFinite(v) ? v : null;
}
