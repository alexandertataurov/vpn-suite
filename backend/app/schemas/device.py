"""Device request/response schemas."""

from datetime import datetime

from pydantic import BaseModel

from app.schemas.base import OrmSchema, StrictSchema


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


class DeviceOut(OrmSchema):
    id: str
    user_id: int
    subscription_id: str
    server_id: str
    device_name: str | None
    public_key: str
    issued_at: datetime
    revoked_at: datetime | None
    suspended_at: datetime | None = None
    data_limit_bytes: int | None = None
    expires_at: datetime | None = None
    created_at: datetime
    issued_configs: list[IssuedConfigOut] = []


class DeviceLimitUpdate(BaseModel):
    data_limit_bytes: int | None = None
    expires_at: datetime | None = None


class DeviceList(OrmSchema):
    items: list[DeviceOut]
    total: int


class RevokeRequest(BaseModel):
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
