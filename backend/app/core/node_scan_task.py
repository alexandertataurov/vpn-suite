"""Background task: periodic docker-based node discovery + registry sync."""

from __future__ import annotations

import asyncio
import logging

from sqlalchemy import select

from app.core.config import settings
from app.core.database import async_session_factory
from app.models import Server
from app.services.topology_engine import TopologyEngine

_log = logging.getLogger(__name__)


async def _known_docker_node_ids() -> set[str]:
    async with async_session_factory() as session:
        rows = await session.execute(
            select(Server.id).where(Server.api_endpoint.like("docker://%"))
        )
        return {row[0] for row in rows.all()}


def _fallback_adapter():
    from app.services.node_runtime_docker import DockerNodeRuntimeAdapter

    prefixes = getattr(settings, "docker_vpn_container_prefixes", "amnezia-awg,shadowbox") or "amnezia-awg,shadowbox"
    return DockerNodeRuntimeAdapter(container_filter=prefixes, interface="awg0")


async def run_node_scan_once(get_adapter=None) -> int:
    """
    Run one discovery cycle and synchronize topology -> DB.
    Returns the count of newly discovered docker nodes in this cycle.
    """
    adapter = get_adapter() if callable(get_adapter) else None
    if adapter is None:
        adapter = _fallback_adapter()
    before = await _known_docker_node_ids()
    engine = TopologyEngine(adapter)
    topo = await engine.rebuild_topology()
    discovered = {node.node_id for node in topo.nodes}
    return len(discovered - before)


async def run_node_scan_loop(get_adapter) -> None:
    """Run discovery every node_scan_interval_seconds (0 disables)."""
    interval = settings.node_scan_interval_seconds
    if interval <= 0:
        _log.info("Node scan disabled (interval=%s)", interval)
        return
    while True:
        try:
            await run_node_scan_once(get_adapter)
        except Exception as exc:
            _log.exception("Node scan error: %s", type(exc).__name__)
        await asyncio.sleep(interval)
