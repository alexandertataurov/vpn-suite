/**
 * Dashboard domain selectors. Pure functions: API payload → UI-ready structures.
 * Single source of truth; all dashboard widgets consume these, not raw API.
 */
import type { OperatorDashboardOut } from "@vpn-suite/shared/types";
import { formatBytes } from "@vpn-suite/shared";
import type {
  StripView,
  TimeseriesForChart,
  IncidentForPanel,
  ClusterMatrixRow,
  NodeCoverage,
  ServerRowView,
} from "./types";

export function selectHealthStrip(payload: OperatorDashboardOut | null | undefined): StripView | null {
  if (!payload?.health_strip) return null;
  const s = payload.health_strip;
  return {
    apiStatus: s.api_status,
    prometheusStatus: s.prometheus_status,
    totalNodes: s.total_nodes,
    onlineNodes: s.online_nodes,
    activeSessions: s.active_sessions,
    peersActive: s.peers_active ?? null,
    totalThroughputBps: s.total_throughput_bps,
    avgLatencyMs: s.avg_latency_ms ?? null,
    errorRatePct: s.error_rate_pct,
    lastUpdated: s.last_updated,
    refreshMode: s.refresh_mode,
    freshness: s.freshness,
  };
}

/** ECharts XY: [timestampMs, value]. */
function toNum(x: unknown): number | null {
  if (typeof x === "number" && Number.isFinite(x)) return x;
  const n = Number(x);
  return Number.isFinite(n) ? n : null;
}

export function selectTimeseriesForChart(
  payload: OperatorDashboardOut | null | undefined
): TimeseriesForChart | null {
  if (!payload?.timeseries) return null;
  const points = [...payload.timeseries].sort((a, b) => (a.ts ?? 0) - (b.ts ?? 0));

  const download: [number, number | null][] = [];
  const upload: [number, number | null][] = [];
  const connections: [number, number | null][] = [];
  const throughputBps: [number, number | null][] = [];
  const latencyMsSeries: [number, number | null][] = [];

  const strip = payload.health_strip;
  const stripLatencyMs = typeof strip?.avg_latency_ms === "number" ? strip.avg_latency_ms : null;

  let prevRx: number | null = null;
  let prevTx: number | null = null;
  let prevTs: number | null = null;

  for (const p of points) {
    const tsSec = typeof p.ts === "number" && Number.isFinite(p.ts) ? p.ts : 0;
    const tsMs = tsSec * 1000;
    const rx = toNum(p.rx);
    const tx = toNum(p.tx);
    const peers = toNum(p.peers);

    download.push([tsMs, rx]);
    upload.push([tsMs, tx]);
    connections.push([tsMs, peers]);

    if (
      prevTs != null &&
      prevRx != null &&
      prevTx != null &&
      rx != null &&
      tx != null &&
      tsSec > prevTs
    ) {
      const dt = Math.max(0.001, tsSec - prevTs);
      const deltaRx = rx - prevRx;
      const deltaTx = tx - prevTx;
      const totalDelta = deltaRx + deltaTx;
      const bps =
        Number.isFinite(totalDelta) && totalDelta >= 0
          ? Math.max(0, totalDelta / dt)
          : null;
      throughputBps.push([tsMs, bps]);
    } else {
      throughputBps.push([tsMs, null]);
    }

    if (!payload.latency_timeseries?.length) latencyMsSeries.push([tsMs, stripLatencyMs]);

    prevTs = tsSec;
    prevRx = rx;
    prevTx = tx;
  }

  // Forward-fill throughput so chart is continuous (no breaks at nulls)
  let lastBps: number | null = null;
  for (let i = 0; i < throughputBps.length; i++) {
    const v = throughputBps[i]![1];
    if (v != null && Number.isFinite(v) && v >= 0) lastBps = v;
    else if (lastBps != null) throughputBps[i] = [throughputBps[i]![0], lastBps];
  }
  // Backward-fill leading nulls so the line extends to the first timestamp
  let firstBps: number | null = null;
  for (let i = 0; i < throughputBps.length; i++) {
    const v = throughputBps[i]![1];
    if (v != null && Number.isFinite(v) && v >= 0) {
      firstBps = v;
      break;
    }
  }
  if (firstBps != null) {
    for (let i = 0; i < throughputBps.length; i++) {
      if (throughputBps[i]![1] == null) throughputBps[i] = [throughputBps[i]![0], firstBps];
      else break;
    }
  }

  // P95 latency: use latency_timeseries when present for continuous chart over time
  const rawLatency = payload.latency_timeseries;
  if (rawLatency?.length) {
    latencyMsSeries.length = 0;
    const sorted = [...rawLatency].sort((a, b) => (a.ts ?? 0) - (b.ts ?? 0));
    for (const pt of sorted) {
      const tsMs = (pt.ts ?? 0) * 1000;
      const v = toNum(pt.latency_ms);
      if (v != null && v >= 0) latencyMsSeries.push([tsMs, v]);
      else latencyMsSeries.push([tsMs, null]);
    }
    latencyMsSeries.sort((a, b) => a[0] - b[0]);
    // Forward-fill latency so chart is continuous
    let lastLat: number | null = null;
    for (let i = 0; i < latencyMsSeries.length; i++) {
      const v = latencyMsSeries[i]![1];
      if (v != null && Number.isFinite(v) && v >= 0) lastLat = v;
      else if (lastLat != null) latencyMsSeries[i] = [latencyMsSeries[i]![0], lastLat];
    }
    let firstLat: number | null = null;
    for (let i = 0; i < latencyMsSeries.length; i++) {
      const v = latencyMsSeries[i]![1];
      if (v != null && Number.isFinite(v) && v >= 0) {
        firstLat = v;
        break;
      }
    }
    if (firstLat != null) {
      for (let i = 0; i < latencyMsSeries.length; i++) {
        if (latencyMsSeries[i]![1] == null) latencyMsSeries[i] = [latencyMsSeries[i]![0], firstLat];
        else break;
      }
    }
  }

  const last = points[points.length - 1];
  const lastThroughputStr =
    last != null ? formatBytes((last.rx ?? 0) + (last.tx ?? 0)) : "—";
  const lastConnectionsStr =
    last != null && last.peers != null ? String(last.peers) : "—";

  const throughputValues = throughputBps
    .map(([, v]) => v)
    .filter((v): v is number => typeof v === "number" && Number.isFinite(v) && v >= 0);
  const lastBpsValue =
    throughputValues.length > 0 ? throughputValues[throughputValues.length - 1]! : null;
  const lastThroughputRateStr =
    lastBpsValue != null ? `${formatBytes(lastBpsValue)}/s` : "—";

  const lastLatencyVal =
    latencyMsSeries.length > 0 ? latencyMsSeries[latencyMsSeries.length - 1]?.[1] ?? null : null;
  let lastLatencyStr = "—";
  if (lastLatencyVal != null) {
    const v = lastLatencyVal;
    lastLatencyStr = v >= 1000 ? `${(v / 1000).toFixed(2)}s` : `${Math.round(v)}ms`;
  }

  return {
    download,
    upload,
    connections,
    lastThroughputStr,
    lastConnectionsStr,
    throughputBps,
    latencyMs: latencyMsSeries,
    lastThroughputRateStr,
    lastLatencyStr,
  };
}

