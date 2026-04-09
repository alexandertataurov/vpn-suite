"""Docker telemetry API schemas."""

from __future__ import annotations

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field


class HostSummary(BaseModel):
    host_id: str
    name: str
    endpoint_kind: Literal["unix", "tcp", "ssh"] = "unix"
    is_reachable: bool
    containers_total: int = 0
    running: int = 0
    stopped: int = 0
    unhealthy: int = 0
    restart_loops: int = 0
    last_seen_at: datetime | None = None


class HostSummaryListOut(BaseModel):
    items: list[HostSummary]
    total: int


class ContainerPort(BaseModel):
    ip: str
    private_port: int
    public_port: int | None = None
    protocol: Literal["tcp", "udp"] = "tcp"


class ContainerSummary(BaseModel):
    host_id: str
    container_id: str
    name: str
    compose_service: str | None = None
    compose_project: str | None = None
    image: str
    image_tag: str | None = None
    state: Literal["running", "exited", "paused", "restarting", "dead", "created"] | str = "created"
    health_status: Literal["healthy", "unhealthy", "starting", "none"] = "none"
    restart_count: int = 0
    is_restart_loop: bool = False
    uptime_seconds: int | None = None
    cpu_pct: float | None = None
    mem_bytes: int | None = None
    mem_limit_bytes: int | None = None
    mem_pct: float | None = None
    net_rx_bytes: int | None = None
    net_tx_bytes: int | None = None
    blk_read_bytes: int | None = None
    blk_write_bytes: int | None = None
    ports: list[ContainerPort] = Field(default_factory=list)
    image_version: str | None = None
    env_hash: str
    error_rate_5m: float | None = None
    created_at: datetime | None = None
    started_at: datetime | None = None


class ContainerSummaryListOut(BaseModel):
    items: list[ContainerSummary]
    total: int


class ContainerMetricsPoint(BaseModel):
    ts: datetime
    cpu_pct: float | None = None
    mem_bytes: int | None = None
    mem_pct: float | None = None
    net_rx_bps: float | None = None
    net_tx_bps: float | None = None
    blk_read_bps: float | None = None
    blk_write_bps: float | None = None


class ContainerMetricsTimeseries(BaseModel):
    host_id: str
    container_id: str
    from_ts: datetime = Field(serialization_alias="from")
    to_ts: datetime = Field(serialization_alias="to")
    step_seconds: int
    points: list[ContainerMetricsPoint]


class ContainerLogLine(BaseModel):
    ts: datetime
    stream: Literal["stdout", "stderr"] = "stdout"
    severity: Literal["error", "warn", "info"] = "info"
    message: str


class ContainerLogLineListOut(BaseModel):
    items: list[ContainerLogLine]
    total: int


class AlertItem(BaseModel):
    id: str
    severity: Literal["critical", "warning", "info"]
    rule: str
    host_id: str
    container_id: str | None = None
    container_name: str | None = None
    created_at: datetime
    status: Literal["firing", "resolved"] = "firing"
    context: dict = Field(default_factory=dict)


class AlertItemListOut(BaseModel):
    items: list[AlertItem]
    total: int
