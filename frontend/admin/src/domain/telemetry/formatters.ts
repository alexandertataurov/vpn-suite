import { formatBytes as baseFormatBytes, formatDateTime } from "@vpn-suite/shared";

export function formatBytes(value: number | null | undefined): string {
  if (value == null) return "—";
  return baseFormatBytes(value);
}

export function formatRatePerSecond(value: number | null | undefined, unit: "req" | "bytes" = "req"): string {
  if (value == null) return "—";
  const suffix = unit === "bytes" ? "B/s" : "req/s";
  if (value >= 1e9) return `${(value / 1e9).toFixed(1)} G${suffix}`;
  if (value >= 1e6) return `${(value / 1e6).toFixed(1)} M${suffix}`;
  if (value >= 1e3) return `${(value / 1e3).toFixed(1)} k${suffix}`;
  return `${value.toFixed(2)} ${suffix}`;
}

export function formatLatencySeconds(value: number | null | undefined): string {
  if (value == null) return "—";
  if (value >= 1) return `${value.toFixed(2)}s`;
  return `${Math.round(value * 1000)}ms`;
}

export function formatPercent(value: number | null | undefined, digits = 2): string {
  if (value == null) return "—";
  return `${(value * 100).toFixed(digits)}%`;
}

export function formatCompactNumber(value: number | null | undefined): string {
  if (value == null) return "—";
  const n = Math.round(value);
  if (n >= 1e9) return `${(n / 1e9).toFixed(1)}B`;
  if (n >= 1e6) return `${(n / 1e6).toFixed(1)}M`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(1)}k`;
  return String(n);
}

export function formatTimestamp(input: string | number | Date | null | undefined): string {
  if (input == null) return "—";
  if (typeof input === "number") {
    return formatDateTime(new Date(input));
  }
  if (input instanceof Date) {
    return formatDateTime(input);
  }
  return formatDateTime(input);
}

export function toUnixMs(ts: string | number | Date | null | undefined): number | null {
  if (ts == null) return null;
  if (typeof ts === "number") return ts;
  if (ts instanceof Date) return ts.getTime();
  const d = new Date(ts);
  const t = d.getTime();
  return Number.isNaN(t) ? null : t;
}

export function computeIngestDelaySec(lastScrapeTs: number | null, lastIngestTs: number | null): number | null {
  if (lastScrapeTs == null || lastIngestTs == null) return null;
  const diffMs = lastIngestTs - lastScrapeTs;
  return Math.max(0, Math.round(diffMs / 1000));
}

