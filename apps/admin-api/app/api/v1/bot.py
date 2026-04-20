"""Bot-facing API: create-or-get subscription, create-invoice (Stars stub), revoke own device, funnel events."""

from datetime import datetime, timezone

from fastapi import APIRouter, Depends, Header, HTTPException, Query, Request, status
from sqlalchemy import select
from sqlalchemy.dialects.postgresql import insert as pg_insert
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.bot_auth import BotPrincipal, get_admin_or_bot_only
from app.core.config import settings
from app.core.database import get_db
from app.core.metrics import vpn_revenue_churn_total
from app.core.telegram_user import build_tg_requisites
from app.models import (
    ChurnSurvey,
    Device,
    Payment,
    Plan,
    Referral,
    Server,
    Subscription,
    User,
)
from app.schemas.bot import (
    BotEventRequest,
    BotRevokeDeviceRequest,
    ChurnSurveyRequest,
    ChurnSurveyResponse,
    CreateDonationInvoiceRequest,
    CreateInvoiceRequest,
    CreateInvoiceResponse,
    CreateOrGetSubscriptionRequest,
    CreateOrGetSubscriptionResponse,
    PromoValidateRequest,
    ReferralAttachRequest,
    TelegramStarsConfirmRequest,
    TrialStartRequest,
    TrialStartResponse,
)
from app.schemas.subscription import SubscriptionOut
from app.schemas.user import UserOut
from app.services.funnel_service import log_funnel_event
from app.services.issued_config_service import persist_issued_configs
from app.services.payment_webhook_service import complete_pending_payment_by_bot
from app.services.retention_service import pause_subscription, retention_discount_percent
from app.services.subscription_state import (
    apply_subscription_cycle,
    commercially_active_where,
    normalize_pending_state,
)
from app.services.topology_engine import TopologyEngine
from app.services.trial_service import start_trial

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
    principal=Depends(get_admin_or_bot_only),
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
    if body.telegram_user:
        requisites = build_tg_requisites(body.telegram_user)
        if requisites:
            meta = user.meta or {}
            meta["tg"] = requisites
            user.meta = meta
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
            *commercially_active_where(now=now),
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
            device_limit=int(getattr(plan, "device_limit", 1) or 1),
            auto_renew=False,
        )
        normalize_pending_state(sub)
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
    principal=Depends(get_admin_or_bot_only),
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
                *commercially_active_where(now=now),
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
    is_free = plan.price_amount is not None and int(plan.price_amount) <= 0
    payment = Payment(
        user_id=user.id,
        subscription_id=sub.id,
        provider=provider,
        status="completed" if is_free else "pending",
        amount=plan.price_amount,
        currency=plan.price_currency,
        external_id=external_id,
        webhook_payload={"promo_code": body.promo_code} if body.promo_code else None,
    )
    db.add(payment)
    try:
        await db.flush()
        if is_free and sub.status != "active":
            now = datetime.now(timezone.utc)
            apply_subscription_cycle(
                sub,
                now=now,
                duration_days=plan.duration_days,
                device_limit=int(
                    getattr(plan, "device_limit", sub.device_limit) or sub.device_limit
                ),
            )
        await db.commit()
        await db.refresh(payment)
        await db.refresh(sub)
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
        sub = existing.subscription
        plan = sub.plan
        is_free = existing.status == "completed" and int(existing.amount or 0) <= 0
    star_count = 0 if is_free else max(1, int(plan.price_amount))
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
        free_activation=is_free,
    )


@router.post("/payments/telegram_stars/create-donation-invoice", response_model=CreateInvoiceResponse)
async def create_donation_invoice(
    request: Request,
    body: CreateDonationInvoiceRequest,
    db: AsyncSession = Depends(get_db),
    principal=Depends(get_admin_or_bot_only),
    idempotency_key: str | None = Header(None, alias="Idempotency-Key"),
):
    """Create a pending donation payment (Stars) for an existing subscription. Bot only."""
    _require_bot(principal)
    star_count = int(body.star_count or 0)
    if star_count <= 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"code": "BAD_REQUEST", "message": "star_count must be > 0"},
        )
    user_result = await db.execute(select(User).where(User.tg_id == body.tg_id))
    user = user_result.scalar_one_or_none()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "USER_NOT_FOUND", "message": "User not found"},
        )
    sub = None
    if body.subscription_id:
        sub_result = await db.execute(
            select(Subscription).where(
                Subscription.id == body.subscription_id,
                Subscription.user_id == user.id,
            )
        )
        sub = sub_result.scalar_one_or_none()
    if not sub:
        sub_result = await db.execute(
            select(Subscription)
            .where(Subscription.user_id == user.id)
            .order_by(Subscription.created_at.desc())
            .limit(1)
        )
        sub = sub_result.scalar_one_or_none()
    if not sub:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "SUBSCRIPTION_NOT_FOUND", "message": "No subscription found for user"},
        )
    external_id = (
        f"bot:telegram_stars:donation:{user.id}:{sub.id}:{idempotency_key or request.state.request_id or 'none'}"
    )
    payment = Payment(
        user_id=user.id,
        subscription_id=sub.id,
        provider="telegram_stars",
        status="pending",
        amount=star_count,
        currency="XTR",
        external_id=external_id,
        webhook_payload={"kind": "donation", "star_count": star_count},
    )
    db.add(payment)
    try:
        await db.flush()
        await db.commit()
        await db.refresh(payment)
        await db.refresh(sub)
    except IntegrityError:
        await db.rollback()
        existing = (
            await db.execute(select(Payment).where(Payment.external_id == external_id))
        ).scalar_one_or_none()
        if not existing:
            raise
        payment = existing
    return CreateInvoiceResponse(
        invoice_id=payment.id,
        payment_id=payment.id,
        title="Donation",
        description="Support the project",
        currency="XTR",
        star_count=star_count,
        payload=payment.id,
        server_id="",
        subscription_id=sub.id,
        free_activation=False,
    )


