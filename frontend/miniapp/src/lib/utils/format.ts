export type TimeZoneMode = "local" | "utc";

export interface FormatDateTimeOptions {
  dateStyle?: "short" | "medium" | "long" | "full";
  timeStyle?: "short" | "medium" | "long" | "full";
  timeZone?: string;
}

export function formatBytes(bytes: number, options?: { digits?: number }): string {
  if (bytes === 0) return "0 B";
  const digits = options?.digits ?? 1;
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${Number((bytes / Math.pow(k, i)).toFixed(digits))} ${sizes[i]}`;
}

export function formatDate(iso: string, _options?: FormatDateTimeOptions): string {
  try {
    return new Date(iso).toLocaleDateString();
  } catch {
    return iso;
  }
}

export function formatDateLong(iso: string, _options?: FormatDateTimeOptions): string {
  try {
    return new Date(iso).toLocaleDateString(undefined, { dateStyle: "long" });
  } catch {
    return iso;
  }
}

export function formatDateTime(iso: string, _options?: FormatDateTimeOptions): string {
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

export function formatTime(iso: string): string {
  try {
    return new Date(iso).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
  } catch {
    return iso;
  }
}

export function formatPct(value: number, decimals = 1): string {
  return `${Number(value.toFixed(decimals))}%`;
}

export function formatPercent01(value: number, decimals = 0): string {
  return formatPct(value * 100, decimals);
}

export function formatTimeAxis(ts: string): string {
  try {
    const d = new Date(ts);
    return d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
  } catch {
    return ts;
  }
}

export function formatDurationShort(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
  return `${(seconds / 3600).toFixed(1)}h`;
}

export function formatRate(bytesPerSec: number): string {
  return `${formatBytes(bytesPerSec)}/s`;
}

export function safeNumber(value: unknown): number {
  if (typeof value === "number" && !Number.isNaN(value)) return value;
  const n = Number(value);
  return Number.isNaN(n) ? 0 : n;
}
