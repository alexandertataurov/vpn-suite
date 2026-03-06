"""WebApp: initData validation, session token, me (user + subscription + devices)."""

import logging
import math
from datetime import datetime, timedelta, timezone

import httpx
from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Query, Request, status
from pydantic import BaseModel, Field, model_validator
from sqlalchemy import func, select
from sqlalchemy.dialects.postgresql import insert as pg_insert
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.api.v1.device_cache import invalidate_devices_list_cache, invalidate_devices_summary_cache
from app.core.config import settings
from app.core.config_builder import ConfigValidationError
from app.core.constants import REDIS_KEY_RATELIMIT_ISSUE_PREFIX
from app.core.database import get_db
from app.core.metrics import frontend_web_vital_ms, frontend_web_vital_score, miniapp_events_total
from app.core.redaction import redact_for_log
from app.core.redis_client import get_redis
from app.core.security import create_webapp_session_token, decode_token, validate_telegram_init_data
from app.core.telegram_user import build_tg_requisites
from app.models import (
    ChurnSurvey,
    Device,
    Payment,
    PaymentEvent,
    Plan,
    PromoCode,
    PromoRedemption,
    Referral,
    Server,
    Subscription,
    User,
)
from app.services.device_telemetry_cache import get_device_telemetry_bulk
from app.services.funnel_service import log_funnel_event
from app.services.issue_service import issue_device
from app.services.issued_config_service import persist_issued_configs
from app.services.retention_service import (
    pause_subscription,
    resume_subscription,
    retention_discount_percent,
)

router = APIRouter(prefix="/webapp", tags=["webapp"])

_WEBAPP_SERVER_SELECT_LIMIT = 20
_WEBAPP_SERVER_SELECT_WINDOW_SECONDS = 60
_WEBAPP_ONBOARDING_VERSION = 1
_WEBAPP_ONBOARDING_MAX_STEP = 4


class WebAppAuthRequest(BaseModel):
    """Accepts initData (Telegram) or init_data."""

    init_data: str = ""

    model_config = {"populate_by_name": True, "extra": "allow"}

    @model_validator(mode="before")
    @classmethod
    def accept_init_data_keys(cls, data: object):
        if isinstance(data, dict):
            v = data.get("initData") or data.get("init_data") or ""
            return {"init_data": v}
        return data


@router.post("/auth")
async def webapp_auth(body: WebAppAuthRequest, db: AsyncSession = Depends(get_db)):
    """Validate Telegram WebApp initData; ensure user exists; return short-lived session token."""
    init_data = body.init_data
    bot_token = settings.telegram_bot_token
    if not bot_token:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail={"code": "WEBAPP_AUTH_DISABLED", "message": "WebApp auth not configured"},
        )
    user = validate_telegram_init_data(init_data, bot_token)
    if not user or not isinstance(user, dict):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"code": "INVALID_INIT_DATA", "message": "Invalid or expired initData"},
        )
    tg_user_id = user.get("id") if isinstance(user.get("id"), int | float) else None
    if tg_user_id is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"code": "INVALID_INIT_DATA", "message": "User id missing"},
        )
    tg_id = int(tg_user_id)
    requisites = build_tg_requisites(user)
    # Ensure user exists and upsert meta["tg"] so every auth refreshes requisites
    existing = await db.execute(select(User).where(User.tg_id == tg_id))
    db_user = existing.scalar_one_or_none()
    if db_user is None:
        await db.execute(
            pg_insert(User)
            .values(tg_id=tg_id, meta={"tg": requisites} if requisites else None)
            .on_conflict_do_nothing(index_elements=[User.tg_id])
        )
        await db.flush()
        result = await db.execute(select(User).where(User.tg_id == tg_id))
        db_user = result.scalar_one_or_none()
    if db_user is not None and requisites:
        meta = db_user.meta or {}
        meta["tg"] = requisites
        db_user.meta = meta
    await db.commit()
    ttl = int(settings.webapp_session_expire_seconds)
    token = create_webapp_session_token(tg_id, expire_seconds=ttl)
    return {"session_token": token, "expires_in": ttl}


def _get_tg_id_from_bearer(request: Request) -> int | None:
    auth = request.headers.get("Authorization") or ""
    if not auth.startswith("Bearer "):
        return None
    payload = decode_token(auth[7:])
    if payload and payload.get("type") == "webapp" and payload.get("sub"):
        try:
            return int(payload["sub"])
        except (ValueError, TypeError):
            pass
    return None


async def _get_or_create_webapp_user(db: AsyncSession, tg_id: int):
    """Return User for tg_id; create if missing so valid session never gets USER_NOT_FOUND."""
    result = await db.execute(select(User).where(User.tg_id == tg_id))
    user = result.scalar_one_or_none()
    if user:
        return user
    await db.execute(
        pg_insert(User).values(tg_id=tg_id).on_conflict_do_nothing(index_elements=[User.tg_id])
    )
    await db.flush()
    result = await db.execute(select(User).where(User.tg_id == tg_id))
    return result.scalar_one_or_none()


def _serialize_onboarding_state(user: User | None) -> dict:
    if not user:
        return {
            "completed": False,
            "step": None,
            "version": _WEBAPP_ONBOARDING_VERSION,
            "updated_at": None,
        }
    version = int(user.onboarding_version or _WEBAPP_ONBOARDING_VERSION)
    step = user.onboarding_step
    if step is not None:
        step = max(0, min(_WEBAPP_ONBOARDING_MAX_STEP, int(step)))
    completed = user.onboarding_completed_at is not None
    if completed and step is None:
        step = _WEBAPP_ONBOARDING_MAX_STEP
    return {
        "completed": completed,
        "step": step,
        "version": version,
        "updated_at": user.onboarding_completed_at.isoformat()
        if user.onboarding_completed_at
        else None,
    }


class WebAppOnboardingStateBody(BaseModel):
    step: int = Field(..., ge=0, le=_WEBAPP_ONBOARDING_MAX_STEP)
    completed: bool | None = None
    version: int = Field(_WEBAPP_ONBOARDING_VERSION, ge=1)


