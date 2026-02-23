"""Unit tests for load balancer."""

import pytest

from app.schemas.node import NodeMetadata
from app.services.load_balancer import calculate_node_score, select_node


def test_calculate_node_score_prefers_capacity_and_health():
    node_high = NodeMetadata(
        node_id="n1",
        container_name="c1",
        peer_count=10,
        max_peers=100,
        health_score=0.95,
        is_draining=False,
    )
    node_low = NodeMetadata(
        node_id="n2",
        container_name="c2",
        peer_count=80,
        max_peers=100,
        health_score=0.5,
        is_draining=False,
    )
    assert calculate_node_score(node_high) > calculate_node_score(node_low)


@pytest.mark.asyncio
async def test_select_node_excludes_draining():
    """select_node excludes draining nodes."""
    from datetime import datetime, timezone

    from app.schemas.node import ClusterTopology

    draining = NodeMetadata(
        node_id="d1",
        container_name="d1",
        peer_count=5,
        max_peers=100,
        health_score=0.95,
        is_draining=True,
    )
    ok_node = NodeMetadata(
        node_id="n1",
        container_name="n1",
        peer_count=5,
        max_peers=100,
        health_score=0.9,
        is_draining=False,
    )

    async def get_topology():
        return ClusterTopology(
            timestamp=datetime.now(timezone.utc),
            nodes=[draining, ok_node],
            total_capacity=200,
            current_load=10,
            load_factor=0.05,
            health_score=0.9,
            topology_version=1,
        )

    selected = await select_node(get_topology)
    assert selected is not None
    assert selected.node_id == "n1"
    assert selected.is_draining is False


@pytest.mark.asyncio
async def test_select_node_prefers_healthy():
    from datetime import datetime, timezone

    from app.schemas.node import ClusterTopology

    degraded = NodeMetadata(
        node_id="d1",
        container_name="d1",
        peer_count=10,
        max_peers=100,
        health_score=0.5,
        is_draining=False,
    )
    healthy = NodeMetadata(
        node_id="h1",
        container_name="h1",
        peer_count=20,
        max_peers=100,
        health_score=0.95,
        is_draining=False,
    )

    async def get_topology():
        return ClusterTopology(
            timestamp=datetime.now(timezone.utc),
            nodes=[degraded, healthy],
            total_capacity=200,
            current_load=30,
            load_factor=0.15,
            health_score=0.7,
            topology_version=1,
        )

    selected = await select_node(get_topology)
    assert selected is not None
    assert selected.health_score >= 0.9
    assert selected.node_id == "h1"
