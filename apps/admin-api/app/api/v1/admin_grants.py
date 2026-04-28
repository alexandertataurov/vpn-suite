"""Admin grants: manual trial, subscription extension, and user-scoped discounts."""

from __future__ import annotations

from datetime import datetime, timedelta, timezone
from decimal import Decimal

import httpx
from fastapi import APIRouter, Depends, HTTPException, Request, status
from pydantic import BaseModel, Field, model_validator
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.constants import PERM_PRICING_WRITE, PERM_SUBSCRIPTIONS_WRITE
from app.core.database import get_db
from app.core.news_broadcast_task import send_telegram_message
from app.core.rbac import require_permission
from app.models import EntitlementEvent, Plan, PromoCode, Subscription, User
from app.schemas.subscription import SubscriptionOut
from app.services.subscription_state import normalize_active_state

router = APIRouter(prefix="/admin/grants", tags=["admin-grants"])


class TrialGrantRequest(BaseModel):
    user_id: int
    plan_id: str
    duration_hours: int = Field(..., ge=1, le=24 * 30)
    device_limit: int = Field(default=1, ge=1, le=20)
    notify_user: bool = False


class ExtensionGrantRequest(BaseModel):
    user_id: int
    subscription_id: str
    days: int = Field(..., ge=1, le=365)
    reason: str = Field(..., min_length=2, max_length=160)
    notify_user: bool = False


class DiscountGrantRequest(BaseModel):
    user_id: int
    valid_until: datetime
    discount_percent: int | None = Field(default=None, ge=1, le=100)
    fixed_amount_xtr: int | None = Field(default=None, ge=1, le=100_000)
    plan_ids: list[str] | None = None
    notify_user: bool = False

    @model_validator(mode="after")
    def validate_discount_shape(self) -> DiscountGrantRequest:
        if (self.discount_percent is None) == (self.fixed_amount_xtr is None):
            raise ValueError("Provide exactly one of discount_percent or fixed_amount_xtr")
        return self


class GrantResponse(BaseModel):
    status: str
    user_id: int
    subscription: SubscriptionOut | None = None
    promo_code: str | None = None
    event_id: str | None = None
    notified: bool = False


async def _get_user(db: AsyncSession, user_id: int) -> User:
    user = (await db.execute(select(User).where(User.id == user_id))).scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    return user


async def _notify_user(user: User, text: str) -> bool:
    if not user.tg_id:
        return False
    token = (getattr(settings, "telegram_bot_token", None) or "").strip()
    if not token:
        return False
    async with httpx.AsyncClient(timeout=10.0) as client:
        ok, _ = await send_telegram_message(
            client,
            token=token,
            tg_id=int(user.tg_id),
            text=text,
            parse_mode=None,
        )
    return ok


@router.post("/trial", response_model=GrantResponse)
async def grant_trial(
    request: Request,
    body: TrialGrantRequest,
    db: AsyncSession = Depends(get_db),
    _admin=Depends(require_permission(PERM_SUBSCRIPTIONS_WRITE)),
):
    user = await _get_user(db, body.user_id)
    plan = (await db.execute(select(Plan).where(Plan.id == body.plan_id))).scalar_one_or_none()
    if not plan:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Plan not found")

    now = datetime.now(timezone.utc)
    existing = (
        await db.execute(
            select(Subscription)
            .where(
                Subscription.user_id == body.user_id,
                Subscription.plan_id == body.plan_id,
                Subscription.is_trial.is_(True),
            )
            .order_by(Subscription.valid_until.desc())
        )
    ).scalar_one_or_none()
    base_until = max(existing.valid_until if existing else now, now)
    valid_until = base_until + timedelta(hours=body.duration_hours)

    if existing:
        sub = existing
        sub.valid_until = valid_until
        sub.trial_ends_at = valid_until
        sub.device_limit = body.device_limit
        normalize_active_state(sub)
        event_type = "trial_grant_extended"
    else:
        sub = Subscription(
            user_id=body.user_id,
            plan_id=body.plan_id,
            valid_from=now,
            valid_until=valid_until,
            device_limit=body.device_limit,
            is_trial=True,
            trial_ends_at=valid_until,
            auto_renew=False,
            billing_status="trial",
            renewal_status="manual",
        )
        normalize_active_state(sub)
        db.add(sub)
        event_type = "trial_grant_created"

    await db.flush()
    event = EntitlementEvent(
        user_id=body.user_id,
        subscription_id=sub.id,
        event_type=event_type,
        payload={"duration_hours": body.duration_hours, "plan_id": body.plan_id},
    )
    db.add(event)
    await db.flush()
    notified = await _notify_user(
        user,
        f"A free trial has been added to your account until {valid_until.date().isoformat()}.",
    ) if body.notify_user else False
    request.state.audit_resource_type = "grant_trial"
    request.state.audit_resource_id = str(body.user_id)
    request.state.audit_old_new = {"created": event.payload}
    await db.commit()
    await db.refresh(sub)
    return GrantResponse(
        status="granted",
        user_id=body.user_id,
        subscription=SubscriptionOut.model_validate(sub),
        event_id=event.id,
        notified=notified,
    )


