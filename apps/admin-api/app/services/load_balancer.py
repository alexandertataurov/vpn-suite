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

KIND_AWG_NODE = "awg_node"
KIND_LEGACY_WG_RELAY = "legacy_wg_relay"


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


def _base_candidates(
    nodes: list[NodeMetadata],
    *,
    required_capabilities: list[str] | None = None,
    allowed_kinds: set[str] | None = None,
) -> list[NodeMetadata]:
    degraded_min_score = 0.5
    candidates = [
        n
        for n in nodes
        if n.status in ("healthy", "degraded", "unknown")
        and (n.health_score or 0) >= degraded_min_score
        and n.peer_count < n.max_peers
        and not n.is_draining
        and (allowed_kinds is None or (getattr(n, "kind", KIND_AWG_NODE) in allowed_kinds))
    ]
    if required_capabilities:
        candidates = [
            n for n in candidates if all((n.capabilities or {}).get(c) for c in required_capabilities)
        ]
    healthy_candidates = [n for n in candidates if (n.health_score or 0) >= 0.9]
    return healthy_candidates or candidates


def _pick_best(candidates: list[NodeMetadata], client_ip: str | None = None) -> NodeMetadata | None:
    if not candidates:
        return None
    return cast(
        NodeMetadata,
        max(candidates, key=lambda n: (calculate_node_score(n, client_ip), n.node_id)),
    )


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
    candidates = _base_candidates(
        topology.nodes,
        required_capabilities=required_capabilities,
        allowed_kinds={KIND_AWG_NODE},
    )
    if not candidates:
        _log.warning("Load balancer: no suitable node (candidates=%d)", len(topology.nodes))
        raise LoadBalancerError("No suitable node available for peer placement")
    return _pick_best(candidates, client_ip)


async def select_legacy_relay(
    get_topology: Any,
    client_ip: str | None = None,
    required_capabilities: list[str] | None = None,
) -> NodeMetadata | None:
    topology = await get_topology()
    candidates = _base_candidates(
        topology.nodes,
        required_capabilities=required_capabilities,
        allowed_kinds={KIND_LEGACY_WG_RELAY},
    )
    if not candidates:
        _log.warning("Load balancer: no suitable relay (candidates=%d)", len(topology.nodes))
        raise LoadBalancerError("No suitable relay available for peer placement")
    return _pick_best(candidates, client_ip)


async def select_relay_and_upstream(
    get_topology: Any,
    client_ip: str | None = None,
    relay_required_capabilities: list[str] | None = None,
    upstream_required_capabilities: list[str] | None = None,
) -> tuple[NodeMetadata, NodeMetadata]:
    topology = await get_topology()
    relays = _base_candidates(
        topology.nodes,
        required_capabilities=relay_required_capabilities,
        allowed_kinds={KIND_LEGACY_WG_RELAY},
    )
    upstreams = _base_candidates(
        topology.nodes,
        required_capabilities=upstream_required_capabilities,
        allowed_kinds={KIND_AWG_NODE},
    )
    relay = _pick_best(relays, client_ip)
    upstream = _pick_best(upstreams, client_ip)
    if relay is None or upstream is None:
        raise LoadBalancerError("No suitable relay/upstream pair available for peer placement")
    return relay, upstream
