"""Create a single Server row for agent mode so node-agent can use SERVER_ID=<this id>.

Usage:
  AGENT_SERVER_ID=vpn-node-1 python scripts/seed_agent_server.py

If AGENT_SERVER_ID is unset, defaults to "vpn-node-1".
Idempotent: if a server with that id already exists, does nothing and prints the id.
After running, set SERVER_ID=<printed id> in your node-agent environment.
"""

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

DB_URL = settings.database_url
DEFAULT_AGENT_SERVER_ID = "vpn-node-1"


async def main() -> None:
    server_id = (os.environ.get("AGENT_SERVER_ID") or "").strip() or DEFAULT_AGENT_SERVER_ID
    if not (1 <= len(server_id) <= 32) or not all(c.isalnum() or c in "-_" for c in server_id):
        logger.error("AGENT_SERVER_ID must be 1-32 chars, alphanumeric + hyphen/underscore")
        sys.exit(1)

    engine = create_async_engine(DB_URL, echo=False)
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    async with async_session() as session:
        r = await session.execute(select(Server).where(Server.id == server_id))
        existing = r.scalar_one_or_none()
        if existing:
            logger.info("Server already exists: id=%s name=%s", server_id, existing.name)
            sys.stdout.write(server_id + "\n")
            await engine.dispose()
            return
        session.add(
            Server(
                id=server_id,
                name=os.environ.get("AGENT_SERVER_NAME", "VPN node (agent)"),
                region=os.environ.get("AGENT_SERVER_REGION", "docker"),
                api_endpoint=os.environ.get("AGENT_SERVER_API_ENDPOINT", "https://localhost"),
                vpn_endpoint=os.environ.get("AGENT_SERVER_VPN_ENDPOINT") or None,
                public_key=os.environ.get("AGENT_SERVER_PUBLIC_KEY") or None,
                status="unknown",
                is_active=True,
            )
        )
        await session.commit()
        logger.info(
            "Created server id=%s. Set SERVER_ID=%s in your node-agent env.", server_id, server_id
        )
        sys.stdout.write(server_id + "\n")
    await engine.dispose()


if __name__ == "__main__":
    asyncio.run(main())
