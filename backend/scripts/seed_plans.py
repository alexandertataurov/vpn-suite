"""Seed plans (tariffs) from env. Idempotent.

This is intentionally opt-in: plans contain pricing, so defaults must not be
auto-created in production without explicit operator intent.

Env schema:
- PLAN_1_NAME, PLAN_1_DURATION_DAYS, PLAN_1_PRICE_STARS (or PLAN_1_PRICE_AMOUNT), PLAN_1_PRICE_CURRENCY
- Repeat for PLAN_2_*, PLAN_3_*, ... (up to 10)

Optional (non-production only):
- SEED_DEFAULT_PLANS=1: create a minimal placeholder plan if no PLAN_* are provided.
"""

from __future__ import annotations

import asyncio
import logging
import os
import sys
from dataclasses import dataclass
from decimal import Decimal, InvalidOperation

# backend/scripts/ -> backend/
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker

from app.core.config import settings
from app.models import Plan


@dataclass(frozen=True)
class PlanSpec:
    name: str
    duration_days: int
    price_currency: str
    price_amount: Decimal


def _parse_decimal(value: str) -> Decimal | None:
    raw = (value or "").strip()
    if not raw:
        return None
    try:
        return Decimal(raw)
    except (InvalidOperation, ValueError):
        return None


def _plans_from_env() -> list[PlanSpec]:
    out: list[PlanSpec] = []
    for i in range(1, 11):
        prefix = f"PLAN_{i}_"
        name = (os.environ.get(f"{prefix}NAME", "") or "").strip()
        if not name:
            continue

        duration_raw = (os.environ.get(f"{prefix}DURATION_DAYS", "") or "").strip()
        try:
            duration_days = int(duration_raw)
        except ValueError:
            duration_days = 0

        price_currency = (os.environ.get(f"{prefix}PRICE_CURRENCY", "") or "XTR").strip() or "XTR"

        amount = _parse_decimal(os.environ.get(f"{prefix}PRICE_AMOUNT", ""))
        if amount is None:
            amount = _parse_decimal(os.environ.get(f"{prefix}PRICE_STARS", ""))

        if duration_days <= 0 or amount is None or amount <= 0:
            # Skip invalid plan definitions rather than crashing bootstrap.
            continue

        out.append(
            PlanSpec(
                name=name,
                duration_days=duration_days,
                price_currency=price_currency,
                price_amount=amount,
            )
        )
    return out


async def seed(session: AsyncSession) -> int:
    specs = _plans_from_env()
    if not specs:
        if (
            os.environ.get("SEED_DEFAULT_PLANS", "").strip() == "1"
            and settings.environment != "production"
        ):
            specs = [
                PlanSpec(
                    name="Audit Placeholder (30 days)",
                    duration_days=30,
                    price_currency="XTR",
                    price_amount=Decimal("1"),
                )
            ]
        else:
            return 0

    existing = (await session.execute(select(Plan))).scalars().all()
    existing_keys = {(p.name, int(p.duration_days)) for p in existing}

    added = 0
    for s in specs:
        key = (s.name, int(s.duration_days))
        if key in existing_keys:
            continue
        session.add(
            Plan(
                name=s.name,
                duration_days=s.duration_days,
                price_currency=s.price_currency,
                price_amount=s.price_amount,
            )
        )
        added += 1
    return added


async def main() -> None:
    engine = create_async_engine(settings.database_url, echo=False)
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    async with async_session() as session:
        n = await seed(session)
        await session.commit()
    await engine.dispose()
    logging.getLogger(__name__).info("Seed plans OK: %s plan(s) added", n)


if __name__ == "__main__":
    asyncio.run(main())
