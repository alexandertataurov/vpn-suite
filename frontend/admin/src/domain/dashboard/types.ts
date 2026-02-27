/**
 * Dashboard domain — UI-ready types. Single source of truth for displayed data.
 * All values shown in dashboard cards come from selectors that produce these types.
 */

export type Freshness = "fresh" | "degraded" | "stale" | "unknown";

/** Top bar and card health strip (from operator overview). */
export interface StripView {
  apiStatus: "ok" | "degraded" | "down" | "unknown";
  prometheusStatus: "ok" | "down";
  totalNodes: number;
  onlineNodes: number;
  activeSessions: number;
  peersActive: number | null;
  totalThroughputBps: number;
  avgLatencyMs: number | null;
  errorRatePct: number;
  lastUpdated: string;
  refreshMode: string;
  freshness: Freshness;
}

/** One timeseries point for charts: [timestampMs, value]. */
export type XYPoint = [number, number | null];

/** Per-series data for Traffic & Load charts. */
export interface TimeseriesForChart {
  download: XYPoint[];
  upload: XYPoint[];
  connections: XYPoint[];
  lastThroughputStr: string;
  lastConnectionsStr: string;
  /** Derived cluster throughput (bytes per second) over time. */
  throughputBps?: XYPoint[];
  /** Cluster latency (ms) over time, derived from health strip when available. */
  latencyMs?: XYPoint[];
  /** Display label for current throughput rate (e.g. "1.63 MB/s"). */
  lastThroughputRateStr?: string;
  /** Display label for current latency (e.g. "7ms" or "0.12s"). */
  lastLatencyStr?: string;
}

/** Incident item for Active Incidents panel. */
export interface IncidentForPanel {
  severity: "critical" | "warning";
  entity: string;
  metric: string;
  value: string | number;
  timestamp: string;
  link: string;
  status?: "open" | "ack" | "resolved";
  affectedServers?: number;
  acknowledgedBy?: string | null;
}

/** One row in Cluster Health Matrix. */
export interface ClusterMatrixRow {
  region: string;
  totalNodes: number;
  online: number;
  cpuAvg: number | null;
  ramAvg: number | null;
  users: number;
  throughput: number;
  errorPct: number | null;
  latencyP95: number | null;
  health: "ok" | "degraded" | "down";
}

/** Node coverage for CoverageIndicator: nodes reporting / total. */
export interface NodeCoverage {
  total: number;
  online: number;
  degraded: number;
  down: number;
  reportingCount: number;
}

/** Server row for dashboard Operator Server Table (UI shape). */
export interface ServerRowView {
  id: string;
  name: string;
  region: string;
  ip: string;
  status: "online" | "degraded" | "offline";
  cpuPct: number | null;
  ramPct: number | null;
  users: number;
  throughputBps: number;
  lastHeartbeat: string | null;
  freshness: Freshness;
  to: string;
}
