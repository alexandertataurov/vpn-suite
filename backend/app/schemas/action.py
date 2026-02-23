"""Agent action queue schemas (admin API)."""

from datetime import datetime

from pydantic import BaseModel, Field

ALLOWED_ACTION_TYPES = frozenset(
    {
        "sync",
        "apply_peers",
        "drain",
        "undrain",
        "restart_service",
        "rotate_keys",
        "apply_profile",
        "validate_profile",
        "firewall_ports_check",
    }
)


class ActionCreate(BaseModel):
    type: str = Field(
        ...,
        description="sync | apply_peers | drain | undrain | restart_service | rotate_keys | apply_profile | validate_profile | firewall_ports_check",
    )
    payload: dict | None = None


class ActionCreateOut(BaseModel):
    action_id: str
    correlation_id: str | None = None


class AgentActionLogOut(BaseModel):
    ts: datetime
    level: str
    message: str
    meta: dict | None = None


class ActionOut(BaseModel):
    id: str
    server_id: str
    type: str
    status: str
    requested_by: str | None = None
    requested_at: datetime
    started_at: datetime | None = None
    finished_at: datetime | None = None
    error: str | None = None
    correlation_id: str | None = None
    logs: list[AgentActionLogOut] = Field(default_factory=list)


class ActionListOut(BaseModel):
    items: list[ActionOut]
    total: int


class ServerLogLineOut(BaseModel):
    ts: datetime
    level: str
    message: str
    action_id: str | None = None


class ServerLogsOut(BaseModel):
    lines: list[ServerLogLineOut]
    total: int