@router.post("/payments/telegram-stars-confirm")
async def telegram_stars_confirm(
    body: TelegramStarsConfirmRequest,
    db: AsyncSession = Depends(get_db),
    principal=Depends(get_admin_or_bot_only),
):
    """Confirm payment when bot receives successful_payment from Telegram (Stars). Idempotent. Bot only."""
    _require_bot(principal)
    ok = await complete_pending_payment_by_bot(
        db,
        payment_id=body.invoice_payload,
        tg_id=body.tg_id,
        telegram_payment_charge_id=body.telegram_payment_charge_id,
    )
    if not ok:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={
                "code": "PAYMENT_NOT_FOUND",
                "message": "Payment not found or already completed",
            },
        )
    await db.commit()
    return {"status": "ok", "payment_id": body.invoice_payload}


@router.get("/payments/{payment_id}/invoice", response_model=CreateInvoiceResponse)
async def get_payment_invoice(
    payment_id: str,
    tg_id: int = Query(..., description="Telegram user id"),
    db: AsyncSession = Depends(get_db),
    principal=Depends(get_admin_or_bot_only),
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
    amount_int = int(payment.amount or 0)
    free_activation = amount_int <= 0
    return CreateInvoiceResponse(
        invoice_id=payment.id,
        payment_id=payment.id,
        title=plan.name or "VPN",
        description=f"VPN plan, {plan.duration_days} days",
        currency="XTR",
        star_count=0 if free_activation else max(1, amount_int),
        payload=payment.id,
        server_id=server_id,
        subscription_id=payment.subscription_id,
        free_activation=free_activation,
    )


@router.post("/devices/{device_id}/revoke")
async def bot_revoke_device(
    request: Request,
    device_id: str,
    body: BotRevokeDeviceRequest,
    db: AsyncSession = Depends(get_db),
    principal=Depends(get_admin_or_bot_only),
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
    principal=Depends(get_admin_or_bot_only),
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
    principal=Depends(get_admin_or_bot_only),
):
    """Return referral link for user (ref_<user_id>). Create user if not found. Bot only."""
    _require_bot(principal)
    user_result = await db.execute(select(User).where(User.tg_id == tg_id))
    user = user_result.scalar_one_or_none()
    if not user:
        await db.execute(
            pg_insert(User).values(tg_id=tg_id).on_conflict_do_nothing(index_elements=[User.tg_id])
        )
        user_result = await db.execute(select(User).where(User.tg_id == tg_id))
        user = user_result.scalar_one_or_none()
    if not user:
        raise HTTPException(
            status_code=409,
            detail={"code": "USER_CREATE_RACE", "message": "Retry request"},
        )
    code = str(user.id)
    bot_username = (settings.telegram_bot_username or "").strip() or None
    return {"referral_code": code, "payload": f"ref_{code}", "bot_username": bot_username}


@router.post("/referral/attach")
async def referral_attach(
    body: ReferralAttachRequest,
    db: AsyncSession = Depends(get_db),
    principal=Depends(get_admin_or_bot_only),
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
    principal=Depends(get_admin_or_bot_only),
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
    principal=Depends(get_admin_or_bot_only),
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
    # Days earned this month (for "Earn Free VPN Days" screen)
    start_of_month = datetime.now(timezone.utc).replace(
        day=1, hour=0, minute=0, second=0, microsecond=0
    )
    days_result = await db.execute(
        select(func.coalesce(func.sum(Referral.reward_days), 0))
        .select_from(Referral)
        .where(
            Referral.referrer_user_id == user.id,
            Referral.reward_applied_at.isnot(None),
            Referral.reward_applied_at >= start_of_month,
        )
    )
    days_earned_this_month = int(days_result.scalar() or 0)
    return {
        "total_referrals": count,
        "rewards_applied": rewarded,
        "days_earned_this_month": days_earned_this_month,
    }


@router.post("/trial/start", response_model=TrialStartResponse)
async def bot_trial_start(
    request: Request,
    body: TrialStartRequest,
    db: AsyncSession = Depends(get_db),
    principal=Depends(get_admin_or_bot_only),
):
    """Start trial: create user if needed, one trial sub + one device, return configs. Bot only."""
    _require_bot(principal)
    tg_id = body.tg_id
    adapter = getattr(request.app.state, "node_runtime_adapter", None)
    if adapter is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail={"code": "UNAVAILABLE", "message": "Trial service not configured"},
        )
    engine = TopologyEngine(adapter)
    get_topology = engine.get_topology
    try:
        result = await start_trial(
            db,
            tg_id=tg_id,
            get_topology=get_topology,
            runtime_adapter=adapter,
        )
    except ValueError as e:
        code = str(e).replace(" ", "_").lower()[:32]
        if "trial_already_used" in code:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail={"code": "TRIAL_ALREADY_USED", "message": "Trial already used"},
            ) from e
        if "trial_plan_not_found" in code:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail={"code": "TRIAL_PLAN_NOT_FOUND", "message": "No trial plan configured"},
            ) from e
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"code": "BAD_REQUEST", "message": str(e).replace("_", " ")},
        ) from e
    await persist_issued_configs(
        db,
        device_id=result.device_id,
        server_id=result.server_id,
        config_awg=result.config_awg,
        config_wg_obf=result.config_wg_obf,
        config_wg=result.config_wg,
    )
    await db.commit()
    return TrialStartResponse(
        subscription_id=result.subscription_id,
        device_id=result.device_id,
        server_id=result.server_id,
        server_name=result.server_name,
        server_region=result.server_region,
        config_awg=result.config_awg,
        config_wg_obf=result.config_wg_obf,
        config_wg=result.config_wg,
        trial_ends_at=result.trial_ends_at.isoformat(),
        peer_created=result.peer_created,
    )


