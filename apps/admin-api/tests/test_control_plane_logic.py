"""Unit tests for control-plane planning logic."""

from datetime import datetime, timezone
from types import SimpleNamespace
from unittest.mock import AsyncMock

import pytest

from app.schemas.control_plane import (
    PlacementSimulateRequest,
    RebalanceMoveOut,
    RebalancePlanRequest,
)
from app.schemas.node import ClusterTopology, NodeMetadata
from app.services.control_plane_service import (
    _anomaly_risk_level,
    _positive_robust_z,
    automation_status,
    build_topology_graph,
    build_topology_summary,
    execute_rebalance_plan,
    plan_rebalance,
    run_automation_cycle,
    simulate_placement,
)


class _DummySession:
    def __init__(self) -> None:
        self.events: list = []

    def add(self, obj) -> None:
        self.events.append(obj)

    async def flush(self) -> None:
        return None

    async def execute(self, _query):
        class _Result:
            @staticmethod
            def all():
                return []

            @staticmethod
            def scalars():
                class _Scalars:
                    @staticmethod
                    def all():
                        return []

                return _Scalars()

        return _Result()


class _PinnedSession(_DummySession):
    async def execute(self, _query):
        class _Result:
            @staticmethod
            def all():
                return [("src-1", 30)]

            @staticmethod
            def scalars():
                class _Scalars:
                    @staticmethod
                    def all():
                        return []

                return _Scalars()

        return _Result()


class _ExecutionSession:
    def __init__(self, rows):
        self._rows = rows

    async def execute(self, _query):
        class _Result:
            def __init__(self, rows):
                self._rows = rows

            def all(self):
                return self._rows

        return _Result(self._rows)


def _topology(nodes: list[NodeMetadata]) -> ClusterTopology:
    total_capacity = sum(n.max_peers for n in nodes)
    current_load = sum(n.peer_count for n in nodes)
    return ClusterTopology(
        timestamp=datetime.now(timezone.utc),
        nodes=nodes,
        total_capacity=total_capacity,
        current_load=current_load,
        load_factor=(current_load / total_capacity) if total_capacity else 0.0,
        load_index=0.0,
        health_score=0.8,
        health_index=0.0,
        capacity_score=0.0,
        topology_version=1,
    )


def _node(node_id: str, peer_count: int, max_peers: int, status: str = "healthy") -> NodeMetadata:
    return NodeMetadata(
        node_id=node_id,
        container_name=node_id,
        peer_count=peer_count,
        max_peers=max_peers,
        status=status,
        health_score=0.9 if status == "healthy" else 0.6,
        is_draining=False,
    )


def test_build_topology_summary_counts_health_and_overload():
    topo = _topology(
        [
            _node("n1", 90, 100, status="healthy"),
            _node("n2", 20, 100, status="degraded"),
            _node("n3", 99, 100, status="unhealthy"),
        ]
    )
    summary = build_topology_summary(topo, overload_threshold=0.85)
    assert summary.nodes_total == 3
    assert summary.healthy_nodes == 1
    assert summary.degraded_nodes == 1
    assert summary.unhealthy_nodes == 1
    assert summary.overloaded_nodes == 2


def test_anomaly_helpers_produce_expected_shapes():
    z = _positive_robust_z(10.0, [1.0, 2.0, 2.0, 3.0, 3.0, 4.0])
    assert z > 0.0
    assert _anomaly_risk_level(0.85) == "high"
    assert _anomaly_risk_level(0.65) == "medium"
    assert _anomaly_risk_level(0.2) == "low"


@pytest.mark.asyncio
async def test_plan_rebalance_generates_moves_and_event():
    topo = _topology(
        [
            _node("src-1", 95, 100),
            _node("dst-1", 15, 100),
            _node("dst-2", 25, 100),
        ]
    )
    db = _DummySession()
    out = await plan_rebalance(
        db,
        topo,
        RebalancePlanRequest(high_watermark=0.85, target_watermark=0.60, max_moves_per_node=50),
    )
    assert out.total_peers_to_move > 0
    assert len(out.moves) >= 1
    assert db.events, "Expected rebalance plan event to be logged"


@pytest.mark.asyncio
async def test_plan_rebalance_rejects_invalid_watermarks():
    topo = _topology([_node("n1", 90, 100), _node("n2", 10, 100)])
    db = _DummySession()
    with pytest.raises(ValueError):
        await plan_rebalance(
            db,
            topo,
            RebalancePlanRequest(high_watermark=0.7, target_watermark=0.8),
        )


@pytest.mark.asyncio
async def test_simulate_placement_prefers_probe_latency(monkeypatch):
    topo = _topology(
        [
            NodeMetadata(
                node_id="n1",
                container_name="n1",
                peer_count=20,
                max_peers=100,
                status="healthy",
                health_score=0.9,
                is_draining=False,
                latency_ms=25.0,
            ),
            NodeMetadata(
                node_id="n2",
                container_name="n2",
                peer_count=20,
                max_peers=100,
                status="healthy",
                health_score=0.9,
                is_draining=False,
                latency_ms=10.0,
            ),
        ]
    )
    db = _DummySession()

    async def _fake_regions(_db, _ids):
        return {"n1": "eu-west", "n2": "eu-west"}

    monkeypatch.setattr("app.services.control_plane_service._node_regions", _fake_regions)

    async def _fake_probe(_db, *, source_region, node_ids):
        assert source_region == "us-east"
        assert node_ids == {"n1", "n2"}
        return {"n1": 8.0, "n2": 50.0}

    monkeypatch.setattr(
        "app.services.control_plane_service._latest_probe_latency_by_node", _fake_probe
    )
    out = await simulate_placement(
        db,
        topo,
        PlacementSimulateRequest(source_region="us-east", use_latency_probes=True, top_k=2),
    )
    assert out.selected_node_id == "n1"
    assert out.candidates[0].latency_source == "probe"
    assert out.candidates[0].effective_latency_ms == 8.0


