from __future__ import annotations

from datetime import datetime
from typing import Dict, List, Optional

from pydantic import BaseModel, Field


class NodeLiveState(BaseModel):
    """Compact per-node live state for dashboards."""

    node_id: str
    name: Optional[str] = None
    region: Optional[str] = None
    status: str = "unknown"
    heartbeat_age_s: Optional[float] = None
    peer_count: Optional[int] = None
    rx_bytes: Optional[int] = None
    tx_bytes: Optional[int] = None
    cpu_pct: Optional[float] = None
    ram_pct: Optional[float] = None
    stale: bool = False
    incident_flags: List[str] = Field(default_factory=list)


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
    nodes: Dict[str, NodeLiveState]
    mode: str = "normal"  # normal|degraded|circuit_open
    degradation_reason: Optional[str] = None