@router.get("/me")
async def webapp_me(request: Request, db: AsyncSession = Depends(get_db)):
    """Return user, subscriptions, devices for the session's tg_id. Requires Bearer session token."""
    tg_id = _get_tg_id_from_bearer(request)
    if not tg_id:
        raise HTTPException(
            status_code=401, detail={"code": "UNAUTHORIZED", "message": "Invalid session"}
        )
    result = await db.execute(
        select(User)
        .where(User.tg_id == tg_id)
        .options(selectinload(User.subscriptions), selectinload(User.devices))
    )
    user = result.scalar_one_or_none()
    if not user:
        return {
            "user": None,
            "subscriptions": [],
            "devices": [],
            "onboarding": _serialize_onboarding_state(None),
        }
    subs = [
        {
            "id": s.id,
            "plan_id": s.plan_id,
            "status": s.status,
            "valid_until": s.valid_until.isoformat(),
            "device_limit": s.device_limit,
        }
        for s in user.subscriptions
    ]
    devs = [
        {
            "id": d.id,
            "device_name": d.device_name,
            "issued_at": d.issued_at.isoformat(),
            "revoked_at": d.revoked_at.isoformat() if d.revoked_at else None,
            "last_seen_handshake_at": d.last_seen_handshake_at.isoformat()
            if d.last_seen_handshake_at
            else None,
            "apply_status": d.apply_status,
        }
        for d in user.devices
    ]
    await log_funnel_event(
        db,
        event_type="dashboard_open",
        user_id=user.id,
        payload={"source": "webapp"},
    )
    miniapp_events_total.labels(event="dashboard_open").inc()
    return {
        "user": {"id": user.id, "tg_id": user.tg_id},
        "subscriptions": subs,
        "devices": devs,
        "onboarding": _serialize_onboarding_state(user),
    }


@router.post("/onboarding/state")
async def webapp_onboarding_state(
    body: WebAppOnboardingStateBody,
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    """Persist onboarding progress for the current session user."""
    tg_id = _get_tg_id_from_bearer(request)
    if not tg_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"code": "UNAUTHORIZED", "message": "Invalid session"},
        )
    user = await _get_or_create_webapp_user(db, tg_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "USER_NOT_FOUND", "message": "User not found"},
        )
    incoming_step = max(0, min(_WEBAPP_ONBOARDING_MAX_STEP, int(body.step)))
    current_step = user.onboarding_step if user.onboarding_step is not None else 0
    user.onboarding_step = max(current_step, incoming_step)
    user.onboarding_version = max(int(user.onboarding_version or 1), int(body.version))

    should_complete = bool(body.completed)
    if should_complete or user.onboarding_completed_at is not None:
        user.onboarding_completed_at = user.onboarding_completed_at or datetime.now(timezone.utc)
        user.onboarding_step = _WEBAPP_ONBOARDING_MAX_STEP

    await db.commit()
    await db.refresh(user)
    return {"onboarding": _serialize_onboarding_state(user)}


class WebAppTelemetryBody(BaseModel):
    """Frontend telemetry event."""

    event_type: str
    payload: dict | None = None


class WebAppUsagePoint(BaseModel):
    ts: datetime
    bytes_in: int
    bytes_out: int


class WebAppUsageResponse(BaseModel):
    points: list[WebAppUsagePoint]
    sessions: int
    peak_hours: list[int] | None = None


@router.post("/telemetry")
async def webapp_telemetry(
    body: WebAppTelemetryBody,
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    """Log a telemetry event (screen_open, cta_click, etc.). Requires Bearer session token."""
    tg_id = _get_tg_id_from_bearer(request)
    if not tg_id:
        raise HTTPException(
            status_code=401, detail={"code": "UNAUTHORIZED", "message": "Invalid session"}
        )
    result = await db.execute(select(User).where(User.tg_id == tg_id))
    user = result.scalar_one_or_none()
    payload = body.payload or {}
    await log_funnel_event(
        db,
        event_type=body.event_type,
        user_id=user.id if user else None,
        payload=payload,
    )
    if body.event_type == "web_vital" and isinstance(payload, dict):
        name = str(payload.get("name") or "")[:32]
        unit = str(payload.get("unit") or "ms").lower()
        try:
            value = float(payload.get("value") or 0)
        except (TypeError, ValueError):
            value = None
        if name and value is not None and math.isfinite(value) and value >= 0:
            route = payload.get("route")
            route_label = str(route)[:200] if route else "unknown"
            if unit == "score":
                frontend_web_vital_score.labels(
                    app="miniapp", name=name, route=route_label
                ).observe(value)
            else:
                frontend_web_vital_ms.labels(app="miniapp", name=name, route=route_label).observe(
                    value
                )
    await db.commit()
    return {"ok": True}


@router.get("/usage", response_model=WebAppUsageResponse)
async def webapp_usage(
    request: Request,
    range: str = "7d",
    db: AsyncSession = Depends(get_db),
):
    """Return simple usage summary for the current user (bytes over time, sessions).

    Uses per-device telemetry from Redis; currently returns a single aggregate point for the
    requested range.
    """
    tg_id = _get_tg_id_from_bearer(request)
    if not tg_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"code": "UNAUTHORIZED", "message": "Invalid session"},
        )
    if range not in ("7d", "30d"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"code": "BAD_RANGE", "message": "range must be '7d' or '30d'"},
        )
    # Resolve current user id for this Telegram id.
    user_result = await db.execute(select(User.id).where(User.tg_id == tg_id))
    user_id = user_result.scalar_one_or_none()
    if not user_id:
        return WebAppUsageResponse(points=[], sessions=0, peak_hours=[])

    # Load non-revoked devices for the user.
    devices_result = await db.execute(
        select(Device.id).where(Device.user_id == user_id, Device.revoked_at.is_(None))
    )
    device_rows = devices_result.all()
    device_ids = [str(row[0]) for row in device_rows]
    if not device_ids:
        return WebAppUsageResponse(points=[], sessions=0, peak_hours=[])

    telemetry_map = await get_device_telemetry_bulk(device_ids)
    if not telemetry_map:
        return WebAppUsageResponse(points=[], sessions=0, peak_hours=[])

    total_rx = 0
    total_tx = 0
    sessions = 0

    for telemetry in telemetry_map.values():
        rx = telemetry.transfer_rx_bytes or 0
        tx = telemetry.transfer_tx_bytes or 0
        total_rx += rx
        total_tx += tx

        age = telemetry.handshake_age_sec
        if age is not None and 0 <= age <= 120:
            sessions += 1

    now = datetime.now(timezone.utc)
    point = WebAppUsagePoint(ts=now, bytes_in=total_rx, bytes_out=total_tx)
    return WebAppUsageResponse(points=[point], sessions=sessions, peak_hours=[])


def _extract_plan_style(name: str) -> tuple[str, str]:
    """Derive style + clean display name from stored plan name.

    Convention (case-insensitive prefix):
    - "[promo]" -> "promotional"
    - "[popular]" -> "popular"
    - "[normal]" or no prefix -> "normal"
    """
    raw = (name or "").strip()
    lowered = raw.lower()
    prefixes: list[tuple[str, str]] = [
        ("[promo]", "promotional"),
        ("[popular]", "popular"),
        ("[normal]", "normal"),
    ]
    for token, style in prefixes:
        if lowered.startswith(token):
            clean = raw[len(token) :].lstrip()
            return style, clean or raw
    return "normal", raw


