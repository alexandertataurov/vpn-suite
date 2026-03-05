"""Server request/response schemas. api_endpoint validated for SSRF (https only, no private IPs)."""

from datetime import datetime
from ipaddress import ip_address, ip_network
from typing import Literal
from urllib.parse import urlparse

from pydantic import BaseModel, Field, field_validator

from app.schemas.base import OrmSchema

ServerStatusEnum = Literal["online", "offline", "degraded", "unknown"]


def normalize_server_status(raw: str | None) -> ServerStatusEnum:
    """Map DB/health status to API enum."""
    if not raw:
        return "unknown"
    s = raw.lower()
    if s in ("healthy", "ok"):
        return "online"
    if s == "degraded":
        return "degraded"
    if s in ("unhealthy", "unreachable", "down", "error", "offline"):
        return "offline"
    return "unknown"


# Blocked for SSRF: loopback, private, link-local (RFC 3922), localhost
_FORBIDDEN_IP_NETWORKS = ("127.0.0.0/8", "10.0.0.0/8", "172.16.0.0/12", "169.254.0.0/16", "::1/128")


def _is_forbidden_host(host: str) -> bool:
    """True if host is localhost or a forbidden IP (private/loopback/link-local)."""
    if not host or host.lower() in ("localhost", "localhost.", "localhost.localdomain"):
        return True
    try:
        addr = ip_address(host)
        for net in _FORBIDDEN_IP_NETWORKS:
            if addr in ip_network(net):
                return True
        return False
    except ValueError:
        return False  # not an IP; allow (e.g. public hostname) — DNS rebinding mitigated at call time with timeout


def _validate_vpn_endpoint(v: str | None) -> str | None:
    """Validate VPN endpoint as host:port (port 1-65535). Host may be hostname or IP (including private for NAT)."""
    if v is None or (v := v.strip()) == "":
        return None
    if ":" not in v:
        raise ValueError("vpn_endpoint must be host:port (e.g. vpn.example.com:47604)")
    host, _, port_str = v.rpartition(":")
    host = host.strip()
    if not host:
        raise ValueError("vpn_endpoint must have a host")
    try:
        port = int(port_str.strip())
    except ValueError:
        raise ValueError("vpn_endpoint port must be numeric")
    if not (1 <= port <= 65535):
        raise ValueError("vpn_endpoint port must be 1-65535")
    return v


class ServerCreate(BaseModel):
    """Create a server. Optional id: use for agent mode so node-agent can set SERVER_ID to match."""

    id: str | None = (
        None  # Optional; 1–32 chars, alphanumeric + hyphen/underscore. If set, node-agent must use SERVER_ID=<this>
    )
    name: str
    region: str
    api_endpoint: str
    vpn_endpoint: str | None = None  # VPN host:port e.g. vpn.example.com:47604
    public_key: str | None = None
    preshared_key: str | None = None
    amnezia_h1: int | None = None
    amnezia_h2: int | None = None
    amnezia_h3: int | None = None
    amnezia_h4: int | None = None

    @field_validator("id")
    @classmethod
    def id_format(cls, v: str | None) -> str | None:
        if v is None or v == "":
            return None
        v = v.strip()
        if not (1 <= len(v) <= 32):
            raise ValueError("id must be 1–32 characters")
        if not all(c.isalnum() or c in "-_" for c in v):
            raise ValueError("id must be alphanumeric, hyphen, or underscore")
        return v

    @field_validator("api_endpoint")
    @classmethod
    def api_endpoint_https_no_private(cls, v: str) -> str:
        """Accept bare IP/host or http(s) URL; default to http://; reject private hosts."""
        v = (v or "").strip()
        if "://" not in v:
            v = "http://" + v
        parsed = urlparse(v)
        scheme = (parsed.scheme or "").lower()
        if scheme not in ("https", "http"):
            raise ValueError("api_endpoint must be https or http URL")
        host = (parsed.hostname or "").strip()
        if not host:
            raise ValueError("api_endpoint must have a host")
        if _is_forbidden_host(host):
            raise ValueError("api_endpoint must not point to private or localhost")
        return v

    @field_validator("vpn_endpoint")
    @classmethod
    def vpn_endpoint_format(cls, v: str | None) -> str | None:
        return _validate_vpn_endpoint(v)


