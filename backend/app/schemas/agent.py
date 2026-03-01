"""Node-agent (pull model) schemas: heartbeat -> control-plane, desired-state <- control-plane."""

from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, Field


class AgentHeartbeatIn(BaseModel):
    """Agent heartbeat payload (no secrets)."""

    server_id: str = Field(..., description="Control-plane server_id this agent manages")
    container_name: str = Field(..., description="Local AmneziaWG container name (amnezia-awg*)")
    host_id: str | None = Field(default=None, description="Stable host id")
    container_id: str | None = Field(default=None, description="Docker container id")
    classification: dict | None = Field(default=None, description="Discovery classification")
    confidence: float | None = Field(default=None, description="Discovery confidence 0..1")
    evidence: list[str] | None = Field(default=None, description="Evidence strings")
    interface_name: str = Field(default="awg0")
    public_key: str = Field(default="")
    listen_port: int = Field(default=0, ge=0, le=65535)
    peer_count: int = Field(default=0, ge=0)
    total_rx_bytes: int = Field(default=0, ge=0)
    total_tx_bytes: int = Field(default=0, ge=0)
    health_score: float = Field(default=1.0, ge=0.0, le=1.0)
    status: str = Field(default="unknown", description="healthy|degraded|unhealthy|unknown")
    agent_version: str = Field(default="unknown")
    ts_utc: datetime = Field(..., description="Agent timestamp UTC")
    # Per-peer telemetry for device list (public_key, allowed_ips, last_handshake_age_sec, rx_bytes, tx_bytes)
    peers: list[dict] | None = Field(default=None, description="Per-peer telemetry from node")


class AgentAckOut(BaseModel):
    ok: bool = True
    server_time_utc: datetime


class AgentDesiredPeer(BaseModel):
    public_key: str
    allowed_ips: str = "0.0.0.0/0, ::/0"
    persistent_keepalive: int = 25
    preshared_key: str | None = None


class ObfuscationHOut(BaseModel):
    """AmneziaWG H1–H4 from Server; sync to node env (AWG_H1–AWG_H4) for rotation."""

    h1: int
    h2: int
    h3: int
    h4: int


class ObfuscationFullOut(BaseModel):
    """Full AmneziaWG obfuscation (S1, S2, Jc, Jmin, Jmax, H1–H4). Sync to node env so issued configs match."""

    s1: int
    s2: int
    jc: int = 3
    jmin: int = 10
    jmax: int = 50
    h1: int
    h2: int
    h3: int
    h4: int


class AgentDesiredStateOut(BaseModel):
    server_id: str
    interface_name: str = "awg0"
    revision: str = Field(..., description="Opaque revision for idempotency/caching")
    peers: list[AgentDesiredPeer]
    correlation_id: str | None = Field(
        default=None, description="Request/correlation ID for logs and audit"
    )
    obfuscation_h: ObfuscationHOut | None = Field(
        default=None,
        description="When set, node should apply AWG_H1–H4 and restart AmneziaWG",
    )
    obfuscation_full: ObfuscationFullOut | None = Field(
        default=None,
        description="When set, node should apply AWG_S1,S2,Jc,Jmin,Jmax,H1–H4 and restart AmneziaWG",
    )


# --- Agent API v1 (versioned routes: status, telemetry, peers, actions) ---


class AgentV1StatusOut(BaseModel):
    """Agent v1 status from last heartbeat (Redis)."""

    server_id: str
    agent_version: str = "unknown"
    interface_name: str = "awg0"
    last_heartbeat_ts: datetime | None = None


class AgentV1TelemetryOut(BaseModel):
    """Agent v1 telemetry from last heartbeat (Redis)."""

    server_id: str
    peer_count: int = 0
    total_rx_bytes: int = 0
    total_tx_bytes: int = 0
    health_score: float = 1.0
    status: str = "unknown"


class AgentV1PeerOut(BaseModel):
    """Single peer in agent v1 peers list (from heartbeat or snapshot)."""

    public_key: str
    allowed_ips: str = ""
    last_handshake_age_sec: int | None = None
    rx_bytes: int = 0
    tx_bytes: int = 0


class AgentV1ActionExecuteIn(BaseModel):
    """Stub: push-mode action request (prefer poll/report)."""

    type: str = Field(..., description="Action type e.g. sync, apply_peers")
    payload: dict | None = None


class AgentV1ActionPollOut(BaseModel):
    """Pull-mode: next pending action for server_id; empty if none."""

    action_id: str | None = None
    type: str | None = None
    payload: dict | None = None


class AgentV1ActionReportIn(BaseModel):
    """Agent reports action completion or failure."""

    action_id: str
    status: str = Field(..., description="completed | failed")
    message: str = ""
    meta: dict | None = None
