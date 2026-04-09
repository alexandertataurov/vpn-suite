"""Unit tests for health scoring."""

from datetime import datetime, timezone

from app.services.health_scoring import (
    NodeHealthState,
    calculate_health_score,
    health_score_to_state,
)


def test_health_score_to_state():
    assert health_score_to_state(0.95) == NodeHealthState.HEALTHY
    assert health_score_to_state(0.9) == NodeHealthState.HEALTHY
    assert health_score_to_state(0.7) == NodeHealthState.DEGRADED
    assert health_score_to_state(0.5) == NodeHealthState.DEGRADED
    assert health_score_to_state(0.3) == NodeHealthState.UNHEALTHY
    assert health_score_to_state(0.0) == NodeHealthState.UNKNOWN


def test_calculate_health_score_ok_no_peers():
    from app.models.server import Server
    from app.models.server_health_log import ServerHealthLog

    server = Server(id="s1", name="n1", region="r1", api_endpoint="https://a.b/c")
    log = ServerHealthLog(
        server_id="s1",
        status="ok",
        latency_ms=10.0,
        handshake_ok=True,
        ts=datetime.now(timezone.utc),
    )
    score = calculate_health_score(server, log, peer_count=0, active_peer_count=0)
    assert score >= 0.9  # ok + no capacity penalty


def test_calculate_health_score_unreachable():
    from app.models.server import Server
    from app.models.server_health_log import ServerHealthLog

    server = Server(id="s1", name="n1", region="r1", api_endpoint="https://a.b/c")
    log = ServerHealthLog(
        server_id="s1",
        status="unreachable",
        latency_ms=None,
        handshake_ok=None,
        ts=datetime.now(timezone.utc),
    )
    score = calculate_health_score(server, log)
    assert score == 0.0
