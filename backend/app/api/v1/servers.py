"""Servers API: CRUD for external VPN nodes (metadata only)."""

import json
import logging
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from sqlalchemy import func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.v1.server_cache import invalidate_servers_list_cache, servers_list_cache_key
from app.api.v1.server_utils import (
    _agent_heartbeat_server_ids,
    _display_is_active,
    get_agent_heartbeat,
)
from app.api.v1.servers_peers import fetch_peers_for_server
from app.api.v1.servers_actions import servers_actions_router
from app.api.v1.servers_crud import servers_crud_router
from app.api.v1.servers_sync import servers_sync_router
from app.api.v1.servers_telemetry import servers_telemetry_router
from app.core.bot_auth import get_admin_or_bot
from app.core.config import settings
from app.core.constants import PERM_SERVERS_READ, PERM_SERVERS_WRITE
from app.core.database import get_db
from app.core.error_responses import not_found_404
from app.core.rbac import require_permission
from app.core.redis_client import get_redis
from app.models import Device, Server, ServerHealthLog, ServerSnapshot
from app.schemas.server import (
    RestartRequest,
    ServerBulkRequest,
    ServerCapabilitiesOut,
    ServerCreate,
    ServerDeviceCountsOut,
    ServerHealthOut,
    ServerLimitsOut,
    ServerLimitsUpdate,
    ServerList,
    ServerOut,
    ServerSnapshotSummaryEntry,
    ServersSnapshotSummaryOut,
    ServerStatusOut,
    normalize_server_status,
)
from app.schemas.vpn_node import VpnNodeCardOut, VpnNodeDetailOut
from app.services.vpn_node_service import build_vpn_node_cards, build_vpn_node_detail
from app.services.server_health_service import (
    get_last_health,
    run_health_check,
)

router = APIRouter(prefix="/servers", tags=["servers"])
logger = logging.getLogger(__name__)

SERVERS_LIST_CACHE_TTL = 15  # seconds

# DB status values that map to API status filter
_STATUS_TO_DB: dict[str, tuple[str, ...]] = {
    "online": ("healthy", "ok"),
    "offline": ("unhealthy", "unreachable", "down", "error", "offline"),
    "degraded": ("degraded",),
    "unknown": ("unknown",),
}


def _group_server_name(name: str) -> str:
    """Group servers by base name (strip trailing digits, e.g. amnezia-awg2 → amnezia-awg)."""
    name = (name or "").strip()
    return name.rstrip("0123456789")


@router.post("", response_model=ServerOut, status_code=status.HTTP_201_CREATED)
async def create_server(
    request: Request,
    body: ServerCreate,
    db: AsyncSession = Depends(get_db),
    admin=Depends(require_permission(PERM_SERVERS_WRITE)),
):
    if body.id:
        r = await db.execute(select(Server).where(Server.id == body.id))
        if r.scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Server with id={body.id!r} already exists",
            )
    server = Server(
        name=body.name,
        region=body.region,
        api_endpoint=body.api_endpoint,
        vpn_endpoint=body.vpn_endpoint,
        public_key=body.public_key,
        preshared_key=body.preshared_key,
        amnezia_h1=body.amnezia_h1,
        amnezia_h2=body.amnezia_h2,
        amnezia_h3=body.amnezia_h3,
        amnezia_h4=body.amnezia_h4,
        status="unknown",
        is_active=True,
    )
    if body.id:
        server.id = body.id
    db.add(server)
    await db.flush()
    request.state.audit_resource_type = "server"
    request.state.audit_resource_id = server.id
    request.state.audit_old_new = {"created": {"name": server.name, "region": server.region}}
    await db.commit()
    await db.refresh(server)
    await invalidate_servers_list_cache()
    rid = getattr(request.state, "request_id", None)
    return ServerOut(
        id=server.id,
        name=server.name,
        region=server.region,
        api_endpoint=server.api_endpoint,
        vpn_endpoint=server.vpn_endpoint,
        public_key=server.public_key,
        preshared_key=getattr(server, "preshared_key", None),
        amnezia_h1=getattr(server, "amnezia_h1", None),
        amnezia_h2=getattr(server, "amnezia_h2", None),
        amnezia_h3=getattr(server, "amnezia_h3", None),
        amnezia_h4=getattr(server, "amnezia_h4", None),
        status=normalize_server_status(server.status),
        is_active=server.is_active,
        health_score=getattr(server, "health_score", None),
        is_draining=getattr(server, "is_draining", False),
        max_connections=getattr(server, "max_connections", None),
        created_at=server.created_at,
        last_seen_at=None,
        last_snapshot_at=None,
        request_id=rid,
        updated_at=getattr(server, "updated_at", None),
        provider=getattr(server, "provider", None),
        tags=getattr(server, "tags", None),
        auto_sync_enabled=getattr(server, "auto_sync_enabled", False),
        auto_sync_interval_sec=getattr(server, "auto_sync_interval_sec", 60),
        ops_notes=getattr(server, "ops_notes", None),
        ops_notes_updated_at=getattr(server, "ops_notes_updated_at", None),
        ops_notes_updated_by=getattr(server, "ops_notes_updated_by", None),
        cert_fingerprint=getattr(server, "cert_fingerprint", None),
        cert_expires_at=getattr(server, "cert_expires_at", None),
    )


