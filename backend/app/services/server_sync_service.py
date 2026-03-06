"""Server sync: fetch snapshot from AmneziaWG node, store, update Server. Audit + request_id."""

import json
import logging
import time
import uuid
from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

# #region agent log
_DEBUG_LOG_PATH = "/opt/.cursor/debug-a8eb6e.log"


def _agent_log(location: str, message: str, data: dict, hypothesis_id: str) -> None:
    try:
        with open(_DEBUG_LOG_PATH, "a") as f:
            f.write(
                json.dumps(
                    {
                        "sessionId": "a8eb6e",
                        "location": location,
                        "message": message,
                        "data": data,
                        "timestamp": int(time.time() * 1000),
                        "hypothesisId": hypothesis_id,
                    }
                )
                + "\n"
            )
    except Exception:
        pass


# #endregion

from app.core.logging_config import extra_for_event
from app.models import IpPool, Server, ServerSnapshot, SyncJob
from app.schemas.snapshot import (
    ServerSnapshot as ServerSnapshotSchema,
    SnapshotEndpoints,
    SnapshotHealth,
    SnapshotHealthStatus,
    SnapshotIpPool,
    SnapshotLimits,
    SnapshotLocation,
    SnapshotResources,
    SnapshotUsers,
)
from app.services.audit_service import log_audit
from app.services.node_runtime import NodeRuntimeAdapter

_log = logging.getLogger(__name__)

# Active = handshake within last 180s
ACTIVE_PEER_AGE_SEC = 180


def _is_private_ip(ip: str) -> bool:
    """Return True if IP is private (not routable from internet)."""
    try:
        addr = ip.strip().split("/")[0].split(":")[0]
        if not addr or addr == "localhost":
            return True
        import ipaddress

        return ipaddress.ip_address(addr).is_private
    except Exception:
        return True


def _status_to_snapshot_health(status: str) -> SnapshotHealthStatus:
    s = (status or "").lower()
    if s in ("healthy", "ok"):
        return SnapshotHealthStatus.online
    if s == "degraded":
        return SnapshotHealthStatus.degraded
    if s in ("unhealthy", "unreachable", "down", "error", "offline"):
        return SnapshotHealthStatus.offline
    return SnapshotHealthStatus.unknown


