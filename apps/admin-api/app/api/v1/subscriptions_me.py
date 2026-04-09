"""Subscription self-service endpoints for WebApp users (Bearer auth).

Admin subscription endpoints live in app.api.v1.subscriptions and require RBAC permission.
These endpoints are scoped to the current Telegram user (tg_id from webapp bearer token).
"""

from __future__ import annotations

from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Request, status
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import decode_token
from app.models import Subscription, User
from app.services.subscription_state import commercially_active_where

router = APIRouter(prefix="/subscriptions", tags=["subscriptions"])

_USER_META_AUTO_RENEW_DEFAULT_KEY = "webapp_auto_renew_default"


class SubscriptionMeUpdateBody(BaseModel):
    auto_renew: bool


def _get_tg_id_from_bearer(request: Request) -> int | None:
    auth = request.headers.get("Authorization") or ""
    if not auth.startswith("Bearer "):
        return None
    payload = decode_token(auth[7:])
    if payload and payload.get("type") == "webapp" and payload.get("sub"):
        try:
            return int(payload["sub"])
        except (ValueError, TypeError):
            return None
    return None


@router.patch("/me")
async def update_my_subscription(
    request: Request,
    body: SubscriptionMeUpdateBody,
    db: AsyncSession = Depends(get_db),
):
    """Update current user's subscription preferences (currently: auto_renew)."""
    tg_id = _get_tg_id_from_bearer(request)
    if not tg_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"code": "UNAUTHORIZED", "message": "Invalid session"},
        )

    user_result = await db.execute(select(User).where(User.tg_id == tg_id))
    user = user_result.scalar_one_or_none()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "USER_NOT_FOUND", "message": "User not found"},
        )

    now = datetime.now(timezone.utc)
    sub_result = await db.execute(
        select(Subscription)
        .where(
            Subscription.user_id == user.id,
            *commercially_active_where(now=now),
        )
        .order_by(Subscription.valid_until.desc())
        .limit(1)
    )
    sub = sub_result.scalar_one_or_none()
    if not sub:
        latest_result = await db.execute(
            select(Subscription)
            .where(Subscription.user_id == user.id)
            .order_by(Subscription.created_at.desc())
            .limit(1)
        )
        sub = latest_result.scalar_one_or_none()

    if sub:
        sub.auto_renew = bool(body.auto_renew)

    # Persist preference for future subscriptions even when no subscription exists yet.
    meta = dict(user.meta or {})
    meta[_USER_META_AUTO_RENEW_DEFAULT_KEY] = bool(body.auto_renew)
    user.meta = meta

    await db.commit()
    return {"auto_renew": bool(body.auto_renew)}
