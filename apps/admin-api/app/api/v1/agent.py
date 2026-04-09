"""Node-agent endpoints (pull model).

Security model (production):
- Mutual TLS is enforced at the reverse-proxy for /api/v1/agent/*.
- This router additionally requires X-Agent-Token (shared or per-node; shared here for bootstrap).

Agent model:
- Heartbeat pushes runtime metadata into Redis (TTL) for control-plane visibility.
- Desired-state returns the peer set from DB for this server_id so agent can reconcile locally.
"""

from __future__ import annotations

import hashlib
import json
import logging
import secrets as stdlib_secrets
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, Header, HTTPException, Query, Request
from sqlalchemy import or_, select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.v1.server_cache import invalidate_servers_list_cache
from app.core.amnezia_config import (
    DEFAULT_S1,
    DEFAULT_S2,
    DEFAULT_Jc,
    DEFAULT_Jmax,
    DEFAULT_Jmin,
)
from app.core.config import settings
from app.core.constants import REDIS_KEY_AGENT_HB_PREFIX
from app.core.database import async_session_factory, get_db
from app.core.logging_config import request_id_ctx
from app.core.redaction import redact_for_log
from app.core.redis_client import get_redis
from app.models import Device, Server, ServerProfile
from app.schemas.agent import (
    AgentAckOut,
    AgentDesiredPeer,
    AgentDesiredStateOut,
    AgentHeartbeatIn,
    AgentV1ActionExecuteIn,
    AgentV1ActionPollOut,
    AgentV1ActionReportIn,
    AgentV1PeerOut,
    AgentV1StatusOut,
    AgentV1TelemetryOut,
    ObfuscationFullOut,
    ObfuscationHOut,
)
from app.services.agent_action_service import (
    append_log,
    get_action,
    get_pending_action,
    set_status,
)
from app.services.audit_service import log_audit
from app.services.device_telemetry_cache import (
    _norm_public_key,
    write_device_telemetry_from_heartbeat_peers,
)

_log = logging.getLogger(__name__)
router = APIRouter(tags=["agent"])


def _require_agent_token(x_agent_token: str | None) -> None:
    if not settings.agent_shared_token:
        raise HTTPException(
            status_code=503,
            detail={
                "code": "AGENT_API_DISABLED",
                "message": "Agent API disabled (AGENT_SHARED_TOKEN not set)",
            },
        )
    if not x_agent_token or not stdlib_secrets.compare_digest(
        x_agent_token, settings.agent_shared_token
    ):
        raise HTTPException(
            status_code=401, detail={"code": "AGENT_UNAUTHORIZED", "message": "Invalid agent token"}
        )


def _rev_for(server_id: str, peers: list[AgentDesiredPeer]) -> str:
    h = hashlib.sha256()
    h.update(server_id.encode("utf-8"))
    for p in peers:
        h.update(p.public_key.encode("utf-8"))
        h.update(b"\x00")
        h.update(p.allowed_ips.encode("utf-8"))
        h.update(b"\x00")
        h.update((p.preshared_key or "").encode("utf-8"))
        h.update(b"\x00")
    return h.hexdigest()[:16]


def _heartbeat_public_key(payload: AgentHeartbeatIn) -> str | None:
    """Valid server public_key from heartbeat (base64, min length) or None."""
    pk = (payload.public_key or "").strip()
    return pk if len(pk) >= 43 else None


async def _ensure_server_from_heartbeat(db: AsyncSession, payload: AgentHeartbeatIn) -> None:
    """Ensure a Server row exists for this server_id; create from heartbeat if missing."""
    sid = (payload.server_id or "")[:32]
    if not sid:
        return
    r = await db.execute(select(Server).where(Server.id == sid))
    if r.scalar_one_or_none():
        return
    name = (payload.container_name or sid).strip()
    if name == "(no container)":
        name = sid
    name = (name or sid)[:255]
    api_endpoint = (
        f"docker://{payload.container_name}"
        if payload.container_name and payload.container_name != "(no container)"
        else f"docker://{sid}"
    )
    now = datetime.now(timezone.utc)
    pk = _heartbeat_public_key(payload)
    server = Server(
        id=sid,
        name=name,
        region="docker",
        api_endpoint=api_endpoint[:512],
        status=payload.status or "unknown",
        is_active=True,
        public_key=pk,
        public_key_synced_at=now if pk else None,
    )
    db.add(server)
    try:
        await db.commit()
    except Exception:
        await db.rollback()
        raise