@router.get("/plans")
async def webapp_list_plans(request: Request, db: AsyncSession = Depends(get_db)):
    """List active plans for Mini App. Bearer session token required."""
    tg_id = _get_tg_id_from_bearer(request)
    if not tg_id:
        raise HTTPException(
            status_code=401, detail={"code": "UNAUTHORIZED", "message": "Invalid session"}
        )
    trial_plan_id = (getattr(settings, "trial_plan_id", "") or "").strip()
    stmt = select(Plan)
    if trial_plan_id:
        stmt = stmt.where(Plan.id != trial_plan_id)
    stmt = stmt.order_by(Plan.price_amount.asc(), Plan.duration_days.asc(), Plan.id.asc())
    result = await db.execute(stmt)
    plans = result.scalars().all()
    user_result = await db.execute(select(User.id).where(User.tg_id == tg_id))
    user = user_result.scalar_one_or_none()
    if user:
        await log_funnel_event(
            db,
            event_type="pricing_view",
            user_id=user,
            payload={"source": "webapp"},
        )
        miniapp_events_total.labels(event="pricing_view").inc()
    items = []
    for p in plans:
        style, clean_name = _extract_plan_style(p.name)
        items.append(
            {
                "id": p.id,
                "name": clean_name or p.id,
                "duration_days": p.duration_days,
                "price_currency": p.price_currency,
                "price_amount": float(p.price_amount),
                "style": style,
            }
        )
    return {
        "items": items,
        "total": len(items),
    }


class WebAppIssueDeviceResponse(BaseModel):
    device_id: str
    config: str | None
    config_awg: str | None = None
    config_wg_obf: str | None = None
    config_wg: str | None = None
    issued_at: datetime
    node_mode: str  # "mock" | "real"; when mock, peer not created on node
    peer_created: bool  # True when peer was created on VPN node


def _select_delivery_config_text(out: object) -> str:
    """Pick first available config variant for chat delivery."""
    for raw in (
        getattr(out, "config_awg", None),
        getattr(out, "config_wg_obf", None),
        getattr(out, "config_wg", None),
        # Legacy compatibility for alternate issue result shapes.
        getattr(out, "config", None),
    ):
        if isinstance(raw, str) and raw.strip():
            return raw
    return ""


async def _send_webapp_config_to_telegram(
    tg_id: int,
    device_id: str,
    config_text: str,
) -> None:
    """Best-effort: send config text and .conf file to Telegram chat."""
    token = (getattr(settings, "telegram_bot_token", None) or "").strip()
    if not token or not config_text:
        return
    base_url = f"https://api.telegram.org/bot{token}"
    log = logging.getLogger(__name__)
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            # Short info message (no full config text) to avoid size limits.
            try:
                r_msg = await client.post(
                    f"{base_url}/sendMessage",
                    json={
                        "chat_id": tg_id,
                        "text": "Your VPN config file is attached below. Keep it safe and do not share it.",
                    },
                )
                if r_msg.status_code != 200:
                    log.warning(
                        "webapp_config_send_message_http_failed",
                        extra={
                            "status_code": r_msg.status_code,
                            "body": redact_for_log(r_msg.text[:200]),
                        },
                    )
            except Exception:
                log.warning("webapp_config_send_message_failed", exc_info=True)
            filename = f"vpn-config-{(device_id or '')[:8] or 'device'}.conf"
            try:
                r_doc = await client.post(
                    f"{base_url}/sendDocument",
                    data={"chat_id": str(tg_id)},
                    files={
                        "document": (
                            filename,
                            config_text.encode("utf-8"),
                            "text/plain; charset=utf-8",
                        ),
                    },
                )
                if r_doc.status_code != 200:
                    log.warning(
                        "webapp_config_send_document_http_failed",
                        extra={
                            "status_code": r_doc.status_code,
                            "body": redact_for_log(r_doc.text[:200]),
                        },
                    )
            except Exception:
                log.warning("webapp_config_send_document_failed", exc_info=True)
    except Exception:
        log.warning("webapp_config_send_telegram_failed", exc_info=True)


@router.post("/debug/test-telegram-config")
async def webapp_test_telegram_config(request: Request):
    """Debug helper: send test config message + file to Telegram for current WebApp user."""
    tg_id = _get_tg_id_from_bearer(request)
    if not tg_id:
        raise HTTPException(
            status_code=401,
            detail={"code": "UNAUTHORIZED", "message": "Invalid session"},
        )
    token = (getattr(settings, "telegram_bot_token", None) or "").strip()
    if not token:
        raise HTTPException(
            status_code=503,
            detail={"code": "WEBAPP_AUTH_DISABLED", "message": "WebApp auth not configured"},
        )
    base_url = f"https://api.telegram.org/bot{token}"
    test_config = "[Interface]\nPrivateKey = TEST\nAddress = 10.0.0.2/32\n"
    async with httpx.AsyncClient(timeout=10.0) as client:
        r_msg = await client.post(
            f"{base_url}/sendMessage",
            json={
                "chat_id": tg_id,
                "text": "Miniapp debug: test VPN config message. File should follow.",
            },
        )
        r_doc = await client.post(
            f"{base_url}/sendDocument",
            data={"chat_id": str(tg_id)},
            files={
                "document": (
                    "vpn-config-test.conf",
                    test_config.encode("utf-8"),
                    "text/plain; charset=utf-8",
                ),
            },
        )
    return {
        "message_status": r_msg.status_code,
        "message_body": redact_for_log(r_msg.text[:200]),
        "document_status": r_doc.status_code,
        "document_body": redact_for_log(r_doc.text[:200]),
    }


