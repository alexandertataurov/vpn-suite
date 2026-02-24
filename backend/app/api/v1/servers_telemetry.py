"""Servers telemetry summary and per-server telemetry sub-router (mounted under /servers)."""

import hashlib
import json
import logging
import time
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, Query, Request
from sqlalchemy import or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.v1.server_utils import get_agent_heartbeat
from app.core.config import settings
from app.core.constants import PERM_SERVERS_READ, REDIS_KEY_AGENT_HB_PREFIX
from app.core.database import get_db
from app.core.error_responses import not_found_404
from app.core.logging_config import extra_for_event
from app.core.rbac import require_permission
from app.core.redis_client import get_redis
from app.models import AgentAction, AgentActionLog, Server, ServerSnapshot
from app.schemas.action import ServerLogLineOut, ServerLogsOut
from app.schemas.server import (
    ServersTelemetrySummaryOut,
    ServerTelemetryEntry,
    ServerTelemetryOut,
)

logger = logging.getLogger(__name__)
servers_telemetry_router = APIRouter()

TELEMETRY_SUMMARY_CACHE_TTL = 15

_STATUS_TO_DB: dict[str, tuple[str, ...]] = {
    "online": ("healthy", "ok"),
    "offline": ("unhealthy", "unreachable", "down", "error", "offline"),
    "degraded": ("degraded",),
    "unknown": ("unknown",),
}