async def _fetch_servers_list_uncached(
    db: AsyncSession,
    effective_limit: int,
    effective_offset: int,
    is_active: bool | None,
    region: str | None,
    status: str | None,
    search: str | None,
    sort: str,
    last_seen_within_hours: int | None,
) -> ServerList:
    """Build servers list from DB (no cache). Used by list_servers."""
    stmt = select(Server)
    count_stmt = select(func.count()).select_from(Server)
    if is_active is not None:
        stmt = stmt.where(Server.is_active.is_(is_active))
        count_stmt = count_stmt.where(Server.is_active.is_(is_active))
    if region is not None and region.strip():
        stmt = stmt.where(Server.region == region.strip())
        count_stmt = count_stmt.where(Server.region == region.strip())
    if status is not None and status.strip().lower() in (
        "online",
        "offline",
        "degraded",
        "unknown",
    ):
        db_vals = _STATUS_TO_DB.get(status.strip().lower(), ())
        if db_vals:
            stmt = stmt.where(Server.status.in_(db_vals))
            count_stmt = count_stmt.where(Server.status.in_(db_vals))
    if search is not None and search.strip():
        term = f"%{search.strip()}%"
        stmt = stmt.where(or_(Server.name.ilike(term), Server.api_endpoint.ilike(term)))
        count_stmt = count_stmt.where(or_(Server.name.ilike(term), Server.api_endpoint.ilike(term)))
    if last_seen_within_hours is not None:
        cutoff = datetime.now(timezone.utc) - timedelta(hours=last_seen_within_hours)
        subq = (
            select(ServerHealthLog.server_id)
            .group_by(ServerHealthLog.server_id)
            .having(func.max(ServerHealthLog.ts) >= cutoff)
        )
        stmt = stmt.where(Server.id.in_(subq))
        count_stmt = count_stmt.where(Server.id.in_(subq))
    agent_mode_no_heartbeat = False
    if settings.node_discovery == "agent":
        heartbeat_ids = await _agent_heartbeat_server_ids()
        if heartbeat_ids:
            stmt = stmt.where(Server.id.in_(heartbeat_ids))
            count_stmt = count_stmt.where(Server.id.in_(heartbeat_ids))
        else:
            agent_mode_no_heartbeat = True
            # Still return all servers so seeded/created servers show as offline until agent connects

    # Docker discovery: only list servers whose name matches VPN container prefixes; one per name (best health).
    docker_prefixes: list[str] = []
    if settings.node_discovery == "docker":
        raw = getattr(settings, "docker_vpn_container_prefixes", "amnezia-awg") or "amnezia-awg"
        docker_prefixes = [p.strip() + "%" for p in raw.split(",") if p.strip()]
        if docker_prefixes:
            prefix_cond = or_(*(Server.name.like(p) for p in docker_prefixes))
            stmt = stmt.where(prefix_cond)
            count_stmt = count_stmt.where(prefix_cond)

    _sort_column = {
        "created_at_desc": Server.created_at.desc(),
        "created_at_asc": Server.created_at.asc(),
        "name_asc": Server.name.asc(),
        "name_desc": Server.name.desc(),
        "region_asc": Server.region.asc(),
    }.get(sort, Server.created_at.desc())

    last_seen_subq = (
        select(ServerHealthLog.server_id, func.max(ServerHealthLog.ts).label("last_ts"))
        .group_by(ServerHealthLog.server_id)
        .subquery()
    )
    stmt_with_last = select(Server, last_seen_subq.c.last_ts).outerjoin(
        last_seen_subq, Server.id == last_seen_subq.c.server_id
    )
    if stmt.whereclause is not None:
        stmt_with_last = stmt_with_last.where(stmt.whereclause)

    if docker_prefixes:
        # Docker: fetch all matching, dedupe by name (keep best health), then paginate.
        result = await db.execute(stmt_with_last.order_by(_sort_column))
        all_rows = result.all()
        by_name: dict[str, tuple[Server, datetime | None]] = {}
        for row in all_rows:
            s, last_ts = row[0], row[1]
            raw_name = s.name or s.id
            group = _group_server_name(raw_name)
            existing = by_name.get(group)
            s_active = getattr(s, "is_active", True)
            s_health = getattr(s, "health_score") or 0.0
            if existing is None:
                by_name[group] = (s, last_ts)
            else:
                e_active = getattr(existing[0], "is_active", True)
                e_health = getattr(existing[0], "health_score") or 0.0
                if (s_active, s_health) >= (e_active, e_health):
                    by_name[group] = (s, last_ts)
        total = len(by_name)

        def _row_sort_key(r: tuple) -> tuple:
            s, _ = r
            ts = (s.created_at or datetime.min.replace(tzinfo=timezone.utc)).timestamp()
            if sort == "created_at_desc":
                return (-ts,)
            if sort == "created_at_asc":
                return (ts,)
            if sort == "name_asc":
                return ((s.name or "").lower(),)
            if sort == "name_desc":
                return ((-(ord((s.name or " ")[0])), (s.name or "").lower()),)
            if sort == "region_asc":
                return ((s.region or "").lower(), (s.name or "").lower())
            return (-ts,)

        sorted_rows = sorted(
            by_name.values(), key=_row_sort_key, reverse=(sort in ("created_at_desc", "name_desc"))
        )
        page_rows = sorted_rows[effective_offset : effective_offset + effective_limit]
    else:
        total = (await db.execute(count_stmt)).scalar() or 0
        result = await db.execute(
            stmt_with_last.order_by(_sort_column).limit(effective_limit).offset(effective_offset)
        )
        page_rows = result.all()

    items = []
    for row in page_rows:
        s, last_ts = row[0], row[1]
        d = {
            "id": s.id,
            "name": s.name,
            "region": s.region,
            "api_endpoint": s.api_endpoint,
            "vpn_endpoint": s.vpn_endpoint,
            "public_key": s.public_key,
            "preshared_key": getattr(s, "preshared_key", None),
            "status": normalize_server_status(s.status),
            "is_active": _display_is_active(s, last_ts),
            "health_score": getattr(s, "health_score", None),
            "is_draining": getattr(s, "is_draining", False),
            "max_connections": getattr(s, "max_connections", None),
            "created_at": s.created_at,
            "last_seen_at": last_ts,
            "last_snapshot_at": getattr(s, "last_snapshot_at", None),
            "updated_at": getattr(s, "updated_at", None),
            "provider": getattr(s, "provider", None),
            "tags": getattr(s, "tags", None),
            "auto_sync_enabled": getattr(s, "auto_sync_enabled", False),
            "auto_sync_interval_sec": getattr(s, "auto_sync_interval_sec", 60),
            "ops_notes": getattr(s, "ops_notes", None),
            "ops_notes_updated_at": getattr(s, "ops_notes_updated_at", None),
            "ops_notes_updated_by": getattr(s, "ops_notes_updated_by", None),
            "cert_fingerprint": getattr(s, "cert_fingerprint", None),
            "cert_expires_at": getattr(s, "cert_expires_at", None),
        }
        items.append(ServerOut(**d))
    return ServerList(items=items, total=total, agent_mode_no_heartbeat=agent_mode_no_heartbeat)


