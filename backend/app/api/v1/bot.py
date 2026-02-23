"""Bot-facing API: create-or-get subscription, create-invoice (Stars stub), revoke own device, funnel events."""

from datetime import datetime, timezone

from fastapi import APIRouter, Depends, Header, HTTPException, Query, Request, status
from sqlalchemy import select
from sqlalchemy.dialects.postgresql import insert as pg_insert
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.bot_auth import BotPrincipal, get_admin_or_bot
from app.core.database import get_db
from app.models import Device, Payment, Plan, Referral, Server, Subscription, User
from app.schemas.bot import (
    BotEventRequest,
    BotRevokeDeviceRequest,
    CreateInvoiceRequest,
    CreateInvoiceResponse,
    CreateOrGetSubscriptionRequest,
    CreateOrGetSubscriptionResponse,
    PromoValidateRequest,
    ReferralAttachRequest,
)
from app.schemas.subscription import SubscriptionOut
from app.schemas.user import UserOut
from app.services.funnel_service import log_funnel_event

router = APIRouter(prefix="/bot", tags=["bot"])


def _require_bot(principal):  # noqa: ANN001
    if not isinstance(principal, BotPrincipal):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={"code": "FORBIDDEN", "message": "Bot only"},
        )


@router.post("/subscriptions/create-or-get", response_model=CreateOrGetSubscriptionResponse)
async def create_or_get_subscription(
    request: Request,
    body: CreateOrGetSubscriptionRequest,
    db: AsyncSession = Depends(get_db),
    principal=Depends(get_admin_or_bot),
):
    """Find/create user; return active or pending subscription for plan. Bot (X-API-Key) only."""
    _require_bot(principal)
    plan_result = await db.execute(select(Plan).where(Plan.id == body.plan_id))
    plan = plan_result.scalar_one_or_none()
    if not plan:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "PLAN_NOT_FOUND", "message": "Plan not found"},
        )
    plan_id = plan.id
    user_result = await db.execute(select(User).where(User.tg_id == body.tg_id))
    user = user_result.scalar_one_or_none()
    if not user:
        # Avoid unique constraint violations (and Postgres ERROR logs) under concurrent /create-or-get.
        # ON CONFLICT DO NOTHING is idempotent and race-safe.
        inserted_id = (
            await db.execute(
                pg_insert(User)
                .values(tg_id=body.tg_id)
                .on_conflict_do_nothing(index_elements=[User.tg_id])
                .returning(User.id)
            )
        ).scalar_one_or_none()
        user_result = await db.execute(select(User).where(User.tg_id == body.tg_id))
        user = user_result.scalar_one_or_none()
        if not user:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail={
                    "code": "USER_CREATE_RACE",
                    "message": "Concurrent user creation conflict, retry request",
                },
            )
        if inserted_id is not None:
            await log_funnel_event(
                db, event_type="start", user_id=user.id, payload={"tg_id": body.tg_id}
            )
    if user.is_banned:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={"code": "USER_BANNED", "message": "User is banned"},
        )
    # Serialize subscription selection/creation for this user to avoid duplicates under burst load.
    await db.execute(select(User.id).where(User.id == user.id).with_for_update())
    now = datetime.now(timezone.utc)
    sub_result = await db.execute(
        select(Subscription)
        .where(
            Subscription.user_id == user.id,
            Subscription.plan_id == plan_id,
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
                Subscription.plan_id == plan_id,
                Subscription.status == "pending",
            )
            .order_by(Subscription.created_at.desc())
            .limit(1)
        )
        sub = pending_result.scalar_one_or_none()
    if not sub:
        sub = Subscription(
            user_id=user.id,
            plan_id=plan_id,
            # Pending subscription carries no paid entitlement window until webhook completion.
            valid_from=now,
            valid_until=now,
            device_limit=1,
            status="pending",
        )
        db.add(sub)
        await db.flush()
    await db.commit()
    await db.refresh(user)
    await db.refresh(sub)
    return CreateOrGetSubscriptionResponse(
        user_id=user.id,
        user=UserOut.model_validate(user),
        subscription_id=sub.id,
        subscription=SubscriptionOut.model_validate(sub),
    )


