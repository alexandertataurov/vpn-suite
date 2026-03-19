"""WebApp: initData validation, session token, me (user + subscription + devices)."""

import logging
import math
import re
from datetime import datetime, timedelta, timezone

import httpx
from fastapi import (
    APIRouter,
    BackgroundTasks,
    Depends,
    HTTPException,
    Query,
    Request,
    Response,
    status,
)
from pydantic import BaseModel, Field, field_validator, model_validator
from sqlalchemy import func, select
from sqlalchemy.dialects.postgresql import insert as pg_insert
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from starlette.responses import JSONResponse

from app.api.v1.device_cache import invalidate_devices_list_cache, invalidate_devices_summary_cache
from app.api.v1.users import _delete_user_cascade
from app.core.amnezia_vpn_key import encode_awg_conf_vpn_key, sanitize_awg_conf
from app.core.config import settings
from app.core.config_builder import ConfigValidationError
from app.core.constants import REDIS_KEY_RATELIMIT_ISSUE_PREFIX, STARS_PER_LEGACY_UNIT
from app.core.database import get_db
from app.core.metrics import (
    frontend_web_vital_ms,
    frontend_web_vital_score,
    miniapp_events_total,
    referral_attach_fail_total,
    referral_attach_total,
    vpn_revenue_referral_signup_total,
)
from app.core.one_time_download import create_one_time_token
from app.core.rate_limit import rate_limit_promo_validate, rate_limit_webapp_me_patch
from app.core.redaction import redact_for_log
from app.core.redis_client import get_redis
from app.core.security import (
    create_webapp_session_token,
    decode_token,
    decrypt_config,
    validate_telegram_init_data,
)
from app.core.telegram_user import build_tg_requisites
from app.models import (
    ChurnSurvey,
    Device,
    IssuedConfig,
    Payment,
    PaymentEvent,
    Plan,
    Referral,
    Server,
    Subscription,
    User,
)
from app.services.device_telemetry_cache import (
    HANDSHAKE_OK_SEC,
    get_device_telemetry_bulk,
    get_telemetry_last_updated,
)
from app.services.funnel_service import log_funnel_event
from app.services.issue_service import issue_device
from app.services.issued_config_service import persist_issued_configs
from app.services.promo_service import PromoCodeError, redeem_promo_code, validate_promo_code
from app.services.retention_service import (
    pause_subscription,
    resume_subscription,
    retention_discount_percent,
)
from app.services.subscription_lifecycle_events import emit_access_blocked
from app.services.subscription_state import (
    access_status as subscription_access_status,
)
from app.services.subscription_state import (
    apply_subscription_cycle,
    entitled_active_where,
    is_commercially_active,
    is_restorable,
    mark_cancel_at_period_end,
    mark_cancelled,
    normalize_pending_state,
    sort_subscriptions,
)
from app.services.subscription_state import (
    commercial_status as subscription_commercial_status,
)

router = APIRouter(prefix="/webapp", tags=["webapp"])

_WEBAPP_SERVER_SELECT_LIMIT = 20
_WEBAPP_SERVER_SELECT_WINDOW_SECONDS = 60
_WEBAPP_ONBOARDING_VERSION = 2
_WEBAPP_ONBOARDING_MAX_STEP = 3
_WEBAPP_LIVE_TELEMETRY_STALE_SEC = 180


def _looks_like_ip(host: str) -> bool:
    """True if host looks like an IPv4 or IPv6 address, not a hostname."""
    if not host or not host.strip():
        return False
    s = host.strip()
    # IPv4: digits and dots only, 4 parts
    if "." in s and ":" not in s:
        parts = s.split(".")
        if len(parts) == 4 and all(p.isdigit() and 0 <= int(p) <= 255 for p in parts):
            return True
    # IPv6: contains colons
    if ":" in s:
        return True
    return False


def _server_public_ip(server: Server | None) -> str | None:
    """Return server's public/exit IP for display. Returns None if endpoint host is a hostname (not an IP)."""
    if server is None or not getattr(server, "api_endpoint", None):
        return None
    host = (server.api_endpoint or "").split("//")[-1].split("/")[0].split(":")[0] or None
    if not host or not _looks_like_ip(host):
        return None
    return host


def _is_telemetry_fresh(
    telemetry_last_updated: datetime | None,
    *,
    now: datetime,
) -> bool:
    if telemetry_last_updated is None:
        return False
    return (now - telemetry_last_updated).total_seconds() <= _WEBAPP_LIVE_TELEMETRY_STALE_SEC


def _effective_handshake_for_live(
    device: Device,
    *,
    telemetry_map: dict[str, object],
) -> tuple[datetime | None, int | None]:
    telemetry = telemetry_map.get(device.id) if isinstance(device.id, str) else telemetry_map.get(str(device.id))
    if telemetry and getattr(telemetry, "handshake_latest_at", None) is not None:
        return telemetry.handshake_latest_at, getattr(telemetry, "handshake_age_sec", None)
    if device.last_seen_handshake_at is not None:
        return device.last_seen_handshake_at, None
    return None, None


def _build_live_connection(
    *,
    active_devices: list[Device],
    telemetry_map: dict[str, object],
    telemetry_last_updated: datetime | None,
    now: datetime,
) -> dict:
    telemetry_fresh = _is_telemetry_fresh(telemetry_last_updated, now=now)
    base = {
        "status": "unknown",
        "source": "server_handshake",
        "device_id": None,
        "device_name": None,
        "last_handshake_at": None,
        "handshake_age_sec": None,
        "telemetry_updated_at": telemetry_last_updated.isoformat() if telemetry_last_updated else None,
    }
    if not active_devices:
        return base

    ranked_devices = sorted(
        active_devices,
        key=lambda device: (
            _effective_handshake_for_live(device, telemetry_map=telemetry_map)[0] or device.issued_at,
            device.issued_at,
        ),
        reverse=True,
    )
    latest_device = ranked_devices[0]
    latest_handshake_at, latest_handshake_age = _effective_handshake_for_live(
        latest_device,
        telemetry_map=telemetry_map,
    )

    for device in ranked_devices:
        handshake_at, handshake_age = _effective_handshake_for_live(device, telemetry_map=telemetry_map)
        if not telemetry_fresh or handshake_at is None:
            continue
        resolved_age = handshake_age
        if resolved_age is None:
            resolved_age = max(0, int((now - handshake_at).total_seconds()))
        if resolved_age <= HANDSHAKE_OK_SEC:
            return {
                **base,
                "status": "connected",
                "device_id": device.id,
                "device_name": device.device_name,
                "last_handshake_at": handshake_at.isoformat(),
                "handshake_age_sec": resolved_age,
            }

    if telemetry_fresh:
        resolved_age = latest_handshake_age
        if resolved_age is None and latest_handshake_at is not None:
            resolved_age = max(0, int((now - latest_handshake_at).total_seconds()))
        return {
            **base,
            "status": "disconnected",
            "device_id": latest_device.id,
            "device_name": latest_device.device_name,
            "last_handshake_at": latest_handshake_at.isoformat() if latest_handshake_at else None,
            "handshake_age_sec": resolved_age,
        }

    return {
        **base,
        "device_id": latest_device.id,
        "device_name": latest_device.device_name,
        "last_handshake_at": latest_handshake_at.isoformat() if latest_handshake_at else None,
        "handshake_age_sec": latest_handshake_age,
    }


