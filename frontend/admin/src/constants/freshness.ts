/** Freshness thresholds (ms) for operator console data. */
export const FRESH_MS = 30_000;
export const DEGRADED_MS = 2 * 60 * 1000;

export type FreshnessLevel = "fresh" | "degraded" | "stale" | "unknown";

/**
 * @param iso ISO timestamp or null/undefined
 * @param staleThresholdMs Optional. Age above this (ms) is "stale". Default DEGRADED_MS (2m).
 */
export function getFreshnessLevel(
  iso: string | null | undefined,
  staleThresholdMs = DEGRADED_MS
): FreshnessLevel {
  if (!iso) return "unknown";
  const age = Date.now() - new Date(iso).getTime();
  if (age <= FRESH_MS) return "fresh";
  if (age <= staleThresholdMs) return "degraded";
  return "stale";
}
