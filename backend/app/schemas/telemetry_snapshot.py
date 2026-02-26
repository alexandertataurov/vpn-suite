"""Telemetry snapshot API: UI-ready aggregated response shapes."""

from pydantic import BaseModel, ConfigDict, Field


class NodeSummaryOut(BaseModel):
    total: int = 0
    online: int = 0
    degraded: int = 0
    down: int = 0


class NodeEntryOut(BaseModel):
    id: str
    name: str = ""
    region: str = ""
    health: str = "unknown"  # ok | degraded | broken
    handshake_age_s: int | None = None
    traffic_recent: bool = False
    peers: int = 0
    rx: int = 0
    tx: int = 0
    stale: bool = False
    last_success_ts: int | None = None


class NodesSnapshotOut(BaseModel):
    model_config = ConfigDict(populate_by_name=True, serialize_by_alias=True)
    summary: NodeSummaryOut = Field(default_factory=NodeSummaryOut)
    items: list[NodeEntryOut] = Field(default_factory=list, alias="list")


class DeviceSummaryOut(BaseModel):
    total: int = 0
    handshake_ok: int = 0
    needs_reconcile: int = 0
    stale: int = 0


class DeviceEntryOut(BaseModel):
    id: str
    server_id: str
    handshake_age_s: int | None = None
    allowed_ips_ok: bool = False
    traffic_recent: bool = False
    stale: bool = False


class DevicesSnapshotOut(BaseModel):
    model_config = ConfigDict(populate_by_name=True, serialize_by_alias=True)
    summary: DeviceSummaryOut = Field(default_factory=DeviceSummaryOut)
    items: list[DeviceEntryOut] = Field(default_factory=list, alias="list")


class SessionsSnapshotOut(BaseModel):
    active_sessions: int = 0
    incidents_count: int = 0


class SnapshotMetaOut(BaseModel):
    snapshot_ts: int = 0
    cursor: str = ""
    freshness: str = "unknown"  # fresh | degraded | stale
    incidents_count: int = 0
    stale_node_ids: list[str] = Field(default_factory=list)
    partial_failure: bool = False


class TelemetrySnapshotOut(BaseModel):
    """Response for GET /telemetry/snapshot. Only included scopes are present."""
    nodes: NodesSnapshotOut | None = None
    devices: DevicesSnapshotOut | None = None
    sessions: SessionsSnapshotOut | None = None
    meta: SnapshotMetaOut = Field(default_factory=SnapshotMetaOut)
