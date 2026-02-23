"""Node metadata and cluster DTOs (spec-aligned)."""

from datetime import datetime

from pydantic import BaseModel


class ClusterTopology(BaseModel):
    """Current cluster state (nodes, capacity, load, health)."""

    timestamp: datetime
    nodes: list["NodeMetadata"]
    total_capacity: int
    current_load: int
    load_factor: float
    load_index: float = 0.0
    health_score: float
    health_index: float = 0.0
    capacity_score: float = 0.0
    topology_version: int


class NodeMetadata(BaseModel):
    """Runtime metadata for a VPN node (from discovery or DB + telemetry)."""

    node_id: str
    container_name: str  # or origin identifier for HTTP nodes
    container_id: str = ""  # empty for HTTP nodes
    host_id: str | None = None
    classification: dict | None = None
    confidence: float | None = None
    evidence: list[str] | None = None
    interface_name: str = "awg0"
    public_key: str = ""
    listen_port: int = 0
    endpoint_ip: str = ""  # external IP/host for clients
    internal_ip: str = ""  # Docker/internal network IP if applicable
    peer_count: int = 0
    total_rx_bytes: int = 0
    total_tx_bytes: int = 0
    mtu: int = 1420
    status: str = "unknown"  # healthy | degraded | unhealthy | unknown
    last_seen: datetime | None = None
    capabilities: dict = {}  # e.g. {"obfuscation": true, "ipv6": false}
    health_score: float = 0.0
    max_peers: int = 1000
    is_draining: bool = False
    latency_ms: float | None = None


ClusterTopology.model_rebuild()


class ClusterTopologyOut(BaseModel):
    """API response for GET /cluster/topology."""

    timestamp: datetime
    nodes: list[dict]
    total_capacity: int
    current_load: int
    load_factor: float
    load_index: float = 0.0
    health_score: float
    health_index: float = 0.0
    capacity_score: float = 0.0
    topology_version: int


class NodeListOut(BaseModel):
    """API response for GET /cluster/nodes (list of node summary)."""

    nodes: list[dict]
    total: int