async def _build_latest_device_delivery(
    db: AsyncSession,
    *,
    active_devices: list[Device],
) -> dict | None:
    if not active_devices:
        return None
    ranked_devices = sorted(
        active_devices,
        key=lambda device: (
            device.last_seen_handshake_at or device.issued_at,
            device.issued_at,
        ),
        reverse=True,
    )
    latest_device = ranked_devices[0]
    cfg_result = await db.execute(
        select(IssuedConfig)
        .where(
            IssuedConfig.device_id == latest_device.id,
            IssuedConfig.profile_type == "awg",
        )
        .order_by(IssuedConfig.created_at.desc())
        .limit(1)
    )
    issued = cfg_result.scalar_one_or_none()
    if not issued or not issued.config_encrypted:
        return None
    try:
        config_text = sanitize_awg_conf(decrypt_config(issued.config_encrypted))
        amnezia_vpn_key = encode_awg_conf_vpn_key(config_text)
    except Exception:
        logging.getLogger(__name__).warning(
            "webapp_latest_device_delivery_encode_failed",
            extra={"device_id": latest_device.id},
            exc_info=True,
        )
        return None

    download_url = None
    public_host = getattr(settings, "public_domain", None) or getattr(settings, "vpn_default_host", "")
    if public_host:
        ttl = getattr(settings, "awg_download_token_ttl_seconds", 600) or 600
        try:
            token = await create_one_time_token(
                db,
                device_id=latest_device.id,
                kind="awg_conf",
                ttl_seconds=ttl,
            )
            download_url = f"https://{public_host}/d/{token}"
        except Exception:
            logging.getLogger(__name__).warning(
                "webapp_latest_device_delivery_download_url_failed",
                extra={"device_id": latest_device.id},
                exc_info=True,
            )

    return {
        "device_id": latest_device.id,
        "device_name": latest_device.device_name,
        "issued_at": latest_device.issued_at.isoformat(),
        "download_url": download_url,
        "amnezia_vpn_key": amnezia_vpn_key,
    }


def _resolve_route(
    user: User,
    subscriptions: list,
    active_devices: list,
) -> tuple[str, str]:
    """Return (recommended_route, reason) per spec §7.2."""
    now = datetime.now(timezone.utc)
    primary_sub = next(
        (
            s
            for s in subscriptions
            if (
                subscription_commercial_status(s) in ("active", "pending")
                and (getattr(s, "valid_until", None) and s.valid_until > now or is_restorable(s, now=now))
            )
        ),
        None,
    )
    if not primary_sub:
        # Check for grace/expired
        grace_sub = next((s for s in subscriptions if is_restorable(s, now=now)), None)
        if grace_sub:
            return "/restore-access", "expired_with_grace"
        # No active subscription
        return "/plan", "no_subscription"

    access_status = subscription_access_status(primary_sub)
    cancel_at_end = bool(getattr(primary_sub, "cancel_at_period_end", False))

    grace_until = getattr(primary_sub, "grace_until", None)
    if access_status == "grace" and grace_until and grace_until > now:
        return "/restore-access", "grace"
    if access_status == "paused":
        return "/settings", "paused_access"
    if cancel_at_end and primary_sub.valid_until > now:
        return "/account/subscription", "cancelled_at_period_end"

    has_device = len(active_devices) > 0
    has_confirmed = user.last_connection_confirmed_at is not None or any(
        getattr(d, "last_connection_confirmed_at", None) is not None for d in active_devices
    )

    if not has_device:
        return "/devices/issue", "no_device"
    if not has_confirmed:
        return "/connect-status", "connection_not_confirmed"
    return "/", "connected_user"


def _webapp_issue_requires_runtime_adapter() -> bool:
    return settings.node_mode == "real" and settings.node_discovery != "agent"


async def _select_webapp_issue_server_id(
    db: AsyncSession,
    *,
    preferred_server_id: str | None = None,
) -> str | None:
    if preferred_server_id:
        preferred_result = await db.execute(
            select(Server.id).where(
                Server.id == preferred_server_id,
                Server.is_active.is_(True),
            )
        )
        preferred_id = preferred_result.scalar_one_or_none()
        if preferred_id:
            return str(preferred_id)

    fallback_result = await db.execute(
        select(Server.id)
        .where(Server.is_active.is_(True))
        .order_by(Server.is_draining.asc(), Server.created_at.asc())
        .limit(1)
    )
    fallback_id = fallback_result.scalar_one_or_none()
    return str(fallback_id) if fallback_id else None


