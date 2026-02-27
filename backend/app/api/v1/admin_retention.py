"""Admin retention automation: rules CRUD, run engine."""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.constants import PERM_RETENTION_READ, PERM_RETENTION_WRITE
from app.core.database import get_db
from app.core.rbac import require_permission
from app.models import RetentionRule
from app.services.retention_automation_engine import run_retention_rules

router = APIRouter(prefix="/admin/retention", tags=["admin-retention"])


class RetentionRuleOut(BaseModel):
    id: str
    name: str
    condition_json: dict
    action_type: str
    action_params: dict | None
    priority: int
    enabled: bool
    created_at: str | None


class RetentionRuleIn(BaseModel):
    name: str
    condition_json: dict
    action_type: str
    action_params: dict | None = None
    priority: int = 0
    enabled: bool = True


class RetentionRuleListOut(BaseModel):
    items: list[RetentionRuleOut]
    total: int


class RetentionRunOut(BaseModel):
    rules_evaluated: int
    actions_taken: int


@router.get("/rules", response_model=RetentionRuleListOut)
async def list_retention_rules(
    db: AsyncSession = Depends(get_db),
    _admin=Depends(require_permission(PERM_RETENTION_READ)),
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    enabled: bool | None = Query(None),
):
    q = select(RetentionRule)
    if enabled is not None:
        q = q.where(RetentionRule.enabled == enabled)
    from sqlalchemy import func
    count_q = select(func.count()).select_from(RetentionRule)
    if enabled is not None:
        count_q = count_q.where(RetentionRule.enabled == enabled)
    total = (await db.execute(count_q)).scalar() or 0
    q = q.order_by(RetentionRule.priority.desc()).limit(limit).offset(offset)
    result = await db.execute(q)
    rows = result.scalars().all()
    items = [
        RetentionRuleOut(
            id=r.id,
            name=r.name,
            condition_json=r.condition_json or {},
            action_type=r.action_type,
            action_params=r.action_params,
            priority=r.priority,
            enabled=r.enabled,
            created_at=r.created_at.isoformat() if r.created_at else None,
        )
        for r in rows
    ]
    return RetentionRuleListOut(items=items, total=total)


@router.post("/rules", response_model=RetentionRuleOut)
async def create_retention_rule(
    request: Request,
    body: RetentionRuleIn,
    db: AsyncSession = Depends(get_db),
    _admin=Depends(require_permission(PERM_RETENTION_WRITE)),
):
    rule = RetentionRule(
        name=body.name,
        condition_json=body.condition_json,
        action_type=body.action_type,
        action_params=body.action_params,
        priority=body.priority,
        enabled=body.enabled,
    )
    db.add(rule)
    await db.flush()
    request.state.audit_resource_type = "retention_rule"
    request.state.audit_resource_id = rule.id
    await db.commit()
    await db.refresh(rule)
    return RetentionRuleOut(
        id=rule.id,
        name=rule.name,
        condition_json=rule.condition_json or {},
        action_type=rule.action_type,
        action_params=rule.action_params,
        priority=rule.priority,
        enabled=rule.enabled,
        created_at=rule.created_at.isoformat() if rule.created_at else None,
    )


@router.patch("/rules/{rule_id}", response_model=RetentionRuleOut)
async def update_retention_rule(
    rule_id: str,
    body: RetentionRuleIn,
    db: AsyncSession = Depends(get_db),
    _admin=Depends(require_permission(PERM_RETENTION_WRITE)),
):
    rule = await db.get(RetentionRule, rule_id)
    if not rule:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Rule not found")
    rule.name = body.name
    rule.condition_json = body.condition_json
    rule.action_type = body.action_type
    rule.action_params = body.action_params
    rule.priority = body.priority
    rule.enabled = body.enabled
    await db.commit()
    await db.refresh(rule)
    return RetentionRuleOut(
        id=rule.id,
        name=rule.name,
        condition_json=rule.condition_json or {},
        action_type=rule.action_type,
        action_params=rule.action_params,
        priority=rule.priority,
        enabled=rule.enabled,
        created_at=rule.created_at.isoformat() if rule.created_at else None,
    )


@router.delete("/rules/{rule_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_retention_rule(
    rule_id: str,
    db: AsyncSession = Depends(get_db),
    _admin=Depends(require_permission(PERM_RETENTION_WRITE)),
):
    rule = await db.get(RetentionRule, rule_id)
    if not rule:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Rule not found")
    await db.delete(rule)
    await db.commit()
    return None


@router.post("/run", response_model=RetentionRunOut)
async def run_retention_engine(
    db: AsyncSession = Depends(get_db),
    _admin=Depends(require_permission(PERM_RETENTION_WRITE)),
):
    result = await run_retention_rules(db)
    await db.commit()
    return RetentionRunOut(**result)
