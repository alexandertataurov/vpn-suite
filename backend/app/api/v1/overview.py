"""Overview/stats for admin dashboard."""

from __future__ import annotations

import logging
import time
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from pydantic import BaseModel
from sqlalchemy import func, select

from app.core.bot_auth import get_admin_or_bot
from app.core.config import settings
from app.core.constants import PERM_CLUSTER_READ
from app.core.database import get_db
from app.core.logging_config import extra_for_event
from app.core.rbac import require_permission
from app.core.telemetry_polling_task import get_dashboard_timeseries
from app.models import Device, Plan, Server, ServerSnapshot, Subscription, User

logger = logging.getLogger(__name__)

router = APIRouter(tags=["overview"])


class OverviewStats(BaseModel):
    servers_total: int
    servers_unhealthy: int
    peers_total: int
    users_total: int
    subscriptions_active: int
    mrr: float


class ConnectionNodeOut(BaseModel):
    """Single node in the unified dashboard: server (AWG)."""

    id: str
    type: str  # "server"
    label: str
    region: str | None = None
    peer_count: int = 0
    status: str | None = None
    to: str  # path for drilldown


class ConnectionNodesOut(BaseModel):
    nodes: list[ConnectionNodeOut]


class DashboardTimeseriesPoint(BaseModel):
    ts: int
    peers: int
    rx: int
    tx: int


class DashboardTimeseriesOut(BaseModel):
    """Bandwidth (rx/tx bytes) and connections (peers) for last 24h from cluster telemetry."""

    points: list[DashboardTimeseriesPoint]


class HealthSnapshotOut(BaseModel):
    telemetry_last_at: datetime | None = None
    snapshot_last_at: datetime | None = None
    operator_last_success_at: datetime | None = None
    sessions_active: int
    incidents_count: int
    metrics_freshness: dict[str, str]
    request_id: str | None = None


def _freshness(age_s: float | None, fresh_s: int, degraded_s: int) -> str:
    if age_s is None:
        return "missing"
    if age_s <= fresh_s:
        return "fresh"
    if age_s <= degraded_s:
        return "degraded"
    return "stale"


# Primary source of timeseries for the UI is the timeseries field of GET /overview/operator.
# The endpoints below are for legacy/bot clients; the admin dashboard uses /overview/operator only.
@router.get("/overview/dashboard_timeseries", response_model=DashboardTimeseriesOut)
async def get_dashboard_timeseries_endpoint(
    _principal=Depends(get_admin_or_bot),
):
    """Timeseries for dashboard charts: cluster peers count and rx/tx bytes. Empty when telemetry not available (e.g. agent mode)."""
    points = await get_dashboard_timeseries()
    return DashboardTimeseriesOut(
        points=[
            DashboardTimeseriesPoint(ts=p["ts"], peers=p["peers"], rx=p["rx"], tx=p["tx"])
            for p in points
        ]
    )


@router.get("/overview/telemetry", response_model=DashboardTimeseriesOut)
async def get_overview_telemetry_alias(
    _principal=Depends(get_admin_or_bot),
):
    """Alias for legacy clients: same as /overview/dashboard_timeseries."""
    points = await get_dashboard_timeseries()
    return DashboardTimeseriesOut(
        points=[
            DashboardTimeseriesPoint(ts=p["ts"], peers=p["peers"], rx=p["rx"], tx=p["tx"])
            for p in points
        ]
    )


@router.get("/overview/health-snapshot", response_model=HealthSnapshotOut)
async def get_health_snapshot(
    request: Request,
    db=Depends(get_db),
    _admin=Depends(require_permission(PERM_CLUSTER_READ)),
):
    """Lightweight health snapshot for UI freshness indicators."""
    started = time.perf_counter()
    now = datetime.now(timezone.utc)

    points = await get_dashboard_timeseries(window_seconds=3600)
    last_ts = points[-1]["ts"] if points else None
    telemetry_last_at = datetime.fromtimestamp(last_ts, tz=timezone.utc) if last_ts else None

    snap_last = (
        await db.execute(
            select(func.max(ServerSnapshot.ts_utc)).where(ServerSnapshot.status == "success")
        )
    ).scalar_one_or_none()

    sessions_active = (
        await db.execute(
            select(func.count()).select_from(Device).where(Device.revoked_at.is_(None))
        )
    ).scalar_one_or_none() or 0

    unhealthy_count = (
        await db.execute(
            select(func.count())
            .select_from(Server)
            .where((Server.status.is_(None)) | (~Server.status.in_(("ok", "healthy"))))
        )
    ).scalar_one_or_none() or 0

    telemetry_age = (now - telemetry_last_at).total_seconds() if telemetry_last_at else None
    snapshot_age = (now - snap_last).total_seconds() if snap_last else None

    telemetry_fresh = _freshness(telemetry_age, fresh_s=30, degraded_s=120)
    snapshot_fresh = _freshness(
        snapshot_age,
        fresh_s=max(settings.server_sync_interval_seconds * 2, 120),
        degraded_s=max(settings.server_sync_interval_seconds * 6, 600),
    )
    incidents_fresh = telemetry_fresh if telemetry_fresh != "missing" else "unknown"

    out = HealthSnapshotOut(
        telemetry_last_at=telemetry_last_at,
        snapshot_last_at=snap_last,
        operator_last_success_at=telemetry_last_at,
        sessions_active=int(sessions_active),
        incidents_count=int(unhealthy_count),
        metrics_freshness={
            "telemetry": telemetry_fresh,
            "snapshots": snapshot_fresh,
            "sessions": "fresh",
            "incidents": incidents_fresh,
        },
        request_id=getattr(request.state, "request_id", None),
    )

    logger.info(
        "health snapshot",
        extra=extra_for_event(
            event="overview.health_snapshot",
            route="/api/v1/overview/health-snapshot",
            method="GET",
            status_code=200,
            duration_ms=(time.perf_counter() - started) * 1000,
            actor_id=str(getattr(request.state, "audit_admin_id", "")) or None,
            result_count=1,
        ),
    )
    return out