@router.post("/devices/issue", response_model=WebAppIssueDeviceResponse)
async def webapp_issue_device(
    request: Request,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
):
    """Issue a new device for the current user. Bearer session required. Returns one-time config."""
    tg_id = _get_tg_id_from_bearer(request)
    if not tg_id:
        raise HTTPException(
            status_code=401, detail={"code": "UNAUTHORIZED", "message": "Invalid session"}
        )
    user = await _get_or_create_webapp_user(db, tg_id)
    if not user:
        raise HTTPException(
            status_code=404, detail={"code": "USER_NOT_FOUND", "message": "User not found"}
        )
    if settings.issue_rate_limit_per_minute > 0:
        try:
            r = get_redis()
            key = f"{REDIS_KEY_RATELIMIT_ISSUE_PREFIX}{user.id}"
            n = await r.incr(key)
            if n == 1:
                await r.expire(key, settings.issue_rate_window_seconds)
            if n > settings.issue_rate_limit_per_minute:
                raise HTTPException(
                    status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                    detail={
                        "code": "RATE_LIMIT_EXCEEDED",
                        "message": "Too many device issue requests. Try again later.",
                    },
                )
        except HTTPException:
            raise
        except Exception:
            # Fail-open if Redis unavailable; log at debug level in callers.
            pass
    now = datetime.now(timezone.utc)
    sub_result = await db.execute(
        select(Subscription)
        .where(
            Subscription.user_id == user.id,
            Subscription.status == "active",
            Subscription.valid_until > now,
        )
        .limit(1)
    )
    sub = sub_result.scalar_one_or_none()
    if not sub:
        raise HTTPException(
            status_code=400,
            detail={"code": "NO_ACTIVE_SUBSCRIPTION", "message": "No active subscription"},
        )
    adapter = getattr(request.app.state, "node_runtime_adapter", None)
    if adapter is None:
        raise HTTPException(
            status_code=503,
            detail={
                "code": "NODE_RUNTIME_UNAVAILABLE",
                "message": "Device issuance is temporarily unavailable. Try again later.",
            },
        )
    from app.services.topology_engine import TopologyEngine

    engine = TopologyEngine(adapter)
    get_topology = engine.get_topology
    preferred_server_id: str | None = None
    meta = user.meta or {}
    if not meta.get("server_auto_select", True):
        raw_server_id = str(meta.get("preferred_server_id") or "").strip()
        if raw_server_id:
            preferred_server_id = raw_server_id
    try:
        out = await issue_device(
            db,
            user_id=user.id,
            subscription_id=sub.id,
            server_id=preferred_server_id,
            device_name=f"webapp_{tg_id}",
            get_topology=get_topology,
            runtime_adapter=adapter,
        )
    except Exception as e:
        from app.core.exceptions import LoadBalancerError, WireGuardCommandError
        from app.services.server_live_key_service import ServerNotSyncedError

        if isinstance(e, ServerNotSyncedError):
            raise HTTPException(
                status_code=409,
                detail={
                    "code": "SERVER_NOT_SYNCED",
                    "message": "Server key not verified; run sync or fix discovery.",
                    "details": {
                        "server_id": getattr(e, "server_id", ""),
                        "reason": getattr(e, "reason", ""),
                    },
                },
            ) from e
        if isinstance(e, LoadBalancerError):
            raise HTTPException(status_code=503, detail={"code": "NO_NODE", "message": str(e)})
        if isinstance(e, WireGuardCommandError):
            raise HTTPException(
                status_code=502, detail={"code": "NODE_PEER_FAILED", "message": str(e)}
            )
        if isinstance(e, ConfigValidationError):
            msg = (
                "; ".join(getattr(e, "errors", [str(e)])) if getattr(e, "errors", None) else str(e)
            )
            raise HTTPException(
                status_code=400,
                detail={"code": "CONFIG_VALIDATION_FAILED", "message": msg[:500]},
            ) from e
        if isinstance(e, ValueError):
            raise HTTPException(
                status_code=400,
                detail={"code": "ISSUE_FAILED", "message": str(e).replace("_", " ")},
            ) from e
        logging.getLogger(__name__).exception("webapp_issue_device unhandled error")
        raise HTTPException(
            status_code=500,
            detail={
                "code": "INTERNAL_ERROR",
                "message": "Could not add device. Please try again or contact support.",
            },
        ) from e
    try:
        await persist_issued_configs(
            db,
            device_id=out.device.id,
            server_id=out.device.server_id,
            config_awg=out.config_awg,
            config_wg_obf=out.config_wg_obf,
            config_wg=out.config_wg,
        )
        await db.commit()
        await invalidate_devices_summary_cache()
        await invalidate_devices_list_cache()
        await db.refresh(out.device)
    except Exception as commit_err:
        await db.rollback()
        logging.getLogger(__name__).exception("webapp_issue_device commit/invalidate failed")
        raise HTTPException(
            status_code=500,
            detail={
                "code": "INTERNAL_ERROR",
                "message": "Could not add device. Please try again or contact support.",
            },
        ) from commit_err
    config_text = _select_delivery_config_text(out)
    if config_text:
        try:
            background_tasks.add_task(
                _send_webapp_config_to_telegram,
                tg_id=tg_id,
                device_id=out.device.id,
                config_text=config_text,
            )
        except Exception:
            logging.getLogger(__name__).warning(
                "webapp_issue_device_schedule_telegram_failed",
                exc_info=True,
            )
    return WebAppIssueDeviceResponse(
        device_id=out.device.id,
        config=out.config_awg,
        config_awg=out.config_awg,
        config_wg_obf=out.config_wg_obf,
        config_wg=out.config_wg,
        node_mode=settings.node_mode,
        peer_created=out.peer_created,
        issued_at=out.device.issued_at,
    )


@router.post("/devices/{device_id}/revoke")
async def webapp_revoke_device(
    device_id: str, request: Request, db: AsyncSession = Depends(get_db)
):
    """Revoke own device. Bearer session token required."""
    tg_id = _get_tg_id_from_bearer(request)
    if not tg_id:
        raise HTTPException(
            status_code=401, detail={"code": "UNAUTHORIZED", "message": "Invalid session"}
        )
    user_result = await db.execute(select(User).where(User.tg_id == tg_id))
    user = user_result.scalar_one_or_none()
    if not user:
        raise HTTPException(
            status_code=404, detail={"code": "USER_NOT_FOUND", "message": "User not found"}
        )
    device_result = await db.execute(
        select(Device).where(Device.id == device_id, Device.user_id == user.id)
    )
    device = device_result.scalar_one_or_none()
    if not device:
        raise HTTPException(
            status_code=404, detail={"code": "DEVICE_NOT_FOUND", "message": "Device not found"}
        )
    if device.revoked_at:
        raise HTTPException(
            status_code=400, detail={"code": "ALREADY_REVOKED", "message": "Already revoked"}
        )
    device.revoked_at = datetime.now(timezone.utc)
    await db.commit()
    return {"status": "ok"}


@router.get("/referral/my-link")
async def webapp_referral_my_link(request: Request, db: AsyncSession = Depends(get_db)):
    tg_id = _get_tg_id_from_bearer(request)
    if not tg_id:
        raise HTTPException(
            status_code=401, detail={"code": "UNAUTHORIZED", "message": "Invalid session"}
        )
    user_result = await db.execute(select(User).where(User.tg_id == tg_id))
    user = user_result.scalar_one_or_none()
    if not user:
        raise HTTPException(
            status_code=404, detail={"code": "USER_NOT_FOUND", "message": "User not found"}
        )
    code = str(user.id)
    return {"referral_code": code, "payload": f"ref_{code}"}


