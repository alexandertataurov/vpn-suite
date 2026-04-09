"""Seed promo code 1freestar: 1 XTR discount, all plans, per-user once, no global cap. Idempotent."""

import asyncio
import logging
import os
import sys
from decimal import Decimal

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# apps/admin-api/scripts/ -> apps/admin-api/
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker

from app.core.config import settings
from app.core.constants import PROMO_1FREESTAR_DISCOUNT_XTR
from app.models import PromoCode
from app.models.base import uuid4_hex

DB_URL = settings.database_url

PROMO_CODE = "1FREESTAR"
PROMO_TYPE = "fixed_xtr"


async def seed(session: AsyncSession, dry_run: bool = False) -> tuple[bool, bool]:
    """Insert 1freestar promo if not exists. Returns True if row was/would be inserted."""
    result = await session.execute(select(PromoCode).where(PromoCode.code == PROMO_CODE))
    existing = result.scalar_one_or_none()
    if existing:
        logger.info("Promo %s already exists (id=%s). Skipping.", PROMO_CODE, existing.id)
        return False, False

    promo = PromoCode(
        id=uuid4_hex(),
        code=PROMO_CODE,
        type=PROMO_TYPE,
        value=Decimal(str(PROMO_1FREESTAR_DISCOUNT_XTR)),
        constraints=None,
        status="active",
        discount_xtr=PROMO_1FREESTAR_DISCOUNT_XTR,
        max_uses_per_user=1,
        global_use_limit=None,
        is_active=True,
        expires_at=None,
        applicable_plan_ids=None,
    )
    if dry_run:
        logger.info("Dry run: would insert promo %s", PROMO_CODE)
        return True, False

    try:
        session.add(promo)
        await session.flush()
    except IntegrityError:
        await session.rollback()
        logger.info("Promo %s already exists (race). Skipping.", PROMO_CODE)
        return False, False
    return True, True


async def main() -> None:
    dry_run = os.environ.get("DRY_RUN", "").lower() in ("1", "true", "yes")
    if dry_run:
        logger.info("DRY_RUN=1: no changes will be committed")

    engine = create_async_engine(DB_URL, echo=False)
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    async with async_session() as session:
        inserted, should_commit = await seed(session, dry_run=dry_run)
        if should_commit:
            await session.commit()
    await engine.dispose()

    if inserted and not dry_run:
        logger.info("Seed OK: promo %s inserted", PROMO_CODE)
    elif dry_run:
        logger.info("Dry run complete")
    else:
        logger.info("Seed OK: promo %s already present", PROMO_CODE)


if __name__ == "__main__":
    asyncio.run(main())
    sys.exit(0)
