"""Migrate peer (device) from one node to another (spec 4.2)."""

import logging
from typing import Any

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import LoadBalancerError, WireGuardCommandError
from app.models import Device, Server
from app.services.load_balancer import select_node
from app.services.node_runtime import NodeRuntimeAdapter, PeerConfigLike

_log = logging.getLogger(__name__)

async def migrate_peer(
    session: AsyncSession,
    device: Device,
    target_node_id: str,
    adapter: NodeRuntimeAdapter,
) -> None:
    """
    Move peer to target node: remove from current, add on target, update device.server_id.
    Caller must commit. Raises WireGuardCommandError on add failure.
    """
    if device.revoked_at is not None:
        raise ValueError("Peer is revoked")
    old_node_id = device.server_id
    if old_node_id == target_node_id:
        return
    allowed = (device.allowed_ips or "").strip()
    if not allowed or "0.0.0.0/0" in allowed:
        raise WireGuardCommandError(
            "Device has no valid allowed_ips; re-issue config first",
            command="migrate_peer",
            output="allowed_ips missing or 0.0.0.0/0",
        )
    peer_config = PeerConfigLike(public_key=device.public_key, allowed_ips=allowed)
    try:
        await adapter.remove_peer(old_node_id, device.public_key)
    except Exception as e:
        _log.warning("Migrate remove_peer failed (continuing): node_id=%s %s", old_node_id, e)
    try:
        await adapter.add_peer(target_node_id, peer_config)
    except Exception as e:
        _log.exception("Migrate add_peer failed: target=%s", target_node_id)
        rollback_ok = False
        rollback_error = ""
        try:
            await adapter.add_peer(old_node_id, peer_config)
            rollback_ok = True
        except Exception as rollback_exc:
            rollback_error = str(rollback_exc)
            _log.exception(
                "Migrate rollback failed: old_node=%s target=%s",
                old_node_id,
                target_node_id,
            )
        message = f"Add peer on target failed: {e}"
        if rollback_ok:
            message = f"{message}; rollback restored on source"
        elif rollback_error:
            message = f"{message}; rollback_failed={rollback_error}"
        raise WireGuardCommandError(message, command="add_peer", output=str(e))
    device.server_id = target_node_id


async def resolve_target_node(
    session: AsyncSession,
    target_node_id: str | None,
    get_topology: Any,
) -> str:
    """Resolve target node id: use target_node_id if provided, else load balancer. Raises LoadBalancerError if no node."""
    if target_node_id:
        r = await session.execute(
            select(Server).where(Server.id == target_node_id, Server.is_active.is_(True))
        )
        if r.scalar_one_or_none() is None:
            raise ValueError("Target node not found or inactive")
        return target_node_id
    node = await select_node(get_topology, client_ip=None, required_capabilities=None)
    if node is None:
        raise LoadBalancerError("No suitable node available for peer placement")
    return node.node_id