@router.get("/_debug/metrics-targets")
async def get_metrics_targets(
    request: Request,
    _admin=Depends(require_permission(PERM_CLUSTER_READ)),
):
    """Prometheus targets (auth-protected)."""
    started = time.perf_counter()
    from app.services.prometheus_query_service import PrometheusQueryService

    prom = PrometheusQueryService()
    if not prom.enabled:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Prometheus not configured"
        )
    data = await prom.targets()
    logger.info(
        "metrics targets",
        extra=extra_for_event(
            event="metrics.targets",
            route="/api/v1/_debug/metrics-targets",
            method="GET",
            status_code=200,
            duration_ms=(time.perf_counter() - started) * 1000,
            actor_id=str(getattr(request.state, "audit_admin_id", "")) or None,
            result_count=len(data.get("activeTargets", []) if isinstance(data, dict) else []),
        ),
    )
    return data


@router.get("/overview", response_model=OverviewStats)
async def get_overview(
    db=Depends(get_db),
    _principal=Depends(get_admin_or_bot),
):
    """Aggregate counts for dashboard. Admin or bot auth. MRR = sum of monthly value of active subs."""
    now = datetime.now(timezone.utc)

    # Count all servers (AWG)
    servers_total = (await db.execute(select(func.count()).select_from(Server))).scalar() or 0
    _healthy_statuses = ("ok", "healthy")
    servers_unhealthy = (
        await db.execute(
            select(func.count())
            .select_from(Server)
            .where(
                (Server.status.is_(None)) | (~Server.status.in_(_healthy_statuses)),
            )
        )
    ).scalar() or 0

    peers_total = (
        await db.execute(
            select(func.count()).select_from(Device).where(Device.revoked_at.is_(None))
        )
    ).scalar() or 0

    users_total = (await db.execute(select(func.count()).select_from(User))).scalar() or 0
    subs_active = (
        await db.execute(
            select(func.count())
            .select_from(Subscription)
            .where(
                Subscription.status == "active",
                Subscription.valid_until > now,
            )
        )
    ).scalar() or 0

    # MRR: active subs only; monthly value = price_amount * (30 / duration_days) per sub
    mrr_subq = (
        select(Plan.price_amount, Plan.duration_days)
        .select_from(Subscription)
        .join(Plan, Plan.id == Subscription.plan_id)
        .where(
            Subscription.status == "active",
            Subscription.valid_until > now,
        )
    )
    rows = (await db.execute(mrr_subq)).all()
    mrr = 0.0
    for price, days in rows:
        if price is not None and days and days > 0:
            mrr += float(price) * 30.0 / days

    return OverviewStats(
        servers_total=servers_total,
        servers_unhealthy=servers_unhealthy,
        peers_total=peers_total,
        users_total=users_total,
        subscriptions_active=subs_active,
        mrr=round(mrr, 2),
    )


@router.get("/overview/connection_nodes", response_model=ConnectionNodesOut)
async def get_connection_nodes(
    db=Depends(get_db),
    _principal=Depends(get_admin_or_bot),
):
    """Unified connection nodes: servers (with peer count). For dashboard system view."""
    nodes: list[ConnectionNodeOut] = []

    # Servers with active peer count
    peer_counts = (
        await db.execute(
            select(Device.server_id, func.count(Device.id).label("c"))
            .where(Device.revoked_at.is_(None))
            .group_by(Device.server_id)
        )
    ).all()
    peer_by_server: dict[str, int] = {row.server_id: row.c for row in peer_counts}

    servers = (
        await db.execute(
            select(Server.id, Server.name, Server.region, Server.status).where(
                Server.is_active.is_(True)
            )
        )
    ).all()
    for s in servers:
        nodes.append(
            ConnectionNodeOut(
                id=s.id,
                type="server",
                label=s.name or s.id,
                region=s.region or None,
                peer_count=peer_by_server.get(s.id, 0),
                status=s.status if s.status != "unknown" else None,
                to=f"/servers/{s.id}",
            )
        )

    return ConnectionNodesOut(nodes=nodes)


@router.get("/overview/operator")
async def get_overview_operator(
    request: Request,
    time_range: str = Query("1h"),
    _admin=Depends(require_permission(PERM_CLUSTER_READ)),
):
    """Operator console: health strip, cluster matrix, incidents, servers, timeseries."""
    allowed_ranges = {"5m", "15m", "1h", "6h", "24h"}
    if time_range not in allowed_ranges:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid time_range '{time_range}'. Allowed: {', '.join(sorted(allowed_ranges))}.",
        )
    from app.services.operator_dashboard_service import fetch_operator_dashboard

    return await fetch_operator_dashboard(time_range=time_range, request=request)