@router.post("/extension", response_model=GrantResponse)
async def grant_extension(
    request: Request,
    body: ExtensionGrantRequest,
    db: AsyncSession = Depends(get_db),
    _admin=Depends(require_permission(PERM_SUBSCRIPTIONS_WRITE)),
):
    user = await _get_user(db, body.user_id)
    sub = (
        await db.execute(
            select(Subscription).where(
                Subscription.id == body.subscription_id,
                Subscription.user_id == body.user_id,
            )
        )
    ).scalar_one_or_none()
    if not sub:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Subscription not found")

    now = datetime.now(timezone.utc)
    old_until = sub.valid_until
    sub.valid_until = max(sub.valid_until, now) + timedelta(days=body.days)
    normalize_active_state(sub)
    event = EntitlementEvent(
        user_id=body.user_id,
        subscription_id=sub.id,
        event_type="subscription_extension_granted",
        payload={"days": body.days, "reason": body.reason, "old_valid_until": old_until.isoformat()},
    )
    db.add(event)
    await db.flush()
    notified = await _notify_user(
        user,
        f"Your VPN subscription has been extended by {body.days} days.",
    ) if body.notify_user else False
    request.state.audit_resource_type = "grant_extension"
    request.state.audit_resource_id = sub.id
    request.state.audit_old_new = {"old": {"valid_until": old_until.isoformat()}, "new": event.payload}
    await db.commit()
    await db.refresh(sub)
    return GrantResponse(
        status="granted",
        user_id=body.user_id,
        subscription=SubscriptionOut.model_validate(sub),
        event_id=event.id,
        notified=notified,
    )


@router.post("/discount", response_model=GrantResponse)
async def grant_discount(
    request: Request,
    body: DiscountGrantRequest,
    db: AsyncSession = Depends(get_db),
    _admin=Depends(require_permission(PERM_PRICING_WRITE)),
):
    user = await _get_user(db, body.user_id)
    now = datetime.now(timezone.utc)
    valid_until = body.valid_until if body.valid_until.tzinfo else body.valid_until.replace(tzinfo=timezone.utc)
    if valid_until <= now:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="valid_until must be in the future")
    code = f"USER{body.user_id}-{now.strftime('%Y%m%d%H%M%S')}"
    if body.plan_ids:
        plans = (await db.execute(select(Plan.id).where(Plan.id.in_(body.plan_ids)))).scalars().all()
        if len(set(plans)) != len(set(body.plan_ids)):
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="One or more plans were not found")

    promo = PromoCode(
        code=code,
        type="percent" if body.discount_percent is not None else "fixed_xtr",
        value=Decimal(str(body.discount_percent if body.discount_percent is not None else body.fixed_amount_xtr)),
        discount_xtr=int(body.fixed_amount_xtr or 0),
        max_uses_per_user=1,
        global_use_limit=1,
        is_active=True,
        status="active",
        expires_at=valid_until,
        applicable_plan_ids=body.plan_ids,
        constraints={"user_ids": [body.user_id], "source": "admin_grant"},
    )
    db.add(promo)
    event = EntitlementEvent(
        user_id=body.user_id,
        subscription_id=None,
        event_type="discount_granted",
        payload={
            "promo_code": code,
            "discount_percent": body.discount_percent,
            "fixed_amount_xtr": body.fixed_amount_xtr,
            "valid_until": valid_until.isoformat(),
            "plan_ids": body.plan_ids or [],
        },
    )
    db.add(event)
    await db.flush()
    notified = await _notify_user(
        user,
        f"A discount code has been added to your account: {code}",
    ) if body.notify_user else False
    request.state.audit_resource_type = "grant_discount"
    request.state.audit_resource_id = code
    request.state.audit_old_new = {"created": event.payload}
    await db.commit()
    return GrantResponse(
        status="granted",
        user_id=body.user_id,
        promo_code=code,
        event_id=event.id,
        notified=notified,
    )
