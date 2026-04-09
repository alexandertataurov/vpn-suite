"""S8-4: Compare per-peer metrics with server limits; auto-block and audit when exceeded."""

import logging

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import Device, Server
from app.services.audit_service import log_audit
from app.services.node_runtime import NodeRuntimeAdapter

_log = logging.getLogger(__name__)
AUDIT_ADMIN_SYSTEM = "system"


async def run_limits_check(
    session: AsyncSession,
    runtime_adapter: NodeRuntimeAdapter,
) -> None:
    """For each server with traffic_limit_gb and is_active, fetch peer metrics; block and audit if over limit."""
    from app.core.config import settings

    if not settings.limits_auto_block_enabled:
        return
    r = await session.execute(
        select(Server).where(
            Server.is_active.is_(True),
            Server.traffic_limit_gb.isnot(None),
            Server.traffic_limit_gb > 0,
        )
    )
    servers = r.scalars().all()
    for server in servers:
        if server.traffic_limit_gb is None:
            continue
        limit_bytes = int(server.traffic_limit_gb * 1e9)
        peers = await runtime_adapter.list_peers(server.id)
        metrics_list = [
            {
                "public_key": str(peer.get("public_key")),
                "traffic_bytes": int(peer.get("transfer_rx") or 0)
                + int(peer.get("transfer_tx") or 0),
            }
            for peer in peers
            if isinstance(peer, dict) and peer.get("public_key")
        ]
        if not metrics_list:
            continue
        traffic_by_key = {
            m["public_key"]: m.get("traffic_bytes")
            for m in metrics_list
            if m.get("traffic_bytes") is not None
        }
        if not traffic_by_key:
            continue
        dev_r = await session.execute(
            select(Device).where(
                Device.server_id == server.id,
                Device.revoked_at.is_(None),
            )
        )
        devices = dev_r.scalars().all()
        for device in devices:
            tb = traffic_by_key.get(device.public_key)
            if tb is None or tb <= limit_bytes:  # type: ignore[operator]
                continue
            ok = True
            try:
                await runtime_adapter.remove_peer(server.id, device.public_key)
            except Exception:
                ok = False
            await log_audit(
                session,
                admin_id=AUDIT_ADMIN_SYSTEM,
                action="auto_block",
                resource_type="device",
                resource_id=device.id,
                old_new={
                    "reason": "traffic_limit_exceeded",
                    "traffic_bytes": tb,
                    "limit_gb": server.traffic_limit_gb,
                    "server_id": server.id,
                    "node_accepted": ok,
                },
            )
            _log.warning(
                "Auto-blocked device_id=%s server_id=%s traffic_bytes=%s limit_gb=%s",
                device.id,
                server.id,
                tb,
                server.traffic_limit_gb,
            )
    await session.commit()
