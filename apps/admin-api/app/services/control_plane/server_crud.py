"""Server/IP and health helpers for control-plane."""

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import Server


async def _node_regions(db: AsyncSession, node_ids: set[str]) -> dict[str, str]:
    """Return mapping node_id -> region for the given node (server) IDs."""
    if not node_ids:
        return {}
    rows = await db.execute(select(Server.id, Server.region).where(Server.id.in_(node_ids)))
    return {node_id: (region or "unknown") for node_id, region in rows.all()}