@router.post("/agent/heartbeat", response_model=AgentAckOut)
async def agent_heartbeat(
    payload: AgentHeartbeatIn,
    x_agent_token: str | None = Header(default=None, alias="X-Agent-Token"),
    db: AsyncSession = Depends(get_db),
):
    _require_agent_token(x_agent_token)
    rid = request_id_ctx.get()
    now = datetime.now(timezone.utc)
    try:
        r = get_redis()
        key = f"{REDIS_KEY_AGENT_HB_PREFIX}{payload.server_id}"
        dumped = payload.model_dump(mode="json")
        await r.set(key, json.dumps(dumped), ex=settings.agent_heartbeat_ttl_seconds)
        if dumped.get("peers"):
            _log.info(
                "Agent heartbeat stored server_id=%s peers=%s",
                payload.server_id,
                len(dumped["peers"]),
            )
            # Write device telemetry immediately so Devices page shows data without waiting for poll
            try:
                dev_r = await db.execute(
                    select(Device.id, Device.public_key).where(
                        Device.server_id == payload.server_id,
                        Device.revoked_at.is_(None),
                    )
                )
                pk_to_device_id = {}
                for row in dev_r.all():
                    dev_id, pubkey = row[0], row[1]
                    if dev_id and pubkey:
                        pk = _norm_public_key(pubkey)
                        if pk:
                            pk_to_device_id[pk] = dev_id
                written = await write_device_telemetry_from_heartbeat_peers(
                    payload.server_id,
                    dumped["peers"],
                    pk_to_device_id,
                )
                if written:
                    _log.info(
                        "Agent heartbeat wrote telemetry for %s devices server_id=%s",
                        written,
                        payload.server_id,
                    )
                # Peers on node -> mark device apply_status=APPLIED so config content/download can succeed
                dev_ids = [
                    pk_to_device_id[_norm_public_key(str(p.get("public_key") or ""))]
                    for p in dumped["peers"]
                    if isinstance(p, dict)
                    and _norm_public_key(str(p.get("public_key") or "")) in pk_to_device_id
                ]
                if dev_ids:
                    await db.execute(
                        update(Device)
                        .where(
                            Device.id.in_(dev_ids),
                            or_(
                                Device.apply_status.is_(None),
                                Device.apply_status.notin_(("APPLIED", "VERIFIED")),
                            ),
                        )
                        .values(apply_status="APPLIED", last_applied_at=now)
                    )
                    await db.commit()
            except Exception as te:
                _log.warning(
                    "Heartbeat telemetry/apply_status update failed server_id=%s: %s",
                    payload.server_id,
                    te,
                    exc_info=True,
                )
    except Exception as exc:
        raise HTTPException(
            status_code=503,
            detail={
                "code": "AGENT_HEARTBEAT_STORE_FAILED",
                "message": "Failed to store agent heartbeat",
                "details": {"error": redact_for_log(str(exc))[:200], "request_id": rid},
            },
        )
    try:
        await _ensure_server_from_heartbeat(db, payload)
        # Persist public_key from heartbeat so issue/reissue and DB fallback stay in sync
        pk = _heartbeat_public_key(payload)
        if pk:
            srv_r = await db.execute(select(Server).where(Server.id == payload.server_id))
            server = srv_r.scalar_one_or_none()
            if server and (server.public_key or "").strip() != pk:
                server.public_key = pk
                server.public_key_synced_at = now
                await db.commit()
                await invalidate_servers_list_cache()
    except Exception:
        pass  # best-effort; list still works from Redis heartbeats
    return AgentAckOut(ok=True, server_time_utc=now)