@pytest.mark.asyncio
async def test_build_topology_graph_includes_nodes_and_edges():
    topo = _topology([_node("n1", 10, 100), _node("n2", 20, 100)])
    db = _DummySession()
    out = await build_topology_graph(db, topo)
    assert len(out.nodes) == 2
    assert out.regions == ["unknown"]
    assert any(edge.edge_type == "intra_region" for edge in out.edges)


@pytest.mark.asyncio
async def test_plan_rebalance_respects_enterprise_pinning_capacity():
    topo = _topology([_node("src-1", 95, 100), _node("dst-1", 10, 100)])
    db = _PinnedSession()
    out = await plan_rebalance(
        db,
        topo,
        RebalancePlanRequest(high_watermark=0.85, target_watermark=0.60, max_moves_per_node=50),
    )
    # src target=60; with 30 enterprise-pinned peers, only 5 peers are movable.
    assert out.total_peers_to_move == 5
    assert out.moves[0].peers_to_move == 5


@pytest.mark.asyncio
async def test_execute_rebalance_plan_skips_enterprise_and_prefers_cold_peers(monkeypatch):
    cold = SimpleNamespace(
        id="dev-cold",
        server_id="src-1",
        public_key="pk-cold",
        issued_at=datetime(2024, 1, 1, tzinfo=timezone.utc),
    )
    hot = SimpleNamespace(
        id="dev-hot",
        server_id="src-1",
        public_key="pk-hot",
        issued_at=datetime(2024, 1, 2, tzinfo=timezone.utc),
    )
    enterprise = SimpleNamespace(
        id="dev-enterprise",
        server_id="src-1",
        public_key="pk-enterprise",
        issued_at=datetime(2024, 1, 3, tzinfo=timezone.utc),
    )
    db = _ExecutionSession(
        [
            (cold, "Personal"),
            (hot, "Personal"),
            (enterprise, "Enterprise Gold"),
        ]
    )
    migrated: list[str] = []

    async def _fake_migrate(_db, device, target_node_id, _adapter):
        migrated.append(device.id)
        device.server_id = target_node_id

    monkeypatch.setattr("app.services.control_plane_service.migrate_peer", _fake_migrate)
    runtime = SimpleNamespace(
        list_peers=AsyncMock(
            return_value=[
                {
                    "public_key": "pk-cold",
                    "last_handshake": 0,
                    "transfer_rx": 512,
                    "transfer_tx": 1024,
                },
                {
                    "public_key": "pk-hot",
                    "last_handshake": int(datetime.now(timezone.utc).timestamp()),
                    "transfer_rx": 25_000_000,
                    "transfer_tx": 15_000_000,
                },
                {
                    "public_key": "pk-enterprise",
                    "last_handshake": 0,
                    "transfer_rx": 0,
                    "transfer_tx": 0,
                },
            ]
        )
    )
    executions, stop_reason = await execute_rebalance_plan(
        db,
        moves=[RebalanceMoveOut(source_node_id="src-1", target_node_id="dst-1", peers_to_move=2)],
        runtime_adapter=runtime,
        batch_size=1,
        max_executions_per_cycle=10,
        stop_on_error=True,
        rollback_on_error=True,
    )

    assert stop_reason is None
    assert migrated == ["dev-cold"]
    assert executions[0].attempted == 1
    assert executions[0].succeeded == 1
    assert executions[0].skipped_enterprise == 1


@pytest.mark.asyncio
async def test_run_automation_cycle_returns_summary():
    topo = _topology([_node("n1", 95, 100), _node("n2", 20, 100)])
    db = _DummySession()
    out = await run_automation_cycle(
        db,
        topo,
        high_watermark=0.85,
        target_watermark=0.65,
        max_moves_per_node=200,
        unhealthy_health_threshold=0.5,
        execute_rebalance=False,
        rebalance_batch_size=20,
        rebalance_max_executions_per_cycle=50,
        rebalance_stop_on_error=True,
        rebalance_rollback_on_error=True,
        sync_server_state=False,
    )
    assert out.failed_nodes >= 0
    assert out.rebalance_moves >= 0
    assert out.executed_migrations == 0
    assert out.event_id is None or isinstance(out.event_id, str)
    assert len(db.events) >= 1


@pytest.mark.asyncio
async def test_automation_status_returns_valid_structure():
    """Regression: automation_status must return valid AutomationStatusOut (no 500)."""
    _ = _DummySession()

    class _ScalarResult:
        def scalar_one_or_none(self):
            return None  # no last run event

    class _SessionWithExecute:
        async def execute(self, _query):
            return _ScalarResult()

    session = _SessionWithExecute()
    out = await automation_status(session)
    assert out.enabled is not None
    assert isinstance(out.interval_seconds, int)
    assert isinstance(out.enterprise_plan_keywords, list)
    assert out.last_run_at is None
    assert out.last_run is None
