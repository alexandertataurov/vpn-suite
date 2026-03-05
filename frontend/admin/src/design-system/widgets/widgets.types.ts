/* System status widget types and helpers.
 *
 * These are pure data contracts — UI components read these
 * and map them to CSS classes from `widgets.css`.
 */

export type WidgetAccent = "green" | "amber" | "red" | "blue" | "purple" | "cyan" | "dim";

export type TrendDirection = "up" | "down" | "flat";

export type SessionsMode = "normal" | "spike" | "idle" | "drain" | "loading";

export interface SessionsWidgetData {
  mode: SessionsMode;
  /** Current sessions count. */
  value: number;
  /** Change vs. comparison window, in percent (positive or negative). */
  deltaPercent?: number;
  /** Connected peers backing those sessions. */
  peers: number;
  /** Optional uptime text, e.g. `99.98%`. */
  uptimeLabel?: string;
  /** Optional peak text used in spike state. */
  peakLabel?: string;
  /**
   * Free-form status line under the metric, e.g.
   * `No active sessions` or `Last drop 04.05 17:31`.
   */
  statusLabel?: string;
  /** Semantic tone for the status line, controls color span. */
  statusTone?: "default" | "good" | "warn" | "bad";
}

export type IncidentsState = "allClear" | "warnings" | "critical" | "acknowledged";

export interface IncidentsWidgetData {
  critical: number;
  warning: number;
  /** When true, treat active incidents as acknowledged. */
  acknowledged?: boolean;
  /** Count of unhealthy nodes for the footer line. */
  unhealthyNodes?: number;
}

export type FreshnessState = "fresh" | "stale" | "dead" | "live";

export type StampKind = "now" | "ago" | "old";

export interface SparkPoint {
  x: number;
  y: number;
}

export interface TelemetryWidgetData {
  state: FreshnessState;
  /** Human label: `JUST NOW`, `4 MIN AGO`, etc. */
  lastSampleLabel: string;
  /** Optional high‑freq interval label (e.g. `100ms INTERVAL`). */
  intervalLabel?: string;
  series: SparkPoint[];
}

export type LatencyBand = "excellent" | "nominal" | "degraded" | "critical";

export interface LatencyDistribution {
  p50Ms?: number;
  p95Ms: number;
  p99Ms?: number;
}

export interface LatencyWidgetData extends LatencyDistribution {
  /** Error rate in percentage, 0–100. */
  errorRate: number;
  trendDirection: TrendDirection;
  /** Absolute delta vs. comparison window, in milliseconds. */
  trendDeltaMs: number;
}

export type ClusterMode = "grid" | "bars";

export interface ClusterMetricRow {
  key: string;
  /** Human formatted value, e.g. `78.2%` or `1.2 Gbps`. */
  value: string;
  /**
   * Utilization percentage (0–100). When present, used to
   * drive color thresholds for both grid and bar modes.
   */
  percent?: number;
}

export interface ClusterLoadWidgetData {
  mode: ClusterMode;
  metrics: ClusterMetricRow[];
  /** When true, treat cluster as in maintenance mode (purple accent). */
  maintenance?: boolean;
  /** When true, treat data as offline; widgets should render OFFLINE state. */
  offline?: boolean;
}

/* ──────────────────────────────────────────────────────────
 * Helper mappers for components
 * ────────────────────────────────────────────────────────── */

export function getAccentForSessionsState(mode: SessionsMode): WidgetAccent {
  switch (mode) {
    case "normal":
      return "green";
    case "spike":
      return "amber";
    case "idle":
      return "dim";
    case "drain":
      return "red";
    case "loading":
      return "dim";
  }
}

export function getIncidentsState(data: IncidentsWidgetData): IncidentsState {
  if (data.acknowledged && (data.critical > 0 || data.warning > 0)) {
    return "acknowledged";
  }
  if (data.critical > 0) {
    return "critical";
  }
  if (data.warning > 0) {
    return "warnings";
  }
  return "allClear";
}

export function getFreshnessStamp(state: FreshnessState): StampKind {
  switch (state) {
    case "fresh":
    case "live":
      return "now";
    case "stale":
      return "ago";
    case "dead":
      return "old";
  }
}

export function getLatencyBand(p95Ms: number): LatencyBand {
  if (p95Ms < 20) {
    return "excellent";
  }
  if (p95Ms < 100) {
    return "nominal";
  }
  if (p95Ms <= 500) {
    return "degraded";
  }
  return "critical";
}

export function getLatencyAccent(band: LatencyBand): WidgetAccent {
  switch (band) {
    case "excellent":
      return "cyan";
    case "nominal":
      return "green";
    case "degraded":
      return "amber";
    case "critical":
      return "red";
  }
}

export function getBarFillVariant(percent: number | undefined): "green" | "amber" | "red" {
  if (percent == null || percent < 60) {
    return "green";
  }
  if (percent <= 85) {
    return "amber";
  }
  return "red";
}

export function getClusterAccent(metrics: ClusterMetricRow[]): {
  accent: WidgetAccent;
  saturated: boolean;
} {
  const maxPercent = Math.max(
    0,
    ...metrics.map((m) => (typeof m.percent === "number" ? m.percent : 0))
  );

  if (maxPercent > 85) {
    return { accent: "red", saturated: true };
  }
  if (maxPercent >= 60) {
    return { accent: "amber", saturated: false };
  }
  return { accent: "blue", saturated: false };
}

