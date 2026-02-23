/**
 * Single source of truth for domain status → Badge variant mappings.
 * Use these helpers instead of ad-hoc status→variant logic.
 */

type StatusMapVariant = "neutral" | "info" | "success" | "warning" | "danger";

/** Server health (running/ok/degraded/error/unknown) */
export function serverStatusToVariant(s: string | null | undefined): StatusMapVariant {
  if (!s) return "info";
  const v = String(s).toLowerCase();
  if (v === "running" || v === "ok") return "success";
  if (v === "degraded") return "warning";
  if (v === "error") return "danger";
  return "neutral";
}

/** User (active/inactive/banned) */
export function userStatusToVariant(s: string | boolean | null | undefined): StatusMapVariant {
  if (s === true || s === "active") return "success";
  if (s === false || s === "inactive" || s === "banned") return "danger";
  return "neutral";
}

/** Subscription (active/expired/cancelled/failed) */
export function subscriptionStatusToVariant(s: string | null | undefined): StatusMapVariant {
  if (!s) return "neutral";
  const v = String(s).toLowerCase();
  if (v === "active") return "success";
  if (v === "expired") return "warning";
  if (v === "cancelled") return "neutral";
  if (v === "failed") return "danger";
  return "neutral";
}

/** Payment (completed/pending/failed/refunded) */
export function paymentStatusToVariant(s: string | null | undefined): StatusMapVariant {
  if (!s) return "neutral";
  const v = String(s).toLowerCase();
  if (v === "completed") return "success";
  if (v === "pending") return "info";
  if (v === "failed") return "danger";
  if (v === "refunded") return "neutral";
  return "neutral";
}

/** Stream (live/degraded/offline) */
export function streamStatusToVariant(s: string | null | undefined): StatusMapVariant {
  if (!s) return "neutral";
  const v = String(s).toLowerCase();
  if (v === "live") return "success";
  if (v === "degraded") return "warning";
  if (v === "offline") return "danger";
  return "neutral";
}

/** Container (running/restarting/paused/dead/exited) */
export function containerStatusToVariant(s: string | null | undefined): StatusMapVariant {
  if (!s) return "neutral";
  const v = String(s).toLowerCase();
  if (v === "running") return "success";
  if (v === "restarting" || v === "paused") return "warning";
  if (v === "dead" || v === "exited") return "danger";
  return "neutral";
}

/** Device (active/revoked) */
export function deviceStatusToVariant(s: string | null | undefined): StatusMapVariant {
  if (!s) return "neutral";
  const v = String(s).toLowerCase();
  if (v === "active") return "success";
  if (v === "revoked") return "danger";
  return "neutral";
}

/** Connection (connected/degraded/disconnected) */
export function connectionStatusToVariant(s: string | null | undefined): StatusMapVariant {
  if (!s) return "neutral";
  const v = String(s).toLowerCase();
  if (v === "connected") return "success";
  if (v === "degraded") return "warning";
  if (v === "disconnected") return "danger";
  return "neutral";
}

/** Alert severity */
export function alertSeverityToVariant(s: string | null | undefined): StatusMapVariant {
  if (!s) return "neutral";
  const v = String(s).toLowerCase();
  if (v === "critical" || v === "error") return "danger";
  if (v === "warning") return "warning";
  if (v === "info") return "info";
  return "neutral";
}

/** Data/TimeSeries (live/stale/partial/error/empty/loading) */
export function dataStatusToVariant(s: string | null | undefined): StatusMapVariant {
  if (!s) return "info";
  const v = String(s).toLowerCase();
  if (v === "live") return "success";
  if (v === "stale" || v === "partial") return "warning";
  if (v === "error") return "danger";
  if (v === "empty" || v === "loading") return "info";
  return "info";
}
