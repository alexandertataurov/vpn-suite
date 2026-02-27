import type {
  AlertItem,
  AlertItemListOut,
  ContainerLogLine,
  ContainerLogLineListOut,
  ContainerMetricsPoint,
  ContainerMetricsTimeseries,
  ContainerSummary,
  ContainerSummaryListOut,
  HostSummary,
  HostSummaryListOut,
  MetricsKpisOut,
  OperatorHealthStrip,
  OperatorIncident,
  OperatorDashboardOut,
  ServiceScrapeStatus,
  TelemetryServicesOut,
  TopologySummaryOut,
  ServerTelemetryOut,
} from "@vpn-suite/shared/types";

export interface TimeseriesPoint {
  ts: number;
  value: number;
  labels?: Record<string, string>;
}

export interface TimeseriesSeries {
  label: string;
  points: TimeseriesPoint[];
}

export interface Timeseries {
  metric: string;
  series: TimeseriesSeries[];
}

export type HealthStatus = "ok" | "degraded" | "down" | "unknown";

export interface HealthSummary {
  api: HealthStatus;
  prom: HealthStatus;
  lastScrapeTs: number | null;
  lastIngestTs: number | null;
  /** Seconds between lastScrapeTs and lastIngestTs (positive = ingest lag). */
  ingestDelaySec: number | null;
}

export type ServiceTargetStatus = "up" | "down" | "unknown";

export interface ServiceTarget {
  name: string;
  instance: string;
  status: ServiceTargetStatus;
  lastScrapeTs: number | null;
  lastError?: string | null;
  controlsSupported: boolean;
}

export type ContainerHealthStatus = "healthy" | "unhealthy" | "starting" | "none" | "unknown";

export interface ContainerRow {
  id: string;
  hostId: string;
  name: string;
  image: string;
  imageTag?: string | null;
  status: string;
  health: ContainerHealthStatus;
  cpuPct: number | null;
  memBytes: number | null;
  memLimitBytes: number | null;
  memPct: number | null;
  uptimeSeconds: number | null;
  restartCount: number;
  isRestartLoop: boolean;
  errorRate5m: number | null;
  composeService?: string | null;
  composeProject?: string | null;
  createdAt?: string | null;
  startedAt?: string | null;
}

export type TelemetryMode = "operator" | "engineer";

export type TelemetryRefresh = "off" | "15s" | "30s" | "60s";

export type TelemetryRangePreset = "5m" | "15m" | "1h" | "6h" | "24h";

export type TelemetryTab = "docker" | "vpn";

export interface TelemetryCustomRange {
  from: number;
  to: number;
}

export interface TelemetrySelectedResource {
  type: "container" | "service" | "node" | "alert";
  id: string;
  hostId?: string;
}

export interface TelemetryUrlState {
  mode: TelemetryMode;
  region: string;
  range: TelemetryRangePreset | "custom";
  customRange?: TelemetryCustomRange;
  refresh: TelemetryRefresh;
  selected?: TelemetrySelectedResource;
}

export interface IncidentSummaryItem {
  kind: "containers" | "services" | "alerts" | "ingest";
  label: string;
  count: number;
  severity: "critical" | "warning" | "info";
}

export interface OperatorOverviewNormalized {
  healthStrip: OperatorHealthStrip;
  incidents: OperatorIncident[];
}

export interface DockerTelemetryState {
  hosts: HostSummaryListOut | undefined;
  containers: ContainerSummaryListOut | undefined;
  alerts: AlertItemListOut | undefined;
  metrics: ContainerMetricsTimeseries | undefined;
  logs: ContainerLogLineListOut | undefined;
}

export type {
  AlertItem,
  AlertItemListOut,
  ContainerLogLine,
  ContainerLogLineListOut,
  ContainerMetricsPoint,
  ContainerMetricsTimeseries,
  ContainerSummary,
  ContainerSummaryListOut,
  HostSummary,
  HostSummaryListOut,
  MetricsKpisOut,
  OperatorHealthStrip,
  OperatorIncident,
  OperatorDashboardOut,
  ServiceScrapeStatus,
  TelemetryServicesOut,
  TopologySummaryOut,
  ServerTelemetryOut,
};

