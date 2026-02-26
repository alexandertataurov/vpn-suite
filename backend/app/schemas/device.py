"""Device request/response schemas."""

from datetime import datetime
from typing import Literal

from pydantic import BaseModel

from app.schemas.base import OrmSchema, StrictSchema

ReconciliationStatus = Literal["ok", "needs_reconcile", "broken"]
NodeHealthStatus = Literal["online", "offline", "unknown"]
ConfigStateStatus = Literal["issued", "used", "pending"]


class IssuedConfigOut(OrmSchema):
    """Issued config metadata (per device) — no token or encrypted config."""

    id: str
    server_id: str
    profile_type: str
    expires_at: datetime | None
    consumed_at: datetime | None
    created_at: datetime


class IssueRequest(BaseModel):
    subscription_id: str
    server_id: str | None = None  # omit for load-balanced selection
    device_name: str | None = None


class IssueResponse(StrictSchema):
    device_id: str
    issued_at: datetime
    config: str | None  # Deprecated; AWG config for backward compatibility
    config_awg: str | None = None
    config_wg_obf: str | None = None
    config_wg: str | None = None
    server_id: str
    subscription_id: str
    node_mode: str = "mock"  # "mock" | "real"; when mock, peer not created on node
    peer_created: bool = False  # True when peer was created on VPN node (NODE_MODE=real)


class DeviceTelemetryOut(BaseModel):
    """Per-device telemetry from cache (handshake, rx/tx, reconciliation)."""

    device_id: str
    handshake_latest_at: datetime | None = None
    handshake_age_sec: int | None = None
    transfer_rx_bytes: int | None = None
    transfer_tx_bytes: int | None = None
    endpoint: str | None = None
    allowed_ips_on_node: str | None = None
    peer_present: bool = False
    node_health: NodeHealthStatus = "unknown"
    config_state: ConfigStateStatus = "issued"
    reconciliation_status: ReconciliationStatus = "ok"
    telemetry_reason: str | None = None
    last_updated: datetime | None = None


class DeviceOut(OrmSchema):
    id: str
    user_id: int
    subscription_id: str
    server_id: str
    device_name: str | None
    public_key: str
    allowed_ips: str | None = None
    issued_at: datetime
    revoked_at: datetime | None
    suspended_at: datetime | None = None
    data_limit_bytes: int | None = None
    expires_at: datetime | None = None
    created_at: datetime
    issued_configs: list[IssuedConfigOut] = []
    user_email: str | None = None  # Populated when listing with User join
    telemetry: DeviceTelemetryOut | None = None  # From cache when available
    # State reconciliation
    apply_status: str | None = None  # PENDING_APPLY | APPLIED | FAILED_APPLY | NO_HANDSHAKE
    last_applied_at: datetime | None = None
    last_seen_handshake_at: datetime | None = None
    last_error: str | None = None
    protocol_version: str | None = None  # awg_legacy | awg_15 | awg_20


class DeviceListItemOut(OrmSchema):
    """Device fields for list; no issued_configs to avoid lazy-load 500s."""

    id: str
    user_id: int
    subscription_id: str
    server_id: str
    device_name: str | None
    public_key: str
    allowed_ips: str | None = None
    issued_at: datetime
    revoked_at: datetime | None
    suspended_at: datetime | None = None
    data_limit_bytes: int | None = None
    expires_at: datetime | None = None
    created_at: datetime
    apply_status: str | None = None
    last_applied_at: datetime | None = None
    last_seen_handshake_at: datetime | None = None
    last_error: str | None = None
    protocol_version: str | None = None


class DeviceLimitUpdate(BaseModel):
    data_limit_bytes: int | None = None
    expires_at: datetime | None = None


class DeviceList(OrmSchema):
    items: list[DeviceOut]
    total: int


class UserDeviceList(BaseModel):
    """List of devices for GET /users/{id}/devices; uses DeviceListItemOut to avoid loading issued_configs."""

    items: list[DeviceListItemOut]
    total: int


class DeviceSummaryOut(BaseModel):
    """Aggregate counts for devices dashboard."""

    total: int
    active: int
    revoked: int
    unused_configs: int  # issued_configs where consumed_at is null
    no_allowed_ips: int  # devices where allowed_ips null/empty/invalid
    handshake_ok_count: int = 0  # from telemetry cache: handshake in last 2m
    no_handshake_count: int = 0  # from telemetry cache: no handshake or stale
    traffic_zero_count: int = 0  # from telemetry cache: rx+tx == 0
    telemetry_last_updated: datetime | None = None  # global cache freshness


class RevokeRequest(BaseModel):
    confirm_token: str


class DeleteRequest(BaseModel):
    confirm_token: str


class BlockRequest(BaseModel):
    confirm_token: str


class ResetRequest(BaseModel):
    # Unsafe fallback: allow DB revoke when node peer removal failed.
    # Default is fail-closed (False).
    force_revoke_db_only: bool = False


class BulkRevokeRequest(BaseModel):
    device_ids: list[str]
    confirm_token: str


class BulkRevokeOut(BaseModel):
    revoked: int
    skipped: int
    errors: list[str]
