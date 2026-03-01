"""Admin promo campaigns: CRUD for targeted offers."""

from __future__ import annotations

from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.constants import PERM_PRICING_READ, PERM_PRICING_WRITE
from app.core.database import get_db
from app.core.rbac import require_permission
from app.models import PromoCampaign

router = APIRouter(prefix="/admin/promos", tags=["admin-promos"])


class PromoCampaignOut(BaseModel):
    id: str
    name: str
    discount_percent: int
    valid_from: str
    valid_until: str
    target_rule: str | None
    max_redemptions: int | None
    extra_params: dict | None
    created_at: str | None


class PromoCampaignIn(BaseModel):
    name: str
    discount_percent: int
    valid_from: datetime
    valid_until: datetime
    target_rule: str | None = None
    max_redemptions: int | None = None
    extra_params: dict | None = None


@router.get("/campaigns", response_model=list[PromoCampaignOut])
async def list_promo_campaigns(
    db: AsyncSession = Depends(get_db),
    _admin=Depends(require_permission(PERM_PRICING_READ)),
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
):
    q = select(PromoCampaign).order_by(PromoCampaign.valid_until.desc()).limit(limit).offset(offset)
    result = await db.execute(q)
    rows = result.scalars().all()
    return [
        PromoCampaignOut(
            id=r.id,
            name=r.name,
            discount_percent=r.discount_percent,
            valid_from=r.valid_from.isoformat() if r.valid_from else "",
            valid_until=r.valid_until.isoformat() if r.valid_until else "",
            target_rule=r.target_rule,
            max_redemptions=r.max_redemptions,
            extra_params=r.extra_params,
            created_at=r.created_at.isoformat() if r.created_at else None,
        )
        for r in rows
    ]


@router.post("/campaigns", response_model=PromoCampaignOut, status_code=status.HTTP_201_CREATED)
async def create_promo_campaign(
    body: PromoCampaignIn,
    db: AsyncSession = Depends(get_db),
    _admin=Depends(require_permission(PERM_PRICING_WRITE)),
):
    campaign = PromoCampaign(
        name=body.name,
        discount_percent=body.discount_percent,
        valid_from=body.valid_from,
        valid_until=body.valid_until,
        target_rule=body.target_rule,
        max_redemptions=body.max_redemptions,
        extra_params=body.extra_params,
    )
    db.add(campaign)
    await db.commit()
    await db.refresh(campaign)
    return PromoCampaignOut(
        id=campaign.id,
        name=campaign.name,
        discount_percent=campaign.discount_percent,
        valid_from=campaign.valid_from.isoformat() if campaign.valid_from else "",
        valid_until=campaign.valid_until.isoformat() if campaign.valid_until else "",
        target_rule=campaign.target_rule,
        max_redemptions=campaign.max_redemptions,
        extra_params=campaign.extra_params,
        created_at=campaign.created_at.isoformat() if campaign.created_at else None,
    )


@router.get("/campaigns/{campaign_id}", response_model=PromoCampaignOut)
async def get_promo_campaign(
    campaign_id: str,
    db: AsyncSession = Depends(get_db),
    _admin=Depends(require_permission(PERM_PRICING_READ)),
):
    c = await db.get(PromoCampaign, campaign_id)
    if not c:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Campaign not found")
    return PromoCampaignOut(
        id=c.id,
        name=c.name,
        discount_percent=c.discount_percent,
        valid_from=c.valid_from.isoformat() if c.valid_from else "",
        valid_until=c.valid_until.isoformat() if c.valid_until else "",
        target_rule=c.target_rule,
        max_redemptions=c.max_redemptions,
        extra_params=c.extra_params,
        created_at=c.created_at.isoformat() if c.created_at else None,
    )


@router.patch("/campaigns/{campaign_id}", response_model=PromoCampaignOut)
async def update_promo_campaign(
    campaign_id: str,
    body: PromoCampaignIn,
    db: AsyncSession = Depends(get_db),
    _admin=Depends(require_permission(PERM_PRICING_WRITE)),
):
    c = await db.get(PromoCampaign, campaign_id)
    if not c:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Campaign not found")
    c.name = body.name
    c.discount_percent = body.discount_percent
    c.valid_from = body.valid_from
    c.valid_until = body.valid_until
    c.target_rule = body.target_rule
    c.max_redemptions = body.max_redemptions
    c.extra_params = body.extra_params
    await db.commit()
    await db.refresh(c)
    return PromoCampaignOut(
        id=c.id,
        name=c.name,
        discount_percent=c.discount_percent,
        valid_from=c.valid_from.isoformat() if c.valid_from else "",
        valid_until=c.valid_until.isoformat() if c.valid_until else "",
        target_rule=c.target_rule,
        max_redemptions=c.max_redemptions,
        extra_params=c.extra_params,
        created_at=c.created_at.isoformat() if c.created_at else None,
    )


@router.delete("/campaigns/{campaign_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_promo_campaign(
    campaign_id: str,
    db: AsyncSession = Depends(get_db),
    _admin=Depends(require_permission(PERM_PRICING_WRITE)),
):
    c = await db.get(PromoCampaign, campaign_id)
    if not c:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Campaign not found")
    await db.delete(c)
    await db.commit()
    return None
