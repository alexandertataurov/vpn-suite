"""Pricing history: log plan price changes for audit and revenue impact."""

from __future__ import annotations

from decimal import Decimal

from sqlalchemy.ext.asyncio import AsyncSession

from app.models import PriceHistory


async def log_price_change(
    session: AsyncSession,
    *,
    plan_id: str,
    price_amount_old: Decimal | None,
    price_amount_new: Decimal,
    promo_pct_old: int | None = None,
    promo_pct_new: int | None = None,
    changed_by_admin_id: str | None = None,
    reason: str | None = None,
    revenue_impact_estimate: Decimal | None = None,
) -> PriceHistory:
    """Append a price_history row. Caller must update Plan separately if desired."""
    record = PriceHistory(
        plan_id=plan_id,
        price_amount_old=price_amount_old,
        price_amount_new=price_amount_new,
        promo_pct_old=promo_pct_old,
        promo_pct_new=promo_pct_new,
        changed_by_admin_id=changed_by_admin_id,
        reason=reason,
        revenue_impact_estimate=revenue_impact_estimate,
    )
    session.add(record)
    await session.flush()
    return record
