"""Overview/stats for admin dashboard."""

from __future__ import annotations

from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel

from app.core.constants import PERM_CLUSTER_READ
from app.core.rbac import require_permission
from sqlalchemy import func, select

from app.core.bot_auth import get_admin_or_bot
from app.core.config import settings
from app.core.database import get_db
from app.core.telemetry_polling_task import get_dashboard_timeseries
from app.models import Device, Plan, Server, Subscription, User

router = APIRouter(tags=["overview"])


class OverviewStats(BaseModel):
    servers_total: int
    servers_unhealthy: int
    peers_total: int
    users_total: int
    subscriptions_active: int
    mrr: float
    outline_keys_total: int | None = None
    outline_traffic_bps: int | None = None


class ConnectionNodeOut(BaseModel):
    """Single node in the unified dashboard: server (AWG) or outline."""

    id: str
    type: str  # "server" | "outline"
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


@router.get("/overview", response_model=OverviewStats)
async def get_overview(
    db=Depends(get_db),
    _principal=Depends(get_admin_or_bot),
):
    """Aggregate counts for dashboard. Admin or bot auth. MRR = sum of monthly value of active subs."""
    now = datetime.now(timezone.utc)

    # Count all servers (AWG and Outline/Shadowsocks)
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

    outline_keys_total: int | None = None
    outline_traffic_bps: int | None = None
    try:
        from app.services.prometheus_query_service import PrometheusQueryService

        prom = PrometheusQueryService()
        if prom.enabled:
            keys_rows = await prom.query("outline_access_keys_total")
            traffic_rows = await prom.query("sum(rate(shadowsocks_data_bytes[5m]))")
            try:
                if keys_rows and keys_rows[0].get("value"):
                    outline_keys_total = int(float(keys_rows[0]["value"][1]))
            except Exception:
                outline_keys_total = None
            try:
                if traffic_rows and traffic_rows[0].get("value"):
                    outline_traffic_bps = int(float(traffic_rows[0]["value"][1]))
            except Exception:
                outline_traffic_bps = None
    except Exception:
        outline_keys_total = None
        outline_traffic_bps = None

    return OverviewStats(
        servers_total=servers_total,
        servers_unhealthy=servers_unhealthy,
        peers_total=peers_total,
        users_total=users_total,
        subscriptions_active=subs_active,
        mrr=round(mrr, 2),
        outline_keys_total=outline_keys_total,
        outline_traffic_bps=outline_traffic_bps,
    )


@router.get("/overview/connection_nodes", response_model=ConnectionNodesOut)
async def get_connection_nodes(
    db=Depends(get_db),
    _principal=Depends(get_admin_or_bot),
):
    """Unified connection nodes: servers (with peer count) + Outline. For dashboard system view."""
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
            select(
                Server.id, Server.name, Server.region, Server.status, Server.integration_type
            ).where(Server.is_active.is_(True))
        )
    ).all()
    for s in servers:
        is_outline = getattr(s, "integration_type", "awg") == "outline"
        nodes.append(
            ConnectionNodeOut(
                id=s.id,
                type="outline" if is_outline else "server",
                label=s.name or s.id,
                region=s.region or None,
                peer_count=peer_by_server.get(s.id, 0),
                status=s.status if s.status != "unknown" else None,
                to=f"/servers/{s.id}",
            )
        )

    # Outline as a connection node (if enabled)
    if settings.outline_integration_enabled and settings.outline_manager_url:
        outline_peer_count: int | None = None
        outline_status: str | None = None
        try:
            from app.services.prometheus_query_service import PrometheusQueryService

            prom = PrometheusQueryService()
            if prom.enabled:
                keys_rows = await prom.query("outline_access_keys_total")
                up_rows = await prom.query('up{job="outline-ss"}')
                poller_rows = await prom.query('up{job="outline-poller"}')
                try:
                    if keys_rows and keys_rows[0].get("value"):
                        outline_peer_count = int(float(keys_rows[0]["value"][1]))
                except Exception:
                    outline_peer_count = None
                try:
                    ss_up = int(float(up_rows[0]["value"][1])) if up_rows else None
                    poller_up = int(float(poller_rows[0]["value"][1])) if poller_rows else None
                    if ss_up == 1 and poller_up == 1:
                        outline_status = "connected"
                    elif ss_up == 0 or poller_up == 0:
                        outline_status = "offline"
                except Exception:
                    outline_status = None
        except Exception:
            outline_peer_count = None
            outline_status = None

        try:
            from app.services.outline_client import OutlineShadowboxClient

            client = OutlineShadowboxClient(
                settings.outline_manager_url,
                verify_ssl=True,
                timeout=min(5.0, getattr(settings, "outline_request_timeout_seconds", 15)),
                retry_count=0,
            )
            keys = await client.list_access_keys()
            status_val = outline_status or "connected"
        except Exception:
            keys = []
            status_val = outline_status or "offline"
        nodes.append(
            ConnectionNodeOut(
                id="outline",
                type="outline",
                label="Outline",
                region=None,
                peer_count=outline_peer_count if outline_peer_count is not None else len(keys),
                status=status_val,
                to="/integrations/outline",
            )
        )

    return ConnectionNodesOut(nodes=nodes)


@router.get("/overview/operator")
async def get_overview_operator(
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

    return await fetch_operator_dashboard(time_range=time_range)
