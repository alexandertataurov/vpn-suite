"""Plans API: CRUD for tariffs."""

from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.bot_auth import get_admin_or_bot
from app.core.constants import PERM_PLANS_READ, PERM_PLANS_WRITE
from app.core.database import get_db
from app.core.rbac import require_permission
from app.models import Plan, Subscription
from app.schemas.plan import PlanCreate, PlanList, PlanOut, PlanUpdate

router = APIRouter(prefix="/plans", tags=["plans"])


@router.post("", response_model=PlanOut, status_code=status.HTTP_201_CREATED)
async def create_plan(
    request: Request,
    body: PlanCreate,
    db: AsyncSession = Depends(get_db),
    admin=Depends(require_permission(PERM_PLANS_WRITE)),
):
    plan = Plan(
        name=body.name,
        duration_days=body.duration_days,
        device_limit=body.device_limit,
        price_currency=body.price_currency,
        price_amount=body.price_amount,
        upsell_methods=body.upsell_methods,
    )
    db.add(plan)
    await db.flush()
    request.state.audit_resource_type = "plan"
    request.state.audit_resource_id = plan.id
    request.state.audit_old_new = {"created": {"name": plan.name}}
    await db.commit()
    await db.refresh(plan)
    return plan


@router.get("", response_model=PlanList)
async def list_plans(
    db: AsyncSession = Depends(get_db),
    _principal=Depends(get_admin_or_bot),
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
):
    """List plans. Allowed for bot (X-API-Key) or admin (JWT)."""
    total = (await db.execute(select(func.count()).select_from(Plan))).scalar() or 0
    result = await db.execute(select(Plan).order_by(Plan.id).limit(limit).offset(offset))
    rows = result.scalars().all()
    return PlanList(items=[PlanOut.model_validate(r) for r in rows], total=total)


@router.get("/{plan_id}", response_model=PlanOut)
async def get_plan(
    plan_id: str,
    db: AsyncSession = Depends(get_db),
    _admin=Depends(require_permission(PERM_PLANS_READ)),
):
    result = await db.execute(select(Plan).where(Plan.id == plan_id))
    plan = result.scalar_one_or_none()
    if not plan:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Plan not found")
    return plan


@router.patch("/{plan_id}", response_model=PlanOut)
async def update_plan(
    request: Request,
    plan_id: str,
    body: PlanUpdate,
    db: AsyncSession = Depends(get_db),
    admin=Depends(require_permission(PERM_PLANS_WRITE)),
):
    result = await db.execute(select(Plan).where(Plan.id == plan_id))
    plan = result.scalar_one_or_none()
    if not plan:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Plan not found")
    old_snapshot = {
        "name": plan.name,
        "duration_days": plan.duration_days,
        "device_limit": plan.device_limit,
        "price_amount": str(plan.price_amount),
    }
    data = body.model_dump(exclude_unset=True)
    for k, v in data.items():
        setattr(plan, k, v)
    await db.flush()
    request.state.audit_resource_type = "plan"
    request.state.audit_resource_id = plan.id
    request.state.audit_old_new = {"old": old_snapshot, "new": {**old_snapshot, **data}}
    await db.commit()
    await db.refresh(plan)
    return plan


@router.delete("/{plan_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_plan(
    request: Request,
    plan_id: str,
    db: AsyncSession = Depends(get_db),
    admin=Depends(require_permission(PERM_PLANS_WRITE)),
):
    result = await db.execute(select(Plan).where(Plan.id == plan_id))
    plan = result.scalar_one_or_none()
    if not plan:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Plan not found")
    sub_count = (
        await db.execute(select(func.count()).select_from(Subscription).where(Subscription.plan_id == plan_id))
    ).scalar() or 0
    if sub_count > 0:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Cannot delete plan: {sub_count} subscription(s) reference it",
        )
    request.state.audit_resource_type = "plan"
    request.state.audit_resource_id = plan.id
    request.state.audit_old_new = {"deleted": {"name": plan.name}}
    await db.delete(plan)
    await db.commit()
    return None
