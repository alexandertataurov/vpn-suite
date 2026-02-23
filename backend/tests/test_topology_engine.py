"""Unit tests for topology engine."""

from datetime import datetime, timezone
from unittest.mock import AsyncMock, patch

import pytest

from app.schemas.node import NodeMetadata
from app.services.topology_engine import TopologyEngine, _compute_topology_hash


@pytest.fixture
def mock_adapter():
    adapter = AsyncMock()
    adapter.discover_nodes.return_value = [
        NodeMetadata(
            node_id="n1",
            container_name="s1",
            peer_count=10,
            max_peers=100,
            health_score=0.95,
            is_draining=False,
        ),
        NodeMetadata(
            node_id="n2",
            container_name="s2",
            peer_count=20,
            max_peers=100,
            health_score=0.8,
            is_draining=False,
        ),
    ]
    return adapter


@pytest.mark.asyncio
async def test_rebuild_topology_aggregates(mock_adapter):
    from app.schemas.node import ClusterTopology

    mock_client = AsyncMock()
    mock_client.get = AsyncMock(return_value=None)
    mock_client.set = AsyncMock(return_value=True)
    with patch("app.services.topology_engine.get_redis", return_value=mock_client):
        engine = TopologyEngine(mock_adapter)
        topo = await engine.rebuild_topology()
    assert isinstance(topo, ClusterTopology)
    assert topo.total_capacity == 200
    assert topo.current_load == 30
    assert topo.load_factor == 0.15
    assert len(topo.nodes) == 2
    assert topo.topology_version >= 1


def test_compute_topology_hash_stable():
    from app.schemas.node import ClusterTopology, NodeMetadata

    t = datetime.now(timezone.utc)
    n = NodeMetadata(node_id="a", container_name="c", peer_count=0, max_peers=10)
    topo = ClusterTopology(
        timestamp=t,
        nodes=[n],
        total_capacity=10,
        current_load=0,
        load_factor=0.0,
        health_score=1.0,
        topology_version=1,
    )
    h1 = _compute_topology_hash(topo)
    topo.topology_version = 2
    h2 = _compute_topology_hash(topo)
    assert h1 == h2  # version excluded from hash
