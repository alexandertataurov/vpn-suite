"""Plans API: CRUD for tariffs."""

from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.bot_auth import get_admin_or_bot
from app.core.constants import PERM_PLANS_READ, PERM_PLANS_WRITE
from app.core.database import get_db
from app.core.rbac import require_permission
from app.models import Plan, Subscription
from app.schemas.plan import PlanCreate, PlanList, PlanOut, PlanReorderBody, PlanUpdate

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
    include_archived: bool = Query(True, description="Include archived plans (admin list)"),
):
    """List plans. Allowed for bot (X-API-Key) or admin (JWT)."""
    stmt = select(Plan)
    if not include_archived:
        stmt = stmt.where(Plan.is_archived.is_(False))
    count_stmt = select(func.count()).select_from(stmt.subquery())
    total = (await db.execute(count_stmt)).scalar() or 0
    stmt = stmt.order_by(Plan.display_order.asc(), Plan.id.asc()).limit(limit).offset(offset)
    result = await db.execute(stmt)
    rows = result.scalars().all()
    if not rows:
        return PlanList(items=[], total=total)
    plan_ids = [r.id for r in rows]
    sub_counts_result = await db.execute(
        select(Subscription.plan_id, func.count())
        .where(Subscription.plan_id.in_(plan_ids))
        .group_by(Subscription.plan_id)
    )
    sub_counts = dict(sub_counts_result.all())
    items = [
        PlanOut.model_validate(r).model_copy(
            update={"subscription_count": sub_counts.get(r.id, 0)}
        )
        for r in rows
    ]
    return PlanList(items=items, total=total)


@router.patch("/reorder", response_model=PlanList)
async def reorder_plans(
    request: Request,
    body: PlanReorderBody,
    db: AsyncSession = Depends(get_db),
    admin=Depends(require_permission(PERM_PLANS_WRITE)),
):
    """Set display_order by array index (plan_ids[0] -> 0, plan_ids[1] -> 1, ...)."""
    if not body.plan_ids:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="plan_ids must be non-empty",
        )
    result = await db.execute(select(Plan).where(Plan.id.in_(body.plan_ids)))
    plans = {p.id: p for p in result.scalars().all()}
    for idx, pid in enumerate(body.plan_ids):
        if pid in plans:
            plans[pid].display_order = idx
    request.state.audit_resource_type = "plans"
    request.state.audit_old_new = {"reorder": body.plan_ids}
    await db.commit()
    result = await db.execute(
        select(Plan).order_by(Plan.display_order.asc(), Plan.id.asc())
    )
    rows = result.scalars().all()
    return PlanList(
        items=[PlanOut.model_validate(r) for r in rows],
        total=len(rows),
    )


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
        "is_archived": plan.is_archived,
        "display_order": plan.display_order,
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
        await db.execute(
            select(func.count()).select_from(Subscription).where(Subscription.plan_id == plan_id)
        )
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


@router.post("/{plan_id}/clone", response_model=PlanOut, status_code=status.HTTP_201_CREATED)
async def clone_plan(
    request: Request,
    plan_id: str,
    db: AsyncSession = Depends(get_db),
    admin=Depends(require_permission(PERM_PLANS_WRITE)),
):
    """Create a copy of a plan with a new id and \" (copy)\" suffix in name."""
    result = await db.execute(select(Plan).where(Plan.id == plan_id))
    source = result.scalar_one_or_none()
    if not source:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Plan not found")
    new_plan = Plan(
        name=f"{source.name} (copy)",
        duration_days=source.duration_days,
        device_limit=source.device_limit,
        price_currency=source.price_currency,
        price_amount=source.price_amount,
        upsell_methods=source.upsell_methods,
        is_archived=False,
        display_order=source.display_order,
    )
    db.add(new_plan)
    await db.flush()
    request.state.audit_resource_type = "plan"
    request.state.audit_resource_id = new_plan.id
    request.state.audit_old_new = {"cloned_from": plan_id, "name": new_plan.name}
    await db.commit()
    await db.refresh(new_plan)
    return new_plan