@servers_telemetry_router.get("/telemetry/summary", response_model=ServersTelemetrySummaryOut)
async def get_servers_telemetry_summary(
    request: Request,
    region: str | None = Query(None),
    status_filter: str | None = Query(None, alias="status"),
    search: str | None = Query(None),
    db: AsyncSession = Depends(get_db),
    _admin=Depends(require_permission(PERM_SERVERS_READ)),
):
    """Return telemetry summary per server (Prometheus: vpn_node_health, vpn_node_peers)."""
    from app.services.prometheus_query_service import PrometheusQueryService
    started = time.perf_counter()
    now = datetime.now(timezone.utc)
    cache_key = f"servers:telemetry:summary:{hashlib.sha256(json.dumps([region, status_filter, search], sort_keys=True).encode()).hexdigest()}"
    try:
        redis = get_redis()
        cached = await redis.get(cache_key)
        if cached:
            out = ServersTelemetrySummaryOut.model_validate_json(cached)
            logger.info(
                "servers telemetry summary cache hit",
                extra=extra_for_event(
                    event="servers.telemetry_summary",
                    route="/api/v1/servers/telemetry/summary",
                    method="GET",
                    status_code=200,
                    duration_ms=(time.perf_counter() - started) * 1000,
                    actor_id=str(getattr(request.state, "audit_admin_id", "")) or None,
                    result_count=len(out.servers),
                    query_params={"region": region, "status": status_filter, "search": search, "cache": "hit"},
                ),
            )
            return out
    except Exception:
        logger.debug("Servers telemetry summary cache get failed", exc_info=True)

    stmt = select(Server).where(Server.is_active.is_(True))
    if region and region.strip():
        stmt = stmt.where(Server.region == region.strip())
    if status_filter and status_filter.strip().lower() in (
        "online",
        "offline",
        "degraded",
        "unknown",
    ):
        db_vals = _STATUS_TO_DB.get(status_filter.strip().lower(), ())
        if db_vals:
            stmt = stmt.where(Server.status.in_(db_vals))
    if search and search.strip():
        term = f"%{search.strip()}%"
        stmt = stmt.where(or_(Server.name.ilike(term), Server.api_endpoint.ilike(term)))
    stmt = stmt.limit(500)
    result = await db.execute(stmt)
    rows = result.scalars().all()
    server_ids = [s.id for s in rows]

    servers_map: dict[str, ServerTelemetryEntry] = {
        sid: ServerTelemetryEntry() for sid in server_ids
    }

    prom = PrometheusQueryService()
    if prom.enabled and server_ids:
        for sid in server_ids:
            health_rows = await prom.query(f'vpn_node_health{{node_id="{sid}"}}')
            peers_rows = await prom.query(f'vpn_node_peers{{node_id="{sid}"}}')
            ts: datetime | None = None
            if health_rows:
                v = health_rows[0].get("value")
                if v and len(v) >= 2:
                    try:
                        servers_map[sid].health_score = float(v[1])
                    except (ValueError, TypeError):
                        pass
                if v and len(v) >= 1:
                    try:
                        ts = datetime.fromtimestamp(float(v[0]), tz=timezone.utc)
                    except (ValueError, TypeError):
                        pass
            if peers_rows:
                v = peers_rows[0].get("value")
                if v and len(v) >= 2:
                    try:
                        servers_map[sid].peers = int(float(v[1]))
                    except (ValueError, TypeError):
                        pass
            if ts:
                servers_map[sid].last_metrics_at = ts

    # Agent heartbeat fallback when no Prometheus data
    heartbeat_cache: dict[str, dict] = {}
    for sid in server_ids:
        entry = servers_map.get(sid)
        if entry and entry.health_score is None and entry.peers is None:
            hb = await get_agent_heartbeat(sid)
            if hb:
                heartbeat_cache[sid] = hb
                try:
                    hs = hb.get("health_score")
                    if hs is not None:
                        entry.health_score = float(hs) * 100.0 if float(hs) <= 1.0 else float(hs)
                    pc = hb.get("peer_count")
                    if pc is not None:
                        entry.peers = int(pc)
                    ts_utc = hb.get("ts_utc")
                    if ts_utc:
                        entry.last_metrics_at = (
                            datetime.fromisoformat(ts_utc.replace("Z", "+00:00"))
                            if isinstance(ts_utc, str)
                            else ts_utc
                        )
                except (ValueError, TypeError):
                    pass

    # Best-effort CPU/RAM from local Docker telemetry (fallback for agent mode UI).
    service = getattr(request.app.state, "docker_telemetry_service", None)
    if service is not None:
        try:
            containers = await service.list_containers("local")
            by_id = {c.container_id: c for c in containers}
            by_name = {c.name: c for c in containers if c.name}
            for s in rows:
                entry = servers_map.get(s.id)
                if entry is None:
                    continue
                if entry.cpu_pct is not None or entry.ram_pct is not None:
                    continue
                hb = heartbeat_cache.get(s.id)
                container_id = str(hb.get("container_id") or "").strip() if hb else ""
                container_name = ""
                if s.api_endpoint and s.api_endpoint.startswith("docker://"):
                    container_name = s.api_endpoint[len("docker://") :].strip()
                c = by_id.get(container_id) if container_id else None
                if c is None and container_name:
                    c = by_name.get(container_name)
                if c:
                    entry.cpu_pct = c.cpu_pct
                    entry.ram_pct = c.mem_pct
                    if entry.last_metrics_at is None:
                        entry.last_metrics_at = now
        except Exception:
            logger.debug("Docker telemetry CPU/RAM fallback failed", exc_info=True)

    # Snapshot fallback: Prometheus CPU/RAM metrics are missing in some deployments.
    snapshot_map: dict[str, tuple[float | None, float | None, datetime | None]] = {}
    if server_ids:
        r = await db.execute(
            select(ServerSnapshot)
            .where(ServerSnapshot.server_id.in_(server_ids))
            .where(ServerSnapshot.status == "success")
            .distinct(ServerSnapshot.server_id)
            .order_by(ServerSnapshot.server_id, ServerSnapshot.ts_utc.desc())
        )
        snaps = r.scalars().all()
        for snap in snaps:
            res = (snap.payload_json or {}).get("resources") or {}
            cpu_pct = res.get("cpu_pct")
            ram_pct = res.get("ram_pct")
            snapshot_map[snap.server_id] = (
                float(cpu_pct) if isinstance(cpu_pct, (int, float)) else None,
                float(ram_pct) if isinstance(ram_pct, (int, float)) else None,
                snap.ts_utc,
            )
    for sid, (snap_cpu, snap_ram, snap_ts) in snapshot_map.items():
        entry = servers_map.get(sid)
        if entry is None:
            continue
        if entry.cpu_pct is None and snap_cpu is not None:
            entry.cpu_pct = snap_cpu
        if entry.ram_pct is None and snap_ram is not None:
            entry.ram_pct = snap_ram
        if entry.last_metrics_at is None and snap_ts is not None:
            entry.last_metrics_at = snap_ts

    stale_after_s = max(settings.node_telemetry_cache_ttl_seconds * 4, 600)
    for entry in servers_map.values():
        if entry.last_telemetry_at is None:
            entry.last_telemetry_at = entry.last_metrics_at
        telemetry_last = entry.last_telemetry_at or entry.last_metrics_at
        if telemetry_last:
            age_s = (now - telemetry_last).total_seconds()
            entry.telemetry_status = "stale" if age_s > stale_after_s else "ok"
        else:
            has_any = any(
                v is not None
                for v in (entry.health_score, entry.peers, entry.cpu_pct, entry.ram_pct)
            )
            entry.telemetry_status = "missing" if not has_any else "ok"

    out = ServersTelemetrySummaryOut(servers=servers_map)
    logger.info(
        "servers telemetry summary",
        extra=extra_for_event(
            event="servers.telemetry_summary",
            route="/api/v1/servers/telemetry/summary",
            method="GET",
            status_code=200,
            duration_ms=(time.perf_counter() - started) * 1000,
            actor_id=str(getattr(request.state, "audit_admin_id", "")) or None,
            result_count=len(out.servers),
            query_params={"region": region, "status": status_filter, "search": search, "cache": "miss"},
        ),
    )
    try:
        redis = get_redis()
        await redis.setex(cache_key, TELEMETRY_SUMMARY_CACHE_TTL, out.model_dump_json())
    except Exception:
        logger.debug("Servers telemetry summary cache set failed", exc_info=True)
    return out


