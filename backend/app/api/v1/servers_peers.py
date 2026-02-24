import json
import logging
import time
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.v1.server_utils import get_agent_heartbeat
from app.core.config import settings
from app.core.constants import PERM_SERVERS_READ, PERM_SERVERS_WRITE
from app.core.database import get_db
from app.core.exception_handling import raise_http_for_control_plane_exception
from app.core.exceptions import WireGuardCommandError
from app.core.logging_config import extra_for_event
from app.core.metrics import (
    admin_issue_latency_seconds,
    admin_issue_total,
    admin_revoke_total,
    admin_rotate_total,
    provision_failures_total,
)
from app.core.rate_limit import rate_limit_admin_issue
from app.core.rbac import require_permission
from app.core.redis_client import get_redis
from app.models import Device, Server
from app.schemas.server import (
    AdminIssuePeerPeerOut,
    AdminIssuePeerRequest,
    AdminIssuePeerResponse,
    AdminRevokePeerResponse,
    AdminRotatePeerResponse,
    BlockPeerRequest,
    PeerOut,
    ResetPeerRequest,
    ServerPeersOut,
)
from app.services.admin_issue_service import admin_issue_peer, admin_rotate_peer
from app.services.server_health_service import sync_peers_after_restart

router = APIRouter(prefix="/servers", tags=["servers"])
logger = logging.getLogger(__name__)

IDEMPOTENCY_ADMIN_ISSUE_PREFIX = "admin_issue:"
IDEMPOTENCY_ADMIN_ISSUE_TTL = 86400  # 24h


@router.get("/{server_id}/peers-sync")
async def get_server_peers_sync(
    request: Request,
    server_id: str,
    db: AsyncSession = Depends(get_db),
    _admin=Depends(require_permission(PERM_SERVERS_READ)),
):
    """On-demand: fetch peers from node, compare with DB devices; return diff counts (and log)."""
    if settings.node_discovery == "agent" or settings.node_mode == "agent":
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail={
                "code": "AGENT_MODE_UNSUPPORTED",
                "message": "Peer sync requires runtime access and is disabled in agent mode.",
            },
        )
    result = await db.execute(select(Server).where(Server.id == server_id))
    server = result.scalar_one_or_none()
    if not server:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Server not found")
    adapter = request.app.state.node_runtime_adapter
    return await sync_peers_after_restart(db, server, runtime_adapter=adapter)


