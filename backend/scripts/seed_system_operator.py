"""Seed system user and subscription for standalone admin-issued peers. Idempotent."""

import asyncio
import logging
import os
import sys
from datetime import datetime, timedelta, timezone

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# backend/scripts/ -> backend/
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker

from app.core.config import settings
from app.models import Plan, Subscription, User
from app.models.base import uuid4_hex

DB_URL = settings.database_url

# tg_id for system user (standalone admin-issued peers)
SYSTEM_TG_ID = 0
STANDALONE_DEVICE_LIMIT = 1000


async def seed(session: AsyncSession) -> None:
    # User with tg_id=0 (system user for standalone peers)
    result = await session.execute(select(User).where(User.tg_id == SYSTEM_TG_ID))
    user = result.scalar_one_or_none()
    if not user:
        user = User(tg_id=SYSTEM_TG_ID, is_banned=False)
        session.add(user)
        await session.flush()

    # Use first plan in DB for system subscription (no dedicated "operator" plan)
    plan_result = await session.execute(select(Plan).order_by(Plan.created_at.asc()).limit(1))
    plan = plan_result.scalar_one_or_none()
    if not plan:
        logger.warning(
            "No plan in DB; create at least one plan via Admin UI (or run seed-plans with PLAN_* set). Skipping system subscription."
        )
        return

    result = await session.execute(
        select(Subscription).where(
            Subscription.user_id == user.id,
            Subscription.plan_id == plan.id,
            Subscription.status == "active",
        )
    )
    if result.scalar_one_or_none():
        return

    now = datetime.now(timezone.utc)
    valid_until = now + timedelta(days=plan.duration_days)
    session.add(
        Subscription(
            id=uuid4_hex(),
            user_id=user.id,
            plan_id=plan.id,
            valid_from=now,
            valid_until=valid_until,
            device_limit=STANDALONE_DEVICE_LIMIT,
            status="active",
        )
    )


async def main() -> None:
    engine = create_async_engine(DB_URL, echo=False)
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    async with async_session() as session:
        await seed(session)
        await session.commit()
    await engine.dispose()
    logger.info("Seed OK: system user and subscription for standalone peers")


if __name__ == "__main__":
    asyncio.run(main())
