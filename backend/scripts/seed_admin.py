"""Seed admin role and admin user from settings. Idempotent."""

import asyncio
import logging
import os
import sys

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# backend/scripts/ -> backend/
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker

from app.core.config import settings
from app.models import AdminUser, Role
from app.models.base import uuid4_hex

# sync URL for psycopg2 used by alembic; we use async
DB_URL = settings.database_url


async def seed(session: AsyncSession) -> None:
    # Role admin (fixed id for reference)
    result = await session.execute(select(Role).where(Role.name == "admin"))
    role = result.scalar_one_or_none()
    if not role:
        role = Role(
            id="admin",
            name="admin",
            permissions=["*"],
        )
        session.add(role)
        await session.flush()

    from app.core.security import get_password_hash

    admin_email = (settings.admin_email or "").strip().lower()
    if not admin_email:
        logger.warning("ADMIN_EMAIL is empty; skipping admin user seed")
        return
    result = await session.execute(select(AdminUser).where(AdminUser.email == admin_email))
    existing = result.scalar_one_or_none()
    if existing:
        existing.password_hash = get_password_hash(settings.admin_password)
        return

    session.add(
        AdminUser(
            id=uuid4_hex(),
            email=admin_email,
            password_hash=get_password_hash(settings.admin_password),
            role_id=role.id,
        )
    )


async def main() -> None:
    engine = create_async_engine(DB_URL, echo=False)
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    async with async_session() as session:
        await seed(session)
        await session.commit()
    await engine.dispose()
    logger.info("Seed OK: role admin, admin user from settings")


if __name__ == "__main__":
    asyncio.run(main())
