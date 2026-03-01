import { ApiError } from "@vpn-suite/shared/types";

/** Status-aware error message for telemetry UI. */
export function getTelemetryErrorMessage(err: unknown, fallback = "Failed to load telemetry"): string {
  if (err instanceof ApiError) {
    const e = err;
    if (e.statusCode === 403) return "Permission denied. Requires telemetry:read.";
    if (e.statusCode === 429) return "Rate limited. Please wait before retrying.";
    if (e.statusCode === 503) return "Service unavailable. Telemetry backend may be down.";
    if (e.code === "TIMEOUT") return "Request timed out. Check your connection.";
    return e.message || fallback;
  }
  if (err instanceof Error) return err.message;
  return fallback;
}

/** Freshness thresholds (seconds). Configurable for operator tuning. */
export const FRESHNESS_FRESH_MAX_S = 30;
export const FRESHNESS_DEGRADED_MAX_S = 120;

export type FreshnessStatus = "fresh" | "degraded" | "stale" | "partial" | "unknown";

export function computeFreshnessStatus(
  lastUpdatedMs: number | null,
  opts?: { partial?: boolean }
): FreshnessStatus {
  if (opts?.partial) return "partial";
  if (lastUpdatedMs == null) return "unknown";
  const ageS = Math.max(0, (Date.now() - lastUpdatedMs) / 1000);
  if (ageS <= FRESHNESS_FRESH_MAX_S) return "fresh";
  if (ageS <= FRESHNESS_DEGRADED_MAX_S) return "degraded";
  return "stale";
}

export function freshnessStatusToLabel(s: FreshnessStatus): string {
  switch (s) {
    case "fresh":
      return "Fresh";
    case "degraded":
      return "Degraded";
    case "stale":
      return "Stale";
    case "partial":
      return "Partial";
    case "unknown":
      return "Unknown";
    default:
      return "Unknown";
  }
}

export function freshnessStatusToVariant(
  s: FreshnessStatus
): "success" | "warning" | "danger" | "info" {
  switch (s) {
    case "fresh":
      return "success";
    case "degraded":
    case "partial":
      return "warning";
    case "stale":
      return "danger";
    case "unknown":
      return "info";
    default:
      return "info";
  }
}
