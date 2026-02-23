"""Per-server IP address schemas (operator IP management)."""

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field

from app.schemas.base import OrmSchema

ServerIpRole = Literal["primary", "secondary"]
ServerIpState = Literal["good", "bad", "blocked", "suspected_dpi"]


class ServerIpCreate(BaseModel):
    ip: str = Field(..., description="IPv4 or IPv6 address")
    role: ServerIpRole = "secondary"
    state: ServerIpState = "good"


class ServerIpUpdate(BaseModel):
    role: ServerIpRole | None = None
    state: ServerIpState | None = None


class ServerIpOut(OrmSchema):
    id: str
    server_id: str
    ip: str
    role: str
    state: str
    last_checked_at: datetime | None = None
    created_at: datetime


class ServerIpListOut(BaseModel):
    items: list[ServerIpOut]
    total: int
