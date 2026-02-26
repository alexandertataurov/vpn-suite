"""WebApp: initData validation, session token, me (user + subscription + devices)."""

from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Request, status
from pydantic import BaseModel, model_validator
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.config import settings
from app.core.database import get_db
from app.core.security import create_webapp_session_token, decode_token, validate_telegram_init_data
from app.models import (
    Device,
    Payment,
    Plan,
    PromoCode,
    PromoRedemption,
    Referral,
    Server,
    Subscription,
    User,
)
from app.api.v1.device_cache import invalidate_devices_summary_cache
from app.services.issue_service import issue_device

router = APIRouter(prefix="/webapp", tags=["webapp"])


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
async def webapp_auth(body: WebAppAuthRequest):
    """Validate Telegram WebApp initData; return short-lived session token."""
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
    token = create_webapp_session_token(int(tg_user_id), expire_seconds=3600)
    return {"session_token": token, "expires_in": 3600}


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
        return {"user": None, "subscriptions": [], "devices": []}
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
        }
        for d in user.devices
    ]
    return {"user": {"id": user.id, "tg_id": user.tg_id}, "subscriptions": subs, "devices": devs}


@router.get("/plans")
async def webapp_list_plans(request: Request, db: AsyncSession = Depends(get_db)):
    """List active plans for Mini App. Bearer session token required."""
    tg_id = _get_tg_id_from_bearer(request)
    if not tg_id:
        raise HTTPException(
            status_code=401, detail={"code": "UNAUTHORIZED", "message": "Invalid session"}
        )
    result = await db.execute(select(Plan).order_by(Plan.id))
    plans = result.scalars().all()
    return {
        "items": [
            {
                "id": p.id,
                "name": p.name,
                "duration_days": p.duration_days,
                "price_currency": p.price_currency,
                "price_amount": float(p.price_amount),
            }
            for p in plans
        ],
        "total": len(plans),
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


@router.post("/devices/issue", response_model=WebAppIssueDeviceResponse)
async def webapp_issue_device(
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    """Issue a new device for the current user. Bearer session required. Returns one-time config."""
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
    adapter = request.app.state.node_runtime_adapter
    from app.services.topology_engine import TopologyEngine

    engine = TopologyEngine(adapter)
    get_topology = engine.get_topology
    try:
        out = await issue_device(
            db,
            user_id=user.id,
            subscription_id=sub.id,
            server_id=None,
            device_name=f"webapp_{tg_id}",
            get_topology=get_topology,
        )
    except Exception as e:
        from app.core.exceptions import LoadBalancerError, WireGuardCommandError

        if isinstance(e, LoadBalancerError):
            raise HTTPException(status_code=503, detail={"code": "NO_NODE", "message": str(e)})
        if isinstance(e, WireGuardCommandError):
            raise HTTPException(
                status_code=502, detail={"code": "NODE_PEER_FAILED", "message": str(e)}
            )
        if isinstance(e, ValueError):
            raise HTTPException(
                status_code=400,
                detail={"code": "ISSUE_FAILED", "message": str(e).replace("_", " ")},
            )
        raise
    await db.commit()
    await invalidate_devices_summary_cache()
    await db.refresh(out.device)
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
        select(func.count())
        .select_from(Referral)
        .where(Referral.referrer_user_id == user.id, Referral.reward_applied_at.isnot(None))
    )
    rewarded = rewarded_result.scalar() or 0
    return {"total_referrals": total, "rewards_applied": rewarded}


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
    server_result = await db.execute(select(Server).where(Server.is_active.is_(True)).limit(1))
    server = server_result.scalar_one_or_none()
    if not server:
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
        status="pending",
        amount=plan.price_amount,
        currency=plan.price_currency,
        external_id=external_id,
        webhook_payload={"promo_code": body.promo_code} if body.promo_code else None,
    )
    db.add(payment)
    await db.flush()
    await db.commit()
    await db.refresh(payment)
    star_count = max(1, int(plan.price_amount))
    return {
        "invoice_id": payment.id,
        "payment_id": payment.id,
        "title": plan.name or "VPN",
        "description": f"VPN plan, {plan.duration_days} days",
        "currency": "XTR",
        "star_count": star_count,
        "payload": payment.id,
        "server_id": server.id,
        "subscription_id": sub.id,
    }
