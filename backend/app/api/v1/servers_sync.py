"""Server sync and snapshot sub-router (mounted under /servers)."""

import time

from fastapi import APIRouter, Depends, Header, HTTPException, Request, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.v1.server_cache import invalidate_servers_list_cache
from app.core.config import settings
from app.core.constants import PERM_SERVERS_READ, PERM_SERVERS_WRITE
from app.core.database import get_db
from app.core.error_responses import not_found_404
from app.core.idempotency import (
    get_cached_idempotency_response,
    store_idempotency_response,
)
from app.core.logging_config import request_id_ctx
from app.core.metrics import (
    server_snapshot_staleness_seconds,
    server_sync_latency_seconds,
    server_sync_total,
)
from app.core.rbac import require_permission
from app.models import Server, ServerSnapshot
from app.schemas.snapshot import ServerSyncJobStatus, ServerSyncRequest, ServerSyncResponse
from app.services.agent_action_service import create_action
from app.services.audit_service import log_audit
from app.services.server_sync_service import get_job_status, run_sync_for_server, start_sync

servers_sync_router = APIRouter()


@servers_sync_router.post("/{server_id}/sync", response_model=ServerSyncResponse)
async def trigger_server_sync(
    request: Request,
    server_id: str,
    body: ServerSyncRequest,
    idempotency_key: str | None = Header(default=None, alias="Idempotency-Key"),
    db: AsyncSession = Depends(get_db),
    admin=Depends(require_permission(PERM_SERVERS_WRITE)),
):
    """Trigger manual sync: fetch snapshot from node, store, update Server. In agent mode, enqueue action and return action_id."""
    result = await db.execute(select(Server).where(Server.id == server_id))
    server = result.scalar_one_or_none()
    if not server:
        raise not_found_404("Server", server_id)
    cached = await get_cached_idempotency_response("servers.sync", server_id, idempotency_key)
    if cached and isinstance(cached.get("body"), dict):
        return ServerSyncResponse(**cached["body"])
    rid = getattr(request.state, "request_id", None) or request_id_ctx.get() or ""
    admin_id = str(admin.id) if hasattr(admin, "id") else None

    if settings.node_discovery == "agent" or settings.node_mode == "agent":
        action = await create_action(
            db,
            server_id=server_id,
            type="sync",
            payload={"mode": body.mode},
            requested_by=admin_id,
            correlation_id=rid or None,
        )
        await log_audit(
            db,
            admin_id=admin_id,
            action="sync.queued",
            resource_type="agent_action",
            resource_id=action.id,
            old_new={"server_id": server_id, "type": "sync"},
            request_id=rid,
        )
        await db.commit()
        response = ServerSyncResponse(request_id=rid, job_id="", action_id=action.id)
        await store_idempotency_response(
            "servers.sync",
            server_id,
            idempotency_key,
            response.model_dump(),
        )
        return response

    job_id = await start_sync(db, server_id, body.mode, rid or None, admin_id)
    await db.commit()
    adapter = request.app.state.node_runtime_adapter
    started = time.perf_counter()
    success, err = await run_sync_for_server(db, server_id, job_id, rid or None, adapter)
    elapsed = time.perf_counter() - started
    server_sync_total.labels(mode="manual", status="success" if success else "failure").inc()
    server_sync_latency_seconds.observe(elapsed)
    if success:
        server_snapshot_staleness_seconds.labels(server_id=server_id).set(0)
    await db.commit()
    if success:
        await invalidate_servers_list_cache()
    if not success:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Sync failed: {err or 'unknown'}. request_id={rid}",
        )
    response = ServerSyncResponse(request_id=rid, job_id=job_id)
    await store_idempotency_response(
        "servers.sync",
        server_id,
        idempotency_key,
        response.model_dump(),
    )
    return response


@servers_sync_router.get("/{server_id}/sync/{job_id}", response_model=ServerSyncJobStatus)
async def get_server_sync_job(
    server_id: str,
    job_id: str,
    db: AsyncSession = Depends(get_db),
    _admin=Depends(require_permission(PERM_SERVERS_READ)),
):
    """Return sync job progress and result."""
    result = await db.execute(select(Server).where(Server.id == server_id))
    if not result.scalar_one_or_none():
        raise not_found_404("Server", server_id)
    job = await get_job_status(db, server_id, job_id)
    if not job:
        raise not_found_404("Job", job_id)
    return ServerSyncJobStatus(**job)


@servers_sync_router.get("/{server_id}/snapshot")
async def get_server_last_snapshot(
    server_id: str,
    db: AsyncSession = Depends(get_db),
    _admin=Depends(require_permission(PERM_SERVERS_READ)),
):
    """Return last successful snapshot payload for operator view. 404 if none."""
    result = await db.execute(
        select(ServerSnapshot)
        .where(ServerSnapshot.server_id == server_id, ServerSnapshot.status == "success")
        .order_by(ServerSnapshot.ts_utc.desc())
        .limit(1)
    )
    snap = result.scalar_one_or_none()
    if not snap:
        raise not_found_404("Snapshot")
    return {
        "server_id": server_id,
        "ts_utc": snap.ts_utc.isoformat(),
        "payload": snap.payload_json,
        "request_id": snap.request_id,
    }
