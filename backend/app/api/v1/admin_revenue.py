"""Admin revenue overview: full KPIs for control center dashboard."""

from __future__ import annotations

import json
import time

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.constants import PERM_CLUSTER_READ
from app.core.database import get_db
from app.core.redis_client import get_redis
from app.core.rbac import require_permission
from app.services.admin_revenue_service import get_revenue_overview, get_revenue_daily_series

router = APIRouter(prefix="/admin/revenue", tags=["admin-revenue"])

REDIS_KEY_REVENUE_OVERVIEW = "admin:revenue:overview"
REDIS_TTL_SECONDS = 60

_CACHE: dict[str, tuple[float, dict]] = {}
_CACHE_TTL = 60


class RevenueOverviewOut(BaseModel):
    subscriptions_active: int
    mrr: float
    arr: float
    revenue_today: float
    revenue_7d: float
    revenue_30d: float
    arpu: float
    trial_started_30d: int
    trial_conversion_pct: float
    avg_sub_length_days: float
    expiring_3d: int
    expired_today: int
    churn_rate: float
    renewal_rate: float
    churn_by_reason: dict[str, int]
    active_referrers: int
    referral_conversion_pct: float
    referral_paid_30d: int
    earned_bonus_days: int


@router.get("/overview", response_model=RevenueOverviewOut)
async def get_revenue_overview_endpoint(
    db: AsyncSession = Depends(get_db),
    _admin=Depends(require_permission(PERM_CLUSTER_READ)),
) -> RevenueOverviewOut:
    """Full revenue + subscription health + referral metrics. Redis cache 60s, fallback in-memory."""
    try:
        redis = get_redis()
        raw = await redis.get(REDIS_KEY_REVENUE_OVERVIEW)
        if raw:
            data = json.loads(raw)
            return RevenueOverviewOut(**data)
    except Exception:
        pass
    now = time.time()
    if "admin:revenue:overview" in _CACHE:
        cached_at, value = _CACHE["admin:revenue:overview"]
        if now - cached_at < _CACHE_TTL:
            return RevenueOverviewOut(**value)
    data = await get_revenue_overview(db)
    _CACHE["admin:revenue:overview"] = (now, data)
    try:
        redis = get_redis()
        await redis.setex(
            REDIS_KEY_REVENUE_OVERVIEW,
            REDIS_TTL_SECONDS,
            json.dumps(data, default=str),
        )
    except Exception:
        pass
    return RevenueOverviewOut(**data)


class RevenueDayOut(BaseModel):
    date: str
    revenue: float


@router.get("/daily", response_model=list[RevenueDayOut])
async def get_revenue_daily(
    db: AsyncSession = Depends(get_db),
    _admin=Depends(require_permission(PERM_CLUSTER_READ)),
    days: int = 30,
):
    """Daily revenue series for charts (last N days)."""
    if days < 1 or days > 90:
        days = 30
    data = await get_revenue_daily_series(db, days=days)
    return [RevenueDayOut(**d) for d in data]
