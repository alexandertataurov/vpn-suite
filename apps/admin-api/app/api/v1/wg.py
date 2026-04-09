"""WG control-plane API: POST /wg/peer, DELETE /wg/peer (spec endpoints)."""

import logging
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Request, status
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.v1.device_cache import invalidate_devices_list_cache, invalidate_devices_summary_cache
from app.core.config import settings
from app.core.constants import PERM_CLUSTER_WRITE
from app.core.database import get_db
from app.core.exception_handling import raise_http_for_control_plane_exception
from app.core.exceptions import LoadBalancerError, WireGuardCommandError
from app.core.rbac import require_permission
from app.models import Device
from app.schemas.device import IssueResponse
from app.services.issue_service import issue_device
from app.services.issued_config_service import persist_issued_configs
from app.services.server_live_key_service import ServerNotSyncedError
from app.services.topology_engine import TopologyEngine

router = APIRouter(prefix="/wg", tags=["wg"])


class WgPeerCreateBody(BaseModel):
    """Body for POST /wg/peer (provision peer = issue device)."""

    user_id: int
    subscription_id: str
    device_name: str | None = None
    server_id: str | None = None


@router.post("/peer", response_model=IssueResponse, status_code=status.HTTP_201_CREATED)
async def create_wg_peer(
    request: Request,
    body: WgPeerCreateBody,
    db: AsyncSession = Depends(get_db),
    _admin=Depends(require_permission(PERM_CLUSTER_WRITE)),
):
    """Provision a VPN peer (spec: POST /wg/peer). Delegates to issue_service with load-balance when server_id omitted."""
    get_topology = None
    if body.server_id is None:
        adapter = request.app.state.node_runtime_adapter
        engine = TopologyEngine(adapter)
        get_topology = engine.get_topology
    try:
        runtime_adapter = request.app.state.node_runtime_adapter
        out = await issue_device(
            db,
            user_id=body.user_id,
            subscription_id=body.subscription_id,
            server_id=body.server_id,
            device_name=body.device_name,
            get_topology=get_topology,
            runtime_adapter=runtime_adapter,
        )
    except ServerNotSyncedError as e:
        from app.core.metrics import config_issue_blocked_total, discovery_not_found_total

        config_issue_blocked_total.labels(reason="server_not_synced").inc()
        if e.server_id and "not found" in (e.reason or "").lower():
            discovery_not_found_total.labels(server_id=e.server_id).inc()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail={
                "code": "SERVER_NOT_SYNCED",
                "message": "Server key not verified; run sync or fix discovery.",
                "details": {"server_id": e.server_id, "reason": e.reason},
            },
        ) from e
    except (LoadBalancerError, WireGuardCommandError) as e:
        raise_http_for_control_plane_exception(e)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e).replace("_", " "),
        )
    await persist_issued_configs(
        db,
        device_id=out.device.id,
        server_id=out.device.server_id,
        config_awg=out.config_awg,
        config_wg_obf=out.config_wg_obf,
        config_wg=out.config_wg,
        issued_by_admin_id=getattr(_admin, "id", None),
    )
    await db.commit()
    await invalidate_devices_summary_cache()
    await invalidate_devices_list_cache()
    await db.refresh(out.device)
    return IssueResponse(
        device_id=out.device.id,
        issued_at=out.device.issued_at,
        config=out.config_awg,
        config_awg=out.config_awg,
        config_wg_obf=out.config_wg_obf,
        config_wg=out.config_wg,
        server_id=out.device.server_id,
        subscription_id=out.device.subscription_id,
        node_mode=settings.node_mode,
        peer_created=out.peer_created,
    )


@router.delete("/peer/{pubkey}")
async def delete_wg_peer(
    request: Request,
    pubkey: str,
    db: AsyncSession = Depends(get_db),
    _admin=Depends(require_permission(PERM_CLUSTER_WRITE)),
):
    """Remove peer by public key (spec: DELETE /wg/peer/{pubkey}). Revokes device and removes peer from node."""
    # Path may be base64url-encoded; normalize for DB lookup (DB stores raw base64)
    pubkey_normalized = pubkey.replace("-", "+").replace("_", "/").strip()
    result = await db.execute(
        select(Device).where(
            Device.public_key == pubkey_normalized,
            Device.revoked_at.is_(None),
        )
    )
    device = result.scalar_one_or_none()
    if not device:
        # Try exact match in case path was not encoded
        result2 = await db.execute(
            select(Device).where(
                Device.public_key == pubkey.strip(),
                Device.revoked_at.is_(None),
            )
        )
        device = result2.scalar_one_or_none()
    if not device:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Peer not found")
    adapter = request.app.state.node_runtime_adapter
    try:
        if settings.node_mode == "real":
            await adapter.remove_peer(device.server_id, device.public_key)
    except Exception:
        logging.getLogger(__name__).exception("Remove peer failed")
    device.revoked_at = datetime.now(timezone.utc)
    await db.commit()
    if settings.node_mode == "agent":
        return {
            "status": "accepted",
            "message": "Peer revoked in DB; removal pending on node-agent",
            "device_id": device.id,
        }
    return {"status": "ok", "message": "Peer removed", "device_id": device.id}
