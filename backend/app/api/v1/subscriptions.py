"""Subscriptions API: CRUD (create, extend, device_limit)."""

from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.constants import PERM_SUBSCRIPTIONS_READ, PERM_SUBSCRIPTIONS_WRITE
from app.core.database import get_db
from app.core.rbac import require_permission
from app.models import Plan, Subscription, User
from app.schemas.subscription import (
    SubscriptionCreate,
    SubscriptionList,
    SubscriptionOut,
    SubscriptionUpdate,
)
from app.services.subscription_state import apply_state_overrides, normalize_active_state

router = APIRouter(prefix="/subscriptions", tags=["subscriptions"])


@router.post("", response_model=SubscriptionOut, status_code=status.HTTP_201_CREATED)
async def create_subscription(
    request: Request,
    body: SubscriptionCreate,
    db: AsyncSession = Depends(get_db),
    admin=Depends(require_permission(PERM_SUBSCRIPTIONS_WRITE)),
):
    if (await db.execute(select(User).where(User.id == body.user_id))).scalar_one_or_none() is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    if (await db.execute(select(Plan).where(Plan.id == body.plan_id))).scalar_one_or_none() is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Plan not found")
    sub = Subscription(
        user_id=body.user_id,
        plan_id=body.plan_id,
        valid_from=body.valid_from,
        valid_until=body.valid_until,
        device_limit=body.device_limit,
    )
    normalize_active_state(sub)
    db.add(sub)
    await db.flush()
    request.state.audit_resource_type = "subscription"
    request.state.audit_resource_id = sub.id
    request.state.audit_old_new = {"created": {"user_id": sub.user_id, "plan_id": sub.plan_id}}
    await db.commit()
    await db.refresh(sub)
    return sub


@router.get("", response_model=SubscriptionList)
async def list_subscriptions(
    db: AsyncSession = Depends(get_db),
    _admin=Depends(require_permission(PERM_SUBSCRIPTIONS_READ)),
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    user_id: int | None = Query(None),
    plan_id: str | None = Query(None),
):
    stmt = select(Subscription)
    count_stmt = select(func.count()).select_from(Subscription)
    if user_id is not None:
        stmt = stmt.where(Subscription.user_id == user_id)
        count_stmt = count_stmt.where(Subscription.user_id == user_id)
    if plan_id is not None:
        stmt = stmt.where(Subscription.plan_id == plan_id)
        count_stmt = count_stmt.where(Subscription.plan_id == plan_id)
    total = (await db.execute(count_stmt)).scalar() or 0
    result = await db.execute(
        stmt.order_by(Subscription.created_at.desc()).limit(limit).offset(offset)
    )
    rows = result.scalars().all()
    return SubscriptionList(items=[SubscriptionOut.model_validate(r) for r in rows], total=total)


@router.get("/{subscription_id}", response_model=SubscriptionOut)
async def get_subscription(
    subscription_id: str,
    db: AsyncSession = Depends(get_db),
    _admin=Depends(require_permission(PERM_SUBSCRIPTIONS_READ)),
):
    result = await db.execute(select(Subscription).where(Subscription.id == subscription_id))
    sub = result.scalar_one_or_none()
    if not sub:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Subscription not found")
    return sub


@router.patch("/{subscription_id}", response_model=SubscriptionOut)
async def update_subscription(
    request: Request,
    subscription_id: str,
    body: SubscriptionUpdate,
    db: AsyncSession = Depends(get_db),
    admin=Depends(require_permission(PERM_SUBSCRIPTIONS_WRITE)),
):
    result = await db.execute(select(Subscription).where(Subscription.id == subscription_id))
    sub = result.scalar_one_or_none()
    if not sub:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Subscription not found")

    def _json_val(v):
        return v.isoformat() if hasattr(v, "isoformat") else v

    old_snapshot = {
        "valid_until": _json_val(sub.valid_until),
        "device_limit": sub.device_limit,
        "status": sub.status,
        "subscription_status": getattr(sub, "subscription_status", None),
        "access_status": getattr(sub, "access_status", None),
        "billing_status": getattr(sub, "billing_status", None),
        "renewal_status": getattr(sub, "renewal_status", None),
        "grace_until": _json_val(getattr(sub, "grace_until", None)),
        "grace_reason": getattr(sub, "grace_reason", None),
    }
    data = body.model_dump(exclude_unset=True)
    state_status = data.pop("status", None)
    state_access = data.pop("access_status", None)
    state_grace_until = data.get("grace_until")
    state_grace_reason = data.get("grace_reason")
    for k, v in data.items():
        setattr(sub, k, v)
    if (
        state_status is not None
        or state_access is not None
        or state_grace_until is not None
        or state_grace_reason is not None
    ):
        from datetime import datetime, timezone

        apply_state_overrides(
            sub,
            now=datetime.now(timezone.utc),
            status=state_status,
            access_state=state_access,
            grace_until=state_grace_until,
            grace_reason=state_grace_reason,
        )
    await db.flush()
    request.state.audit_resource_type = "subscription"
    request.state.audit_resource_id = sub.id
    new_snapshot = {**old_snapshot, **{k: _json_val(v) for k, v in data.items()}}
    request.state.audit_old_new = {"old": old_snapshot, "new": new_snapshot}
    await db.commit()
    await db.refresh(sub)
    return sub
