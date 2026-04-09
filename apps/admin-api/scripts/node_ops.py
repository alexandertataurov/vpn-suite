"""CLI for runtime node operations via docker adapter.

Run from repo root:
  ./manage.sh node-list
  ./manage.sh node-check <server_id>
  ./manage.sh node-telemetry <server_id>
  ./manage.sh node-public-key <server_id>
  ./manage.sh node-undrain <server_id>
  ./manage.sh node-limits-apply <server_id> [traffic_gb] [speed_mbps] [max_connections]
"""

import asyncio
import json
import logging
import sys

logging.basicConfig(level=logging.INFO, format="%(message)s")
logger = logging.getLogger(__name__)

from sqlalchemy import select

from app.core.database import async_session_factory
from app.core.node_scan_task import run_node_scan_once
from app.models import Server
from app.services.node_runtime_docker import DockerNodeRuntimeAdapter
from app.services.reconciliation_engine import reconcile_all_nodes, reconcile_node

ADAPTER = DockerNodeRuntimeAdapter(container_filter="amnezia-awg", interface="awg0")


async def _get_server(server_id: str) -> Server | None:
    async with async_session_factory() as session:
        r = await session.execute(select(Server).where(Server.id == server_id))
        return r.scalar_one_or_none()


async def _sync() -> None:
    """Trigger docker node discovery and sync to DB (so admin dashboard shows nodes)."""
    added = await run_node_scan_once(lambda: ADAPTER)
    logger.info("Sync done. New nodes discovered: %s", added)


async def _resync() -> None:
    """Run reconciliation: add/remove/update peers on nodes to match DB."""
    results = await reconcile_all_nodes(ADAPTER)
    for nid, r in results:
        logger.info(
            "%s: peers_added=%s peers_removed=%s peers_updated=%s errors=%s",
            nid,
            r.peers_added,
            r.peers_removed,
            r.peers_updated,
            r.errors[:3],
        )
    logger.info("Resync done. Nodes reconciled: %s", len(results))


async def _reconcile_one(server_id: str, dry_run: bool = False) -> None:
    """Reconcile a single node by server_id. With --dry-run only compute diff (no apply)."""
    from app.core.config import settings

    if settings.environment == "production":
        logger.error("Reconciliation must not run in production; only node-agent mutates peers.")
        sys.exit(1)
    server = await _get_server(server_id)
    if not server:
        logger.error("Server not found: %s", server_id)
        sys.exit(1)
    if dry_run:
        # reconcile_node in read_only is not exposed; run full reconcile (apply_diff is inside reconcile_node).
        logger.info(
            "Dry-run: would reconcile node_id=%s (run without --dry-run to apply)", server_id
        )
        return
    result = await reconcile_node(server_id, ADAPTER)
    logger.info(
        "%s: peers_added=%s peers_removed=%s peers_updated=%s errors=%s duration_ms=%.0f",
        server_id,
        result.peers_added,
        result.peers_removed,
        result.peers_updated,
        result.errors[:5],
        result.duration_ms,
    )


async def _list() -> None:
    async with async_session_factory() as session:
        r = await session.execute(select(Server).order_by(Server.created_at.desc()))
        servers = r.scalars().all()
    if not servers:
        logger.info("No servers registered.")
        return
    for s in servers:
        health = getattr(s, "health_score", None)
        draining = getattr(s, "is_draining", False)
        h = f"{health:.2f}" if health is not None else "-"
        logger.info(
            "%s\t%s\t%s\t%s\thealth=%s\tdraining=%s\tactive=%s\t%s",
            s.id,
            s.name,
            s.region,
            s.status,
            h,
            draining,
            s.is_active,
            s.api_endpoint,
        )


async def _check(server_id: str) -> None:
    server = await _get_server(server_id)
    if not server:
        logger.error("Server not found: %s", server_id)
        sys.exit(1)
    result = await ADAPTER.health_check(server.id)
    logger.info(
        "Health: %s latency_ms=%s handshake=%s",
        result.get("status"),
        result.get("latency_ms"),
        result.get("handshake_ok"),
    )
    peers = await ADAPTER.list_peers(server.id)
    logger.info("Peers: %s", len(peers))
    if peers:
        logger.info("Peer sample: %s", json.dumps(peers[:3], indent=2))


async def _telemetry(server_id: str) -> None:
    server = await _get_server(server_id)
    if not server:
        logger.error("Server not found: %s", server_id)
        sys.exit(1)
    peers = await ADAPTER.list_peers(server.id)
    out = [
        {
            "public_key": str(p.get("public_key")),
            "traffic_bytes": int(p.get("transfer_rx") or 0) + int(p.get("transfer_tx") or 0),
            "allowed_ips": str(p.get("allowed_ips") or ""),
        }
        for p in peers
        if isinstance(p, dict) and p.get("public_key")
    ]
    logger.info("%s", json.dumps(out, indent=2))