def _stars_amount(amount: object, currency: str) -> int:
    """Return Telegram Stars amount as a non-negative integer."""
    try:
        value = float(amount or 0)
    except (TypeError, ValueError):
        value = 0.0
    if not math.isfinite(value) or value <= 0:
        return 0
    normalized = (currency or "").strip().upper()
    if normalized in ("XTR", "STARS"):
        return max(0, int(round(value)))
    # Legacy/unknown non-Stars currency: convert using placeholder ratio until product confirms mapping.
    return max(0, int(round(value * float(STARS_PER_LEGACY_UNIT))))


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
    # Preserve explicit False values from Telegram payload
    if "is_premium" in user:
        requisites["is_premium"] = bool(user.get("is_premium"))
    elif "isPremium" in user:
        requisites["is_premium"] = bool(user.get("isPremium"))
    requisites.setdefault("is_premium", False)
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
        meta = dict(db_user.meta or {})
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
            "public_ip": None,
            "latest_device_delivery": None,
            "live_connection": {
                "status": "unknown",
                "source": "server_handshake",
                "device_id": None,
                "device_name": None,
                "last_handshake_at": None,
                "handshake_age_sec": None,
                "telemetry_updated_at": None,
            },
            "onboarding": _serialize_onboarding_state(None),
        }
    active_devices = [d for d in user.devices if d.revoked_at is None]
    preferred_server_id = str((user.meta or {}).get("preferred_server_id") or "").strip() or None
    server_id_for_ip = None
    if active_devices:
        ranked_devices = sorted(
            active_devices,
            key=lambda device: (
                device.last_seen_handshake_at or device.issued_at,
                device.issued_at,
            ),
            reverse=True,
        )
        server_id_for_ip = ranked_devices[0].server_id
    elif preferred_server_id:
        server_id_for_ip = preferred_server_id
    public_ip = None
    if server_id_for_ip:
        server_result = await db.execute(select(Server).where(Server.id == server_id_for_ip))
        public_ip = _server_public_ip(server_result.scalar_one_or_none())

    now = datetime.now(timezone.utc)

    device_ids = [d.id for d in active_devices] if active_devices else []
    telemetry_map = await get_device_telemetry_bulk(device_ids) if device_ids else {}
    telemetry_last_updated = await get_telemetry_last_updated() if device_ids else None

    def _effective_last_seen(d: Device):
        if d.last_seen_handshake_at:
            return d.last_seen_handshake_at
        te = telemetry_map.get(d.id) if isinstance(d.id, str) else telemetry_map.get(str(d.id))
        if te and getattr(te, "handshake_latest_at", None) is not None:
            return te.handshake_latest_at
        return None

    def _device_status(d: Device) -> str:
        if d.revoked_at:
            return "revoked"
        if d.apply_status in ("PENDING_APPLY", "APPLYING", "FAILED_APPLY", "NO_HANDSHAKE"):
            return "config_pending"
        last = _effective_last_seen(d)
        if last:
            age = (now - last).total_seconds()
            return "connected" if age < 300 else "idle"
        return "config_pending"

    ordered_subscriptions = sort_subscriptions(list(user.subscriptions))
    subs = [
        {
            "id": s.id,
            "plan_id": s.plan_id,
            "status": s.status,
            "subscription_status": getattr(s, "subscription_status", s.status),
            "access_status": getattr(s, "access_status", "enabled"),
            "billing_status": getattr(s, "billing_status", "paid"),
            "renewal_status": getattr(
                s,
                "renewal_status",
                "auto_renew_on" if getattr(s, "auto_renew", True) else "auto_renew_off",
            ),
            "valid_until": s.valid_until.isoformat(),
            "grace_until": (g.isoformat() if (g := getattr(s, "grace_until", None)) else None),
            "cancel_at_period_end": bool(getattr(s, "cancel_at_period_end", False)),
            "accrued_bonus_days": int(getattr(s, "accrued_bonus_days", 0) or 0),
            "device_limit": s.device_limit,
            "auto_renew": bool(getattr(s, "auto_renew", True)),
            "is_trial": bool(getattr(s, "is_trial", False)),
            "trial_ends_at": (
                te.isoformat() if (te := getattr(s, "trial_ends_at", None)) else None
            ),
        }
        for s in ordered_subscriptions
    ]
    devs = [
        {
            "id": d.id,
            "device_name": d.device_name,
            "platform": getattr(d, "platform", None),
            "server_id": d.server_id,
            "issued_at": d.issued_at.isoformat(),
            "revoked_at": d.revoked_at.isoformat() if d.revoked_at else None,
            "last_seen_handshake_at": eff.isoformat() if (eff := _effective_last_seen(d)) else None,
            "last_connection_confirmed_at": (
                lc.isoformat() if (lc := getattr(d, "last_connection_confirmed_at", None)) else None
            ),
            "apply_status": d.apply_status,
            "status": _device_status(d),
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

    recommended_route, route_reason = _resolve_route(user, ordered_subscriptions, active_devices)
    routing = {"recommended_route": recommended_route, "reason": route_reason}
    latest_device_delivery = await _build_latest_device_delivery(db, active_devices=active_devices)
    live_connection = _build_live_connection(
        active_devices=active_devices,
        telemetry_map=telemetry_map,
        telemetry_last_updated=telemetry_last_updated,
        now=now,
    )

    meta = user.meta or {}
    tg_meta = meta.get("tg") or {}
    first = (tg_meta.get("first_name") or "").strip()
    last = (tg_meta.get("last_name") or "").strip()
    tg_display = (
        " ".join((first, last)).strip() or (tg_meta.get("username") or "").strip() or "User"
    )
    display_name = (meta.get("display_name") or "").strip() or tg_display or "User"
    photo_url = tg_meta.get("photo_url") or None
    locale = meta.get("locale") or None

    return {
        "user": {
            "id": user.id,
            "tg_id": user.tg_id,
            "email": user.email,
            "phone": user.phone,
            "display_name": display_name or None,
            "photo_url": photo_url,
            "locale": locale,
            "onboarding_step": user.onboarding_step,
            "first_connected_at": (
                user.first_connected_at.isoformat()
                if getattr(user, "first_connected_at", None)
                else None
            ),
            "last_connection_confirmed_at": (
                user.last_connection_confirmed_at.isoformat()
                if getattr(user, "last_connection_confirmed_at", None)
                else None
            ),
        },
        "subscriptions": subs,
        "devices": devs,
        "public_ip": public_ip,
        "latest_device_delivery": latest_device_delivery,
        "live_connection": live_connection,
        "onboarding": _serialize_onboarding_state(user),
        "routing": routing,
    }


class UserAccessResponse(BaseModel):
    """Flat access state for state-driven Home UI. GET /webapp/user/access."""

    status: str  # no_plan | needs_device | generating_config | ready | expired | device_limit | error
    has_plan: bool
    plan_id: str | None = None
    plan_name: str | None = None
    plan_duration_days: int | None = None
    devices_used: int
    device_limit: int | None
    traffic_used_bytes: int | None = None
    config_ready: bool
    config_id: str | None
    expires_at: str | None
    amnezia_vpn_key: str | None = None


async def _sum_usage_bytes_for_devices(device_ids: list[str]) -> int:
    if not device_ids:
        return 0
    telemetry_map = await get_device_telemetry_bulk(device_ids)
    if not telemetry_map:
        return 0
    total_bytes = 0
    for telemetry in telemetry_map.values():
        total_bytes += int(telemetry.transfer_rx_bytes or 0) + int(telemetry.transfer_tx_bytes or 0)
    return total_bytes


async def _build_access_plan_context(
    db: AsyncSession,
    subscription: Subscription | None,
) -> tuple[str | None, str | None, int | None]:
    if subscription is None:
        return None, None, None
    plan_id = getattr(subscription, "plan_id", None)
    if not plan_id:
        return None, None, None
    plan_result = await db.execute(select(Plan).where(Plan.id == plan_id))
    plan = plan_result.scalar_one_or_none()
    if not plan:
        return plan_id, None, None
    _style, clean_name = _extract_plan_style(plan.name)
    return plan_id, clean_name or plan_id, int(plan.duration_days or 0)


@router.get("/user/access", response_model=UserAccessResponse)
async def webapp_user_access(
    request: Request,
    db: AsyncSession = Depends(get_db),
) -> UserAccessResponse:
    """Return flat access state for state-driven Home UI. Requires Bearer session token."""
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
        return UserAccessResponse(
            status="no_plan",
            has_plan=False,
            plan_id=None,
            plan_name=None,
            plan_duration_days=None,
            devices_used=0,
            device_limit=None,
            traffic_used_bytes=0,
            config_ready=False,
            config_id=None,
            expires_at=None,
            amnezia_vpn_key=None,
        )

    now = datetime.now(timezone.utc)
    active_devices = [d for d in user.devices if d.revoked_at is None]
    active_device_ids = [str(d.id) for d in active_devices]
    ordered_subs = sort_subscriptions(list(user.subscriptions))

    primary_sub = next(
        (
            s
            for s in ordered_subs
            if (
                subscription_commercial_status(s) in ("active", "pending")
                and (
                    getattr(s, "valid_until", None)
                    and s.valid_until > now
                    or is_restorable(s, now=now)
                )
            )
        ),
        None,
    )

    if not primary_sub:
        grace_sub = next((s for s in ordered_subs if is_restorable(s, now=now)), None)
        if grace_sub:
            valid_until = grace_sub.valid_until.isoformat()[:10] if grace_sub.valid_until else None
            plan_id, plan_name, plan_duration_days = await _build_access_plan_context(db, grace_sub)
            traffic_used_bytes = await _sum_usage_bytes_for_devices(active_device_ids)
            return UserAccessResponse(
                status="expired",
                has_plan=bool(grace_sub.plan_id),
                plan_id=plan_id,
                plan_name=plan_name,
                plan_duration_days=plan_duration_days,
                devices_used=len(active_devices),
                device_limit=getattr(grace_sub, "device_limit", None),
                traffic_used_bytes=traffic_used_bytes,
                config_ready=False,
                config_id=None,
                expires_at=valid_until,
                amnezia_vpn_key=None,
            )
        return UserAccessResponse(
            status="no_plan",
            has_plan=False,
            plan_id=None,
            plan_name=None,
            plan_duration_days=None,
            devices_used=len(active_devices),
            device_limit=None,
            traffic_used_bytes=0,
            config_ready=False,
            config_id=None,
            expires_at=None,
            amnezia_vpn_key=None,
        )

    access_status_val = subscription_access_status(primary_sub)
    plan_id, plan_name, plan_duration_days = await _build_access_plan_context(db, primary_sub)
    traffic_used_bytes = await _sum_usage_bytes_for_devices(active_device_ids)
    grace_until = getattr(primary_sub, "grace_until", None)
    if access_status_val == "grace" and grace_until and grace_until > now:
        valid_until = primary_sub.valid_until.isoformat()[:10] if primary_sub.valid_until else None
        return UserAccessResponse(
            status="expired",
            has_plan=True,
            plan_id=plan_id,
            plan_name=plan_name,
            plan_duration_days=plan_duration_days,
            devices_used=len(active_devices),
            device_limit=getattr(primary_sub, "device_limit", None),
            traffic_used_bytes=traffic_used_bytes,
            config_ready=False,
            config_id=None,
            expires_at=valid_until,
            amnezia_vpn_key=None,
        )
    if access_status_val == "paused":
        valid_until = primary_sub.valid_until.isoformat()[:10] if primary_sub.valid_until else None
        return UserAccessResponse(
            status="expired",
            has_plan=True,
            plan_id=plan_id,
            plan_name=plan_name,
            plan_duration_days=plan_duration_days,
            devices_used=len(active_devices),
            device_limit=getattr(primary_sub, "device_limit", None),
            traffic_used_bytes=traffic_used_bytes,
            config_ready=False,
            config_id=None,
            expires_at=valid_until,
            amnezia_vpn_key=None,
        )

    device_limit_val = getattr(primary_sub, "device_limit", None)
    if not active_devices:
        return UserAccessResponse(
            status="needs_device",
            has_plan=True,
            plan_id=plan_id,
            plan_name=plan_name,
            plan_duration_days=plan_duration_days,
            devices_used=0,
            device_limit=device_limit_val,
            traffic_used_bytes=traffic_used_bytes,
            config_ready=False,
            config_id=None,
            expires_at=None,
            amnezia_vpn_key=None,
        )

    if device_limit_val is not None and len(active_devices) >= device_limit_val:
        latest_delivery = await _build_latest_device_delivery(db, active_devices=active_devices)
        config_ready = latest_delivery is not None
        config_id = latest_delivery["device_id"] if latest_delivery else None
        amnezia_key = latest_delivery.get("amnezia_vpn_key") if latest_delivery else None
        valid_until = primary_sub.valid_until.isoformat()[:10] if primary_sub.valid_until else None
        if config_ready and primary_sub.valid_until > now:
            return UserAccessResponse(
                status="ready",
                has_plan=True,
                plan_id=plan_id,
                plan_name=plan_name,
                plan_duration_days=plan_duration_days,
                devices_used=len(active_devices),
                device_limit=device_limit_val,
                traffic_used_bytes=traffic_used_bytes,
                config_ready=True,
                config_id=str(config_id) if config_id else None,
                expires_at=valid_until,
                amnezia_vpn_key=amnezia_key,
            )
        return UserAccessResponse(
            status="device_limit",
            has_plan=True,
            plan_id=plan_id,
            plan_name=plan_name,
            plan_duration_days=plan_duration_days,
            devices_used=len(active_devices),
            device_limit=device_limit_val,
            traffic_used_bytes=traffic_used_bytes,
            config_ready=config_ready,
            config_id=str(config_id) if config_id else None,
            expires_at=None,
            amnezia_vpn_key=None,
        )

    latest_delivery = await _build_latest_device_delivery(db, active_devices=active_devices)
    config_ready = latest_delivery is not None
    config_id = latest_delivery["device_id"] if latest_delivery else None
    amnezia_key = latest_delivery.get("amnezia_vpn_key") if latest_delivery else None
    valid_until = primary_sub.valid_until.isoformat()[:10] if primary_sub.valid_until else None

    if config_ready and primary_sub.valid_until > now:
        return UserAccessResponse(
            status="ready",
            has_plan=True,
            plan_id=plan_id,
            plan_name=plan_name,
            plan_duration_days=plan_duration_days,
            devices_used=len(active_devices),
            device_limit=device_limit_val,
            traffic_used_bytes=traffic_used_bytes,
            config_ready=True,
            config_id=str(config_id) if config_id else None,
            expires_at=valid_until,
            amnezia_vpn_key=amnezia_key,
        )

    if primary_sub.valid_until <= now:
        return UserAccessResponse(
            status="expired",
            has_plan=True,
            plan_id=plan_id,
            plan_name=plan_name,
            plan_duration_days=plan_duration_days,
            devices_used=len(active_devices),
            device_limit=device_limit_val,
            traffic_used_bytes=traffic_used_bytes,
            config_ready=config_ready,
            config_id=str(config_id) if config_id else None,
            expires_at=valid_until,
            amnezia_vpn_key=None,
        )

    return UserAccessResponse(
        status="needs_device",
        has_plan=True,
        plan_id=plan_id,
        plan_name=plan_name,
        plan_duration_days=plan_duration_days,
        devices_used=len(active_devices),
        device_limit=device_limit_val,
        traffic_used_bytes=traffic_used_bytes,
        config_ready=config_ready,
        config_id=str(config_id) if config_id else None,
        expires_at=None,
        amnezia_vpn_key=None,
    )


_WEBAPP_ALLOWED_LOCALES = frozenset({"en", "ru"})


_EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")


class WebAppMeProfileUpdateBody(BaseModel):
    """Optional profile fields for PATCH /webapp/me. Omitted or None = no change."""

    email: str | None = None
    phone: str | None = None
    display_name: str | None = None
    locale: str | None = None

    @field_validator("email")
    @classmethod
    def validate_email_format(cls, v: str | None) -> str | None:
        if v is None or not v.strip():
            return None
        s = v.strip()
        if not _EMAIL_RE.match(s):
            raise ValueError("Invalid email format")
        return s

    @model_validator(mode="after")
    def validate_locale(self) -> "WebAppMeProfileUpdateBody":
        if self.locale is not None and self.locale.strip():
            if self.locale.strip().lower() not in _WEBAPP_ALLOWED_LOCALES:
                raise ValueError(f"locale must be one of {sorted(_WEBAPP_ALLOWED_LOCALES)}")
        return self


class WebAppDeleteMeBody(BaseModel):
    confirm_token: str = Field(min_length=1)


@router.patch("/me")
async def webapp_me_update(
    body: WebAppMeProfileUpdateBody,
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    """Update current session user profile. Only provided fields are updated."""
    tg_id = _get_tg_id_from_bearer(request)
    if not tg_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"code": "UNAUTHORIZED", "message": "Invalid session"},
        )
    await rate_limit_webapp_me_patch(tg_id)
    result = await db.execute(select(User).where(User.tg_id == tg_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "USER_NOT_FOUND", "message": "User not found"},
        )
    meta = dict(user.meta or {})
    if body.email is not None:
        user.email = body.email.strip() or None
    if body.phone is not None:
        user.phone = body.phone.strip() or None
    if body.display_name is not None:
        s = body.display_name.strip()
        if s:
            meta["display_name"] = s
        else:
            meta.pop("display_name", None)
    if body.locale is not None:
        s = body.locale.strip().lower() if body.locale.strip() else ""
        if s and s in _WEBAPP_ALLOWED_LOCALES:
            meta["locale"] = s
        else:
            meta.pop("locale", None)
    user.meta = meta or None
    await db.commit()
    await db.refresh(user)
    meta = user.meta or {}
    tg_meta = meta.get("tg") or {}
    first = (tg_meta.get("first_name") or "").strip()
    last = (tg_meta.get("last_name") or "").strip()
    tg_display = (
        " ".join((first, last)).strip() or (tg_meta.get("username") or "").strip() or "User"
    )
    display_name = (meta.get("display_name") or "").strip() or tg_display or "User"
    locale = meta.get("locale") or None
    return {
        "user": {
            "id": user.id,
            "tg_id": user.tg_id,
            "email": user.email,
            "phone": user.phone,
            "display_name": display_name or None,
            "photo_url": tg_meta.get("photo_url") or None,
            "locale": locale,
            "onboarding_step": user.onboarding_step,
            "first_connected_at": (
                user.first_connected_at.isoformat()
                if getattr(user, "first_connected_at", None)
                else None
            ),
            "last_connection_confirmed_at": (
                user.last_connection_confirmed_at.isoformat()
                if getattr(user, "last_connection_confirmed_at", None)
                else None
            ),
        },
    }


@router.post("/logout")
async def webapp_logout(request: Request):
    tg_id = _get_tg_id_from_bearer(request)
    if not tg_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"code": "UNAUTHORIZED", "message": "Invalid session"},
        )
    return {"status": "ok"}


