"""Peers API: spec 4.2 alias over devices (peer_id = device id, node_id = server id)."""

import logging
import time

from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from pydantic import BaseModel
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.constants import PERM_CLUSTER_READ, PERM_CLUSTER_WRITE
from app.core.database import get_db
from app.core.error_responses import not_found_404
from app.core.exception_handling import raise_http_for_control_plane_exception
from app.core.exceptions import LoadBalancerError, WireGuardCommandError
from app.core.logging_config import extra_for_event
from app.core.rbac import require_permission
from app.models import Device
from app.schemas.peer import PeerListItemOut, PeerListOut
from app.services.migrate_service import migrate_peer, resolve_target_node
from app.services.topology_engine import TopologyEngine

router = APIRouter(prefix="/peers", tags=["peers"])
logger = logging.getLogger(__name__)


class MigrateBody(BaseModel):
    """Optional target node for migration; omit to use load balancer."""

    target_node_id: str | None = None


@router.get("", response_model=PeerListOut)
async def list_peers(
    request: Request,
    db: AsyncSession = Depends(get_db),
    node_id: str | None = Query(None, description="Filter by node (server) id"),
    status_filter: str | None = Query(None, alias="status", description="active | revoked"),
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    _admin=Depends(require_permission(PERM_CLUSTER_READ)),
):
    """
    List peers (devices). peer_id = device.id, node_id = device.server_id.
    Create peer: use POST /api/v1/devices/issue (with server_id or omit for load-balanced).
    Remove peer: use POST /api/v1/devices/{id}/revoke or /reset.
    """
    started = time.perf_counter()
    stmt = select(Device)
    count_stmt = select(func.count()).select_from(Device)
    if node_id:
        stmt = stmt.where(Device.server_id == node_id)
        count_stmt = count_stmt.where(Device.server_id == node_id)
    if status_filter == "active":
        stmt = stmt.where(Device.revoked_at.is_(None))
        count_stmt = count_stmt.where(Device.revoked_at.is_(None))
    elif status_filter == "revoked":
        stmt = stmt.where(Device.revoked_at.isnot(None))
        count_stmt = count_stmt.where(Device.revoked_at.isnot(None))
    total = (await db.execute(count_stmt)).scalar() or 0
    stmt = stmt.order_by(Device.issued_at.desc()).offset(offset).limit(limit)
    result = await db.execute(stmt)
    devices = result.scalars().all()
    items = [
        PeerListItemOut(
            peer_id=d.id,
            node_id=d.server_id,
            user_id=d.user_id,
            subscription_id=d.subscription_id,
            public_key=d.public_key,
            client_name=d.device_name,
            status="active" if d.revoked_at is None else "revoked",
            issued_at=d.issued_at,
            revoked_at=d.revoked_at,
        )
        for d in devices
    ]
    duration_ms = (time.perf_counter() - started) * 1000
    logger.info(
        "peers list",
        extra=extra_for_event(
            event="peers.list",
            route="/api/v1/peers",
            method="GET",
            status_code=200,
            duration_ms=duration_ms,
            actor_id=str(getattr(request.state, "audit_admin_id", "")) or None,
            result_count=len(items),
            query_params={
                "node_id": node_id,
                "status": status_filter,
                "limit": limit,
                "offset": offset,
            },
        ),
    )
    if settings.environment != "production":
        logger.info(
            "peers list debug",
            extra={
                "node_id": node_id,
                "status": status_filter,
                "limit": limit,
                "offset": offset,
                "returned": len(items),
                "total": total,
            },
        )
    return PeerListOut(peers=items, total=total)


@router.get("/{peer_id}", response_model=PeerListItemOut)
async def get_peer(
    peer_id: str,
    db: AsyncSession = Depends(get_db),
    _admin=Depends(require_permission(PERM_CLUSTER_READ)),
):
    """Get one peer (device) by id."""
    result = await db.execute(select(Device).where(Device.id == peer_id))
    device = result.scalar_one_or_none()
    if not device:
        raise not_found_404("Peer", peer_id)
    return PeerListItemOut(
        peer_id=device.id,
        node_id=device.server_id,
        user_id=device.user_id,
        subscription_id=device.subscription_id,
        public_key=device.public_key,
        client_name=device.device_name,
        status="active" if device.revoked_at is None else "revoked",
        issued_at=device.issued_at,
        revoked_at=device.revoked_at,
    )


@router.post("/{peer_id}/migrate", status_code=status.HTTP_200_OK)
async def migrate_peer_endpoint(
    peer_id: str,
    request: Request,
    body: MigrateBody,
    db: AsyncSession = Depends(get_db),
    _admin=Depends(require_permission(PERM_CLUSTER_WRITE)),
):
    """Move peer to another node. Remove from current, add on target, update device.server_id (spec 4.2)."""
    result = await db.execute(
        select(Device).where(Device.id == peer_id, Device.revoked_at.is_(None))
    )
    device = result.scalar_one_or_none()
    if not device:
        raise not_found_404("Peer", peer_id)
    adapter = request.app.state.node_runtime_adapter
    if settings.node_mode == "agent":
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail={
                "code": "AGENT_MODE_UNSUPPORTED",
                "message": "Live peer migration is not supported in NODE_MODE=agent. Re-issue config on target node instead.",
            },
        )
    if settings.node_discovery == "agent":
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail={
                "code": "AGENT_DISCOVERY_UNSUPPORTED",
                "message": "add_peer is not supported in NODE_DISCOVERY=agent. Migration requires NODE_DISCOVERY=docker. Re-issue config on target node instead.",
            },
        )
    engine = TopologyEngine(adapter)
    get_topology = engine.get_topology
    try:
        target_node_id = await resolve_target_node(db, body.target_node_id, get_topology)
    except LoadBalancerError as e:
        raise_http_for_control_plane_exception(e)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    previous_node_id = device.server_id
    try:
        await migrate_peer(db, device, target_node_id, adapter)
    except WireGuardCommandError as e:
        raise_http_for_control_plane_exception(e)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    await db.commit()
    await db.refresh(device)
    return {
        "peer_id": device.id,
        "previous_node_id": previous_node_id,
        "node_id": target_node_id,
        "status": "migrated",
    }