async def build_snapshot_from_node(
    server_id: str,
    server: Server,
    adapter: NodeRuntimeAdapter,
    ip_pool_hint: dict | None = None,
) -> tuple[ServerSnapshotSchema | None, str | None]:
    """
    Fetch node data and build canonical snapshot. Returns (snapshot, error).
    ip_pool_hint: optional { cidr, total_ips } from DB; used_ips from peers.
    """
    # #region agent log
    _agent_log(
        "server_sync_service.py:build_snapshot_from_node:entry",
        "sync started",
        {
            "server_id": server_id,
            "adapter": type(adapter).__name__,
            "server_api_endpoint": (server.api_endpoint or "")[:80],
        },
        "A",
    )
    # #endregion
    node = None
    get_node_fn = getattr(adapter, "get_node_for_sync", None)
    has_get_node = callable(get_node_fn)
    if get_node_fn is not None:
        node = await get_node_fn(server_id)
    # #region agent log
    _agent_log(
        "server_sync_service.py:build_snapshot_from_node:after_get_node",
        "get_node_for_sync result",
        {"has_get_node_for_sync": has_get_node, "node_from_sync": node is not None},
        "C",
    )
    # #endregion
    if node is None:
        nodes = await adapter.discover_nodes()
        # #region agent log
        _agent_log(
            "server_sync_service.py:build_snapshot_from_node:after_discover",
            "discover_nodes result",
            {
                "nodes_count": len(nodes),
                "node_ids": [n.node_id for n in nodes],
                "container_names": [getattr(n, "container_name", None) for n in nodes],
            },
            "B",
        )
        # #endregion
        node = next((n for n in nodes if n.node_id == server_id), None)
        if node is None:
            node = next((n for n in nodes if getattr(n, "container_name", None) == server_id), None)
        if node is None and (server.api_endpoint or "").startswith("docker://"):
            container_name = (server.api_endpoint or "")[9:].strip().split("/")[0]
            if container_name:
                node = next(
                    (n for n in nodes if getattr(n, "container_name", None) == container_name),
                    None,
                )
        if node is None and (server.name or "").strip():
            node = next(
                (
                    n
                    for n in nodes
                    if getattr(n, "container_name", None) == (server.name or "").strip()
                ),
                None,
            )
    if not node:
        # #region agent log
        _agent_log(
            "server_sync_service.py:build_snapshot_from_node",
            "node not in discovery",
            {
                "server_id": server_id,
                "discovered_ids": [n.node_id for n in nodes],
                "discovered_container_names": [getattr(n, "container_name", None) for n in nodes],
            },
            "D",
        )
        # #endregion
        return None, "node not found in discovery"

    node_id_for_peers = node.node_id or getattr(node, "container_name", None) or server_id
    try:
        peers = await adapter.list_peers(node_id_for_peers)
    except Exception as e:
        _log.warning("list_peers failed server_id=%s: %s", server_id, e)
        peers = []

    now = datetime.now(timezone.utc)
    now_ts = int(now.timestamp())
    active = 0
    last_handshake_max = 0
    for p in peers:
        h = int(p.get("last_handshake") or 0)
        if h > 0:
            if (now_ts - h) <= ACTIVE_PEER_AGE_SEC:
                active += 1
            last_handshake_max = max(last_handshake_max, now_ts - h)

    # Docker stats (optional)
    resources = SnapshotResources(unavailable_reason="docker_stats_not_available")
    if hasattr(adapter, "get_container_stats") and node.container_name:
        try:
            stats = await adapter.get_container_stats(node.container_name)
            if stats:
                resources = SnapshotResources(
                    cpu_pct=stats.get("cpu_pct"),
                    ram_used_bytes=stats.get("ram_used_bytes"),
                    ram_total_bytes=stats.get("ram_total_bytes"),
                    ram_pct=stats.get("ram_pct"),
                    unavailable_reason=None,
                )
        except Exception as e:
            _log.debug("get_container_stats failed server_id=%s: %s", server_id, e)

    # IP pool: from hint (DB) + used from peers
    used_ips = len(peers)
    ip_pool = SnapshotIpPool(source="amneziawg")
    if ip_pool_hint:
        total = ip_pool_hint.get("total_ips")
        cidr = ip_pool_hint.get("cidr")
        ip_pool = SnapshotIpPool(
            cidr=cidr,
            total_ips=total,
            used_ips=used_ips,
            free_ips=(total - used_ips) if total is not None else None,
            conflicts_detected=False,
            source="amneziawg",
        )

    health_score_pct = (node.health_score or 0.0) * 100.0
    total_peers = len(peers) if peers else (getattr(node, "peer_count", None) or 0)
    snapshot = ServerSnapshotSchema(
        server_id=server_id,
        ts_utc=now,
        version=None,
        location=SnapshotLocation(region=server.region, source="configured"),
        endpoints=SnapshotEndpoints(
            vpn_endpoint=server.vpn_endpoint
            or (
                f"{node.endpoint_ip}:{node.listen_port}"
                if node.endpoint_ip and node.listen_port and not _is_private_ip(node.endpoint_ip)
                else None
            ),
            # Prefer node (runtime) key so sync corrects stale DB; configs then get correct server key.
            public_key=getattr(node, "public_key", None) or server.public_key or None,
        ),
        resources=resources,
        users=SnapshotUsers(
            active_peers=active,
            total_peers=total_peers,
            last_handshake_max_age_sec=last_handshake_max if last_handshake_max else None,
            source="amneziawg",
        ),
        ip_pool=ip_pool,
        health=SnapshotHealth(
            status=_status_to_snapshot_health(node.status or "unknown"),
            health_score=round(health_score_pct, 1),
            reasons=[],
            is_draining=bool(server.is_draining),
        ),
        limits=SnapshotLimits(
            peers_capacity=server.max_connections or node.max_peers,
        ),
    )
    return snapshot, None


