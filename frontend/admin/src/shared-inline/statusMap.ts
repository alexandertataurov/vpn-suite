/**
 * Single source of truth for domain status → Badge variant mappings.
 * Use these helpers instead of ad-hoc status→variant logic.
 */

type StatusMapVariant = "standby" | "accent" | "nominal" | "warning" | "critical";

/** Server health (running/ok/degraded/error/unknown) */
export function serverStatusToVariant(s: string | null | undefined): StatusMapVariant {
  if (!s) return "accent";
  const v = String(s).toLowerCase();
  if (v === "running" || v === "ok") return "nominal";
  if (v === "degraded") return "warning";
  if (v === "error") return "critical";
  return "standby";
}

/** User (active/inactive/banned) */
export function userStatusToVariant(s: string | boolean | null | undefined): StatusMapVariant {
  if (s === true || s === "active") return "nominal";
  if (s === false || s === "inactive" || s === "banned") return "critical";
  return "standby";
}

/** Subscription (active/expired/cancelled/failed) */
export function subscriptionStatusToVariant(s: string | null | undefined): StatusMapVariant {
  if (!s) return "standby";
  const v = String(s).toLowerCase();
  if (v === "active") return "nominal";
  if (v === "expired") return "warning";
  if (v === "cancelled") return "standby";
  if (v === "failed") return "critical";
  return "standby";
}

/** Payment (completed/pending/failed/refunded) */
export function paymentStatusToVariant(s: string | null | undefined): StatusMapVariant {
  if (!s) return "standby";
  const v = String(s).toLowerCase();
  if (v === "completed") return "nominal";
  if (v === "pending") return "accent";
  if (v === "failed") return "critical";
  if (v === "refunded") return "standby";
  return "standby";
}

/** Stream (live/degraded/offline) */
export function streamStatusToVariant(s: string | null | undefined): StatusMapVariant {
  if (!s) return "standby";
  const v = String(s).toLowerCase();
  if (v === "live") return "nominal";
  if (v === "degraded") return "warning";
  if (v === "offline") return "critical";
  return "standby";
}

/** Container (running/restarting/paused/dead/exited) */
export function containerStatusToVariant(s: string | null | undefined): StatusMapVariant {
  if (!s) return "standby";
  const v = String(s).toLowerCase();
  if (v === "running") return "nominal";
  if (v === "restarting" || v === "paused") return "warning";
  if (v === "dead" || v === "exited") return "critical";
  return "standby";
}

/** Device (active/revoked) */
export function deviceStatusToVariant(s: string | null | undefined): StatusMapVariant {
  if (!s) return "standby";
  const v = String(s).toLowerCase();
  if (v === "active") return "nominal";
  if (v === "revoked") return "critical";
  return "standby";
}

/** Connection (connected/degraded/disconnected) */
export function connectionStatusToVariant(s: string | null | undefined): StatusMapVariant {
  if (!s) return "standby";
  const v = String(s).toLowerCase();
  if (v === "connected") return "nominal";
  if (v === "degraded") return "warning";
  if (v === "disconnected") return "critical";
  return "standby";
}

/** Alert severity */
export function alertSeverityToVariant(s: string | null | undefined): StatusMapVariant {
  if (!s) return "standby";
  const v = String(s).toLowerCase();
  if (v === "critical" || v === "error") return "critical";
  if (v === "warning") return "warning";
  if (v === "info") return "accent";
  return "standby";
}

/** Data/TimeSeries (live/stale/partial/error/empty/loading) */
export function dataStatusToVariant(s: string | null | undefined): StatusMapVariant {
  if (!s) return "accent";
  const v = String(s).toLowerCase();
  if (v === "live") return "nominal";
  if (v === "stale" || v === "partial") return "warning";
  if (v === "error") return "critical";
  if (v === "empty" || v === "loading") return "accent";
  return "accent";
}
