export type LiveConnectionState = "live" | "degraded" | "offline";

export interface LiveNodeState {
  node_id: string;
  name?: string | null;
  region?: string | null;
  status: string;
  heartbeat_age_s?: number | null;
  peer_count?: number | null;
  rx_bytes?: number | null;
  tx_bytes?: number | null;
  cpu_pct?: number | null;
  ram_pct?: number | null;
  stale?: boolean;
  incident_flags?: string[];
}

export interface LiveClusterSummary {
  total_nodes: number;
  online_nodes: number;
  degraded_nodes: number;
  down_nodes: number;
  total_peers: number;
  total_rx_bytes: number;
  total_tx_bytes: number;
  stale_nodes: number;
}

export interface LiveClusterState {
  ts: number;
  summary: LiveClusterSummary;
  nodes: Record<string, LiveNodeState>;
  mode: string;
  degradation_reason?: string | null;
}

export interface LiveEvent {
  type: "snapshot" | "patch" | "degraded";
  payload: unknown;
}

export function applyLiveEvent(
  prev: LiveClusterState | null,
  event: LiveEvent
): LiveClusterState | null {
  if (event.type === "snapshot") {
    const payload = event.payload as LiveClusterState;
    if (!payload || typeof payload !== "object") return prev;
    return normalizeSnapshot(payload);
  }
  if (event.type === "patch") {
    const payload = event.payload as {
      ts?: number;
      summary?: Partial<LiveClusterSummary>;
      nodes?: Record<string, LiveNodeState>;
      mode?: string;
      degradation_reason?: string | null;
    };
    if (!prev) {
      // No baseline yet – treat as snapshot.
      return payload && (payload as any).nodes ? normalizeSnapshot(payload as any) : prev;
    }
    const nextNodes = { ...prev.nodes };
    if (payload.nodes && typeof payload.nodes === "object") {
      for (const [id, node] of Object.entries(payload.nodes)) {
        nextNodes[id] = { ...(nextNodes[id] ?? { node_id: id }), ...node };
      }
    }
    const nextSummary: LiveClusterSummary = {
      ...prev.summary,
      ...(payload.summary ?? {}),
    };
    return {
      ts: payload.ts ?? prev.ts,
      summary: nextSummary,
      nodes: nextNodes,
      mode: payload.mode ?? prev.mode,
      degradation_reason: payload.degradation_reason ?? prev.degradation_reason,
    };
  }
  if (event.type === "degraded") {
    if (!prev) return prev;
    const payload = event.payload as { mode?: string; reason?: string };
    return {
      ...prev,
      mode: payload.mode ?? "degraded",
      degradation_reason: payload.reason ?? prev.degradation_reason,
    };
  }
  return prev;
}

function normalizeSnapshot(raw: any): LiveClusterState {
  const ts = typeof raw.ts === "number" ? raw.ts : Date.now() / 1000;
  const summary: LiveClusterSummary = {
    total_nodes: raw.summary?.total_nodes ?? 0,
    online_nodes: raw.summary?.online_nodes ?? 0,
    degraded_nodes: raw.summary?.degraded_nodes ?? 0,
    down_nodes: raw.summary?.down_nodes ?? 0,
    total_peers: raw.summary?.total_peers ?? 0,
    total_rx_bytes: raw.summary?.total_rx_bytes ?? 0,
    total_tx_bytes: raw.summary?.total_tx_bytes ?? 0,
    stale_nodes: raw.summary?.stale_nodes ?? 0,
  };
  const nodes: Record<string, LiveNodeState> = {};
  if (raw.nodes && typeof raw.nodes === "object") {
    for (const [id, node] of Object.entries<any>(raw.nodes)) {
      nodes[id] = {
        node_id: node.node_id ?? id,
        name: node.name ?? null,
        region: node.region ?? null,
        status: node.status ?? "unknown",
        heartbeat_age_s: node.heartbeat_age_s ?? null,
        peer_count: node.peer_count ?? null,
        rx_bytes: node.rx_bytes ?? null,
        tx_bytes: node.tx_bytes ?? null,
        cpu_pct: node.cpu_pct ?? null,
        ram_pct: node.ram_pct ?? null,
        stale: Boolean(node.stale),
        incident_flags: Array.isArray(node.incident_flags) ? node.incident_flags : [],
      };
    }
  }
  return {
    ts,
    summary,
    nodes,
    mode: raw.mode ?? "normal",
    degradation_reason: raw.degradation_reason ?? null,
  };
}