@router.get("/referral/stats")
async def webapp_referral_stats(request: Request, db: AsyncSession = Depends(get_db)):
    tg_id = _get_tg_id_from_bearer(request)
    if not tg_id:
        raise HTTPException(
            status_code=401, detail={"code": "UNAUTHORIZED", "message": "Invalid session"}
        )
    user_result = await db.execute(select(User).where(User.tg_id == tg_id))
    user = user_result.scalar_one_or_none()
    if not user:
        raise HTTPException(
            status_code=404, detail={"code": "USER_NOT_FOUND", "message": "User not found"}
        )
    count_result = await db.execute(
        select(func.count()).select_from(Referral).where(Referral.referrer_user_id == user.id)
    )
    total = count_result.scalar() or 0
    rewarded_result = await db.execute(
        select(
            func.count(),
            func.coalesce(func.sum(Referral.reward_days), 0),
        ).where(
            Referral.referrer_user_id == user.id,
            Referral.reward_applied_at.isnot(None),
        )
    )
    rewarded_row = rewarded_result.first()
    rewarded = rewarded_row[0] if rewarded_row is not None else 0
    earned_days = int(rewarded_row[1]) if rewarded_row is not None else 0
    pending_result = await db.execute(
        select(func.count())
        .select_from(Referral)
        .where(
            Referral.referrer_user_id == user.id,
            Referral.reward_applied_at.is_(None),
        )
    )
    pending = pending_result.scalar() or 0
    goal = 2
    completed_cycles = total // goal
    progress_in_cycle = total - completed_cycles * goal
    remaining_to_next = goal - progress_in_cycle if progress_in_cycle > 0 else goal
    return {
        "total_referrals": total,
        "rewards_applied": rewarded,
        "earned_days": earned_days,
        "active_referrals": rewarded,
        "pending_rewards": pending,
        "invite_goal": goal,
        "invite_progress": progress_in_cycle,
        "invite_remaining": remaining_to_next,
    }


class PromoValidateBody(BaseModel):
    code: str
    plan_id: str


@router.post("/promo/validate")
async def webapp_promo_validate(
    body: PromoValidateBody, request: Request, db: AsyncSession = Depends(get_db)
):
    tg_id = _get_tg_id_from_bearer(request)
    if not tg_id:
        raise HTTPException(
            status_code=401, detail={"code": "UNAUTHORIZED", "message": "Invalid session"}
        )
    promo_result = await db.execute(
        select(PromoCode).where(PromoCode.code == body.code.strip(), PromoCode.status == "active")
    )
    promo = promo_result.scalar_one_or_none()
    if not promo:
        raise HTTPException(
            status_code=404,
            detail={"code": "PROMO_NOT_FOUND", "message": "Invalid or expired code"},
        )
    user_result = await db.execute(select(User).where(User.tg_id == tg_id))
    user = user_result.scalar_one_or_none()
    if not user:
        raise HTTPException(
            status_code=404, detail={"code": "USER_NOT_FOUND", "message": "User not found"}
        )
    constraints = promo.constraints or {}
    if constraints.get("expires_at"):
        try:
            exp = datetime.fromisoformat(str(constraints["expires_at"]).replace("Z", "+00:00"))
            if exp < datetime.now(timezone.utc):
                raise HTTPException(
                    status_code=400, detail={"code": "PROMO_EXPIRED", "message": "Code expired"}
                )
        except (TypeError, ValueError):
            pass
    per_user = constraints.get("per_user_limit", 1)
    red_result = await db.execute(
        select(PromoRedemption).where(
            PromoRedemption.promo_code_id == promo.id, PromoRedemption.user_id == user.id
        )
    )
    if red_result.scalar_one_or_none() and per_user <= 1:
        raise HTTPException(
            status_code=400, detail={"code": "PROMO_ALREADY_USED", "message": "Code already used"}
        )
    return {
        "valid": True,
        "type": promo.type,
        "value": str(promo.value),
        "description": f"{promo.type}: {promo.value}",
    }


class CreateInvoiceWebAppBody(BaseModel):
    plan_id: str
    promo_code: str | None = None


class WebAppPaymentStatusOut(BaseModel):
    payment_id: str
    status: str
    plan_id: str | None = None
    valid_until: datetime | None = None


class WebAppBillingHistoryItem(BaseModel):
    payment_id: str
    plan_id: str | None = None
    plan_name: str
    amount: float
    currency: str
    status: str
    created_at: datetime
    invoice_ref: str


class WebAppBillingHistoryResponse(BaseModel):
    items: list[WebAppBillingHistoryItem]
    total: int


def _webapp_history_status(payment_status: str, has_refund_event: bool) -> str:
    if has_refund_event:
        return "refunded"
    normalized = (payment_status or "").lower()
    if normalized == "completed":
        return "paid"
    if normalized == "failed":
        return "failed"
    return "pending"


async def _create_telegram_invoice_link(
    title: str,
    description: str,
    payload: str,
    star_count: int,
) -> str:
    """Call Telegram Bot API createInvoiceLink. Returns invoice URL or empty string if token missing/fail."""
    token = (getattr(settings, "telegram_bot_token", None) or "").strip()
    if not token:
        return ""
    url = f"https://api.telegram.org/bot{token}/createInvoiceLink"
    body = {
        "title": title[:32],
        "description": description[:255],
        "payload": payload[:128],
        "provider_token": "",
        "currency": "XTR",
        "prices": [{"label": title[:32] or "VPN", "amount": max(1, star_count)}],
    }
    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            r = await client.post(url, json=body)
            if r.status_code != 200:
                return ""
            data = r.json()
            if isinstance(data.get("result"), str):
                return data["result"]
            return ""
    except Exception:
        return ""