@router.delete("/me", status_code=status.HTTP_204_NO_CONTENT)
async def webapp_me_delete(
    body: WebAppDeleteMeBody,
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    tg_id = _get_tg_id_from_bearer(request)
    if not tg_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"code": "UNAUTHORIZED", "message": "Invalid session"},
        )
    if body.confirm_token.strip() != "DELETE":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"code": "INVALID_CONFIRM_TOKEN", "message": "Type DELETE to confirm"},
        )

    result = await db.execute(select(User).where(User.tg_id == tg_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "USER_NOT_FOUND", "message": "User not found"},
        )

    await _delete_user_cascade(db, user.id)
    await db.commit()
    await invalidate_devices_summary_cache()
    await invalidate_devices_list_cache()
    return Response(status_code=status.HTTP_204_NO_CONTENT)


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
    """Log a telemetry event (e.g. screen_view, cta_click). Requires Bearer session token."""
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
    event_label = (body.event_type or "unknown")[:64]
    miniapp_events_total.labels(event=event_label).inc()
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
    stmt = select(Plan).where(Plan.is_archived.is_(False))
    if trial_plan_id:
        stmt = stmt.where(Plan.id != trial_plan_id)
    stmt = stmt.order_by(Plan.display_order.asc(), Plan.id.asc())
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
        stars = _stars_amount(p.price_amount, p.price_currency)
        items.append(
            {
                "id": p.id,
                "name": clean_name or p.id,
                "duration_days": p.duration_days,
                "device_limit": int(getattr(p, "device_limit", 1) or 1),
                "price_currency": "XTR",
                "price_amount": stars,
                "style": style,
                "upsell_methods": p.upsell_methods if p.upsell_methods is not None else [],
                "display_order": int(getattr(p, "display_order", 0) or 0),
            }
        )
    items.sort(
        key=lambda item: (
            int(item.get("display_order", 0)),
            int(item.get("price_amount") or 0),
            int(item.get("duration_days") or 0),
            str(item.get("id") or ""),
        )
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
    amnezia_vpn_key: str | None = None
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


def _build_amnezia_vpn_key(config_text: str | None) -> str | None:
    if not isinstance(config_text, str) or not config_text.strip():
        return None
    try:
        return encode_awg_conf_vpn_key(sanitize_awg_conf(config_text))
    except Exception:
        logging.getLogger(__name__).warning(
            "webapp_amnezia_vpn_key_build_failed",
            exc_info=True,
        )
        return None


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
    """Debug helper: send test config message + file to Telegram for current WebApp user. Dev only."""
    if settings.environment.lower() != "development":
        raise HTTPException(status_code=404, detail="Not found")
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
            *entitled_active_where(now=now),
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
    if adapter is None and _webapp_issue_requires_runtime_adapter():
        raise HTTPException(
            status_code=503,
            detail={
                "code": "NODE_RUNTIME_UNAVAILABLE",
                "message": "Device issuance is temporarily unavailable. Try again later.",
            },
        )
    get_topology = None
    if adapter is not None:
        from app.services.topology_engine import TopologyEngine

        engine = TopologyEngine(adapter)
        get_topology = engine.get_topology
    preferred_server_id: str | None = None
    meta = user.meta or {}
    if not meta.get("server_auto_select", True):
        raw_server_id = str(meta.get("preferred_server_id") or "").strip()
        if raw_server_id:
            preferred_server_id = raw_server_id
    if get_topology is None:
        preferred_server_id = await _select_webapp_issue_server_id(
            db,
            preferred_server_id=preferred_server_id,
        )
        if preferred_server_id is None:
            raise HTTPException(
                status_code=503,
                detail={"code": "NO_NODE", "message": "No active server available for device issuance."},
            )
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
        amnezia_vpn_key=_build_amnezia_vpn_key(out.config_awg),
        node_mode=settings.node_mode,
        peer_created=out.peer_created,
        issued_at=out.device.issued_at,
    )