@router.post(
    "/{server_id}/peers",
    response_model=AdminIssuePeerResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_server_peer(
    request: Request,
    server_id: str,
    body: AdminIssuePeerRequest,
    db: AsyncSession = Depends(get_db),
    admin=Depends(require_permission(PERM_SERVERS_WRITE)),
    _rate_limit=Depends(rate_limit_admin_issue),
):
    """Create a peer on the chosen server; return one-time config_download_url and qr_payload."""
    request.state.audit_resource_type = "device"
    request.state.audit_action = f"{request.method} {request.url.path}"
    rid = getattr(request.state, "request_id", None)
    admin_id = str(admin.id) if hasattr(admin, "id") else None
    base_url = str(request.base_url).rstrip("/")
    base_config_url = f"{base_url}/api/v1/admin/configs"

    if body.client_request_id:
        idem_key = f"{IDEMPOTENCY_ADMIN_ISSUE_PREFIX}{server_id}:{body.client_request_id}"
        try:
            cached = await get_redis().get(idem_key)
            if cached:
                data = json.loads(cached)
                device_id = data.get("device_id")
                token_awg = data.get("token_awg")
                token_wg_obf = data.get("token_wg_obf")
                token_wg = data.get("token_wg")
                if device_id and token_awg and token_wg_obf and token_wg:
                    dev_result = await db.execute(select(Device).where(Device.id == device_id))
                    dev = dev_result.scalar_one_or_none()
                    if dev:
                        return AdminIssuePeerResponse(
                            peer=AdminIssuePeerPeerOut(
                                id=dev.id,
                                server_id=dev.server_id,
                                device_name=dev.device_name,
                                public_key=dev.public_key,
                                issued_at=dev.issued_at,
                            ),
                            config_awg={
                                "download_url": f"{base_config_url}/{token_awg}/download",
                                "qr_payload": "",
                            },
                            config_wg_obf={
                                "download_url": f"{base_config_url}/{token_wg_obf}/download",
                                "qr_payload": "",
                            },
                            config_wg={
                                "download_url": f"{base_config_url}/{token_wg}/download",
                                "qr_payload": "",
                            },
                            request_id=rid or "",
                            peer_created=True,
                        )
        except Exception:
            logger.debug("Admin issue idempotency cache get failed", exc_info=True)

    t0 = time.perf_counter()
    try:
        out = await admin_issue_peer(
            db,
            server_id=server_id,
            user_id=body.user_id,
            subscription_id=body.subscription_id,
            device_name=body.label,
            expires_in_days=body.expires_in_days,
            client_endpoint=body.client_endpoint,
            issued_by_admin_id=admin_id,
            runtime_adapter=request.app.state.node_runtime_adapter,
            base_config_url=base_config_url,
        )
        admin_issue_total.labels(status="success").inc()
        admin_issue_latency_seconds.labels(status="success").observe(time.perf_counter() - t0)
    except ValueError as e:
        admin_issue_total.labels(status="failure").inc()
        provision_failures_total.labels(server_id=server_id, reason="validation").inc()
        admin_issue_latency_seconds.labels(status="failure").observe(time.perf_counter() - t0)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e).replace("_", " "),
        )
    except WireGuardCommandError as e:
        admin_issue_total.labels(status="failure").inc()
        provision_failures_total.labels(server_id=server_id, reason="wireguard").inc()
        admin_issue_latency_seconds.labels(status="failure").observe(time.perf_counter() - t0)
        raise_http_for_control_plane_exception(e)
    await db.commit()
    request.state.audit_resource_id = out.device.id
    logger.info(
        "provision peer issued",
        extra=extra_for_event(
            event="provision.peer.issued",
            entity_id=out.device.id,
            actor_id=admin_id,
        ),
    )
    request.state.audit_old_new = {
        "created": {"server_id": server_id, "peer_created": out.peer_created},
    }
    if body.client_request_id:
        token_awg = out.config_awg.download_url.rstrip("/").split("/")[-2]
        token_wg_obf = out.config_wg_obf.download_url.rstrip("/").split("/")[-2]
        token_wg = out.config_wg.download_url.rstrip("/").split("/")[-2]
        idem_key = f"{IDEMPOTENCY_ADMIN_ISSUE_PREFIX}{server_id}:{body.client_request_id}"
        try:
            await get_redis().setex(
                idem_key,
                IDEMPOTENCY_ADMIN_ISSUE_TTL,
                json.dumps(
                    {
                        "device_id": out.device.id,
                        "token_awg": token_awg,
                        "token_wg_obf": token_wg_obf,
                        "token_wg": token_wg,
                    }
                ),
            )
        except Exception:
            logger.debug("Admin issue idempotency cache set failed", exc_info=True)
    return AdminIssuePeerResponse(
        peer=AdminIssuePeerPeerOut(
            id=out.device.id,
            server_id=out.device.server_id,
            device_name=out.device.device_name,
            public_key=out.device.public_key,
            issued_at=out.device.issued_at,
        ),
        config_awg={
            "download_url": out.config_awg.download_url,
            "qr_payload": out.config_awg.qr_payload,
        },
        config_wg_obf={
            "download_url": out.config_wg_obf.download_url,
            "qr_payload": out.config_wg_obf.qr_payload,
        },
        config_wg={
            "download_url": out.config_wg.download_url,
            "qr_payload": out.config_wg.qr_payload,
        },
        request_id=rid or "",
        peer_created=out.peer_created,
    )


@router.post("/{server_id}/peers/{peer_id}/rotate", response_model=AdminRotatePeerResponse)
async def rotate_server_peer(
    request: Request,
    server_id: str,
    peer_id: str,
    db: AsyncSession = Depends(get_db),
    admin=Depends(require_permission(PERM_SERVERS_WRITE)),
):
    """Rotate keys for peer; returns new config_download_url and qr_payload."""
    request.state.audit_resource_type = "device"
    request.state.audit_action = f"{request.method} {request.url.path}"
    rid = getattr(request.state, "request_id", None)
    admin_id = str(admin.id) if hasattr(admin, "id") else None
    base_url = str(request.base_url).rstrip("/")
    base_config_url = f"{base_url}/api/v1/admin/configs"
    try:
        out = await admin_rotate_peer(
            db,
            server_id=server_id,
            peer_id=peer_id,
            issued_by_admin_id=admin_id,
            runtime_adapter=request.app.state.node_runtime_adapter,
            base_config_url=base_config_url,
        )
        admin_rotate_total.labels(status="success").inc()
    except ValueError as e:
        admin_rotate_total.labels(status="failure").inc()
        provision_failures_total.labels(server_id=server_id, reason="validation").inc()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e).replace("_", " "),
        )
    except WireGuardCommandError as e:
        admin_rotate_total.labels(status="failure").inc()
        provision_failures_total.labels(server_id=server_id, reason="wireguard").inc()
        raise_http_for_control_plane_exception(e)
    await db.commit()
    request.state.audit_resource_id = peer_id
    request.state.audit_old_new = {"rotate": {"server_id": server_id}}
    return AdminRotatePeerResponse(
        config_awg={
            "download_url": out.config_awg.download_url,
            "qr_payload": out.config_awg.qr_payload,
        },
        config_wg_obf={
            "download_url": out.config_wg_obf.download_url,
            "qr_payload": out.config_wg_obf.qr_payload,
        },
        config_wg={
            "download_url": out.config_wg.download_url,
            "qr_payload": out.config_wg.qr_payload,
        },
        request_id=rid or "",
    )