@router.get("/agent/desired-state", response_model=AgentDesiredStateOut)
async def agent_desired_state(
    request: Request,
    server_id: str,
    x_agent_token: str | None = Header(default=None, alias="X-Agent-Token"),
):
    _require_agent_token(x_agent_token)
    correlation_id = getattr(request.state, "request_id", None) or request_id_ctx.get()
    async with async_session_factory() as session:
        r = await session.execute(
            select(Device.public_key, Device.allowed_ips, Device.preshared_key)
            .where(
                Device.server_id == server_id,
                Device.revoked_at.is_(None),
                Device.suspended_at.is_(None),
            )
            .order_by(Device.created_at.asc())
        )
        peers = [
            AgentDesiredPeer(
                public_key=row[0],
                allowed_ips=(row[1] or "10.8.1.2/32").strip(),
                preshared_key=(row[2] or "").strip() or None,
            )
            for row in r.all()
            if row and row[0]
        ]
        server_r = await session.execute(select(Server).where(Server.id == server_id))
        server = server_r.scalar_one_or_none()
        obfuscation_h = None
        obfuscation_full = None
        if server and all(
            getattr(server, k, None) is not None
            for k in ("amnezia_h1", "amnezia_h2", "amnezia_h3", "amnezia_h4")
        ):
            obfuscation_h = ObfuscationHOut(
                h1=server.amnezia_h1,
                h2=server.amnezia_h2,
                h3=server.amnezia_h3,
                h4=server.amnezia_h4,
            )
            # Build full obfuscation from server H + first profile so node can sync S1,S2,Jc to env
            profile_r = await session.execute(
                select(ServerProfile.request_params)
                .where(ServerProfile.server_id == server_id)
                .order_by(ServerProfile.created_at.asc())
                .limit(1)
            )
            params = (profile_r.scalar() or {}) if profile_r else {}
            if isinstance(params, dict):
                obfuscation_full = ObfuscationFullOut(
                    s1=int(params.get("amnezia_s1", DEFAULT_S1)),
                    s2=int(params.get("amnezia_s2", DEFAULT_S2)),
                    jc=int(params.get("amnezia_jc", DEFAULT_Jc)),
                    jmin=int(params.get("amnezia_jmin", DEFAULT_Jmin)),
                    jmax=int(params.get("amnezia_jmax", DEFAULT_Jmax)),
                    h1=server.amnezia_h1,
                    h2=server.amnezia_h2,
                    h3=server.amnezia_h3,
                    h4=server.amnezia_h4,
                )
    rev = _rev_for(server_id, peers)
    return AgentDesiredStateOut(
        server_id=server_id,
        interface_name="awg0",
        revision=rev,
        peers=peers,
        correlation_id=correlation_id,
        obfuscation_h=obfuscation_h,
        obfuscation_full=obfuscation_full,
    )


# --- Agent API v1 (versioned: status, telemetry, peers; action stubs) ---


async def _get_heartbeat_payload_async(server_id: str) -> dict | None:
    """Return parsed heartbeat payload from Redis or None if missing."""
    r = get_redis()
    key = f"{REDIS_KEY_AGENT_HB_PREFIX}{server_id}"
    raw = await r.get(key)
    if not raw:
        return None
    try:
        return json.loads(raw)
    except (json.JSONDecodeError, TypeError):
        return None


@router.get("/agent/v1/status", response_model=AgentV1StatusOut)
async def agent_v1_status(
    server_id: str = Query(..., description="Server ID this agent manages"),
    x_agent_token: str | None = Header(default=None, alias="X-Agent-Token"),
):
    _require_agent_token(x_agent_token)
    payload = await _get_heartbeat_payload_async(server_id)
    if not payload:
        raise HTTPException(status_code=404, detail="No heartbeat for this server_id")
    ts = payload.get("ts_utc")
    if isinstance(ts, str):
        try:
            ts = datetime.fromisoformat(ts.replace("Z", "+00:00"))
        except (ValueError, TypeError):
            ts = None
    return AgentV1StatusOut(
        server_id=server_id,
        agent_version=payload.get("agent_version") or "unknown",
        interface_name=payload.get("interface_name") or "awg0",
        last_heartbeat_ts=ts,
    )


