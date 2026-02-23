"""Seed servers (VPN nodes) from env. Idempotent. Use for dev/real nodes (http or private IP allowed via direct insert)."""

import asyncio
import logging
import os
import sys

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker

from app.core.config import settings
from app.models import Server
from app.models.base import uuid4_hex

DB_URL = settings.database_url


def _nodes_from_env() -> list[dict]:
    out = []
    for i in range(1, 6):
        prefix = f"NODE_{i}_"
        api = os.environ.get(f"{prefix}API_ENDPOINT", "").strip()
        if not api:
            continue
        out.append(
            {
                "name": os.environ.get(f"{prefix}NAME", f"node{i}"),
                "region": os.environ.get(f"{prefix}REGION", "eu"),
                "api_endpoint": api.rstrip("/"),
                "vpn_endpoint": os.environ.get(f"{prefix}VPN_ENDPOINT", "").strip() or None,
                "public_key": os.environ.get(f"{prefix}PUBLIC_KEY", "").strip() or None,
            }
        )
    return out


async def seed(session: AsyncSession) -> int:
    nodes = _nodes_from_env()
    if not nodes:
        return 0
    added = 0
    for n in nodes:
        r = await session.execute(select(Server).where(Server.api_endpoint == n["api_endpoint"]))
        if r.scalar_one_or_none():
            continue
        session.add(
            Server(
                id=uuid4_hex(),
                name=n["name"],
                region=n["region"],
                api_endpoint=n["api_endpoint"],
                vpn_endpoint=n["vpn_endpoint"],
                public_key=n.get("public_key"),
                status="unknown",
                is_active=True,
            )
        )
        added += 1
    return added


async def main() -> None:
    engine = create_async_engine(DB_URL, echo=False)
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    async with async_session() as session:
        n = await seed(session)
        await session.commit()
        logger.info(
            "Seed nodes OK: %s server(s) added (set NODE_1_API_ENDPOINT, NODE_1_NAME, NODE_1_REGION, etc.)",
            n,
        )
    await engine.dispose()


if __name__ == "__main__":
    asyncio.run(main())