@router.get("", response_model=ServerList)
async def list_servers(
    db: AsyncSession = Depends(get_db),
    _principal=Depends(get_admin_or_bot),
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    is_active: bool | None = Query(None),
    region: str | None = Query(None, description="Filter by region"),
    status: str | None = Query(
        None, description="Filter by status: online, offline, degraded, unknown"
    ),
    search: str | None = Query(None, description="Search in name and api_endpoint"),
    sort: str = Query(
        "created_at_desc",
        description="Sort: created_at_desc, created_at_asc, name_asc, name_desc, region_asc",
    ),
    page: int | None = Query(
        None, ge=1, description="Page number (1-based); overrides offset when set"
    ),
    page_size: int | None = Query(
        None, ge=1, le=200, description="Page size; overrides limit when set"
    ),
    last_seen_within_hours: int | None = Query(
        None,
        ge=1,
        le=8760,
        description="Only servers with last_seen_at within this many hours (hides stale)",
    ),
):
    """List servers. Bot may use limit=1, is_active=true to get default server for issue."""
    effective_limit = page_size if page_size is not None else limit
    effective_offset = (page - 1) * effective_limit if page is not None and page > 0 else offset

    cache_key = servers_list_cache_key(
        limit, offset, is_active, region, status, search, sort, page, page_size
    )
    if last_seen_within_hours is not None:
        cache_key = None
    if cache_key:
        try:
            redis = get_redis()
            cached = await redis.get(cache_key)
            if cached:
                return ServerList.model_validate(json.loads(cached))
        except Exception:
            logger.debug("Servers list cache get failed", exc_info=True)

    result = await _fetch_servers_list_uncached(
        db,
        effective_limit,
        effective_offset,
        is_active,
        region,
        status,
        search,
        sort,
        last_seen_within_hours,
    )
    if cache_key:
        try:
            redis = get_redis()
            await redis.set(
                cache_key,
                json.dumps(result.model_dump(mode="json"), default=str),
                ex=SERVERS_LIST_CACHE_TTL,
            )
        except Exception:
            logger.debug("Servers list cache set failed", exc_info=True)
    return result


