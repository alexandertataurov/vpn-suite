import { type TimeZoneMode, formatTimeAxis } from "@vpn-suite/shared";

/** Compact axis/tooltip: 1000 -> 1K, 1.2e6 -> 1.2M, 1e9 -> 1G. */
export function formatCompactNumber(value: number): string {
  if (value >= 1_000_000_000) {
    const g = value / 1_000_000_000;
    return g % 1 === 0 ? `${g}G` : `${g.toFixed(1)}G`;
  }
  if (value >= 1_000_000) {
    const m = value / 1_000_000;
    return m % 1 === 0 ? `${m}M` : `${m.toFixed(1)}M`;
  }
  if (value >= 1_000) {
    const k = value / 1_000;
    return k % 1 === 0 ? `${k}K` : `${k.toFixed(1)}K`;
  }
  return String(Math.round(value));
}

export function formatChartTimeAxisLabel(
  value: string | number,
  tz: TimeZoneMode,
  rangeMs: number
): string {
  if (typeof value !== "number") return String(value);
  return formatTimeAxis(value, { tz, rangeMs });
}
