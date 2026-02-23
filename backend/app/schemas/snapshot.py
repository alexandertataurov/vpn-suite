"""Server snapshot schema — canonical telemetry from AmneziaWG node."""

from datetime import datetime
from enum import Enum

from pydantic import BaseModel, Field


class SnapshotHealthStatus(str, Enum):
    online = "online"
    offline = "offline"
    degraded = "degraded"
    unknown = "unknown"


class SnapshotLocation(BaseModel):
    region: str
    city: str | None = None
    country: str | None = None
    provider: str | None = None
    source: str = "configured"  # configured | geoip


class SnapshotEndpoints(BaseModel):
    vpn_endpoint: str | None = None
    public_key: str | None = None


class SnapshotResources(BaseModel):
    cpu_pct: float | None = None
    ram_used_bytes: int | None = None
    ram_total_bytes: int | None = None
    ram_pct: float | None = None
    unavailable_reason: str | None = None


class SnapshotUsers(BaseModel):
    active_peers: int = 0
    total_peers: int = 0
    last_handshake_max_age_sec: int | None = None
    source: str = "amneziawg"


class SnapshotIpPool(BaseModel):
    cidr: str | None = None
    total_ips: int | None = None
    used_ips: int | None = None
    free_ips: int | None = None
    conflicts_detected: bool = False
    source: str = "amneziawg"


class SnapshotHealth(BaseModel):
    status: SnapshotHealthStatus = SnapshotHealthStatus.unknown
    health_score: float | None = None  # 0..100
    reasons: list[str] = Field(default_factory=list)
    is_draining: bool = False


class SnapshotLimits(BaseModel):
    peers_capacity: int | None = None
    cpu_warn_threshold: int | None = 80
    ram_warn_threshold: int | None = 90


class ServerSnapshot(BaseModel):
    """Canonical snapshot from one AmneziaWG server (node or agent)."""

    server_id: str
    ts_utc: datetime
    version: dict | None = None  # e.g. {"awg": "1.x", "panel_agent": null}
    location: SnapshotLocation
    endpoints: SnapshotEndpoints
    resources: SnapshotResources
    users: SnapshotUsers
    ip_pool: SnapshotIpPool
    health: SnapshotHealth
    limits: SnapshotLimits = Field(default_factory=SnapshotLimits)


class ServerSyncRequest(BaseModel):
    mode: str = "manual"  # manual | auto


class ServerSyncResponse(BaseModel):
    request_id: str
    job_id: str
    action_id: str | None = None  # Set when agent mode: frontend polls GET /actions/{action_id}


class ServerSyncJobStatus(BaseModel):
    job_id: str
    server_id: str
    status: str  # pending | running | completed | failed (normalize to queued|running|succeeded|failed|canceled in vNext)
    started_at: datetime | None
    finished_at: datetime | None
    request_id: str | None
    error: str | None = None
    progress_pct: int | None = None  # 0..100
    logs_tail: list[str] | None = None
    job_type: str = "sync"  # sync | verify | rotate | restart | healthcheck