@router.post("/payments/{provider}/create-invoice", response_model=CreateInvoiceResponse)
async def create_invoice(
    request: Request,
    provider: str,
    body: CreateInvoiceRequest,
    db: AsyncSession = Depends(get_db),
    principal=Depends(get_admin_or_bot),
    idempotency_key: str | None = Header(None, alias="Idempotency-Key"),
):
    """Create pending payment and return invoice payload for Telegram Stars (stub). Bot only."""
    _require_bot(principal)
    if provider != "telegram_stars":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"code": "UNSUPPORTED_PROVIDER", "message": f"Unsupported provider: {provider}"},
        )
    user_result = await db.execute(select(User).where(User.tg_id == body.tg_id))
    user = user_result.scalar_one_or_none()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "USER_NOT_FOUND", "message": "User not found"},
        )
    plan_result = await db.execute(select(Plan).where(Plan.id == body.plan_id))
    plan = plan_result.scalar_one_or_none()
    if not plan:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "PLAN_NOT_FOUND", "message": "Plan not found"},
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
        now = datetime.now(timezone.utc)
        sub_result = await db.execute(
            select(Subscription)
            .where(
                Subscription.user_id == user.id,
                Subscription.plan_id == body.plan_id,
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
                    Subscription.plan_id == body.plan_id,
                    Subscription.status == "pending",
                )
                .order_by(Subscription.created_at.desc())
                .limit(1)
            )
            sub = pending_result.scalar_one_or_none()
    if not sub:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={
                "code": "SUBSCRIPTION_NOT_FOUND",
                "message": "No subscription for this plan",
            },
        )
    server_result = await db.execute(select(Server).where(Server.is_active.is_(True)).limit(1))
    server = server_result.scalar_one_or_none()
    if not server:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail={"code": "SERVER_NOT_AVAILABLE", "message": "No server available"},
        )
    external_id = (
        f"bot:{provider}:{user.id}:{sub.id}:{idempotency_key or request.state.request_id or 'none'}"
    )
    payment = Payment(
        user_id=user.id,
        subscription_id=sub.id,
        provider=provider,
        status="pending",
        amount=plan.price_amount,
        currency=plan.price_currency,
        external_id=external_id,
        webhook_payload={"promo_code": body.promo_code} if body.promo_code else None,
    )
    db.add(payment)
    try:
        await db.flush()
        await db.commit()
        await db.refresh(payment)
    except IntegrityError:
        # Idempotency-Key replay / duplicate external_id: return the existing pending payment.
        await db.rollback()
        existing = (
            await db.execute(
                select(Payment)
                .where(Payment.external_id == external_id)
                .options(
                    selectinload(Payment.subscription).selectinload(Subscription.plan),
                )
            )
        ).scalar_one_or_none()
        if not existing:
            raise
        payment = existing
    star_count = max(1, int(plan.price_amount))
    return CreateInvoiceResponse(
        invoice_id=payment.id,
        payment_id=payment.id,
        title=plan.name or "VPN",
        description=f"VPN plan, {plan.duration_days} days",
        currency="XTR",
        star_count=star_count,
        payload=payment.id,
        server_id=server.id,
        subscription_id=sub.id,
    )