@router.post("/{server_id}/peers/{peer_id}/revoke", response_model=AdminRevokePeerResponse)
async def revoke_server_peer(
    request: Request,
    server_id: str,
    peer_id: str,
    db: AsyncSession = Depends(get_db),
    admin=Depends(require_permission(PERM_SERVERS_WRITE)),
):
    """Revoke peer: remove from node and set revoked_at on device."""
    request.state.audit_resource_type = "device"
    request.state.audit_action = f"{request.method} {request.url.path}"
    rid = getattr(request.state, "request_id", None)
    result = await db.execute(
        select(Device).where(Device.id == peer_id, Device.server_id == server_id)
    )
    device = result.scalar_one_or_none()
    if not device:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Peer not found")
    if device.revoked_at:
        return AdminRevokePeerResponse(request_id=rid or "", message="Already revoked")
    adapter = request.app.state.node_runtime_adapter
    ok = True
    try:
        if settings.node_mode == "real":
            await adapter.remove_peer(server_id, device.public_key)
        else:
            ok = False
    except Exception:
        logger.exception("Revoke peer failed")
        ok = False
    device.revoked_at = datetime.now(timezone.utc)
    await db.flush()
    request.state.audit_resource_id = peer_id
    request.state.audit_old_new = {"revoke": {"server_id": server_id, "node_accepted": ok}}
    await db.commit()
    admin_revoke_total.labels(status="success" if ok else "db_only").inc()
    logger.info(
        "provision peer revoked",
        extra=extra_for_event(
            event="provision.peer.revoked",
            entity_id=peer_id,
        ),
    )
    return AdminRevokePeerResponse(request_id=rid or "")


@router.get("/{server_id}/peers", response_model=ServerPeersOut)
async def get_server_peers(
    request: Request,
    server_id: str,
    db: AsyncSession = Depends(get_db),
    _admin=Depends(require_permission(PERM_SERVERS_READ)),
):
    """Fetch peers from node with pubkey, handshake, rx/tx, status. Returns empty when node unreachable."""
    result = await db.execute(select(Server).where(Server.id == server_id))
    server = result.scalar_one_or_none()
    if not server:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Server not found")
    if settings.node_discovery == "agent":
        hb = await get_agent_heartbeat(server_id)
        now_ts = int(datetime.now(timezone.utc).timestamp())
        dev_result = await db.execute(
            select(Device.id, Device.public_key).where(
                Device.server_id == server_id, Device.revoked_at.is_(None)
            )
        )
        pk_to_id = {row[1]: row[0] for row in dev_result.all()}
        peers = []
        hb_peers = hb.get("peers") if isinstance(hb, dict) else None
        if isinstance(hb_peers, list):
            for p in hb_peers:
                if not isinstance(p, dict):
                    continue
                pk = str(p.get("public_key") or "")
                age_sec = p.get("last_handshake_age_sec")
                last_handshake_ts = None
                peer_status = "unknown"
                if isinstance(age_sec, int | float) and age_sec >= 0:
                    last_handshake_ts = datetime.fromtimestamp(
                        now_ts - int(age_sec), tz=timezone.utc
                    )
                    peer_status = "online" if int(age_sec) <= 180 else "offline"
                peer_id = pk_to_id.get(pk)
                peers.append(
                    PeerOut(
                        public_key=pk,
                        peer_id=peer_id,
                        allowed_ips=str(p.get("allowed_ips") or ""),
                        last_handshake_ts=last_handshake_ts,
                        rx_bytes=int(p.get("rx_bytes") or 0),
                        tx_bytes=int(p.get("tx_bytes") or 0),
                        status=peer_status,
                    )
                )
        return ServerPeersOut(
            peers=peers,
            total=len(peers),
            node_reachable=bool(hb),
        )
    try:
        adapter = request.app.state.node_runtime_adapter
        raw = await adapter.list_peers(server.id)
        now_ts = int(datetime.now(timezone.utc).timestamp())
        dev_result = await db.execute(
            select(Device.id, Device.public_key).where(
                Device.server_id == server_id, Device.revoked_at.is_(None)
            )
        )
        pk_to_id = {row[1]: row[0] for row in dev_result.all()}
        peers = []
        for p in raw:
            pk = str(p.get("public_key") or "")
            last = int(p.get("last_handshake") or 0)
            peer_status = "unknown"
            last_handshake_ts = None
            if last > 0:
                last_handshake_ts = datetime.fromtimestamp(last, tz=timezone.utc)
                peer_status = "online" if (now_ts - last) <= 180 else "offline"
            peer_id = pk_to_id.get(pk)
            peers.append(
                PeerOut(
                    public_key=pk,
                    peer_id=peer_id,
                    allowed_ips=str(p.get("allowed_ips") or ""),
                    last_handshake_ts=last_handshake_ts,
                    rx_bytes=int(p.get("transfer_rx") or 0),
                    tx_bytes=int(p.get("transfer_tx") or 0),
                    status=peer_status,
                )
            )
        return ServerPeersOut(peers=peers, total=len(peers), node_reachable=True)
    except Exception:
        logger.exception("Get server peers failed")
        return ServerPeersOut(peers=[], total=0, node_reachable=False)


