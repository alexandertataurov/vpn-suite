"""Health scoring and NodeHealthState for control-plane."""

from enum import Enum

from app.models.server import Server
from app.models.server_health_log import ServerHealthLog


class NodeHealthState(str, Enum):
    HEALTHY = "healthy"  # score >= 0.9
    DEGRADED = "degraded"  # 0.5 <= score < 0.9
    UNHEALTHY = "unhealthy"  # score < 0.5
    UNKNOWN = "unknown"  # no recent data


def calculate_health_score(
    server: Server,
    health_log: ServerHealthLog | None = None,
    peer_count: int = 0,
    active_peer_count: int = 0,
    max_peers: int | None = None,
) -> float:
    """
    Multi-factor health score in [0.0, 1.0].
    Uses container/process reachable, peer connectivity ratio, capacity.
    """
    score = 1.0
    max_peers = max_peers or server.max_connections or 1000

    # Container/process reachable (from last health log)
    if health_log:
        if health_log.status == "unreachable":
            score *= 0.0
        elif health_log.status == "degraded":
            score *= 0.5
        elif health_log.status != "ok":
            score *= 0.3
        # ok: leave score at 1.0
    else:
        # No recent health log
        if getattr(server, "status", None) == "unreachable":
            score *= 0.0
        elif getattr(server, "status", None) in ("degraded", "unknown"):
            score *= 0.5

    # Peer connectivity: share of peers with recent handshake (if we have data)
    if peer_count > 0:
        ratio = active_peer_count / peer_count
        score *= 0.5 + 0.5 * ratio

    # Near capacity penalty
    if max_peers and peer_count >= max_peers * 0.95:
        score *= 0.7

    return max(0.0, min(1.0, score))


def health_score_to_state(score: float) -> NodeHealthState:
    """Map health score to NodeHealthState."""
    if score >= 0.9:
        return NodeHealthState.HEALTHY
    if score >= 0.5:
        return NodeHealthState.DEGRADED
    if score > 0.0:
        return NodeHealthState.UNHEALTHY
    return NodeHealthState.UNKNOWN