async def run_sync_for_server(
    session: AsyncSession,
    server_id: str,
    job_id: str,
    request_id: str | None,
    adapter: NodeRuntimeAdapter,
) -> tuple[bool, str | None]:
    """
    Run sync: fetch snapshot, write row, update Server. Returns (success, error).
    Caller must commit. Marks SyncJob running then completed/failed.
    """
    job = await session.get(SyncJob, job_id)
    server = await session.get(Server, server_id)
    if not job or not server or job.server_id != server_id:
        return False, "job or server not found"

    job.status = "running"
    job.started_at = datetime.now(timezone.utc)
    await session.flush()

    ip_pool_hint = None
    r = await session.execute(
        select(IpPool).where(IpPool.server_id == server_id, IpPool.is_active.is_(True)).limit(1)
    )
    pool = r.scalar_one_or_none()
    if pool:
        ip_pool_hint = {"cidr": pool.cidr, "total_ips": pool.total_ips}

    started = time.perf_counter()
    snapshot, err = await build_snapshot_from_node(
        server_id, server, adapter, ip_pool_hint=ip_pool_hint
    )
    latency_ms = (time.perf_counter() - started) * 1000.0

    if err or not snapshot:
        job.status = "failed"
        job.finished_at = datetime.now(timezone.utc)
        job.error = err or "empty snapshot"
        if "not found" in (err or "").lower():
            server.key_status = "not_found"
        try:
            from app.core.metrics import discovery_not_found_total, server_key_sync_fail_total

            server_key_sync_fail_total.labels(
                server_id=server_id, reason=(err or "unknown")[:64]
            ).inc()
            if "not found" in (err or "").lower():
                discovery_not_found_total.labels(server_id=server_id).inc()
        except Exception:
            pass
        _log.warning(
            "Sync failed server_id=%s job_id=%s: %s",
            server_id,
            job_id,
            job.error,
            extra=extra_for_event(
                event="worker.sync.failed",
                entity_id=server_id,
                error_code="E_UPSTREAM_5XX",
                error_kind="external",
                error_severity="warn",
                error_retryable=True,
            ),
        )
        return False, job.error

    snap_id = uuid.uuid4().hex[:32]
    payload = snapshot.model_dump(mode="json")

    snap_row = ServerSnapshot(
        id=snap_id,
        server_id=server_id,
        ts_utc=snapshot.ts_utc,
        payload_json=payload,
        status="success",
        error=None,
        request_id=request_id,
    )
    session.add(snap_row)

    server.status = snapshot.health.status.value
    server.health_score = (
        (snapshot.health.health_score or 0) / 100.0
        if snapshot.health.health_score is not None
        else None
    )
    server.last_snapshot_at = snapshot.ts_utc
    if snapshot.endpoints.vpn_endpoint:
        server.vpn_endpoint = snapshot.endpoints.vpn_endpoint
    if snapshot.endpoints.public_key:
        server.public_key = snapshot.endpoints.public_key
        server.public_key_synced_at = snapshot.ts_utc
        server.key_status = "verified"
        try:
            from app.core.metrics import server_key_sync_success_total

            server_key_sync_success_total.labels(server_id=server_id).inc()
        except Exception:
            pass
    if pool and snapshot.ip_pool.used_ips is not None:
        pool.used_ips = snapshot.ip_pool.used_ips

    job.status = "completed"
    job.finished_at = datetime.now(timezone.utc)
    job.error = None
    _log.info(
        "Sync completed server_id=%s job_id=%s request_id=%s latency_ms=%.0f",
        server_id,
        job_id,
        request_id,
        latency_ms,
        extra=extra_for_event(
            event="worker.sync.completed",
            entity_id=server_id,
            duration_ms=latency_ms,
        ),
    )
    return True, None


async def start_sync(
    session: AsyncSession,
    server_id: str,
    mode: str,
    request_id: str | None,
    admin_id: str | None,
) -> str:
    """Create SyncJob (pending), return job_id. Caller commits."""
    server = await session.get(Server, server_id)
    if not server:
        raise ValueError("server not found")
    job_id = uuid.uuid4().hex[:32]
    job = SyncJob(
        id=job_id,
        server_id=server_id,
        mode=mode,
        status="pending",
        request_id=request_id,
    )
    session.add(job)
    await log_audit(
        session,
        admin_id=admin_id,
        action="server.sync.start",
        resource_type="server",
        resource_id=server_id,
        old_new={"mode": mode, "job_id": job_id, "request_id": request_id},
        request_id=request_id,
    )
    return job_id


async def get_job_status(session: AsyncSession, server_id: str, job_id: str) -> dict | None:
    """Return job status dict or None."""
    r = await session.execute(
        select(SyncJob).where(SyncJob.id == job_id, SyncJob.server_id == server_id)
    )
    job = r.scalar_one_or_none()
    if not job:
        return None
    return {
        "job_id": job.id,
        "server_id": job.server_id,
        "status": job.status,
        "started_at": job.started_at,
        "finished_at": job.finished_at,
        "request_id": job.request_id,
        "error": job.error,
        "progress_pct": getattr(job, "progress_pct", None),
        "logs_tail": getattr(job, "logs_tail", None),
        "job_type": getattr(job, "job_type", "sync"),
    }