@router.patch("/bulk")
async def bulk_update_servers(
    request: Request,
    body: ServerBulkRequest,
    db: AsyncSession = Depends(get_db),
    admin=Depends(require_permission(PERM_SERVERS_WRITE)),
):
    """Bulk actions: mark_draining, unmark_draining, disable_provisioning, enable_provisioning."""
    if body.action in ("disable_provisioning", "enable_provisioning"):
        if not body.confirm_token:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="confirm_token required for provisioning actions",
            )
        if body.confirm_token != settings.restart_confirm_token:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Invalid confirmation token",
            )
    if not body.server_ids:
        return {"updated": 0, "server_ids": []}

    result = await db.execute(select(Server).where(Server.id.in_(body.server_ids)))
    servers = list(result.scalars().unique().all())
    found_ids = {s.id for s in servers}
    for sid in body.server_ids:
        if sid not in found_ids:
            raise not_found_404("Server", sid)

    for server in servers:
        if body.action == "mark_draining":
            server.is_draining = True
        elif body.action == "unmark_draining":
            server.is_draining = False
        elif body.action == "disable_provisioning":
            server.is_active = False
        elif body.action == "enable_provisioning":
            server.is_active = True

    await db.commit()
    await invalidate_servers_list_cache()
    rid = getattr(request.state, "request_id", None)
    return {"updated": len(servers), "server_ids": [s.id for s in servers], "request_id": rid}