class ServerUpdate(BaseModel):
    name: str | None = None
    region: str | None = None
    api_endpoint: str | None = None
    vpn_endpoint: str | None = None
    public_key: str | None = None
    preshared_key: str | None = None
    amnezia_h1: int | None = None
    amnezia_h2: int | None = None
    amnezia_h3: int | None = None
    amnezia_h4: int | None = None
    ops_notes: str | None = None

    @field_validator("api_endpoint")
    @classmethod
    def api_endpoint_https_no_private(cls, v: str | None) -> str | None:
        if v is None:
            return None
        v = v.strip()
        if "://" not in v:
            v = "http://" + v
        parsed = urlparse(v)
        if (parsed.scheme or "").lower() not in ("https", "http"):
            raise ValueError("api_endpoint must be https or http URL")
        host = (parsed.hostname or "").strip()
        if not host or _is_forbidden_host(host):
            raise ValueError("api_endpoint must not point to private or localhost")
        return v

    @field_validator("vpn_endpoint")
    @classmethod
    def vpn_endpoint_format(cls, v: str | None) -> str | None:
        return _validate_vpn_endpoint(v)

    is_active: bool | None = None
    auto_sync_enabled: bool | None = None
    auto_sync_interval_sec: int | None = None


class ServerOut(OrmSchema):
    id: str
    name: str
    region: str
    api_endpoint: str
    vpn_endpoint: str | None
    public_key: str | None
    preshared_key: str | None = None
    amnezia_h1: int | None = None
    amnezia_h2: int | None = None
    amnezia_h3: int | None = None
    amnezia_h4: int | None = None
    status: ServerStatusEnum
    is_active: bool
    health_score: float | None = None
    is_draining: bool = False
    max_connections: int | None = None
    created_at: datetime
    last_seen_at: datetime | None = None  # from latest ServerHealthLog.ts
    last_snapshot_at: datetime | None = None  # from last successful server sync
    request_id: str | None = None  # set on mutating responses for traceability
    # Optional vNext fields (backward compatible; no DB migration in PR-01)
    updated_at: datetime | None = None
    provider: str | None = None
    tags: list[str] | None = None
    auto_sync_enabled: bool = False
    auto_sync_interval_sec: int = 60
    ops_notes: str | None = None
    ops_notes_updated_at: datetime | None = None
    ops_notes_updated_by: str | None = None
    cert_fingerprint: str | None = None
    cert_expires_at: datetime | None = None


class ServerCertStatusOut(BaseModel):
    """mTLS cert status for agent/server (from env or DB)."""

    fingerprint: str | None = None
    expires_at: datetime | None = None
    last_rotation_at: datetime | None = None


class ServerList(BaseModel):
    items: list[ServerOut]
    total: int
    # True when NODE_DISCOVERY=agent and no Redis heartbeats; list is empty until node-agent sends heartbeat with SERVER_ID
    agent_mode_no_heartbeat: bool = False


class ServerDeviceCountsOut(BaseModel):
    """Map server_id -> device count for list views."""

    counts: dict[str, int]


class ServerStatusOut(BaseModel):
    status: str
    is_active: bool


class ServerHealthOut(BaseModel):
    status: str
    latency_ms: float | None
    handshake_ok: bool | None
    ts: datetime


class RestartRequest(BaseModel):
    reason: str
    confirm_token: str


class ServerCapabilitiesOut(BaseModel):
    profile_types: list[str] = ["awg", "wg_obf", "wg"]
    supports_rotate: bool = True
    max_connections: int | None = None
    is_draining: bool = False


class ServerLimitsOut(BaseModel):
    traffic_limit_gb: float | None
    speed_limit_mbps: float | None
    max_connections: int | None


class ServerLimitsUpdate(BaseModel):
    traffic_limit_gb: float | None = None
    speed_limit_mbps: float | None = None
    max_connections: int | None = None


class PeerOut(BaseModel):
    """Node peer. peer_id present when mapped to a Device (for admin rotate/revoke)."""

    public_key: str
    peer_id: str | None = None  # Device.id when known (enables rotate/revoke)
    device_name: str | None = None  # Device.device_name when mapped
    allowed_ips: str | None = None
    last_handshake_ts: datetime | None = None
    rx_bytes: int | None = None
    tx_bytes: int | None = None
    traffic_bytes: int | None = None
    status: str = "unknown"  # online, offline, unknown
    issues: list[str] = Field(default_factory=list)  # no_handshake, no_traffic, wrong_allowed_ips
    rtt_ms: int | None = None  # Round-trip time (ms); from node-agent ping to tunnel IP
    loss_pct: float | None = None  # Packet loss % when measured