@router.get("/payments/{payment_id}/invoice", response_model=CreateInvoiceResponse)
async def get_payment_invoice(
    payment_id: str,
    tg_id: int = Query(..., description="Telegram user id"),
    db: AsyncSession = Depends(get_db),
    principal=Depends(get_admin_or_bot),
):
    """Return invoice payload for an existing pending payment (e.g. from Mini App deep link). Bot only."""
    _require_bot(principal)
    result = await db.execute(
        select(Payment)
        .where(Payment.id == payment_id, Payment.status == "pending")
        .options(
            selectinload(Payment.user),
            selectinload(Payment.subscription).selectinload(Subscription.plan),
        )
    )
    payment = result.scalar_one_or_none()
    if not payment or payment.user.tg_id != tg_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "PAYMENT_NOT_FOUND", "message": "Payment not found or not pending"},
        )
    plan = payment.subscription.plan
    server_result = await db.execute(select(Server).where(Server.is_active.is_(True)).limit(1))
    server = server_result.scalar_one_or_none()
    server_id = server.id if server else ""
    return CreateInvoiceResponse(
        invoice_id=payment.id,
        payment_id=payment.id,
        title=plan.name or "VPN",
        description=f"VPN plan, {plan.duration_days} days",
        currency="XTR",
        star_count=max(1, int(payment.amount)),
        payload=payment.id,
        server_id=server_id,
        subscription_id=payment.subscription_id,
    )


@router.post("/devices/{device_id}/revoke")
async def bot_revoke_device(
    request: Request,
    device_id: str,
    body: BotRevokeDeviceRequest,
    db: AsyncSession = Depends(get_db),
    principal=Depends(get_admin_or_bot),
):
    """Revoke own device: verify device belongs to user by tg_id, then set revoked_at. Bot only."""
    _require_bot(principal)
    user_result = await db.execute(select(User).where(User.tg_id == body.tg_id))
    user = user_result.scalar_one_or_none()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "USER_NOT_FOUND", "message": "User not found"},
        )
    device_result = await db.execute(
        select(Device).where(Device.id == device_id, Device.user_id == user.id)
    )
    device = device_result.scalar_one_or_none()
    if not device:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "DEVICE_NOT_FOUND", "message": "Device not found or not yours"},
        )
    if device.revoked_at:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"code": "ALREADY_REVOKED", "message": "Device already revoked"},
        )
    device.revoked_at = datetime.now(timezone.utc)
    request.state.audit_resource_type = "device"
    request.state.audit_resource_id = device.id
    request.state.audit_old_new = {"revoked": {"user_id": user.id}}
    await db.commit()
    await db.refresh(device)
    return {"status": "ok", "message": "Device revoked"}


@router.post("/events")
async def bot_events(
    body: BotEventRequest,
    db: AsyncSession = Depends(get_db),
    principal=Depends(get_admin_or_bot),
):
    """Log funnel event from bot/WebApp. Bot only."""
    _require_bot(principal)
    user_result = await db.execute(select(User).where(User.tg_id == body.tg_id))
    user = user_result.scalar_one_or_none()
    user_id = user.id if user else None
    await log_funnel_event(
        db,
        event_type=body.event_type,
        user_id=user_id,
        payload=body.payload or {},
    )
    await db.commit()
    return {"status": "ok"}


@router.get("/referral/my-link")
async def referral_my_link(
    tg_id: int = Query(..., description="Telegram user id"),
    db: AsyncSession = Depends(get_db),
    principal=Depends(get_admin_or_bot),
):
    """Return referral link for user (ref_<user_id>). Bot only."""
    _require_bot(principal)
    user_result = await db.execute(select(User).where(User.tg_id == tg_id))
    user = user_result.scalar_one_or_none()
    if not user:
        raise HTTPException(
            status_code=404, detail={"code": "USER_NOT_FOUND", "message": "User not found"}
        )
    code = str(user.id)
    return {"referral_code": code, "payload": f"ref_{code}"}