@router.post("/{server_id}/peers/block")
async def block_server_peer(
    request: Request,
    server_id: str,
    body: BlockPeerRequest,
    db: AsyncSession = Depends(get_db),
    admin=Depends(require_permission(PERM_SERVERS_WRITE)),
):
    if body.confirm_token != settings.block_confirm_token:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Block requires confirm_token in body",
        )
    result = await db.execute(select(Server).where(Server.id == server_id))
    server = result.scalar_one_or_none()
    if not server:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Server not found")
    adapter = request.app.state.node_runtime_adapter
    ok = True
    try:
        # WG runtime has no "block" command; removing peer enforces block.
        if settings.node_mode == "real":
            await adapter.remove_peer(server.id, body.public_key)
        else:
            ok = False
    except Exception:
        logger.exception("Block peer failed")
        ok = False
    request.state.audit_resource_type = "peer"
    pk = body.public_key
    request.state.audit_resource_id = pk[:16] + "..." if len(pk) > 16 else pk
    request.state.audit_old_new = {"block": {"server_id": server_id, "node_accepted": ok}}
    if settings.node_mode == "agent":
        # DB-only: try to map to a Device and revoke; agent will remove peer.
        pk_norm = body.public_key.replace("-", "+").replace("_", "/").strip()
        d = (
            await db.execute(
                select(Device).where(
                    Device.server_id == server_id,
                    Device.public_key.in_([pk_norm, body.public_key.strip()]),
                    Device.revoked_at.is_(None),
                )
            )
        ).scalar_one_or_none()
        if d:
            d.revoked_at = datetime.now(timezone.utc)
            await db.commit()
            return {
                "status": "accepted",
                "message": "Peer revoked in DB; block pending on node-agent",
            }
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Peer not found")
    if not ok:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY, detail="Node did not accept block"
        )
    return {"status": "ok", "message": "Peer blocked"}


@router.post("/{server_id}/peers/reset")
async def reset_server_peer(
    request: Request,
    server_id: str,
    body: ResetPeerRequest,
    db: AsyncSession = Depends(get_db),
    admin=Depends(require_permission(PERM_SERVERS_WRITE)),
):
    result = await db.execute(select(Server).where(Server.id == server_id))
    server = result.scalar_one_or_none()
    if not server:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Server not found")
    adapter = request.app.state.node_runtime_adapter
    ok = True
    try:
        if settings.node_mode == "real":
            await adapter.remove_peer(server.id, body.public_key)
        else:
            ok = False
    except Exception:
        logger.exception("Reset peer failed")
        ok = False
    pk = body.public_key
    request.state.audit_resource_type = "peer"
    request.state.audit_resource_id = pk[:16] + "..." if len(pk) > 16 else pk
    request.state.audit_old_new = {"reset": {"server_id": server_id, "node_accepted": ok}}
    if settings.node_mode == "agent":
        pk_norm = body.public_key.replace("-", "+").replace("_", "/").strip()
        d = (
            await db.execute(
                select(Device).where(
                    Device.server_id == server_id,
                    Device.public_key.in_([pk_norm, body.public_key.strip()]),
                    Device.revoked_at.is_(None),
                )
            )
        ).scalar_one_or_none()
        if not d:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Peer not found")
        d.revoked_at = datetime.now(timezone.utc)
        await db.commit()
        return {"status": "accepted", "message": "Peer revoked in DB; reset pending on node-agent"}
    if not ok:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY, detail="Node did not accept reset"
        )
    return {"status": "ok", "message": "Peer reset"}
