"""Reset all subscriptions to a single Beta plan and archive other plans.

Usage (non-production only unless you know what you're doing):

    python backend/scripts/reset_all_users_to_beta_plan.py

Behavior:
- Picks the Beta plan by `BETA_PLAN_ID` env var, or by name ILIKE '%beta%'.
- Updates all `subscriptions.plan_id` to the Beta plan id (keeping validity).
- Syncs `device_limit` on subscriptions to match the Beta plan.
- Archives all other plans by setting `is_archived=True`.

This is intended as an operational one-off during Beta simplification.
Always take a DB backup first and verify in staging before production.
"""

from __future__ import annotations

import asyncio
import logging
import os
import sys

from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker

# backend/scripts/ -> backend/
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.config import settings
from app.models import Plan, Subscription

logger = logging.getLogger(__name__)


async def main() -> None:
    """Entrypoint: move all subscriptions to Beta plan and archive other plans."""
    beta_plan_id_env = (os.environ.get("BETA_PLAN_ID") or "").strip()

    engine = create_async_engine(settings.database_url, echo=False)
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    async with async_session() as session:
        # 1) Resolve Beta plan
        beta_plan: Plan | None = None

        if beta_plan_id_env:
            result = await session.execute(select(Plan).where(Plan.id == beta_plan_id_env))
            beta_plan = result.scalar_one_or_none()
            if beta_plan is None:
                raise RuntimeError(
                    f"BETA_PLAN_ID={beta_plan_id_env!r} does not match any existing Plan.id"
                )
        else:
            result = await session.execute(select(Plan).where(Plan.name.ilike("%beta%")))
            beta_plan = result.scalars().first()
            if beta_plan is None:
                raise RuntimeError(
                    "No Beta plan found. Set BETA_PLAN_ID to an existing Plan.id or create a plan "
                    "with name containing 'Beta'."
                )

        # 2) Switch all subscriptions to Beta plan (keep validity window)
        await session.execute(
            update(Subscription)
            .where(Subscription.plan_id != beta_plan.id)
            .values(plan_id=beta_plan.id, device_limit=beta_plan.device_limit)
        )

        # 3) Archive all other plans
        await session.execute(
            update(Plan).where(Plan.id != beta_plan.id).values(is_archived=True)
        )

        await session.commit()

        logger.info("All subscriptions set to Beta plan %s; other plans archived.", beta_plan.id)

    await engine.dispose()


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    asyncio.run(main())