@router.post("/payments/create-invoice")
async def webapp_create_invoice(
    request: Request,
    body: CreateInvoiceWebAppBody,
    db: AsyncSession = Depends(get_db),
):
    """Create pending/active subscription payment invoice for Telegram Stars. Bearer required."""
    tg_id = _get_tg_id_from_bearer(request)
    if not tg_id:
        raise HTTPException(
            status_code=401, detail={"code": "UNAUTHORIZED", "message": "Invalid session"}
        )
    user = await _get_or_create_webapp_user(db, tg_id)
    if not user:
        raise HTTPException(
            status_code=404, detail={"code": "USER_NOT_FOUND", "message": "User not found"}
        )
    plan_result = await db.execute(select(Plan).where(Plan.id == body.plan_id))
    plan = plan_result.scalar_one_or_none()
    if not plan:
        raise HTTPException(
            status_code=404, detail={"code": "PLAN_NOT_FOUND", "message": "Plan not found"}
        )
    # Serialize per-user subscription selection/creation to avoid duplicates under fast retries.
    await db.execute(select(User.id).where(User.id == user.id).with_for_update())
    now = datetime.now(timezone.utc)
    sub_result = await db.execute(
        select(Subscription)
        .where(
            Subscription.user_id == user.id,
            Subscription.plan_id == plan.id,
            Subscription.status == "active",
            Subscription.valid_until > now,
        )
        .limit(1)
    )
    sub = sub_result.scalar_one_or_none()
    if not sub:
        pending_result = await db.execute(
            select(Subscription)
            .where(
                Subscription.user_id == user.id,
                Subscription.plan_id == plan.id,
                Subscription.status == "pending",
            )
            .order_by(Subscription.created_at.desc())
            .limit(1)
        )
        sub = pending_result.scalar_one_or_none()
    if not sub:
        sub = Subscription(
            user_id=user.id,
            plan_id=plan.id,
            valid_from=now,
            # Pending subscription has no paid window until completed payment webhook.
            valid_until=now,
            device_limit=1,
            status="pending",
        )
        db.add(sub)
        await db.flush()
    is_free = float(plan.price_amount or 0) <= 0
    server_result = await db.execute(select(Server).where(Server.is_active.is_(True)).limit(1))
    server = server_result.scalar_one_or_none()
    if not server and not is_free:
        raise HTTPException(
            status_code=503,
            detail={"code": "SERVER_NOT_AVAILABLE", "message": "No server available"},
        )
    external_id = (
        f"webapp:telegram_stars:{user.id}:{sub.id}:{getattr(request.state, 'request_id', 'none')}"
    )
    payment = Payment(
        user_id=user.id,
        subscription_id=sub.id,
        provider="telegram_stars",
        status="completed" if is_free else "pending",
        amount=plan.price_amount,
        currency=plan.price_currency,
        external_id=external_id,
        webhook_payload={"promo_code": body.promo_code} if body.promo_code else None,
    )
    db.add(payment)
    await db.flush()
    if is_free and sub.status != "active":
        sub.status = "active"
        sub.valid_from = now
        sub.valid_until = now + timedelta(days=plan.duration_days or 365)
    await log_funnel_event(
        db,
        event_type="plan_selected",
        user_id=user.id,
        payload={"plan_id": plan.id},
    )
    miniapp_events_total.labels(event="plan_selected").inc()
    await db.commit()
    await db.refresh(payment)
    await db.refresh(sub)
    star_count = 0 if is_free else max(1, int(plan.price_amount))
    title = plan.name or "VPN"
    description = f"VPN plan, {plan.duration_days} days"
    invoice_link = ""
    if not is_free:
        invoice_link = await _create_telegram_invoice_link(
            title=title,
            description=description,
            payload=payment.id,
            star_count=star_count,
        )
    return {
        "invoice_id": payment.id,
        "payment_id": payment.id,
        "title": title,
        "description": description,
        "currency": "XTR",
        "star_count": star_count,
        "payload": payment.id,
        "server_id": server.id if server else "",
        "subscription_id": sub.id,
        "invoice_link": invoice_link,
        "free_activation": is_free,
    }


@router.get("/payments/history", response_model=WebAppBillingHistoryResponse)
async def webapp_payments_history(
    request: Request,
    db: AsyncSession = Depends(get_db),
    limit: int = Query(5, ge=1, le=50),
    offset: int = Query(0, ge=0),
):
    """Return payment history for current user. Bearer session token required."""
    tg_id = _get_tg_id_from_bearer(request)
    if not tg_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"code": "UNAUTHORIZED", "message": "Invalid session"},
        )
    user_result = await db.execute(select(User.id).where(User.tg_id == tg_id))
    user_id = user_result.scalar_one_or_none()
    if not user_id:
        return WebAppBillingHistoryResponse(items=[], total=0)

    total_result = await db.execute(
        select(func.count()).select_from(Payment).where(Payment.user_id == user_id)
    )
    total = int(total_result.scalar_one() or 0)

    rows_result = await db.execute(
        select(Payment, Subscription, Plan)
        .join(Subscription, Payment.subscription_id == Subscription.id, isouter=True)
        .join(Plan, Subscription.plan_id == Plan.id, isouter=True)
        .where(Payment.user_id == user_id)
        .order_by(Payment.created_at.desc(), Payment.id.desc())
        .limit(limit)
        .offset(offset)
    )
    rows = rows_result.all()
    payment_ids = [payment.id for payment, _subscription, _plan in rows]

    refunded_payment_ids: set[str] = set()
    if payment_ids:
        events_result = await db.execute(
            select(PaymentEvent.payment_id, PaymentEvent.event_type).where(
                PaymentEvent.payment_id.in_(payment_ids)
            )
        )
        for payment_id, event_type in events_result.all():
            if "refund" in str(event_type or "").lower():
                refunded_payment_ids.add(str(payment_id))

    items: list[WebAppBillingHistoryItem] = []
    for payment, subscription, plan in rows:
        fallback_plan_name = (
            plan.name
            if plan and plan.name
            else subscription.plan_id
            if subscription and subscription.plan_id
            else "Unknown plan"
        )
        _style, clean_plan_name = _extract_plan_style(fallback_plan_name)
        invoice_ref = payment.external_id or payment.id
        history_status = _webapp_history_status(
            payment_status=payment.status,
            has_refund_event=payment.id in refunded_payment_ids,
        )
        items.append(
            WebAppBillingHistoryItem(
                payment_id=payment.id,
                plan_id=subscription.plan_id if subscription else None,
                plan_name=clean_plan_name or fallback_plan_name,
                amount=float(payment.amount or 0),
                currency=payment.currency,
                status=history_status,
                created_at=payment.created_at,
                invoice_ref=invoice_ref,
            )
        )

    return WebAppBillingHistoryResponse(items=items, total=total)


@router.get("/payments/{payment_id}/status", response_model=WebAppPaymentStatusOut)
async def webapp_payment_status(
    payment_id: str,
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    """Return payment status for a given payment owned by the current user."""
    tg_id = _get_tg_id_from_bearer(request)
    if not tg_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"code": "UNAUTHORIZED", "message": "Invalid session"},
        )
    result = await db.execute(
        select(Payment, Subscription, User)
        .join(User, Payment.user_id == User.id)
        .join(Subscription, Payment.subscription_id == Subscription.id, isouter=True)
        .where(Payment.id == payment_id, User.tg_id == tg_id)
    )
    row = result.first()
    if not row:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "PAYMENT_NOT_FOUND", "message": "Payment not found"},
        )
    payment, sub, _user = row
    return WebAppPaymentStatusOut(
        payment_id=payment.id,
        status=payment.status,
        plan_id=sub.plan_id if sub else None,
        valid_until=sub.valid_until if sub and sub.valid_until else None,
    )


class WebAppTrialStartOut(BaseModel):
    subscription_id: str
    device_id: str
    trial_ends_at: str  # ISO datetime