@router.get("/snapshots/summary", response_model=ServersSnapshotSummaryOut)
async def get_servers_snapshots_summary(
    db: AsyncSession = Depends(get_db),
    _admin=Depends(require_permission(PERM_SERVERS_READ)),
):
    """Return per-server telemetry from last successful snapshot (authoritative).
    Uses distinct(ServerSnapshot.server_id) — PostgreSQL/SQLAlchemy dialect;
    not supported on SQLite. Requires Postgres for production."""
    r = await db.execute(
        select(ServerSnapshot)
        .where(ServerSnapshot.status == "success")
        .distinct(ServerSnapshot.server_id)
        .order_by(ServerSnapshot.server_id, ServerSnapshot.ts_utc.desc())
    )
    rows = r.scalars().all()
    servers_map: dict[str, ServerSnapshotSummaryEntry] = {}
    for snap in rows:
        p = snap.payload_json or {}
        res = p.get("resources") or {}
        users = p.get("users") or {}
        ip_pool = p.get("ip_pool") or {}
        health = p.get("health") or {}
        servers_map[snap.server_id] = ServerSnapshotSummaryEntry(
            cpu_pct=res.get("cpu_pct"),
            ram_pct=res.get("ram_pct"),
            ram_used_bytes=res.get("ram_used_bytes"),
            ram_total_bytes=res.get("ram_total_bytes"),
            active_peers=users.get("active_peers"),
            total_peers=users.get("total_peers"),
            used_ips=ip_pool.get("used_ips"),
            total_ips=ip_pool.get("total_ips"),
            free_ips=ip_pool.get("free_ips"),
            health_score=health.get("health_score"),
            last_snapshot_at=snap.ts_utc,
            source="snapshot",
        )
    # Agent heartbeat fallback for servers with no snapshot (use string ids for JSON keys)
    seen_ids = set(servers_map)
    if settings.node_discovery == "agent":
        heartbeat_ids = await _agent_heartbeat_server_ids()
        candidate_ids = [str(sid) for sid in heartbeat_ids if str(sid) not in seen_ids]
    else:
        result = await db.execute(select(Server.id))
        candidate_ids = [str(row[0]) for row in result.all()]
        candidate_ids = [sid for sid in candidate_ids if sid not in seen_ids]
    for sid in candidate_ids:
        hb = await get_agent_heartbeat(sid)
        if hb:
            try:
                hs = hb.get("health_score")
                health_score = None
                if hs is not None:
                    f = float(hs)
                    health_score = f * 100.0 if f <= 1.0 else f
                peer_count = hb.get("peer_count")
                used_ips = int(peer_count) if peer_count is not None else 0
                servers_map[sid] = ServerSnapshotSummaryEntry(
                    used_ips=used_ips,
                    total_ips=None,
                    health_score=health_score,
                    total_peers=peer_count,
                    active_peers=peer_count,
                    source="agent",
                )
            except (ValueError, TypeError):
                pass
    return ServersSnapshotSummaryOut(servers=servers_map)


@router.get("/device-counts", response_model=ServerDeviceCountsOut)
async def get_server_device_counts(
    db: AsyncSession = Depends(get_db),
    _principal=Depends(get_admin_or_bot),
):
    """Return device count per server_id for list views (avoids loading full device list)."""
    stmt = (
        select(Device.server_id, func.count(Device.id).label("c"))
        .where(Device.server_id.isnot(None))
        .group_by(Device.server_id)
    )
    result = (await db.execute(stmt)).all()
    counts = {str(r.server_id): r.c for r in result}
    return ServerDeviceCountsOut(counts=counts)


@router.get("/vpn-nodes", response_model=list[VpnNodeCardOut])
async def get_servers_vpn_nodes(
    request: Request,
    db: AsyncSession = Depends(get_db),
    region: str | None = Query(None),
    health: str | None = Query(None, description="Filter by health_state: ok | degraded | down"),
    _admin=Depends(require_permission(PERM_SERVERS_READ)),
):
    """Return VPN node cards for operator grid. Uses DB + Redis heartbeat + snapshot."""
    cards = await build_vpn_node_cards(db, request, region=region, health=health)
    return cards


@router.get("/{server_id}/vpn-node", response_model=VpnNodeDetailOut)
async def get_server_vpn_node(
    request: Request,
    server_id: str,
    db: AsyncSession = Depends(get_db),
    _admin=Depends(require_permission(PERM_SERVERS_READ)),
):
    """Return full VPN node detail for drilldown (card + peers + interface + system)."""
    peers, _, server_found = await fetch_peers_for_server(server_id, db, request)
    if not server_found:
        raise not_found_404("Server", server_id)
    detail = await build_vpn_node_detail(server_id, db, request, peers)
    if detail is None:
        raise not_found_404("Server", server_id)
    return detail


@router.get("/{server_id}/status", response_model=ServerStatusOut)
async def get_server_status(
    server_id: str,
    db: AsyncSession = Depends(get_db),
    _admin=Depends(require_permission(PERM_SERVERS_READ)),
):
    result = await db.execute(select(Server).where(Server.id == server_id))
    server = result.scalar_one_or_none()
    if not server:
        raise not_found_404("Server", server_id)
    return ServerStatusOut(status=server.status, is_active=server.is_active)


