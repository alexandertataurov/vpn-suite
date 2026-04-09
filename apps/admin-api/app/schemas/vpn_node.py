"""VPN node monitoring payloads: card (grid) and detail (drilldown)."""

from datetime import datetime

from pydantic import BaseModel, Field

HealthState = str  # "ok" | "degraded" | "down"


class VpnNodeAlertOut(BaseModel):
    """Single alert for a VPN node."""

    severity: str  # critical | warning | info
    metric: str
    value: str | float | int
    baseline: str | float | None = None
    since: datetime | str | None = None
    likely_cause: str | None = None


class VpnNodeIdentityOut(BaseModel):
    """Node identity block."""

    node_id: str
    name: str | None = None
    region: str | None = None
    public_ip: str | None = None
    tunnel_cidr_or_interface_ip: str | None = None
    uptime_node: str | None = None
    uptime_tunnel: str | None = None
    health_state: HealthState = "ok"


class VpnNodeKpisOut(BaseModel):
    """Compact KPIs for card."""

    active_peers: int | None = None
    peers_max: int | None = None
    peers_fullness_pct: float | None = None
    rx_bps: int | float | None = None
    tx_bps: int | float | None = None
    rx_1h: int | None = None
    tx_1h: int | None = None
    handshake_health_pct: float | None = None
    rtt_p50_ms: float | None = None
    rtt_p95_ms: float | None = None
    loss_p50_pct: float | None = None
    loss_p95_pct: float | None = None
    connects_per_min: float | None = None
    disconnects_per_min: float | None = None


class SparkPointOut(BaseModel):
    """Single point for sparkline."""

    x: int
    y: float


class VpnNodeCardOut(BaseModel):
    """One VPN node card for grid."""

    identity: VpnNodeIdentityOut
    kpis: VpnNodeKpisOut = Field(default_factory=VpnNodeKpisOut)
    sparkline_peers: list[SparkPointOut] = Field(default_factory=list)
    sparkline_rx: list[SparkPointOut] = Field(default_factory=list)
    sparkline_tx: list[SparkPointOut] = Field(default_factory=list)
    alerts: list[VpnNodeAlertOut] = Field(default_factory=list, max_length=3)


class VpnNodeInterfaceOut(BaseModel):
    """Tunnel/interface health."""

    if_up: bool | None = None
    mtu: int | None = None
    errors: int | None = None
    drops: int | None = None


class VpnNodeSystemOut(BaseModel):
    """Minimal system metrics that impact VPN."""

    cpu_pct: float | None = None
    ram_pct: float | None = None
    disk_pct: float | None = None
    nic_errs: int | None = None
    container_health: str | None = None  # node-agent, wg/amnezia
    ntp_status: str | None = None


class RttLossPointOut(BaseModel):
    """Single point for RTT/loss timeseries."""

    ts: float
    value: float


class VpnNodePeerRowOut(BaseModel):
    """Minimal peer row for drilldown (matches PeerOut shape)."""

    public_key: str
    peer_id: str | None = None
    device_name: str | None = None
    allowed_ips: str | None = None
    last_handshake_ts: datetime | None = None
    rx_bytes: int | None = None
    tx_bytes: int | None = None
    status: str = "unknown"
    issues: list[str] = Field(default_factory=list)
    rtt_ms: int | None = None
    loss_pct: float | None = None


class VpnNodeDetailOut(BaseModel):
    """Full VPN node payload for drilldown."""

    card: VpnNodeCardOut
    peers: list[VpnNodePeerRowOut] = Field(default_factory=list)
    rtt_timeseries_1h: list[RttLossPointOut] = Field(default_factory=list)
    rtt_timeseries_24h: list[RttLossPointOut] = Field(default_factory=list)
    loss_timeseries_1h: list[RttLossPointOut] = Field(default_factory=list)
    interface: VpnNodeInterfaceOut | None = None
    system: VpnNodeSystemOut | None = None