@router.post("/referral/attach")
async def referral_attach(
    body: ReferralAttachRequest,
    db: AsyncSession = Depends(get_db),
    principal=Depends(get_admin_or_bot),
):
    """Attach referee (tg_id) to referrer (referral_code). Idempotent. Bot only."""
    _require_bot(principal)
    tg_id = body.tg_id
    referral_code = body.referral_code
    if not referral_code:
        raise HTTPException(
            status_code=400,
            detail={"code": "BAD_REQUEST", "message": "tg_id and referral_code required"},
        )
    try:
        referrer_user_id = int(str(referral_code).strip())
    except ValueError:
        raise HTTPException(
            status_code=400, detail={"code": "BAD_REQUEST", "message": "Invalid referral_code"}
        )
    referee_result = await db.execute(select(User).where(User.tg_id == tg_id))
    referee = referee_result.scalar_one_or_none()
    if not referee:
        raise HTTPException(
            status_code=404, detail={"code": "USER_NOT_FOUND", "message": "User not found"}
        )
    if referrer_user_id == referee.id:
        raise HTTPException(
            status_code=400, detail={"code": "BAD_REQUEST", "message": "Cannot refer self"}
        )
    referrer_result = await db.execute(select(User).where(User.id == referrer_user_id))
    if referrer_result.scalar_one_or_none() is None:
        raise HTTPException(
            status_code=404, detail={"code": "NOT_FOUND", "message": "Referrer not found"}
        )
    existing = await db.execute(select(Referral).where(Referral.referee_user_id == referee.id))
    if existing.scalar_one_or_none():
        await db.commit()
        return {"status": "ok", "attached": False}
    r = Referral(
        referrer_user_id=referrer_user_id,
        referee_user_id=referee.id,
        referral_code=str(referral_code),
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
    return {"status": "ok", "attached": True}


@router.post("/promo/validate")
async def promo_validate(
    body: PromoValidateRequest,
    db: AsyncSession = Depends(get_db),
    principal=Depends(get_admin_or_bot),
):
    """Validate promo code for plan and user; return preview (discount/bonus). Bot only."""
    _require_bot(principal)
    from datetime import datetime

    from app.models import PromoCode, PromoRedemption

    result = await db.execute(
        select(PromoCode).where(PromoCode.code == body.code.strip(), PromoCode.status == "active")
    )
    promo = result.scalar_one_or_none()
    if not promo:
        raise HTTPException(
            status_code=404,
            detail={"code": "PROMO_NOT_FOUND", "message": "Invalid or expired code"},
        )
    constraints = promo.constraints or {}
    if constraints.get("expires_at"):
        try:
            exp = datetime.fromisoformat(constraints["expires_at"].replace("Z", "+00:00"))
            if exp < datetime.now(timezone.utc):
                raise HTTPException(
                    status_code=400, detail={"code": "PROMO_EXPIRED", "message": "Code expired"}
                )
        except (TypeError, ValueError):
            pass
    user_result = await db.execute(select(User).where(User.tg_id == body.tg_id))
    user = user_result.scalar_one_or_none()
    if not user:
        raise HTTPException(
            status_code=404, detail={"code": "USER_NOT_FOUND", "message": "User not found"}
        )
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


@router.get("/referral/stats")
async def referral_stats(
    tg_id: int = Query(..., description="Telegram user id"),
    db: AsyncSession = Depends(get_db),
    principal=Depends(get_admin_or_bot),
):
    """Return referral stats for user. Bot only."""
    _require_bot(principal)
    user_result = await db.execute(select(User).where(User.tg_id == tg_id))
    user = user_result.scalar_one_or_none()
    if not user:
        raise HTTPException(
            status_code=404, detail={"code": "USER_NOT_FOUND", "message": "User not found"}
        )
    from sqlalchemy import func

    count_result = await db.execute(
        select(func.count()).select_from(Referral).where(Referral.referrer_user_id == user.id)
    )
    count = count_result.scalar() or 0
    rewarded_result = await db.execute(
        select(func.count())
        .select_from(Referral)
        .where(Referral.referrer_user_id == user.id, Referral.reward_applied_at.isnot(None))
    )
    rewarded = rewarded_result.scalar() or 0
    return {"total_referrals": count, "rewards_applied": rewarded}
