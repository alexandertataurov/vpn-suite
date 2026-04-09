"""Run server sync to refresh Server.public_key from node; optionally reissue all devices on a server.

After SECRET_KEY or server WireGuard key rotation: reissue devices so configs decrypt (new key)
and contain the current server key (VPN connects).

Usage (from repo root):
  ./manage.sh fix-server-public-key              # sync all servers (docker), then reissue ALL devices
  ./manage.sh fix-server-public-key <server_id>  # sync that server, then reissue its devices
"""

import asyncio
import logging
import sys

from sqlalchemy import select

from app.core.config import settings
from app.core.database import async_session_factory
from app.core.redis_client import close_redis, init_redis
from app.models import Device, Server
from app.services.admin_issue_service import reissue_config_for_device
from app.services.server_sync_service import run_sync_for_server, start_sync

logging.basicConfig(level=logging.INFO, format="%(message)s")
logger = logging.getLogger(__name__)


def _get_adapter():
    if settings.node_discovery == "docker":
        from app.services.node_runtime_docker import DockerNodeRuntimeAdapter

        prefixes = (
            getattr(settings, "docker_vpn_container_prefixes", "amnezia-awg") or "amnezia-awg"
        )
        return DockerNodeRuntimeAdapter(container_filter=prefixes, interface="awg0")
    if settings.node_discovery == "agent":
        from app.services.node_runtime_agent import AgentNodeRuntimeAdapter

        return AgentNodeRuntimeAdapter()
    return None


async def _sync_all() -> bool:
    """Run sync for all active servers. Returns True if any ran (docker mode)."""
    if settings.node_discovery == "agent" or settings.node_mode == "agent":
        logger.info(
            "NODE_DISCOVERY=agent: sync is queued by node-agent. "
            "Trigger via Admin (Servers → server → Sync) or POST /api/v1/servers/<server_id>/sync"
        )
        return False
    adapter = _get_adapter()
    async with async_session_factory() as session:
        r = await session.execute(
            select(Server).where(Server.is_active.is_(True)).order_by(Server.created_at.asc())
        )
        servers = r.scalars().all()
    if not servers:
        logger.info("No active servers.")
        return True
    for s in servers:
        async with async_session_factory() as session:
            job_id = await start_sync(session, s.id, "full", None, None)
            await session.commit()
        async with async_session_factory() as session:
            ok, err = await run_sync_for_server(session, s.id, job_id, None, adapter)
            await session.commit()
            if ok:
                logger.info("Sync OK server_id=%s", s.id)
            else:
                logger.warning("Sync failed server_id=%s: %s", s.id, err or "unknown")
    return True


async def _sync_one(server_id: str, adapter) -> bool:
    async with async_session_factory() as session:
        r = await session.execute(select(Server).where(Server.id == server_id))
        s = r.scalar_one_or_none()
    if not s:
        logger.error("Server not found: %s", server_id)
        return False
    async with async_session_factory() as session:
        job_id = await start_sync(session, server_id, "full", None, None)
        await session.commit()
    async with async_session_factory() as session:
        ok, err = await run_sync_for_server(session, server_id, job_id, None, adapter)
        await session.commit()
    if ok:
        logger.info("Sync OK server_id=%s", server_id)
    else:
        logger.warning("Sync failed server_id=%s: %s", server_id, err or "unknown")
    return ok


async def _reissue_server(server_id: str, adapter) -> None:
    async with async_session_factory() as session:
        r = await session.execute(
            select(Device).where(
                Device.server_id == server_id,
                Device.revoked_at.is_(None),
            )
        )
        devices = r.scalars().all()
    if not devices:
        logger.info("No non-revoked devices on server_id=%s", server_id)
        return
    for d in devices:
        async with async_session_factory() as session:
            try:
                await reissue_config_for_device(
                    session,
                    device_id=d.id,
                    issued_by_admin_id=None,
                    runtime_adapter=adapter,
                )
                await session.commit()
                logger.info("Reissued device_id=%s server_id=%s", d.id, server_id)
            except Exception as e:
                await session.rollback()
                logger.warning("Reissue failed device_id=%s: %s", d.id, e)


async def main() -> int:
    # Called as: python scripts/fix_server_public_key.py [server_id]
    try:
        await init_redis()
    except Exception as e:
        logger.warning("Redis init failed (one-off script): %s; reissue may use DB key fallback", e)
    try:
        server_id = (sys.argv[1] if len(sys.argv) > 1 else "").strip() or None
        adapter = _get_adapter()
        if server_id:
            if settings.node_discovery == "agent":
                logger.info(
                    "Syncing in agent mode: use Admin or API to trigger sync; running reissue only."
                )
                await _reissue_server(server_id, adapter)
                return 0
            if not await _sync_one(server_id, adapter):
                return 1
            await _reissue_server(server_id, adapter)
            return 0
        # No server_id: sync all (docker only), then reissue all devices on all servers
        await _sync_all()
        async with async_session_factory() as session:
            r = await session.execute(
                select(Server).where(Server.is_active.is_(True)).order_by(Server.created_at.asc())
            )
            servers = r.scalars().all()
        for s in servers:
            await _reissue_server(s.id, adapter)
        return 0
    finally:
        await close_redis()


if __name__ == "__main__":
    sys.exit(asyncio.run(main()))
