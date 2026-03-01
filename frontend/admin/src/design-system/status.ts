/** Status variant — ONE place, used everywhere */
export type StatusVariant = "nominal" | "warning" | "abort" | "standby" | "live";

export const STATUS_TOKENS: Record<
  StatusVariant,
  { color: string; bg: string; label: string }
> = {
  nominal: { color: "var(--status-nominal)", bg: "var(--status-nominal-dim)", label: "OK" },
  warning: { color: "var(--status-warning)", bg: "var(--status-warning-dim)", label: "WARNING" },
  abort: { color: "var(--status-abort)", bg: "var(--status-abort-dim)", label: "CRITICAL" },
  standby: { color: "var(--status-standby)", bg: "var(--status-standby-dim)", label: "OFFLINE" },
  live: { color: "var(--status-live)", bg: "var(--accent-dim)", label: "LIVE" },
};