export function selectIncidents(payload: OperatorDashboardOut | null | undefined): IncidentForPanel[] {
  if (!payload?.incidents?.length) return [];
  return payload.incidents.map((i) => ({
    severity: i.severity,
    entity: i.entity,
    metric: i.metric,
    value: i.value,
    timestamp: i.timestamp,
    link: i.link,
    status: i.status,
    affectedServers: i.affected_servers,
    acknowledgedBy: i.acknowledged_by ?? null,
  }));
}

function toNumber(v: unknown): number {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string") {
    const n = parseInt(v, 10);
    return Number.isFinite(n) ? n : 0;
  }
  return 0;
}

export function selectClusterMatrix(payload: OperatorDashboardOut | null | undefined): ClusterMatrixRow[] {
  if (!payload?.cluster_matrix?.length) return [];
  return payload.cluster_matrix.map((r) => ({
    region: String(r?.region ?? ""),
    totalNodes: toNumber(r?.total_nodes),
    online: toNumber(r?.online),
    cpuAvg: r?.cpu_avg ?? null,
    ramAvg: r?.ram_avg ?? null,
    users: toNumber(r?.users),
    throughput: toNumber(r?.throughput),
    errorPct: r?.error_pct ?? null,
    latencyP95: r?.latency_p95 ?? null,
    health: (r?.health === "ok" || r?.health === "degraded" || r?.health === "down" ? r.health : "down") as "ok" | "degraded" | "down",
  }));
}

/** Node coverage from operator health_strip (online/total). For full nodes summary use telemetry snapshot. */
export function selectNodeCoverageFromStrip(payload: OperatorDashboardOut | null | undefined): NodeCoverage | null {
  const strip = selectHealthStrip(payload);
  if (!strip) return null;
  return {
    total: strip.totalNodes,
    online: strip.onlineNodes,
    degraded: 0,
    down: Math.max(0, strip.totalNodes - strip.onlineNodes),
    reportingCount: strip.onlineNodes,
  };
}

export function selectServers(payload: OperatorDashboardOut | null | undefined): ServerRowView[] {
  if (!payload?.servers?.length) return [];
  return payload.servers.map((s) => ({
    id: s.id,
    name: s.name,
    region: s.region,
    ip: s.ip,
    status: s.status,
    cpuPct: s.cpu_pct ?? null,
    ramPct: s.ram_pct ?? null,
    users: s.users,
    throughputBps: s.throughput_bps,
    lastHeartbeat: s.last_heartbeat ?? null,
    freshness: s.freshness,
    to: s.to,
  }));
}

export function selectDataStatus(
  payload: OperatorDashboardOut | null | undefined
): "ok" | "degraded" | undefined {
  return payload?.data_status;
}

export function selectLastSuccessfulSampleTs(
  payload: OperatorDashboardOut | null | undefined
): string | null {
  const ts = payload?.last_successful_sample_ts;
  return ts ?? null;
}