@router.post("/devices/{device_id}/confirm-connected")
async def webapp_confirm_connected(
    device_id: str, request: Request, db: AsyncSession = Depends(get_db)
):
    """Confirm connection for device (idempotent). Bearer session token required."""
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
    now = datetime.now(timezone.utc)
    device.last_connection_confirmed_at = now
    if not user.first_connected_at:
        user.first_connected_at = now
    user.last_connection_confirmed_at = now
    await log_funnel_event(
        db,
        event_type="connect_confirmed",
        user_id=user.id,
        payload={"device_id": device_id, "source": "webapp"},
    )
    miniapp_events_total.labels(event="connect_confirmed").inc()
    await db.commit()
    return {"status": "ok"}


@router.post("/devices/{device_id}/replace-with-new", response_model=WebAppIssueDeviceResponse)
async def webapp_replace_device(
    device_id: str,
    request: Request,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
):
    """Revoke current device and issue a new one in the same slot (subscription). Bearer required."""
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
            status_code=400, detail={"code": "ALREADY_REVOKED", "message": "Device already revoked"}
        )
    now = datetime.now(timezone.utc)
    device.revoked_at = now
    sub_result = await db.execute(
        select(Subscription).where(
            Subscription.id == device.subscription_id,
            Subscription.user_id == user.id,
        )
    )
    sub = sub_result.scalar_one_or_none()
    if not sub:
        raise HTTPException(
            status_code=400,
            detail={"code": "INVALID_DEVICE", "message": "Invalid device subscription"},
        )
    access_status = getattr(sub, "access_status", "enabled")
    if access_status == "grace":
        raise HTTPException(
            status_code=400,
            detail={
                "code": "GRACE_NO_NEW_DEVICE",
                "message": "Cannot replace device during grace. Restore access first.",
            },
        )
    sub_status = getattr(sub, "subscription_status", sub.status)
    if sub_status not in ("active", "pending") or sub.valid_until <= now:
        raise HTTPException(
            status_code=400,
            detail={"code": "NO_ACTIVE_SUBSCRIPTION", "message": "No active subscription"},
        )
    adapter = getattr(request.app.state, "node_runtime_adapter", None)
    if adapter is None and _webapp_issue_requires_runtime_adapter():
        raise HTTPException(
            status_code=503,
            detail={"code": "NODE_RUNTIME_UNAVAILABLE", "message": "Device issuance unavailable."},
        )
    preferred_server_id: str | None = device.server_id
    meta = user.meta or {}
    if meta.get("server_auto_select", True):
        preferred_server_id = None
    else:
        raw = str(meta.get("preferred_server_id") or "").strip()
        if raw:
            preferred_server_id = raw
    get_topology = None
    if adapter is not None:
        from app.services.topology_engine import TopologyEngine

        engine = TopologyEngine(adapter)
        get_topology = engine.get_topology
    if get_topology is None:
        preferred_server_id = await _select_webapp_issue_server_id(
            db,
            preferred_server_id=preferred_server_id,
        )
        if preferred_server_id is None:
            raise HTTPException(
                status_code=503,
                detail={"code": "NO_NODE", "message": "No active server available for device issuance."},
            )
    try:
        out = await issue_device(
            db,
            user_id=user.id,
            subscription_id=sub.id,
            server_id=preferred_server_id,
            device_name=device.device_name or f"webapp_{tg_id}",
            get_topology=get_topology,
            runtime_adapter=adapter,
        )
    except Exception as e:
        from app.core.exceptions import LoadBalancerError, WireGuardCommandError
        from app.services.server_live_key_service import ServerNotSyncedError

        if isinstance(e, ServerNotSyncedError):
            raise HTTPException(
                status_code=409, detail={"code": "SERVER_NOT_SYNCED", "message": str(e)}
            ) from e
        if isinstance(e, LoadBalancerError):
            raise HTTPException(
                status_code=503, detail={"code": "NO_NODE", "message": str(e)}
            ) from e
        if isinstance(e, WireGuardCommandError | ValueError):
            raise HTTPException(
                status_code=400, detail={"code": "ISSUE_FAILED", "message": str(e)}
            ) from e
        raise HTTPException(
            status_code=500, detail={"code": "INTERNAL_ERROR", "message": "Replace failed"}
        ) from e
    try:
        await persist_issued_configs(
            db,
            out.device.id,
            out.device.server_id,
            out.config_awg,
            out.config_wg_obf,
            out.config_wg,
        )
        await db.commit()
        await invalidate_devices_summary_cache()
        await invalidate_devices_list_cache()
        await db.refresh(out.device)
    except Exception:
        await db.rollback()
        raise HTTPException(
            status_code=500, detail={"code": "INTERNAL_ERROR", "message": "Replace failed"}
        )
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
            pass
    await log_funnel_event(
        db, event_type="device_revoked", user_id=user.id, payload={"device_id": device_id}
    )
    await log_funnel_event(
        db, event_type="device_issue_success", user_id=user.id, payload={"device_id": out.device.id}
    )
    miniapp_events_total.labels(event="device_revoked").inc()
    miniapp_events_total.labels(event="device_issue_success").inc()
    return WebAppIssueDeviceResponse(
        device_id=out.device.id,
        config=out.config_awg,
        config_awg=out.config_awg,
        config_wg_obf=out.config_wg_obf,
        config_wg=out.config_wg,
        amnezia_vpn_key=_build_amnezia_vpn_key(out.config_awg),
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


class WebAppDeviceNameUpdate(BaseModel):
    """Body for PATCH /webapp/devices/{device_id}: user can set device_name only."""

    device_name: str | None = None

    @field_validator("device_name")
    @classmethod
    def trim_and_cap(cls, v: str | None) -> str | None:
        if v is None:
            return None
        s = (v or "").strip()
        return s[:128] if s else None


@router.patch("/devices/{device_id}")
async def webapp_update_device_name(
    device_id: str,
    body: WebAppDeviceNameUpdate,
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    """Update own device name. Bearer session token required. Only device_name is allowed."""
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
    if body.device_name is not None:
        device.device_name = body.device_name
    await db.commit()
    await invalidate_devices_summary_cache()
    await invalidate_devices_list_cache()
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
    bot_username = (settings.telegram_bot_username or "").strip()
    return {"referral_code": code, "payload": f"ref_{code}", "bot_username": bot_username or None}


class WebAppReferralAttachBody(BaseModel):
    """ref (preferred) or referral_code. Backend resolves to referrer_user_id."""

    ref: str | None = None
    referral_code: str | None = None

    @model_validator(mode="after")
    def resolve_ref(self) -> "WebAppReferralAttachBody":
        raw = (self.ref or self.referral_code or "").strip()
        if raw.startswith("ref_"):
            raw = raw[4:].strip()
        if not raw:
            raise ValueError("ref or referral_code required")
        object.__setattr__(self, "_resolved", raw)
        return self


class WebAppReferralAttachAttachedResponse(BaseModel):
    """New referral record created."""

    status: str = "attached"
    referrer_user_id: int


class WebAppReferralAttachAlreadyResponse(BaseModel):
    """Referee already has a referrer; idempotent."""

    status: str = "already_attached"
    referrer_user_id: int


def _log_referral_attach_attempt(telegram_user_id: int, ref_code: str) -> None:
    logging.getLogger(__name__).info(
        "referral_attach_attempt",
        extra={"telegram_user_id": telegram_user_id, "ref_code": ref_code},
    )


def _log_referral_attach_result(
    telegram_user_id: int,
    ref_code: str,
    resolved_referrer_user_id: int | None,
    attach_status: str,
    reason: str | None = None,
) -> None:
    logging.getLogger(__name__).info(
        "referral_attach_result",
        extra={
            "telegram_user_id": telegram_user_id,
            "ref_code": ref_code,
            "resolved_referrer_user_id": resolved_referrer_user_id,
            "attach_status": attach_status,
            "reason": reason,
        },
    )


@router.post(
    "/referral/attach",
    response_model=WebAppReferralAttachAttachedResponse | WebAppReferralAttachAlreadyResponse,
    responses={
        400: {"description": "status: self_referral_blocked or invalid_ref"},
        401: {"description": "Invalid session"},
    },
)
async def webapp_referral_attach(
    body: WebAppReferralAttachBody,
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    """Attach current user (referee) to referrer by ref/referral_code. Idempotent. Bearer required.
    Returns status: attached | already_attached (200); 400 with status self_referral_blocked | invalid_ref.
    Backend is source of truth; does not overwrite existing referrer. See docs/referral-pipeline.md."""
    tg_id = _get_tg_id_from_bearer(request)
    if not tg_id:
        raise HTTPException(
            status_code=401, detail={"code": "UNAUTHORIZED", "message": "Invalid session"}
        )
    referral_code = getattr(body, "_resolved", None) or (body.referral_code or "").strip()
    if not referral_code:
        referral_attach_fail_total.labels(reason="invalid_ref").inc()
        _log_referral_attach_result(tg_id, "", None, "invalid_ref", "ref required")
        raise HTTPException(
            status_code=400,
            detail={
                "status": "invalid_ref",
                "code": "BAD_REQUEST",
                "message": "ref or referral_code required",
            },
        )
    _log_referral_attach_attempt(tg_id, referral_code)
    try:
        referrer_user_id = int(referral_code)
    except ValueError:
        referral_attach_fail_total.labels(reason="invalid_ref").inc()
        _log_referral_attach_result(tg_id, referral_code, None, "invalid_ref", "ref not numeric")
        raise HTTPException(
            status_code=400,
            detail={
                "status": "invalid_ref",
                "code": "BAD_REQUEST",
                "message": "Invalid referral code",
            },
        )
    referee_result = await db.execute(select(User).where(User.tg_id == tg_id))
    referee = referee_result.scalar_one_or_none()
    if not referee:
        raise HTTPException(
            status_code=404, detail={"code": "USER_NOT_FOUND", "message": "User not found"}
        )
    if referrer_user_id == referee.id:
        referral_attach_fail_total.labels(reason="self_referral_blocked").inc()
        _log_referral_attach_result(
            tg_id, referral_code, referrer_user_id, "self_referral_blocked", "self-referral"
        )
        raise HTTPException(
            status_code=400,
            detail={
                "status": "self_referral_blocked",
                "code": "BAD_REQUEST",
                "message": "Cannot refer self",
            },
        )
    referrer_result = await db.execute(select(User).where(User.id == referrer_user_id))
    if referrer_result.scalar_one_or_none() is None:
        referral_attach_fail_total.labels(reason="referrer_not_found").inc()
        _log_referral_attach_result(tg_id, referral_code, None, "invalid_ref", "referrer not found")
        raise HTTPException(
            status_code=400,
            detail={"status": "invalid_ref", "code": "NOT_FOUND", "message": "Referrer not found"},
        )
    existing_result = await db.execute(
        select(Referral).where(Referral.referee_user_id == referee.id)
    )
    existing = existing_result.scalar_one_or_none()
    if existing:
        await db.commit()
        referral_attach_total.labels(status="already_attached").inc()
        _log_referral_attach_result(
            tg_id,
            referral_code,
            existing.referrer_user_id,
            "already_attached",
            "one attach per referee",
        )
        return {"status": "already_attached", "referrer_user_id": existing.referrer_user_id}
    r = Referral(
        referrer_user_id=referrer_user_id,
        referee_user_id=referee.id,
        referral_code=referral_code,
        status="pending",
    )
    db.add(r)
    await log_funnel_event(
        db,
        event_type="referral_signup",
        user_id=referee.id,
        payload={"referrer_user_id": referrer_user_id},
    )
    await db.commit()
    vpn_revenue_referral_signup_total.inc()
    referral_attach_total.labels(status="attached").inc()
    _log_referral_attach_result(tg_id, referral_code, referrer_user_id, "attached", None)
    return {"status": "attached", "referrer_user_id": referrer_user_id}


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
    pending_days_result = await db.execute(
        select(func.coalesce(func.sum(Referral.pending_reward_days), 0)).where(
            Referral.referrer_user_id == user.id,
            Referral.pending_reward_days > 0,
        )
    )
    pending_reward_days = int(pending_days_result.scalar() or 0)
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
        "pending_reward_days": pending_reward_days,
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
    await rate_limit_promo_validate(tg_id)
    user_result = await db.execute(select(User).where(User.tg_id == tg_id))
    user = user_result.scalar_one_or_none()
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
    original_price_xtr = int(_stars_amount(plan.price_amount, plan.price_currency))
    try:
        result = await validate_promo_code(
            db,
            code=body.code,
            user_id=user.id,
            plan_id=body.plan_id,
            original_price_xtr=original_price_xtr,
        )
    except PromoCodeError as e:
        return JSONResponse(
            status_code=422,
            content={"code": e.code.value, "message": e.message, "status_code": 422},
        )
    return {
        "valid": True,
        "discount_xtr": result.discount_amount,
        "discounted_price_xtr": result.discounted_price,
        "display_label": result.display_label,
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
            *entitled_active_where(now=now),
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
            device_limit=int(getattr(plan, "device_limit", 1) or 1),
            auto_renew=bool((user.meta or {}).get("webapp_auto_renew_default", True)),
        )
        normalize_pending_state(sub)
        db.add(sub)
        await db.flush()
    stars_amount = _stars_amount(plan.price_amount, plan.price_currency)
    original_price_xtr = int(stars_amount)
    final_price_xtr = original_price_xtr
    promo_discount_applied = 0
    if body.promo_code and body.promo_code.strip():
        try:
            val_result = await validate_promo_code(
                db,
                code=body.promo_code,
                user_id=user.id,
                plan_id=body.plan_id,
                original_price_xtr=original_price_xtr,
            )
            final_price_xtr = val_result.discounted_price
            promo_discount_applied = val_result.discount_amount
        except PromoCodeError as e:
            raise HTTPException(
                status_code=422,
                detail={"code": e.code.value, "message": e.message},
            ) from e
    is_free = final_price_xtr <= 0
    server_result = await db.execute(select(Server).where(Server.is_active.is_(True)).limit(1))
    server = server_result.scalar_one_or_none()
    if not server and not is_free:
        raise HTTPException(
            status_code=503,
            detail={"code": "SERVER_NOT_AVAILABLE", "message": "No server available"},
        )
    # Idempotency: return existing pending payment for same user+sub within window to avoid duplicate charges on retry.
    idem_minutes = 5
    idem_cutoff = now - timedelta(minutes=idem_minutes)
    existing_payment_result = await db.execute(
        select(Payment)
        .where(
            Payment.user_id == user.id,
            Payment.subscription_id == sub.id,
            Payment.status == "pending",
            Payment.created_at >= idem_cutoff,
        )
        .order_by(Payment.created_at.desc())
        .limit(1)
    )
    existing_payment = existing_payment_result.scalar_one_or_none()
    if existing_payment:
        await db.commit()
        await db.refresh(existing_payment)
        star_count = 0 if is_free else max(1, int(float(existing_payment.amount or 0)))
        title = plan.name or "VPN"
        description = f"VPN plan, {plan.duration_days} days"
        invoice_link = ""
        if not is_free:
            invoice_link = await _create_telegram_invoice_link(
                title=title,
                description=description,
                payload=existing_payment.id,
                star_count=star_count,
            )
        discounted = int(float(existing_payment.amount or 0)) if existing_payment.amount else star_count
        existing_discount = max(0, original_price_xtr - discounted) if discounted < original_price_xtr else 0
        return {
            "invoice_id": existing_payment.id,
            "payment_id": existing_payment.id,
            "title": title,
            "description": description,
            "currency": "XTR",
            "star_count": star_count,
            "discounted_price_xtr": discounted,
            "promo_discount_applied": existing_discount,
            "payload": existing_payment.id,
            "server_id": server.id if server else "",
            "subscription_id": sub.id,
            "invoice_link": invoice_link,
            "free_activation": is_free,
        }
    external_id = (
        f"webapp:telegram_stars:{user.id}:{sub.id}:{getattr(request.state, 'request_id', 'none')}"
    )
    payment = Payment(
        user_id=user.id,
        subscription_id=sub.id,
        provider="telegram_stars",
        status="completed" if is_free else "pending",
        amount=float(final_price_xtr),
        currency="XTR",
        external_id=external_id,
        webhook_payload={"promo_code": body.promo_code} if body.promo_code else None,
    )
    db.add(payment)
    await db.flush()
    if body.promo_code and body.promo_code.strip():
        try:
            await redeem_promo_code(
                db,
                code=body.promo_code,
                user_id=user.id,
                plan_id=body.plan_id,
                payment_id=payment.id,
                original_price_xtr=original_price_xtr,
            )
        except PromoCodeError as e:
            raise HTTPException(
                status_code=422,
                detail={"code": e.code.value, "message": e.message},
            ) from e
    if is_free and sub.status != "active":
        apply_subscription_cycle(
            sub,
            now=now,
            duration_days=plan.duration_days or 365,
            device_limit=int(getattr(plan, "device_limit", sub.device_limit) or sub.device_limit),
        )
    await log_funnel_event(
        db,
        event_type="plan_selected",
        user_id=user.id,
        payload={"plan_id": plan.id},
    )
    miniapp_events_total.labels(event="plan_selected").inc()
    await log_funnel_event(
        db,
        event_type="invoice_created",
        user_id=user.id,
        payload={"plan_id": plan.id, "payment_id": payment.id},
    )
    miniapp_events_total.labels(event="invoice_created").inc()
    await db.commit()
    await db.refresh(payment)
    await db.refresh(sub)
    star_count = 0 if is_free else max(1, final_price_xtr)
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
        "discounted_price_xtr": final_price_xtr,
        "promo_discount_applied": promo_discount_applied,
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
        stars_amount = _stars_amount(payment.amount, payment.currency)
        items.append(
            WebAppBillingHistoryItem(
                payment_id=payment.id,
                plan_id=subscription.plan_id if subscription else None,
                plan_name=clean_plan_name or fallback_plan_name,
                amount=float(stars_amount),
                currency="XTR",
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
    # Per-server RTT from this user's device telemetry (for latency display)
    server_avg_ping_ms: dict[str, float] = {}
    connected_server_id: str | None = None  # server of most recently connected device (for is_current when auto-select)
    user_devices_result = await db.execute(
        select(Device.id, Device.server_id, Device.last_seen_handshake_at, Device.issued_at).where(
            Device.user_id == user.id, Device.revoked_at.is_(None)
        )
    )
    user_devices = list(user_devices_result.all())
    if user_devices:
        device_ids = [str(row[0]) for row in user_devices]
        telemetry_map = await get_device_telemetry_bulk(device_ids)
        server_rtts: dict[str, list[float]] = {}
        latest_handshake_ts: float | None = None
        for row in user_devices:
            dev_id, server_id = str(row[0]), row[1]
            te = telemetry_map.get(dev_id)
            if te and getattr(te, "rtt_ms", None) is not None and te.rtt_ms is not None:
                try:
                    rtt = float(te.rtt_ms)
                    if 0 <= rtt <= 60000:
                        server_rtts.setdefault(server_id, []).append(rtt)
                except (TypeError, ValueError):
                    pass
            if server_id and te and getattr(te, "handshake_latest_at", None) is not None:
                ts = te.handshake_latest_at.timestamp()
                if latest_handshake_ts is None or ts > latest_handshake_ts:
                    latest_handshake_ts = ts
                    connected_server_id = server_id
        if connected_server_id is None and user_devices:
            ranked = sorted(
                user_devices,
                key=lambda r: (
                    r[2] or r[3],
                    r[3],
                ),
                reverse=True,
            )
            if ranked and ranked[0][1]:
                connected_server_id = ranked[0][1]
        for sid, rtts in server_rtts.items():
            if rtts:
                server_avg_ping_ms[sid] = round(sum(rtts) / len(rtts), 1)
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
        avg_ping = server_avg_ping_ms.get(s.id)
        is_current = preferred_server_id == s.id
        if not is_current and preferred_server_id is None and connected_server_id == s.id:
            is_current = True
        items.append(
            WebAppServerOut(
                id=s.id,
                name=s.name,
                region=s.region,
                load_percent=load_percent,
                avg_ping_ms=avg_ping,
                is_recommended=False,
                is_current=is_current,
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
    # Reason-driven offers (spec §6.4): primary response by reason_group
    offer_pause: bool = False
    offer_discount: bool = False
    offer_downgrade: bool = False
    reason_group: str | None = None


def _offers_for_reason(
    reason_group: str | None, can_pause: bool, discount_percent: int
) -> tuple[bool, bool, bool]:
    """Spec §6.4: map reason_group to targeted offers."""
    if not reason_group:
        return (can_pause, discount_percent > 0, False)
    r = (reason_group or "").strip().lower()
    if r in ("too_expensive", "price"):
        return (False, True, False)
    if r in ("not_using", "temporary_break", "not_needed"):
        return (True, False, True)
    if r in ("slow_or_unstable", "need_more_devices"):
        return (False, False, False)
    if r in ("privacy_or_trust_concern", "other"):
        return (False, discount_percent > 0, False)
    return (can_pause, discount_percent > 0, False)


@router.get("/subscription/offers", response_model=WebAppSubscriptionOffersOut)
async def webapp_subscription_offers(
    request: Request,
    reason_group: str | None = None,
    db: AsyncSession = Depends(get_db),
):
    """Return retention offers (pause, discount). Optional reason_group for reason-driven offers (spec §6.4)."""
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
    )
    subs = sort_subscriptions(list(sub_result.scalars().all()))
    sub = next(
        (
            candidate
            for candidate in subs
            if is_commercially_active(candidate)
        ),
        subs[0] if subs else None,
    )
    if not sub:
        discount_pct = retention_discount_percent()
        op, od, odw = _offers_for_reason(reason_group, False, discount_pct)
        return WebAppSubscriptionOffersOut(
            subscription_id=None,
            status=None,
            valid_until=None,
            discount_percent=discount_pct,
            can_pause=False,
            can_resume=False,
            offer_pause=op,
            offer_discount=od,
            offer_downgrade=odw,
            reason_group=reason_group,
        )
    commercial_status = subscription_commercial_status(sub)
    access_status = subscription_access_status(sub)
    can_pause = (
        commercial_status == "active"
        and access_status == "enabled"
        and sub.paused_at is None
        and sub.valid_until > now
    )
    can_resume = (
        commercial_status == "active"
        and access_status == "paused"
        and sub.paused_at is not None
        and sub.valid_until > now
    )
    discount_pct = retention_discount_percent()
    offer_pause, offer_discount, offer_downgrade = _offers_for_reason(
        reason_group, can_pause, discount_pct
    )
    await log_funnel_event(
        db,
        event_type="cancel_click",
        user_id=user.id,
        payload={"subscription_id": sub.id, "reason_group": reason_group or ""},
    )
    return WebAppSubscriptionOffersOut(
        subscription_id=sub.id,
        status=commercial_status,
        valid_until=sub.valid_until.isoformat(),
        discount_percent=discount_pct,
        can_pause=can_pause,
        can_resume=can_resume,
        offer_pause=offer_pause,
        offer_discount=offer_discount,
        offer_downgrade=offer_downgrade,
        reason_group=reason_group,
    )


class WebAppSubscriptionAccessStateOut(BaseModel):
    subscription_id: str | None
    access_status: str | None
    grace_until: str | None
    valid_until: str | None
    plan_id: str | None
    can_restore: bool


@router.get("/subscription/access-state", response_model=WebAppSubscriptionAccessStateOut)
async def webapp_subscription_access_state(
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    """Return access/grace summary for restore UI."""
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
    sub_result = await db.execute(
        select(Subscription)
        .where(Subscription.user_id == user.id)
        .order_by(Subscription.valid_until.desc())
        .limit(1)
    )
    sub = sub_result.scalar_one_or_none()
    if not sub:
        return WebAppSubscriptionAccessStateOut(
            subscription_id=None,
            access_status=None,
            grace_until=None,
            valid_until=None,
            plan_id=None,
            can_restore=False,
        )
    access_status = getattr(sub, "access_status", "enabled")
    grace_until = getattr(sub, "grace_until", None)
    sub_status = getattr(sub, "subscription_status", sub.status)
    # can_restore should be a real boolean, not the plan_id value.
    can_restore = bool(sub.plan_id) and (access_status == "grace" or sub_status == "expired")
    return WebAppSubscriptionAccessStateOut(
        subscription_id=sub.id,
        access_status=access_status,
        grace_until=grace_until.isoformat() if grace_until else None,
        valid_until=sub.valid_until.isoformat(),
        plan_id=sub.plan_id,
        can_restore=can_restore,
    )


class WebAppSubscriptionRestoreBody(BaseModel):
    subscription_id: str | None = None
    plan_id: str | None = None


@router.post("/subscription/restore")
async def webapp_subscription_restore(
    body: WebAppSubscriptionRestoreBody,
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    """For grace/expired users: create restore invoice for plan, or return plan_id for checkout."""
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
    if body.subscription_id:
        sub_result = await db.execute(
            select(Subscription).where(
                Subscription.id == body.subscription_id,
                Subscription.user_id == user.id,
            )
        )
        sub = sub_result.scalar_one_or_none()
    else:
        sub_result = await db.execute(
            select(Subscription)
            .where(Subscription.user_id == user.id)
            .order_by(Subscription.valid_until.desc())
        )
        subs = list(sub_result.scalars().all())
        sub = next(
            (
                candidate
                for candidate in subs
                if is_restorable(candidate)
            ),
            subs[0] if subs else None,
        )
    if not sub:
        raise HTTPException(
            status_code=400,
            detail={"code": "NO_SUBSCRIPTION", "message": "No subscription to restore"},
        )
    if not is_restorable(sub):
        raise HTTPException(
            status_code=400,
            detail={"code": "NOT_RESTORABLE", "message": "Subscription is not in restore state"},
        )
    plan_id = body.plan_id or sub.plan_id
    if not plan_id:
        raise HTTPException(
            status_code=400,
            detail={"code": "NO_PLAN", "message": "No plan to restore"},
        )
    await log_funnel_event(
        db,
        event_type="winback_clicked",
        user_id=user.id,
        payload={"subscription_id": sub.id, "plan_id": plan_id},
    )
    miniapp_events_total.labels(event="winback_clicked").inc()
    return {"status": "ok", "plan_id": plan_id, "redirect_to": f"/plan/checkout/{plan_id}"}


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
    reason_code: str = "user_request"
    reason_group: str | None = None
    free_text: str | None = None
    discount_accepted: bool | None = None
    offer_accepted: bool | None = None
    cancel_at_period_end: bool = False
    pause_instead: bool = False


@router.post("/subscription/cancel")
async def webapp_subscription_cancel(
    body: WebAppSubscriptionCancelBody,
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    """Cancel subscription with churn survey; support reason_group, pause_instead, cancel_at_period_end."""
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
    if body.pause_instead:
        ok = await pause_subscription(
            db,
            subscription_id=sub.id,
            user_id=user.id,
            reason=f"webapp_cancel_{body.reason_code}",
        )
        if not ok:
            raise HTTPException(
                status_code=400, detail={"code": "PAUSE_FAILED", "message": "Could not pause"}
            )
        survey = ChurnSurvey(
            user_id=user.id,
            subscription_id=sub.id,
            reason=body.reason_code[:32],
            reason_group=(body.reason_group or "")[:32] or None,
            reason_code=body.reason_code[:32] or None,
            free_text=(body.free_text or "")[:512] or None,
            discount_offered=bool(body.discount_accepted),
            offer_accepted=body.offer_accepted,
        )
        db.add(survey)
        await log_funnel_event(
            db, event_type="pause_selected", user_id=user.id, payload={"subscription_id": sub.id}
        )
        await db.commit()
        return {"status": "ok", "action": "paused"}
    if body.cancel_at_period_end:
        mark_cancel_at_period_end(sub)
    else:
        mark_cancelled(sub)
        await emit_access_blocked(
            db, subscription_id=sub.id, user_id=user.id, reason=body.reason_code
        )
    survey = ChurnSurvey(
        user_id=user.id,
        subscription_id=sub.id,
        reason=body.reason_code[:32],
        reason_group=(body.reason_group or "")[:32] or None,
        reason_code=body.reason_code[:32] or None,
        free_text=(body.free_text or "")[:512] or None,
        discount_offered=bool(body.discount_accepted),
        offer_accepted=body.offer_accepted,
    )
    db.add(survey)
    await log_funnel_event(
        db,
        event_type="cancel_confirm",
        user_id=user.id,
        payload={
            "subscription_id": sub.id,
            "reason": body.reason_code,
            "reason_group": body.reason_group,
            "cancel_at_period_end": body.cancel_at_period_end,
        },
    )
    await db.commit()
    return {
        "status": "ok",
        "action": "cancel_at_period_end" if body.cancel_at_period_end else "cancelled",
    }
