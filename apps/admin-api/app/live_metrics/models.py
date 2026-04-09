from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, Field


class NodeLiveState(BaseModel):
    """Compact per-node live state for dashboards."""

    node_id: str
    name: str | None = None
    region: str | None = None
    status: str = "unknown"
    heartbeat_age_s: float | None = None
    peer_count: int | None = None
    rx_bytes: int | None = None
    tx_bytes: int | None = None
    cpu_pct: float | None = None
    ram_pct: float | None = None
    stale: bool = False
    incident_flags: list[str] = Field(default_factory=list)


class ClusterLiveSummary(BaseModel):
    """Aggregated cluster-level view used by top tiles."""

    total_nodes: int = 0
    online_nodes: int = 0
    degraded_nodes: int = 0
    down_nodes: int = 0
    total_peers: int = 0
    total_rx_bytes: int = 0
    total_tx_bytes: int = 0
    stale_nodes: int = 0


class ClusterLiveSnapshot(BaseModel):
    """Snapshot written to Redis hot state and streamed via SSE."""

    ts: float
    updated_at: datetime
    summary: ClusterLiveSummary
    nodes: dict[str, NodeLiveState]
    mode: str = "normal"  # normal|degraded|circuit_open
    degradation_reason: str | None = None