async def _public_key(server_id: str, key_override: str | None) -> None:
    server = await _get_server(server_id)
    if not server:
        logger.error("Server not found: %s", server_id)
        sys.exit(1)
    key = key_override.strip() if key_override else ""
    if not key:
        nodes = await ADAPTER.discover_nodes()
        for node in nodes:
            if node.node_id == server.id and node.public_key:
                key = node.public_key
                break
    if not key:
        logger.error("Could not resolve public key from runtime. Pass key explicitly.")
        sys.exit(1)
    async with async_session_factory() as session:
        r = await session.execute(select(Server).where(Server.id == server_id))
        s = r.scalar_one_or_none()
        if s:
            s.public_key = key
            await session.commit()
    logger.info("%s", key)


async def _undrain(server_id: str) -> None:
    server = await _get_server(server_id)
    if not server:
        logger.error("Server not found: %s", server_id)
        sys.exit(1)
    if not getattr(server, "is_draining", False):
        logger.info("Node is not draining.")
        return
    async with async_session_factory() as session:
        r = await session.execute(select(Server).where(Server.id == server_id))
        s = r.scalar_one_or_none()
        if s:
            s.is_draining = False
            await session.commit()
    logger.info("Undrain: ok")


async def _limits_apply(
    server_id: str,
    traffic_gb: float | None = None,
    speed_mbps: float | None = None,
    max_connections: int | None = None,
) -> None:
    server = await _get_server(server_id)
    if not server:
        logger.error("Server not found: %s", server_id)
        sys.exit(1)
    async with async_session_factory() as session:
        r = await session.execute(select(Server).where(Server.id == server_id))
        s = r.scalar_one_or_none()
        if not s:
            logger.error("Server not found: %s", server_id)
            sys.exit(1)
        if traffic_gb is not None:
            s.traffic_limit_gb = traffic_gb
        if speed_mbps is not None:
            s.speed_limit_mbps = speed_mbps
        if max_connections is not None:
            s.max_connections = max_connections
        await session.commit()
    logger.info("Limits saved (db-only for docker runtime).")


def _parse_float(s: str | None) -> float | None:
    if s is None or s == "" or s == "-":
        return None
    try:
        return float(s)
    except ValueError:
        return None


def _parse_int(s: str | None) -> int | None:
    if s is None or s == "" or s == "-":
        return None
    try:
        return int(s)
    except ValueError:
        return None


def main() -> None:
    if len(sys.argv) < 2:
        logger.error(
            "Usage: node_ops.py {sync|resync|reconcile|list|check|telemetry|limits-apply|undrain|public-key} "
            "[server_id] [--dry-run|key_or_traffic_gb...]",
        )
        sys.exit(1)
    sub = sys.argv[1].lower()
    node_id = sys.argv[2] if len(sys.argv) > 2 else None
    dry_run = len(sys.argv) > 3 and sys.argv[3] == "--dry-run"
    key_arg = sys.argv[3].strip() if len(sys.argv) > 3 and sub == "public-key" else None
    if sub == "sync":
        asyncio.run(_sync())
    elif sub == "resync":
        asyncio.run(_resync())
    elif sub == "reconcile":
        if not node_id:
            logger.error("reconcile requires server_id")
            sys.exit(1)
        asyncio.run(_reconcile_one(node_id, dry_run=dry_run))
    elif sub == "list":
        asyncio.run(_list())
    elif sub == "check":
        if not node_id:
            logger.error("node-check requires server_id")
            sys.exit(1)
        asyncio.run(_check(node_id))
    elif sub == "telemetry":
        if not node_id:
            logger.error("node-telemetry requires server_id")
            sys.exit(1)
        asyncio.run(_telemetry(node_id))
    elif sub == "limits-apply":
        if not node_id:
            logger.error("limits-apply requires server_id")
            sys.exit(1)
        traffic_gb = _parse_float(sys.argv[3]) if len(sys.argv) > 3 else None
        speed_mbps = _parse_float(sys.argv[4]) if len(sys.argv) > 4 else None
        max_conn = _parse_int(sys.argv[5]) if len(sys.argv) > 5 else None
        asyncio.run(_limits_apply(node_id, traffic_gb, speed_mbps, max_conn))
    elif sub == "undrain":
        if not node_id:
            logger.error("undrain requires server_id")
            sys.exit(1)
        asyncio.run(_undrain(node_id))
    elif sub == "public-key":
        if not node_id:
            logger.error("public-key requires server_id")
            sys.exit(1)
        asyncio.run(_public_key(node_id, key_arg))
    else:
        logger.error("Unknown subcommand: %s", sub)
        sys.exit(1)


if __name__ == "__main__":
    main()