@router.post("/trial/start", response_model=WebAppTrialStartOut)
async def webapp_trial_start(request: Request, db: AsyncSession = Depends(get_db)):
    """Start free trial: one trial per user, creates active sub + one device. Bearer required."""
    tg_id = _get_tg_id_from_bearer(request)
    if not tg_id:
        raise HTTPException(
            status_code=401, detail={"code": "UNAUTHORIZED", "message": "Invalid session"}
        )
    user = await _get_or_create_webapp_user(db, tg_id)
    if not user:
        raise HTTPException(
            status_code=404, detail={"code": "USER_NOT_FOUND", "message": "User not found"}
        )
    adapter = getattr(request.app.state, "node_runtime_adapter", None)
    if adapter is None:
        raise HTTPException(
            status_code=503,
            detail={"code": "UNAVAILABLE", "message": "Trial not available"},
        )
    from app.services.topology_engine import TopologyEngine
    from app.services.trial_service import start_trial

    engine = TopologyEngine(adapter)
    try:
        result = await start_trial(
            db,
            tg_id=int(tg_id),
            get_topology=engine.get_topology,
            runtime_adapter=adapter,
        )
    except ValueError as e:
        code = str(e).replace(" ", "_").lower()[:32]
        if "trial_already_used" in code:
            raise HTTPException(
                status_code=409,
                detail={"code": "TRIAL_ALREADY_USED", "message": "Trial already used"},
            ) from e
        if "trial_plan_not_found" in code:
            raise HTTPException(
                status_code=503,
                detail={"code": "TRIAL_PLAN_NOT_FOUND", "message": "No trial plan configured"},
            ) from e
        raise HTTPException(
            status_code=400, detail={"code": "BAD_REQUEST", "message": str(e).replace("_", " ")}
        ) from e
    await db.commit()
    return WebAppTrialStartOut(
        subscription_id=result.subscription_id,
        device_id=result.device_id,
        trial_ends_at=result.trial_ends_at.isoformat(),
    )


class WebAppServerOut(BaseModel):
    id: str
    name: str
    region: str
    load_percent: float | None = None
    avg_ping_ms: float | None = None
    is_recommended: bool = False
    is_current: bool = False


@router.get("/servers")
async def webapp_servers(request: Request, db: AsyncSession = Depends(get_db)):
    """List active VPN servers for selection in the Mini App."""
    tg_id = _get_tg_id_from_bearer(request)
    if not tg_id:
        raise HTTPException(
            status_code=401, detail={"code": "UNAUTHORIZED", "message": "Invalid session"}
        )
    user_result = await db.execute(select(User).where(User.tg_id == tg_id))
    user = user_result.scalar_one_or_none()
    if not user:
        raise HTTPException(
            status_code=404, detail={"code": "USER_NOT_FOUND", "message": "User not found"}
        )
    meta = user.meta or {}
    preferred_server_id = str(meta.get("preferred_server_id") or "").strip() or None
    auto_select = bool(meta.get("server_auto_select", True))
    servers_result = await db.execute(select(Server).where(Server.is_active.is_(True)))
    servers = list(servers_result.scalars().all())
    if not servers:
        return {"items": [], "total": 0, "auto_select": auto_select}
    counts_result = await db.execute(
        select(Device.server_id, func.count())
        .where(Device.revoked_at.is_(None))
        .group_by(Device.server_id)
    )
    counts: dict[str, int] = {row[0]: int(row[1]) for row in counts_result.all()}
    items: list[WebAppServerOut] = []
    best_id: str | None = None
    best_score: tuple[int, float] | None = None
    for s in servers:
        active_devices = counts.get(s.id, 0)
        load_percent: float | None = None
        if s.max_connections and s.max_connections > 0:
            load_percent = min(100.0, active_devices * 100.0 / float(s.max_connections))
        health = getattr(s, "health_score", None) or 0.0
        score = (active_devices * -1, health)
        if best_score is None or score > best_score:
            best_score = score
            best_id = s.id
        items.append(
            WebAppServerOut(
                id=s.id,
                name=s.name,
                region=s.region,
                load_percent=load_percent,
                avg_ping_ms=None,
                is_recommended=False,
                is_current=preferred_server_id == s.id,
            )
        )
    recommended_id = preferred_server_id or best_id
    for item in items:
        if recommended_id and item.id == recommended_id:
            item.is_recommended = True
    return {
        "items": [item.model_dump() for item in items],
        "total": len(items),
        "auto_select": auto_select,
    }


class WebAppServerSelectBody(BaseModel):
    server_id: str | None = None
    mode: str | None = None  # "auto" | "manual"


@router.post("/servers/select")
async def webapp_select_server(
    body: WebAppServerSelectBody, request: Request, db: AsyncSession = Depends(get_db)
):
    """Set preferred server or enable auto-selection for the current user."""
    tg_id = _get_tg_id_from_bearer(request)
    if not tg_id:
        raise HTTPException(
            status_code=401, detail={"code": "UNAUTHORIZED", "message": "Invalid session"}
        )
    user_result = await db.execute(select(User).where(User.tg_id == tg_id))
    user = user_result.scalar_one_or_none()
    if not user:
        raise HTTPException(
            status_code=404, detail={"code": "USER_NOT_FOUND", "message": "User not found"}
        )
    try:
        r = get_redis()
        key = f"ratelimit:webapp_server_select:{user.id}"
        n = await r.incr(key)
        if n == 1:
            await r.expire(key, _WEBAPP_SERVER_SELECT_WINDOW_SECONDS)
        if n > _WEBAPP_SERVER_SELECT_LIMIT:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail={
                    "code": "RATE_LIMIT_EXCEEDED",
                    "message": "Too many server changes. Try again later.",
                },
            )
    except HTTPException:
        raise
    except Exception:
        # Fail-open on Redis errors; global API rate limit still applies.
        pass
    mode = (body.mode or "").strip().lower()
    meta = user.meta or {}
    if mode == "auto" or not body.server_id:
        meta["server_auto_select"] = True
        meta.pop("preferred_server_id", None)
        user.meta = meta
        await log_funnel_event(
            db,
            event_type="server_change",
            user_id=user.id,
            payload={"mode": "auto"},
        )
        await db.commit()
        return {"status": "ok", "mode": "auto"}
    server_result = await db.execute(
        select(Server).where(Server.id == body.server_id, Server.is_active.is_(True))
    )
    server = server_result.scalar_one_or_none()
    if not server:
        raise HTTPException(
            status_code=404,
            detail={"code": "SERVER_NOT_FOUND", "message": "Server not found"},
        )
    meta["server_auto_select"] = False
    meta["preferred_server_id"] = server.id
    user.meta = meta
    await log_funnel_event(
        db,
        event_type="server_change",
        user_id=user.id,
        payload={"mode": "manual", "server_id": server.id},
    )
    await db.commit()
    return {"status": "ok", "mode": "manual", "server_id": server.id}


class WebAppSubscriptionOffersOut(BaseModel):
    subscription_id: str | None
    status: str | None
    valid_until: str | None
    discount_percent: int
    can_pause: bool
    can_resume: bool


