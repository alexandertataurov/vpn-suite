"""Unit tests for Docker runtime tc-based bandwidth policy enforcement."""

from datetime import datetime, timezone
from unittest.mock import AsyncMock

import pytest

from app.schemas.node import NodeMetadata
from app.services.node_runtime_docker import DockerNodeRuntimeAdapter


def _node(node_id: str) -> NodeMetadata:
    return NodeMetadata(
        node_id=node_id,
        container_name="amnezia-awg-1",
        interface_name="awg0",
        last_seen=datetime.now(timezone.utc),
    )


@pytest.mark.asyncio
async def test_enforce_bandwidth_policies_dry_run_returns_commands(monkeypatch):
    adapter = DockerNodeRuntimeAdapter()
    adapter._resolve_node = AsyncMock(return_value=_node("n1"))  # type: ignore[method-assign]

    out = await adapter.enforce_bandwidth_policies(
        "n1",
        policies=[
            {"plan_id": "p1", "rate_mbps": 20, "ceil_mbps": 40, "priority": 2},
        ],
        peer_bindings=[
            {"public_key": "pk-1", "plan_id": "p1", "allowed_ips": "10.8.0.2/32"},
        ],
        dry_run=True,
    )

    assert out["dry_run"] is True
    assert out["classes"] == 1
    assert out["bound_peers"] == 1
    assert out["commands"], "Expected generated tc commands in dry-run mode"


@pytest.mark.asyncio
async def test_enforce_bandwidth_policies_executes_tc_commands(monkeypatch):
    adapter = DockerNodeRuntimeAdapter()
    adapter._resolve_node = AsyncMock(return_value=_node("n1"))  # type: ignore[method-assign]
    captured: list[list[str]] = []

    async def _fake_run(cmd, *, timeout=30.0, stdin=None):
        _ = timeout, stdin
        captured.append(list(cmd))
        return 0, ""

    monkeypatch.setattr("app.services.node_runtime_docker._run_command", _fake_run)

    out = await adapter.enforce_bandwidth_policies(
        "n1",
        policies=[
            {"plan_id": "p-basic", "rate_mbps": 10, "ceil_mbps": 20, "priority": 3},
        ],
        peer_bindings=[
            {"public_key": "pk-1", "plan_id": "p-basic", "allowed_ips": "10.8.0.2/32,10.8.0.3/32"},
        ],
        dry_run=False,
    )

    assert out["dry_run"] is False
    assert out["commands_executed"] > 0
    assert any(cmd[:4] == ["docker", "exec", "amnezia-awg-1", "tc"] for cmd in captured)
