/**
 * Single source of truth for domain status → Badge variant mappings.
 * Why: prevents ad-hoc status→variant drift across admin + miniapp.
 */

export type StatusMapVariant = "neutral" | "info" | "success" | "warning" | "danger";

export type StatusVariant = "neutral" | "info" | "success" | "warning" | "danger" | "live";

export const STATUS_TOKENS: Record<
  StatusVariant,
  { color: string; bg: string; border: string; label: string }
> = {
  neutral: {
    color: "var(--color-text-muted)",
    bg: "color-mix(in oklab, var(--color-border) 14%, transparent)",
    border: "color-mix(in oklab, var(--color-border) 40%, transparent)",
    label: "NEUTRAL",
  },
  info: {
    color: "var(--color-info)",
    bg: "color-mix(in oklab, var(--color-info) 18%, transparent)",
    border: "color-mix(in oklab, var(--color-info) 40%, transparent)",
    label: "INFO",
  },
  success: {
    color: "var(--color-success)",
    bg: "color-mix(in oklab, var(--color-success) 18%, transparent)",
    border: "color-mix(in oklab, var(--color-success) 40%, transparent)",
    label: "SUCCESS",
  },
  warning: {
    color: "var(--color-warning)",
    bg: "color-mix(in oklab, var(--color-warning) 18%, transparent)",
    border: "color-mix(in oklab, var(--color-warning) 40%, transparent)",
    label: "WARNING",
  },
  danger: {
    color: "var(--color-error)",
    bg: "color-mix(in oklab, var(--color-error) 18%, transparent)",
    border: "color-mix(in oklab, var(--color-error) 40%, transparent)",
    label: "DANGER",
  },
  live: {
    color: "var(--color-accent)",
    bg: "color-mix(in oklab, var(--color-accent) 18%, transparent)",
    border: "color-mix(in oklab, var(--color-accent) 40%, transparent)",
    label: "LIVE",
  },
};

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

