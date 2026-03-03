"""Tests for AgentNodeRuntimeAdapter (NODE_DISCOVERY=agent)."""

import json

import pytest

from app.services.node_runtime_agent import AgentNodeRuntimeAdapter


class _RedisMock:
    def __init__(self, payload: dict | None):
        self._payload = payload

    async def get(self, key: str) -> str | None:
        if self._payload is None:
            return None
        return json.dumps(self._payload)


@pytest.mark.asyncio
async def test_get_obfuscation_from_node_returns_obf_when_heartbeat_has_h1_h4(monkeypatch):
    """When heartbeat contains obfuscation with H1–H4, get_obfuscation_from_node returns it."""
    hb = {
        "server_id": "s1",
        "public_key": "abc=",
        "obfuscation": {
            "H1": 10,
            "H2": 20,
            "H3": 30,
            "H4": 40,
            "S1": 213,
            "S2": 237,
            "Jc": 3,
        },
    }
    monkeypatch.setattr(
        "app.services.node_runtime_agent.get_redis",
        lambda: _RedisMock(hb),
    )
    adapter = AgentNodeRuntimeAdapter()
    result = await adapter.get_obfuscation_from_node("s1")
    assert result is not None
    assert result["H1"] == 10
    assert result["H2"] == 20
    assert result["H3"] == 30
    assert result["H4"] == 40
    assert result["S1"] == 213
    assert result["Jc"] == 3


@pytest.mark.asyncio
async def test_get_obfuscation_from_node_returns_none_when_heartbeat_missing_obf(monkeypatch):
    """When heartbeat has no obfuscation key, returns None."""
    monkeypatch.setattr(
        "app.services.node_runtime_agent.get_redis",
        lambda: _RedisMock({"server_id": "s1", "public_key": "x"}),
    )
    adapter = AgentNodeRuntimeAdapter()
    assert await adapter.get_obfuscation_from_node("s1") is None


@pytest.mark.asyncio
async def test_get_obfuscation_from_node_returns_none_when_obf_missing_h4(monkeypatch):
    """When obfuscation dict is missing any H1–H4, returns None."""
    monkeypatch.setattr(
        "app.services.node_runtime_agent.get_redis",
        lambda: _RedisMock(
            {
                "server_id": "s1",
                "obfuscation": {"H1": 1, "H2": 2, "H3": 3},
                # H4 missing
            }
        ),
    )
    adapter = AgentNodeRuntimeAdapter()
    assert await adapter.get_obfuscation_from_node("s1") is None


@pytest.mark.asyncio
async def test_get_obfuscation_from_node_returns_none_when_no_heartbeat(monkeypatch):
    """When Redis has no heartbeat for server, returns None."""
    monkeypatch.setattr(
        "app.services.node_runtime_agent.get_redis",
        lambda: _RedisMock(None),
    )
    adapter = AgentNodeRuntimeAdapter()
    assert await adapter.get_obfuscation_from_node("s1") is None