class ServerPeersOut(BaseModel):
    peers: list[PeerOut]
    total: int
    node_reachable: bool = True  # False when node connection failed


class NodeObfuscationOut(BaseModel):
    """AmneziaWG obfuscation from node (wg show). Issued configs use these when available."""

    H1: int | None = None
    H2: int | None = None
    H3: int | None = None
    H4: int | None = None
    S1: int | None = None
    S2: int | None = None
    Jc: int | None = None
    Jmin: int | None = None
    Jmax: int | None = None


class ServerTelemetryOut(BaseModel):
    peers_count: int
    online_count: int
    total_rx_bytes: int | None = None
    total_tx_bytes: int | None = None
    last_updated: datetime | None = None
    source: str = "api"  # api | cache | agent
    node_reachable: bool = True  # False when node connection failed
    # Agent heartbeat (when source=agent)
    container_name: str | None = None
    agent_version: str | None = None
    reported_status: str | None = None  # healthy | degraded | unhealthy | unknown
    node_obfuscation: NodeObfuscationOut | None = (
        None  # From heartbeat (wg show); current H1–H4 on node
    )


class BlockPeerRequest(BaseModel):
    public_key: str
    confirm_token: str


class ResetPeerRequest(BaseModel):
    public_key: str


BulkAction = Literal[
    "mark_draining", "unmark_draining", "disable_provisioning", "enable_provisioning"
]


class ServerBulkRequest(BaseModel):
    server_ids: list[str]
    action: BulkAction
    confirm_token: str | None = None  # Required for disable_provisioning, enable_provisioning


class ServerTelemetryEntry(BaseModel):
    cpu_pct: float | None = None
    ram_pct: float | None = None
    peers: int | None = None
    health_score: float | None = None
    last_metrics_at: datetime | None = None
    last_telemetry_at: datetime | None = None
    telemetry_status: Literal["ok", "stale", "missing", "error"] | None = None


class ServersTelemetrySummaryOut(BaseModel):
    servers: dict[str, ServerTelemetryEntry]


class ServerSnapshotSummaryEntry(BaseModel):
    """Per-server summary from last successful snapshot (authoritative)."""

    cpu_pct: float | None = None
    ram_pct: float | None = None
    ram_used_bytes: int | None = None
    ram_total_bytes: int | None = None
    active_peers: int | None = None
    total_peers: int | None = None
    used_ips: int | None = None
    total_ips: int | None = None
    free_ips: int | None = None
    health_score: float | None = None
    last_snapshot_at: datetime | None = None
    source: str = "snapshot"  # snapshot | unavailable


class ServersSnapshotSummaryOut(BaseModel):
    servers: dict[str, ServerSnapshotSummaryEntry]


class AdminIssuePeerRequest(BaseModel):
    user_id: int | None = None
    subscription_id: str | None = None
    label: str | None = None  # device_name
    device_limit: int | None = None  # optional override; not used for standalone
    expires_in_days: int | None = None
    client_request_id: str | None = None  # idempotency
    client_endpoint: str | None = None  # host:port override when server.vpn_endpoint unset


class ConfigEntryOut(BaseModel):
    """Download URL and QR payload for a single config format."""

    download_url: str
    qr_payload: str
    # Optional Amnezia vpn:// key for clients that expect text-key import.
    amnezia_vpn_key: str | None = None


class AdminIssuePeerPeerOut(BaseModel):
    id: str
    server_id: str
    device_name: str | None
    public_key: str
    issued_at: datetime


class AdminIssuePeerResponse(BaseModel):
    peer: AdminIssuePeerPeerOut
    config_awg: ConfigEntryOut
    config_wg_obf: ConfigEntryOut
    config_wg: ConfigEntryOut
    request_id: str
    peer_created: bool = False


class AdminRotatePeerResponse(BaseModel):
    config_awg: ConfigEntryOut
    config_wg_obf: ConfigEntryOut
    config_wg: ConfigEntryOut
    request_id: str


class AdminRevokePeerResponse(BaseModel):
    request_id: str
    message: str = "Peer revoked"