@router.get("/subscription/offers", response_model=WebAppSubscriptionOffersOut)
async def webapp_subscription_offers(
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    """Return simple retention offers (pause, discount) for the current user."""
    tg_id = _get_tg_id_from_bearer(request)
    if not tg_id:
        raise HTTPException(
            status_code=401, detail={"code": "UNAUTHORIZED", "message": "Invalid session"}
        )
    user_result = await db.execute(select(User).where(User.tg_id == tg_id))
    user = user_result.scalar_one_or_none()
    if not user:
        raise HTTPException(
            status_code=404, detail={"code": "USER_NOT_FOUND", "message": "User not found"}
        )
    now = datetime.now(timezone.utc)
    sub_result = await db.execute(
        select(Subscription)
        .where(
            Subscription.user_id == user.id,
        )
        .order_by(Subscription.valid_until.desc())
        .limit(1)
    )
    sub = sub_result.scalar_one_or_none()
    if not sub:
        return WebAppSubscriptionOffersOut(
            subscription_id=None,
            status=None,
            valid_until=None,
            discount_percent=retention_discount_percent(),
            can_pause=False,
            can_resume=False,
        )
    can_pause = sub.paused_at is None and sub.valid_until > now
    can_resume = sub.paused_at is not None and sub.valid_until > now
    await log_funnel_event(
        db,
        event_type="cancel_click",
        user_id=user.id,
        payload={"subscription_id": sub.id},
    )
    return WebAppSubscriptionOffersOut(
        subscription_id=sub.id,
        status=sub.status,
        valid_until=sub.valid_until.isoformat(),
        discount_percent=retention_discount_percent(),
        can_pause=can_pause,
        can_resume=can_resume,
    )


class WebAppSubscriptionPauseBody(BaseModel):
    subscription_id: str | None = None


@router.post("/subscription/pause")
async def webapp_subscription_pause(
    body: WebAppSubscriptionPauseBody,
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    """Pause current subscription for the user (retention)."""
    tg_id = _get_tg_id_from_bearer(request)
    if not tg_id:
        raise HTTPException(
            status_code=401, detail={"code": "UNAUTHORIZED", "message": "Invalid session"}
        )
    user_result = await db.execute(select(User).where(User.tg_id == tg_id))
    user = user_result.scalar_one_or_none()
    if not user:
        raise HTTPException(
            status_code=404, detail={"code": "USER_NOT_FOUND", "message": "User not found"}
        )
    sub_id = body.subscription_id
    if not sub_id:
        now = datetime.now(timezone.utc)
        sub_result = await db.execute(
            select(Subscription)
            .where(
                Subscription.user_id == user.id,
                Subscription.valid_until > now,
            )
            .order_by(Subscription.valid_until.desc())
            .limit(1)
        )
        sub = sub_result.scalar_one_or_none()
        if not sub:
            raise HTTPException(
                status_code=400,
                detail={"code": "NO_SUBSCRIPTION", "message": "No active subscription"},
            )
        sub_id = sub.id
    ok = await pause_subscription(
        db,
        subscription_id=sub_id,
        user_id=user.id,
        reason="webapp_pause",
    )
    if not ok:
        raise HTTPException(
            status_code=400,
            detail={"code": "PAUSE_FAILED", "message": "Could not pause subscription"},
        )
    await db.commit()
    return {"status": "ok"}


class WebAppSubscriptionResumeBody(BaseModel):
    subscription_id: str | None = None


@router.post("/subscription/resume")
async def webapp_subscription_resume(
    body: WebAppSubscriptionResumeBody,
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    """Resume paused subscription for the user."""
    tg_id = _get_tg_id_from_bearer(request)
    if not tg_id:
        raise HTTPException(
            status_code=401, detail={"code": "UNAUTHORIZED", "message": "Invalid session"}
        )
    user_result = await db.execute(select(User).where(User.tg_id == tg_id))
    user = user_result.scalar_one_or_none()
    if not user:
        raise HTTPException(
            status_code=404, detail={"code": "USER_NOT_FOUND", "message": "User not found"}
        )
    sub_id = body.subscription_id
    if not sub_id:
        sub_result = await db.execute(
            select(Subscription)
            .where(
                Subscription.user_id == user.id,
            )
            .order_by(Subscription.valid_until.desc())
            .limit(1)
        )
        sub = sub_result.scalar_one_or_none()
        if not sub:
            raise HTTPException(
                status_code=400,
                detail={"code": "NO_SUBSCRIPTION", "message": "No subscription"},
            )
        sub_id = sub.id
    ok = await resume_subscription(
        db,
        subscription_id=sub_id,
        user_id=user.id,
    )
    if not ok:
        raise HTTPException(
            status_code=400,
            detail={"code": "RESUME_FAILED", "message": "Could not resume subscription"},
        )
    await db.commit()
    return {"status": "ok"}


class WebAppSubscriptionCancelBody(BaseModel):
    subscription_id: str | None = None
    reason_code: str
    discount_accepted: bool | None = None


@router.post("/subscription/cancel")
async def webapp_subscription_cancel(
    body: WebAppSubscriptionCancelBody,
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    """Cancel subscription with a simple churn survey."""
    tg_id = _get_tg_id_from_bearer(request)
    if not tg_id:
        raise HTTPException(
            status_code=401, detail={"code": "UNAUTHORIZED", "message": "Invalid session"}
        )
    user_result = await db.execute(select(User).where(User.tg_id == tg_id))
    user = user_result.scalar_one_or_none()
    if not user:
        raise HTTPException(
            status_code=404, detail={"code": "USER_NOT_FOUND", "message": "User not found"}
        )
    sub_id = body.subscription_id
    if not sub_id:
        sub_result = await db.execute(
            select(Subscription)
            .where(
                Subscription.user_id == user.id,
            )
            .order_by(Subscription.valid_until.desc())
            .limit(1)
        )
        sub = sub_result.scalar_one_or_none()
        if not sub:
            raise HTTPException(
                status_code=400,
                detail={"code": "NO_SUBSCRIPTION", "message": "No subscription"},
            )
        sub_id = sub.id
    sub_result = await db.execute(
        select(Subscription).where(
            Subscription.id == sub_id,
            Subscription.user_id == user.id,
        )
    )
    sub = sub_result.scalar_one_or_none()
    if not sub:
        raise HTTPException(
            status_code=404,
            detail={"code": "SUBSCRIPTION_NOT_FOUND", "message": "Subscription not found"},
        )
    survey = ChurnSurvey(
        user_id=user.id,
        subscription_id=sub.id,
        reason=body.reason_code[:32],
        discount_offered=bool(body.discount_accepted),
    )
    db.add(survey)
    sub.status = "cancelled"
    await log_funnel_event(
        db,
        event_type="cancel_confirm",
        user_id=user.id,
        payload={"subscription_id": sub.id, "reason": body.reason_code},
    )
    await db.commit()
    return {"status": "ok"}