@servers_telemetry_router.get("/{server_id}/logs", response_model=ServerLogsOut)
async def get_server_logs(
    server_id: str,
    tail: int = Query(200, ge=1, le=1000),
    db: AsyncSession = Depends(get_db),
    _admin=Depends(require_permission(PERM_SERVERS_READ)),
):
    """Recent action log lines for this server (from agent action logs). For container stdout use Docker Telemetry."""
    result = await db.execute(select(Server).where(Server.id == server_id))
    if not result.scalar_one_or_none():
        raise not_found_404("Server", server_id)
    r = await db.execute(
        select(AgentActionLog)
        .join(AgentAction, AgentActionLog.action_id == AgentAction.id)
        .where(AgentAction.server_id == server_id)
        .order_by(AgentActionLog.ts.desc())
        .limit(tail)
    )
    rows = r.scalars().all()
    lines = [
        ServerLogLineOut(
            ts=log.ts,
            level=log.level,
            message=log.message,
            action_id=log.action_id,
        )
        for log in reversed(rows)
    ]
    return ServerLogsOut(lines=lines, total=len(lines))


@servers_telemetry_router.get("/{server_id}/telemetry", response_model=ServerTelemetryOut)
async def get_server_telemetry(
    request: Request,
    server_id: str,
    db: AsyncSession = Depends(get_db),
    _admin=Depends(require_permission(PERM_SERVERS_READ)),
):
    """Peers count, traffic summary from node. Cache first, live fallback. Graceful N/A on failure."""
    from app.core.telemetry_polling_task import get_cached_telemetry
    from app.services.node_runtime_docker import node_id_from_docker_api_endpoint

    result = await db.execute(select(Server).where(Server.id == server_id))
    server = result.scalar_one_or_none()
    if not server:
        raise not_found_404("Server", server_id)
    if settings.node_discovery == "agent":
        try:
            redis = get_redis()
        except RuntimeError:
            logger.debug("Redis not initialized for agent heartbeat")
            return ServerTelemetryOut(
                peers_count=0,
                online_count=0,
                total_rx_bytes=None,
                total_tx_bytes=None,
                last_updated=None,
                source="agent",
                node_reachable=False,
            )
        try:
            raw = await redis.get(f"{REDIS_KEY_AGENT_HB_PREFIX}{server_id}")
        except Exception:
            logger.debug("Agent heartbeat Redis get failed", exc_info=True)
            return ServerTelemetryOut(
                peers_count=0,
                online_count=0,
                total_rx_bytes=None,
                total_tx_bytes=None,
                last_updated=None,
                source="agent",
                node_reachable=False,
            )
        if raw and isinstance(raw, bytes | str):
            if isinstance(raw, bytes):
                raw = raw.decode("utf-8", errors="replace")
            try:
                hb = json.loads(raw)
            except Exception:
                logger.debug("Agent heartbeat JSON parse failed", exc_info=True)
                hb = None
            if isinstance(hb, dict):
                ts = None
                try:
                    ts = datetime.fromisoformat(str(hb.get("ts_utc") or "").replace("Z", "+00:00"))
                except Exception:
                    logger.debug("Agent heartbeat ts parse failed", exc_info=True)
                    ts = None
                online_count = 0
                hb_peers = hb.get("peers")
                if isinstance(hb_peers, list):
                    for p in hb_peers:
                        if not isinstance(p, dict):
                            continue
                        age = p.get("last_handshake_age_sec")
                        if isinstance(age, (int, float)) and age >= 0 and int(age) <= 180:
                            online_count += 1
                return ServerTelemetryOut(
                    peers_count=int(hb.get("peer_count") or 0),
                    online_count=online_count,
                    total_rx_bytes=int(hb.get("total_rx_bytes") or 0) or None,
                    total_tx_bytes=int(hb.get("total_tx_bytes") or 0) or None,
                    last_updated=ts,
                    source="agent",
                    node_reachable=True,
                    container_name=str(hb.get("container_name") or "").strip() or None,
                    agent_version=str(hb.get("agent_version") or "").strip() or None,
                    reported_status=str(hb.get("status") or "").strip() or None,
                )
        return ServerTelemetryOut(
            peers_count=0,
            online_count=0,
            total_rx_bytes=None,
            total_tx_bytes=None,
            last_updated=None,
            source="agent",
            node_reachable=False,
        )
    cached = await get_cached_telemetry(server_id)
    if cached:
        last_updated = None
        if cached.get("last_updated"):
            try:
                last_updated = datetime.fromisoformat(cached["last_updated"].replace("Z", "+00:00"))
            except (ValueError, TypeError):
                pass
        return ServerTelemetryOut(
            peers_count=cached.get("peers_count", 0),
            online_count=cached.get("online_count", 0),
            total_rx_bytes=cached.get("total_rx_bytes"),
            total_tx_bytes=cached.get("total_tx_bytes"),
            last_updated=last_updated,
            source="cache",
            node_reachable=True,
        )
    try:
        adapter = request.app.state.node_runtime_adapter
        node_id = node_id_from_docker_api_endpoint(server.api_endpoint or "") or server.id
        raw = await adapter.list_peers(node_id)
        now_ts = int(datetime.now(timezone.utc).timestamp())
        online = sum(
            1
            for p in raw
            if int(p.get("last_handshake") or 0) > 0
            and (now_ts - int(p.get("last_handshake") or 0)) <= 180
        )
        total_rx = sum(int(p.get("transfer_rx") or 0) for p in raw)
        total_tx = sum(int(p.get("transfer_tx") or 0) for p in raw)
        return ServerTelemetryOut(
            peers_count=len(raw),
            online_count=online,
            total_rx_bytes=total_rx if total_rx else None,
            total_tx_bytes=total_tx if total_tx else None,
            last_updated=datetime.now(timezone.utc),
            source="api",
            node_reachable=True,
        )
    except Exception:
        logger.exception("Get server telemetry failed")
        return ServerTelemetryOut(
            peers_count=0,
            online_count=0,
            total_rx_bytes=None,
            total_tx_bytes=None,
            last_updated=None,
            source="api",
            node_reachable=False,
        )
