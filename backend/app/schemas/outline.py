"""Outline integration API schemas."""

from datetime import datetime

from pydantic import BaseModel


class OutlineStatusOut(BaseModel):
    status: str  # connected | degraded | offline
    version: str | None = None
    name: str | None = None
    lastCheckedAt: datetime


class OutlineKeyOut(BaseModel):
    id: str
    name: str | None
    port: int
    method: str
    dataLimit: dict | None = None  # {"bytes": int}
    bytesTransferred: int | None = None
    linkedDeviceId: str | None = None  # VPN Suite device id if linked


class OutlineKeyListOut(BaseModel):
    keys: list[OutlineKeyOut]


class OutlineKeyCreateIn(BaseModel):
    name: str | None = None
    limitBytes: int | None = None
    linkUserId: int | None = None
    linkDeviceId: str | None = None


class OutlineKeyRenameIn(BaseModel):
    name: str


class OutlineServerOut(BaseModel):
    """Full server info from GET /server (no secrets)."""

    name: str | None = None
    serverId: str | None = None
    version: str | None = None
    metricsEnabled: bool = False
    portForNewAccessKeys: int | None = None
    hostnameForAccessKeys: str | None = None
    accessKeyDataLimit: dict | None = None  # {"bytes": int} or None


class OutlineDataLimitIn(BaseModel):
    bytes: int  # > 0


class OutlinePortIn(BaseModel):
    port: int  # 1-65535


class OutlineHostnameIn(BaseModel):
    hostname: str  # domain or IP for access keys


# Experimental metrics: server + per-key (tunnel time, data transferred, lastTrafficSeen, etc.)
class OutlineMetricsOut(BaseModel):
    server: dict | None = None
    accessKeys: list[dict] | None = None
