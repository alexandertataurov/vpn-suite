"""Server health: run check, write log, update server status and is_active after N fails; peer sync."""

import logging
from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.models import Device, Server, ServerHealthLog
from app.services.health_scoring import calculate_health_score, health_score_to_state
from app.services.node_runtime import NodeRuntimeAdapter

_log = logging.getLogger(__name__)

N_FAIL_DISABLE = settings.node_health_fail_count_disable


async def run_health_check(
    session: AsyncSession,
    server: Server,
    runtime_adapter: NodeRuntimeAdapter,
) -> ServerHealthLog:
    """Call node, write ServerHealthLog, update Server.status and health_score; if N consecutive fail set is_active=False."""
    result = await _health_check(server, runtime_adapter)
    now = datetime.now(timezone.utc)
    log_entry = ServerHealthLog(
        server_id=server.id,
        status=result["status"],
        latency_ms=result["latency_ms"],
        handshake_ok=result["handshake_ok"],
        ts=now,
    )
    session.add(log_entry)
    await session.flush()
    # Compute and persist health score (peer data not available here; topology/telemetry can refine later)
    health_score = calculate_health_score(server, log_entry, peer_count=0, active_peer_count=0)
    server.health_score = health_score
    server.status = health_score_to_state(health_score).value
    # "degraded" in our runtime health check can mean "reachable but no recent client handshakes".
    # That is not a reason to disable capacity for new users. Only persistent *reachability* failures
    # should flip is_active=False.
    status_value = str(result.get("status") or "unknown")
    if status_value in {"ok", "degraded"}:
        server.is_active = True
    else:
        # Count consecutive failures (most recent first)
        r = await session.execute(
            select(ServerHealthLog)
            .where(ServerHealthLog.server_id == server.id)
            .order_by(ServerHealthLog.ts.desc())
            .limit(N_FAIL_DISABLE)
        )
        recent = r.scalars().all()
        if len(recent) >= N_FAIL_DISABLE and all(
            h.status not in {"ok", "degraded"} for h in recent
        ):
            server.is_active = False
    await session.flush()
    return log_entry


async def get_last_health(session: AsyncSession, server_id: str) -> ServerHealthLog | None:
    """Return latest ServerHealthLog for server or None."""
    r = await session.execute(
        select(ServerHealthLog)
        .where(ServerHealthLog.server_id == server_id)
        .order_by(ServerHealthLog.ts.desc())
        .limit(1)
    )
    return r.scalar_one_or_none()


async def sync_peers_after_restart(
    session: AsyncSession,
    server: Server,
    runtime_adapter: NodeRuntimeAdapter,
) -> dict:
    """Fetch peers from node, compare with non-revoked devices in DB; log discrepancies. Return counts."""
    r = await session.execute(
        select(Device).where(
            Device.server_id == server.id,
            Device.revoked_at.is_(None),
        )
    )
    db_devices = r.scalars().all()
    db_keys = {d.public_key for d in db_devices}
    node_keys = await _peer_keys(server, runtime_adapter)
    missing_on_node = db_keys - node_keys
    extra_on_node = node_keys - db_keys
    if missing_on_node:
        _log.warning(
            "Peer sync server_id=%s: %d device(s) in DB not on node (missing_on_node)",
            server.id,
            len(missing_on_node),
        )
    if extra_on_node:
        _log.warning(
            "Peer sync server_id=%s: %d peer(s) on node not in DB (extra_on_node)",
            server.id,
            len(extra_on_node),
        )
    return {"missing_on_node": len(missing_on_node), "extra_on_node": len(extra_on_node)}


async def _health_check(
    server: Server,
    runtime_adapter: NodeRuntimeAdapter,
) -> dict:
    result = await runtime_adapter.health_check(server.id)
    return {
        "status": str(result.get("status") or "unknown"),
        "latency_ms": result.get("latency_ms"),
        "handshake_ok": result.get("handshake_ok"),
    }


async def _peer_keys(
    server: Server,
    runtime_adapter: NodeRuntimeAdapter,
) -> set[str]:
    peers = await runtime_adapter.list_peers(server.id)
    return {
        str(peer["public_key"])
        for peer in peers
        if isinstance(peer, dict) and peer.get("public_key")
    }
