"""Restore device rows in DB for peers that exist on AmneziaWG server but not in DB.

Read-only on node: only lists peers. Creates Device records for peers present on node
and missing in DB. Does not remove or delete any existing data.

.conf files: Original client .conf cannot be recovered (client private key is not stored).
  Config content lives only in IssuedConfig (DB) or in the API response at issue time.
  Browser localStorage does NOT store .conf — only UI prefs (theme, region, etc.).
  Use --reissue-no-config to issue new configs for devices that have none (new download URLs);
  users must re-import the new .conf (peer on node is replaced with new keys).

Usage:
  python apps/admin-api/scripts/restore_devices_from_peers.py [server_id] [--reissue-no-config]
  If server_id is omitted, processes all servers known to the adapter.
  --reissue-no-config: after restore, reissue each device on those servers that has no
  IssuedConfig, so they get downloadable .conf again (new keys; old client config stops working).
"""

import argparse
import asyncio
import logging
import sys
from datetime import datetime, timezone

logging.basicConfig(level=logging.INFO, format="%(message)s")
logger = logging.getLogger(__name__)

# apps/admin-api/scripts/ -> apps/admin-api/
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.database import async_session_factory
from app.models import Device, IssuedConfig, Server, Subscription
from app.models.base import uuid4_hex
from app.services.admin_issue_service import _resolve_system_user_sub, reissue_config_for_device
from app.services.node_runtime_docker import DockerNodeRuntimeAdapter

ADAPTER = DockerNodeRuntimeAdapter(
    container_filter=getattr(settings, "docker_vpn_container_prefixes", "amnezia-awg,amnezia-wg")
    or "amnezia-awg,amnezia-wg",
    interface="awg0",
)


async def _get_servers(session: AsyncSession, server_id: str | None) -> list[Server]:
    if server_id:
        r = await session.execute(select(Server).where(Server.id == server_id))
        s = r.scalar_one_or_none()
        return [s] if s else []
    r = await session.execute(select(Server).order_by(Server.created_at.asc()))
    return list(r.scalars().all())


async def restore_devices(
    session: AsyncSession,
    server: Server,
    user_id: int,
    subscription_id: str,
    seen_keys: set[str],
) -> int:
    """For one server: list peers from node, create Device for each peer not in DB. Returns count created."""
    peers = await ADAPTER.list_peers(server.id)
    if not peers:
        return 0
    node_keys_to_peer: dict[str, dict] = {
        str(p["public_key"]): p for p in peers if isinstance(p, dict) and p.get("public_key")
    }
    r = await session.execute(select(Device.public_key))
    db_keys = seen_keys | {row[0] for row in r.all()}  # skip if peer exists in DB or this batch
    extra = set(node_keys_to_peer.keys()) - db_keys
    if not extra:
        return 0
    sub_r = await session.execute(select(Subscription).where(Subscription.id == subscription_id))
    sub = sub_r.scalar_one_or_none()
    if not sub:
        return 0
    count_r = await session.execute(
        select(func.count())
        .select_from(Device)
        .where(
            Device.subscription_id == subscription_id,
            Device.revoked_at.is_(None),
        )
    )
    current_count = count_r.scalar() or 0
    limit = max(0, sub.device_limit - current_count)
    if limit <= 0:
        logger.warning(
            "Server %s: system subscription device limit reached; skip restore", server.id
        )
        return 0
    extra = set(list(extra)[:limit])
    now = datetime.now(timezone.utc)
    created = 0
    for pk in extra:
        peer = node_keys_to_peer[pk]
        allowed_ips = (peer.get("allowed_ips") or "").strip() or None
        device = Device(
            id=uuid4_hex(),
            user_id=user_id,
            subscription_id=subscription_id,
            server_id=server.id,
            device_name=None,
            public_key=pk,
            allowed_ips=allowed_ips,
            issued_at=now,
            revoked_at=None,
            apply_status="APPLIED",
            last_applied_at=now,
        )
        session.add(device)
        seen_keys.add(pk)
        created += 1
    return created


async def reissue_devices_with_no_config(
    session: AsyncSession,
    servers: list[Server],
) -> int:
    """Reissue config for each device on these servers that has no IssuedConfig. Returns count."""
    if not servers:
        return 0
    server_ids = [s.id for s in servers]
    # Devices that have no IssuedConfig row
    has_config = (
        select(1).select_from(IssuedConfig).where(IssuedConfig.device_id == Device.id).exists()
    )
    r = await session.execute(
        select(Device).where(
            Device.server_id.in_(server_ids),
            Device.revoked_at.is_(None),
            ~has_config,
        )
    )
    devices = list(r.scalars().all())
    reissued = 0
    for device in devices:
        try:
            await reissue_config_for_device(
                session,
                device_id=device.id,
                runtime_adapter=ADAPTER,
                base_config_url="/api/v1/admin/configs",
            )
            reissued += 1
            logger.info(
                "Reissued config for device %s (server %s)", device.id[:8], device.server_id
            )
        except Exception as e:
            logger.warning("Reissue failed for device %s: %s", device.id[:8], e)
    return reissued


async def main() -> None:
    parser = argparse.ArgumentParser(description="Restore device rows from AmneziaWG peers")
    parser.add_argument(
        "server_id", nargs="?", default=None, help="Optional server id; default all"
    )
    parser.add_argument(
        "--reissue-no-config",
        action="store_true",
        help="After restore, reissue config for devices with no IssuedConfig (new .conf download URLs)",
    )
    args = parser.parse_args()
    server_id = (args.server_id or "").strip() or None

    async with async_session_factory() as session:
        try:
            user_id, subscription_id = await _resolve_system_user_sub(session)
        except ValueError as e:
            logger.error(
                "System operator not seeded. Run: ./manage.sh seed-system-operator — %s", e
            )
            sys.exit(1)
        servers = await _get_servers(session, server_id)
        if not servers:
            logger.error("No server(s) found for %s", server_id or "all")
            sys.exit(1)
        total = 0
        seen_keys: set[str] = set()
        for server in servers:
            n = await restore_devices(session, server, user_id, subscription_id, seen_keys)
            if n:
                logger.info("Server %s: restored %d device(s)", server.id, n)
                total += n
        if args.reissue_no_config:
            reissued = await reissue_devices_with_no_config(session, servers)
            if reissued:
                logger.info("Reissued config for %d device(s) (no config -> new .conf)", reissued)
            else:
                logger.info("No devices without config to reissue.")
        await session.commit()
        if total:
            logger.info("Total restored: %d device(s)", total)
        elif not args.reissue_no_config:
            logger.info("No peers on node missing from DB; nothing to restore.")


if __name__ == "__main__":
    asyncio.run(main())
