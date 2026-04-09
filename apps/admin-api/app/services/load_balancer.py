"""Load balancer: select node for new peer assignment (capacity, health, load)."""

import logging
from typing import Any, cast

from app.core.config import settings
from app.core.exceptions import LoadBalancerError
from app.schemas.node import NodeMetadata

_log = logging.getLogger(__name__)

WEIGHTS = {
    "capacity": settings.load_balancer_weight_capacity,
    "health": settings.load_balancer_weight_health,
    "load": settings.load_balancer_weight_load,
    "latency": settings.load_balancer_weight_latency,
}


def _capacity_score(node: NodeMetadata) -> float:
    """Absolute available capacity used by Ultra Spec weighted scheduling."""
    return float(max(node.max_peers - node.peer_count, 0))


def _health_score(node: NodeMetadata) -> float:
    """Use node.health_score (0..1)."""
    return max(0.0, min(1.0, node.health_score or 0.0))


def _latency_penalty(node: NodeMetadata, _client_ip: str | None = None) -> float:
    """Penalty term from runtime latency (seconds * weight)."""
    latency_ms = float(node.latency_ms or 0.0)
    return (latency_ms / 1000.0) * WEIGHTS["latency"]


def calculate_node_score(
    node: NodeMetadata,
    client_ip: str | None = None,
) -> float:
    """Ultra Spec score: (available_slots * capacity_weight) + health_score - latency_penalty."""
    cap = _capacity_score(node)
    health = _health_score(node)
    latency_penalty = _latency_penalty(node, client_ip)
    return (cap * WEIGHTS["capacity"]) + health - latency_penalty


async def select_node(
    get_topology: Any,
    client_ip: str | None = None,
    required_capabilities: list[str] | None = None,
) -> NodeMetadata | None:
    """
    Select best node for new peer: health >= DEGRADED, has capacity, not draining.
    required_capabilities: filter by node.capabilities (optional).
    """
    topology = await get_topology()
    nodes = topology.nodes
    # Filter: healthy/degraded, has capacity, not draining.
    degraded_min_score = 0.5
    candidates = [
        n
        for n in nodes
        if n.status in ("healthy", "degraded", "unknown")
        and (n.health_score or 0) >= degraded_min_score
        and n.peer_count < n.max_peers
        and not n.is_draining
    ]
    if required_capabilities:
        candidates = [
            n for n in candidates if all(n.capabilities.get(c) for c in required_capabilities)
        ]
    healthy_candidates = [n for n in candidates if (n.health_score or 0) >= 0.9]
    if healthy_candidates:
        candidates = healthy_candidates
    if not candidates:
        _log.warning("Load balancer: no suitable node (candidates=%d)", len(nodes))
        raise LoadBalancerError("No suitable node available for peer placement")
    # Score and pick best; tie-break by node_id for stability
    best = max(
        candidates,
        key=lambda n: (calculate_node_score(n, client_ip), n.node_id),
    )
    return cast(NodeMetadata, best)
