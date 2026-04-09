"""Topology engine: build and cache cluster state."""

import hashlib
import json
import logging
from datetime import datetime, timezone
from typing import TYPE_CHECKING

from sqlalchemy import select

from app.core.config import settings
from app.core.database import async_session_factory
from app.core.metrics import update_topology_metrics
from app.core.redis_client import get_redis
from app.models import Server
from app.schemas.node import ClusterTopology, NodeMetadata

_log = logging.getLogger(__name__)

if TYPE_CHECKING:
    from app.services.node_runtime import NodeRuntimeAdapter

TOPOLOGY_KEY = "vpn:topology:current"
VERSION_KEY = "vpn:topology:version"
HASH_KEY = "vpn:topology:hash"


def _derive_vpn_endpoint(node: NodeMetadata) -> str | None:
    if node.endpoint_ip and node.listen_port:
        return f"{node.endpoint_ip}:{node.listen_port}"
    return None


def _compute_topology_hash(topology: ClusterTopology) -> str:
    """Deterministic hash for change detection (exclude timestamp and version)."""
    data = topology.model_dump(exclude={"timestamp", "topology_version"})
    # Normalize nodes for stable hash (e.g. sort by node_id)
    if "nodes" in data:
        data["nodes"] = sorted(
            data["nodes"],
            key=lambda n: n.get("node_id", ""),
        )
    canonical = json.dumps(data, sort_keys=True, default=str)
    return hashlib.sha256(canonical.encode()).hexdigest()


class TopologyEngine:
    """Build and cache cluster topology."""

    def __init__(self, adapter: "NodeRuntimeAdapter"):
        self._adapter = adapter

    async def _sync_discovered_nodes(self, nodes: list[NodeMetadata]) -> None:
        """Upsert discovered docker nodes into Server table and reflect draining status into topology."""
        # In production agent mode, Server registry is managed explicitly (seeded/provisioned),
        # and node-agent provides health/telemetry via heartbeat. Do not rewrite rows as docker://.
        if settings.node_discovery != "docker":
            return
        discovered = {node.node_id: node for node in nodes}
        try:
            async with async_session_factory() as session:
                existing_rows = await session.execute(
                    select(Server).where(Server.api_endpoint.like("docker://%"))
                )
                existing = {server.id: server for server in existing_rows.scalars().all()}

                for node_id, node in discovered.items():
                    server = existing.get(node_id)
                    vpn_endpoint = _derive_vpn_endpoint(node)
                    api_endpoint = f"docker://{node.container_name}"
                    if server is None:
                        session.add(
                            Server(
                                id=node_id,
                                name=node.container_name,
                                region="docker",
                                api_endpoint=api_endpoint,
                                kind="awg_node",
                                vpn_endpoint=vpn_endpoint,
                                public_key=node.public_key or None,
                                status=node.status or "unknown",
                                is_active=node.status != "unhealthy",
                                max_connections=node.max_peers,
                                health_score=node.health_score,
                                is_draining=False,
                            )
                        )
                        continue

                    if server.max_connections and server.max_connections > 0:
                        node.max_peers = server.max_connections
                    else:
                        server.max_connections = node.max_peers
                    node.kind = getattr(server, "kind", "awg_node") or "awg_node"
                    server.name = node.container_name
                    server.api_endpoint = api_endpoint
                    if vpn_endpoint:
                        server.vpn_endpoint = vpn_endpoint
                    if node.public_key:
                        server.public_key = node.public_key
                    server.status = node.status or server.status
                    server.is_active = node.status != "unhealthy"
                    server.max_connections = node.max_peers
                    server.health_score = node.health_score
                    node.is_draining = bool(server.is_draining)

                for server_id, server in existing.items():
                    if server_id in discovered:
                        continue
                    server.is_active = False
                    server.status = "unreachable"
                    server.health_score = 0.0

                await session.commit()
        except Exception as exc:
            _log.warning("Topology DB sync failed: %s", type(exc).__name__)

    async def rebuild_topology(self) -> ClusterTopology:
        """Fetch nodes from adapter, aggregate metrics, sync DB registry, set deterministic version."""
        nodes = await self._adapter.discover_nodes()
        await self._sync_discovered_nodes(nodes)
        total_capacity = sum(n.max_peers for n in nodes)

        # For cluster "load" and dashboard peers, prefer active/connected peers
        # when available, falling back to total peer_count only when necessary.
        def _peer_count(n: object) -> int:
            v = getattr(n, "active_peers", None)
            if v is not None:
                return int(v)
            return int(getattr(n, "peer_count", None) or 0)

        current_load = sum(_peer_count(n) for n in nodes)
        load_factor = current_load / total_capacity if total_capacity else 0.0
        load_index = load_factor
        capacity_score = (
            ((total_capacity - current_load) / total_capacity) if total_capacity else 0.0
        )
        health_scores = [n.health_score for n in nodes if n.health_score is not None]
        cluster_health = sum(health_scores) / len(health_scores) if health_scores else 0.0
        health_index = cluster_health
        now = datetime.now(timezone.utc)
        topology = ClusterTopology(
            timestamp=now,
            nodes=nodes,
            total_capacity=total_capacity,
            current_load=current_load,
            load_factor=load_factor,
            load_index=load_index,
            health_score=cluster_health,
            health_index=health_index,
            capacity_score=capacity_score,
            topology_version=0,  # set below after hash
        )
        h = _compute_topology_hash(topology)
        try:
            redis = get_redis()
            prev_hash = await redis.get(HASH_KEY)
            prev_hash_s = prev_hash.decode() if isinstance(prev_hash, bytes) else (prev_hash or "")
            prev = await redis.get(VERSION_KEY)
            prev_version = int(prev) if prev else 0
            if prev_hash_s == h and prev_version > 0:
                new_version = prev_version
            else:
                new_version = prev_version + 1
            topology.topology_version = new_version
            await redis.set(
                VERSION_KEY, str(new_version), ex=max(settings.topology_cache_ttl_seconds * 3, 60)
            )
            await redis.set(HASH_KEY, h, ex=max(settings.topology_cache_ttl_seconds * 3, 60))
        except Exception as e:
            _log.warning("Redis topology version update failed: %s", e)
            topology.topology_version = 1
        try:
            update_topology_metrics(topology)
        except Exception as e:
            _log.debug("Metrics update failed: %s", e)
        try:
            redis = get_redis()
            await redis.setex(
                TOPOLOGY_KEY, settings.topology_cache_ttl_seconds, topology.model_dump_json()
            )
        except Exception as e:
            _log.warning("Redis topology cache set failed: %s", e)
        return topology

    async def get_topology(self) -> ClusterTopology:
        """Return cached topology if fresh, otherwise rebuild and cache."""
        ttl = settings.topology_cache_ttl_seconds
        try:
            redis = get_redis()
            raw = await redis.get(TOPOLOGY_KEY)
            if raw:
                return ClusterTopology.model_validate_json(raw)
        except Exception as e:
            _log.warning("Redis topology cache get failed: %s", e)
        topology = await self.rebuild_topology()
        try:
            update_topology_metrics(topology)
        except Exception as e:
            _log.debug("Metrics update failed: %s", e)
        try:
            redis = get_redis()
            await redis.setex(TOPOLOGY_KEY, ttl, topology.model_dump_json())
        except Exception as e:
            _log.warning("Redis topology cache set failed: %s", e)
        return topology
