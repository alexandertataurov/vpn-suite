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
      return payload && typeof payload === "object" && payload.nodes ? normalizeSnapshot(payload) : prev;
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

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : null;
}

function normalizeSnapshot(raw: unknown): LiveClusterState {
  const record = asRecord(raw);
  const summaryRecord = asRecord(record?.summary);
  const ts = typeof record?.ts === "number" ? record.ts : Date.now() / 1000;
  const summary: LiveClusterSummary = {
    total_nodes: typeof summaryRecord?.total_nodes === "number" ? summaryRecord.total_nodes : 0,
    online_nodes: typeof summaryRecord?.online_nodes === "number" ? summaryRecord.online_nodes : 0,
    degraded_nodes:
      typeof summaryRecord?.degraded_nodes === "number" ? summaryRecord.degraded_nodes : 0,
    down_nodes: typeof summaryRecord?.down_nodes === "number" ? summaryRecord.down_nodes : 0,
    total_peers: typeof summaryRecord?.total_peers === "number" ? summaryRecord.total_peers : 0,
    total_rx_bytes:
      typeof summaryRecord?.total_rx_bytes === "number" ? summaryRecord.total_rx_bytes : 0,
    total_tx_bytes:
      typeof summaryRecord?.total_tx_bytes === "number" ? summaryRecord.total_tx_bytes : 0,
    stale_nodes: typeof summaryRecord?.stale_nodes === "number" ? summaryRecord.stale_nodes : 0,
  };
  const nodes: Record<string, LiveNodeState> = {};
  const nodesRecord = asRecord(record?.nodes);
  if (nodesRecord) {
    for (const [id, rawNode] of Object.entries(nodesRecord)) {
      const node = asRecord(rawNode) ?? {};
      const incidentFlags = Array.isArray(node.incident_flags)
        ? node.incident_flags.filter((flag): flag is string => typeof flag === "string")
        : [];
      nodes[id] = {
        node_id: typeof node.node_id === "string" ? node.node_id : id,
        name: typeof node.name === "string" ? node.name : null,
        region: typeof node.region === "string" ? node.region : null,
        status: typeof node.status === "string" ? node.status : "unknown",
        heartbeat_age_s: typeof node.heartbeat_age_s === "number" ? node.heartbeat_age_s : null,
        peer_count: typeof node.peer_count === "number" ? node.peer_count : null,
        rx_bytes: typeof node.rx_bytes === "number" ? node.rx_bytes : null,
        tx_bytes: typeof node.tx_bytes === "number" ? node.tx_bytes : null,
        cpu_pct: typeof node.cpu_pct === "number" ? node.cpu_pct : null,
        ram_pct: typeof node.ram_pct === "number" ? node.ram_pct : null,
        stale: Boolean(node.stale),
        incident_flags: incidentFlags,
      };
    }
  }
  return {
    ts,
    summary,
    nodes,
    mode: typeof record?.mode === "string" ? record.mode : "normal",
    degradation_reason: typeof record?.degradation_reason === "string" ? record.degradation_reason : null,
  };
}