@router.get("/agent/v1/telemetry", response_model=AgentV1TelemetryOut)
async def agent_v1_telemetry(
    server_id: str = Query(..., description="Server ID this agent manages"),
    x_agent_token: str | None = Header(default=None, alias="X-Agent-Token"),
):
    _require_agent_token(x_agent_token)
    payload = await _get_heartbeat_payload_async(server_id)
    if not payload:
        raise HTTPException(status_code=404, detail="No heartbeat for this server_id")
    return AgentV1TelemetryOut(
        server_id=server_id,
        peer_count=payload.get("peer_count") or 0,
        total_rx_bytes=payload.get("total_rx_bytes") or 0,
        total_tx_bytes=payload.get("total_tx_bytes") or 0,
        health_score=float(payload.get("health_score", 1.0)),
        status=payload.get("status") or "unknown",
    )


@router.get("/agent/v1/peers", response_model=list[AgentV1PeerOut])
async def agent_v1_peers(
    server_id: str = Query(..., description="Server ID this agent manages"),
    x_agent_token: str | None = Header(default=None, alias="X-Agent-Token"),
):
    _require_agent_token(x_agent_token)
    payload = await _get_heartbeat_payload_async(server_id)
    if not payload:
        raise HTTPException(status_code=404, detail="No heartbeat for this server_id")
    peers_raw = payload.get("peers")
    if not isinstance(peers_raw, list):
        return []
    out = []
    for p in peers_raw:
        if not isinstance(p, dict) or not p.get("public_key"):
            continue
        out.append(
            AgentV1PeerOut(
                public_key=p["public_key"],
                allowed_ips=p.get("allowed_ips") or "",
                last_handshake_age_sec=p.get("last_handshake_age_sec"),
                rx_bytes=p.get("rx_bytes") or 0,
                tx_bytes=p.get("tx_bytes") or 0,
                rtt_ms=p.get("rtt_ms"),
            )
        )
    return out


@router.post("/agent/v1/actions/execute")
async def agent_v1_actions_execute(
    body: AgentV1ActionExecuteIn,
    x_agent_token: str | None = Header(default=None, alias="X-Agent-Token"),
):
    _require_agent_token(x_agent_token)
    raise HTTPException(
        status_code=501,
        detail={"code": "USE_POLL_REPORT", "message": "Use poll/report for actions"},
    )


@router.get("/agent/v1/actions/poll", response_model=AgentV1ActionPollOut)
async def agent_v1_actions_poll(
    server_id: str = Query(..., description="Server ID this agent manages"),
    x_agent_token: str | None = Header(default=None, alias="X-Agent-Token"),
    db: AsyncSession = Depends(get_db),
):
    _require_agent_token(x_agent_token)
    action = await get_pending_action(db, server_id)
    if not action:
        return AgentV1ActionPollOut(action_id=None, type=None, payload=None)
    now = datetime.now(timezone.utc)
    await set_status(db, action.id, "running", started_at=now)
    await append_log(db, action.id, level="info", message="Agent started execution")
    await db.commit()
    return AgentV1ActionPollOut(
        action_id=action.id,
        type=action.type,
        payload=action.payload,
    )


@router.post("/agent/v1/actions/report")
async def agent_v1_actions_report(
    body: AgentV1ActionReportIn,
    x_agent_token: str | None = Header(default=None, alias="X-Agent-Token"),
    db: AsyncSession = Depends(get_db),
):
    _require_agent_token(x_agent_token)
    now = datetime.now(timezone.utc)
    await append_log(
        db,
        body.action_id,
        level="error" if body.status == "failed" else "info",
        message=body.message or body.status,
        meta=body.meta,
    )
    ok = await set_status(
        db,
        body.action_id,
        body.status,
        error=body.message if body.status == "failed" else None,
        finished_at=now,
    )
    invalidate_cache = False
    if ok and body.status in ("completed", "failed"):
        action = await get_action(db, body.action_id, load_logs=False)
        if action:
            await log_audit(
                db,
                admin_id=None,
                action=f"action.{body.status}",
                resource_type="agent_action",
                resource_id=body.action_id,
                old_new={"server_id": action.server_id, "type": action.type, "status": body.status},
            )
            if action.type == "sync" and body.status == "completed":
                server = await db.get(Server, action.server_id)
                if server:
                    server.last_snapshot_at = now
                    invalidate_cache = True
    await db.commit()
    if invalidate_cache:
        await invalidate_servers_list_cache()
    if not ok:
        raise HTTPException(status_code=404, detail="Action not found")
    return {"ok": True}