@router.get("/{server_id}/health", response_model=ServerHealthOut)
async def get_server_health(
    request: Request,
    server_id: str,
    db: AsyncSession = Depends(get_db),
    _admin=Depends(require_permission(PERM_SERVERS_READ)),
):
    result = await db.execute(select(Server).where(Server.id == server_id))
    server = result.scalar_one_or_none()
    if not server:
        raise not_found_404("Server", server_id)
    adapter = request.app.state.node_runtime_adapter
    await run_health_check(db, server, runtime_adapter=adapter)
    await db.commit()
    last = await get_last_health(db, server_id)
    if not last:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Health check failed"
        )
    return ServerHealthOut(
        status=last.status, latency_ms=last.latency_ms, handshake_ok=last.handshake_ok, ts=last.ts
    )


@router.post("/{server_id}/restart")
async def restart_server(
    request: Request,
    server_id: str,
    body: RestartRequest,
    db: AsyncSession = Depends(get_db),
    admin=Depends(require_permission(PERM_SERVERS_WRITE)),
):
    if body.confirm_token != settings.restart_confirm_token:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Restart requires confirm_token in body",
        )
    result = await db.execute(select(Server).where(Server.id == server_id))
    server = result.scalar_one_or_none()
    if not server:
        raise not_found_404("Server", server_id)
    request.state.audit_resource_type = "server"
    request.state.audit_resource_id = server.id
    request.state.audit_old_new = {"restart": {"reason": body.reason, "accepted": False}}
    raise HTTPException(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        detail={
            "code": "RESTART_NOT_SUPPORTED",
            "message": "Restart is not supported in docker runtime control-plane.",
            "retry_eligible": False,
        },
    )


@router.get("/{server_id}/capabilities", response_model=ServerCapabilitiesOut)
async def get_server_capabilities(
    server_id: str,
    db: AsyncSession = Depends(get_db),
    _admin=Depends(require_permission(PERM_SERVERS_READ)),
):
    result = await db.execute(select(Server).where(Server.id == server_id))
    server = result.scalar_one_or_none()
    if not server:
        raise not_found_404("Server", server_id)
    return ServerCapabilitiesOut(
        profile_types=["awg", "wg"],
        supports_rotate=True,
        max_connections=getattr(server, "max_connections", None),
        is_draining=getattr(server, "is_draining", False),
    )


@router.get("/{server_id}/limits", response_model=ServerLimitsOut)
async def get_server_limits(
    server_id: str,
    db: AsyncSession = Depends(get_db),
    _admin=Depends(require_permission(PERM_SERVERS_READ)),
):
    result = await db.execute(select(Server).where(Server.id == server_id))
    server = result.scalar_one_or_none()
    if not server:
        raise not_found_404("Server", server_id)
    return ServerLimitsOut(
        traffic_limit_gb=server.traffic_limit_gb,
        speed_limit_mbps=server.speed_limit_mbps,
        max_connections=server.max_connections,
    )


@router.patch("/{server_id}/limits", response_model=ServerLimitsOut)
async def update_server_limits(
    request: Request,
    server_id: str,
    body: ServerLimitsUpdate,
    db: AsyncSession = Depends(get_db),
    admin=Depends(require_permission(PERM_SERVERS_WRITE)),
):
    result = await db.execute(select(Server).where(Server.id == server_id))
    server = result.scalar_one_or_none()
    if not server:
        raise not_found_404("Server", server_id)
    data = body.model_dump(exclude_unset=True)
    for k, v in data.items():
        setattr(server, k, v)
    await db.flush()
    ok = True
    request.state.audit_resource_type = "server"
    request.state.audit_resource_id = server.id
    request.state.audit_old_new = {"limits": data, "node_accepted": ok, "mode": "db_only"}
    await db.commit()
    await db.refresh(server)
    await invalidate_servers_list_cache()
    return ServerLimitsOut(
        traffic_limit_gb=server.traffic_limit_gb,
        speed_limit_mbps=server.speed_limit_mbps,
        max_connections=server.max_connections,
    )


# Keep generic "/{server_id}" CRUD routes last to avoid shadowing static routes such as "/device-counts".
router.include_router(servers_sync_router)
router.include_router(servers_actions_router)
router.include_router(servers_telemetry_router)
router.include_router(servers_crud_router)