@router.post("/churn-survey", response_model=ChurnSurveyResponse)
async def bot_churn_survey(
    body: ChurnSurveyRequest,
    db: AsyncSession = Depends(get_db),
    principal=Depends(get_admin_or_bot_only),
):
    """Record churn reason; offer retention discount or pause. Bot only."""
    _require_bot(principal)
    user_result = await db.execute(select(User).where(User.tg_id == body.tg_id))
    user = user_result.scalar_one_or_none()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "USER_NOT_FOUND", "message": "User not found"},
        )
    reason = (body.reason or "").strip().lower().replace(" ", "_")[:32] or "other"
    if reason not in ("too_expensive", "speed_issue", "not_needed", "other"):
        reason = "other"
    subscription_id = body.subscription_id
    if subscription_id:
        sub_result = await db.execute(
            select(Subscription).where(
                Subscription.id == subscription_id,
                Subscription.user_id == user.id,
            )
        )
        if sub_result.scalar_one_or_none() is None:
            subscription_id = None
    discount_offered = reason == "too_expensive"
    if discount_offered:
        try:
            vpn_revenue_churn_total.labels(reason=reason[:32]).inc()
        except Exception:
            pass
        survey = ChurnSurvey(
            user_id=user.id,
            subscription_id=subscription_id,
            reason=reason,
            discount_offered=True,
        )
        db.add(survey)
        await db.flush()
        await db.commit()
        return ChurnSurveyResponse(
            recorded=True,
            retention_discount_offered=True,
            pause_offered=False,
            discount_percent=retention_discount_percent(),
        )
    if reason == "not_needed" and subscription_id:
        try:
            vpn_revenue_churn_total.labels(reason=reason[:32]).inc()
        except Exception:
            pass
        await pause_subscription(
            db,
            subscription_id=subscription_id,
            user_id=user.id,
            reason=reason,
        )
        survey = ChurnSurvey(
            user_id=user.id,
            subscription_id=subscription_id,
            reason=reason,
            discount_offered=False,
        )
        db.add(survey)
        await db.commit()
        return ChurnSurveyResponse(
            recorded=True,
            retention_discount_offered=False,
            pause_offered=True,
        )
    survey = ChurnSurvey(
        user_id=user.id,
        subscription_id=subscription_id,
        reason=reason,
        discount_offered=False,
    )
    db.add(survey)
    try:
        vpn_revenue_churn_total.labels(reason=reason[:32]).inc()
    except Exception:
        pass
    await db.commit()
    return ChurnSurveyResponse(recorded=True, retention_discount_offered=False, pause_offered=False)
