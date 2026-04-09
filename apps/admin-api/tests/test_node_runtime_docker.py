"""Unit tests for Docker runtime node health scoring."""

from datetime import datetime, timezone
from types import SimpleNamespace

import pytest

from app.schemas.node import NodeMetadata
from app.services.node_runtime_docker import (
    DockerNodeRuntimeAdapter,
    _compute_health,
    _parse_wg_show_obfuscation,
)


def test_compute_health_no_peers_high_latency_still_healthy():
    score = _compute_health(peers=[], latency_ms=25.0)
    assert score >= 0.9


def test_compute_health_idle_peers_is_degraded_not_unhealthy():
    now_ts = int(datetime.now(timezone.utc).timestamp())
    peers = [
        {"last_handshake": 0},
        {"last_handshake": now_ts - 600},
    ]
    score = _compute_health(peers=peers, latency_ms=30.0)
    assert score >= 0.5
    assert score < 0.9


@pytest.mark.asyncio
async def test_discover_one_falls_back_to_wg0(monkeypatch):
    pub = "d0EiWoNYP/KDvrPo2VzugY7aU49foQyyykLSJjNqfUw="
    peer = "qRLxpLAMK9eCgrHpaxk60ss/I1E+W7gmCOwxipF912Y="
    wg_dump = (
        f"PRIVATEKEY\t{pub}\t32537\toff\n" f"{peer}\t(none)\t(none)\t10.8.1.1/32\t0\t0\t0\t0\n"
    )

    async def fake_run_command(cmd, *, timeout=30.0, stdin=None):
        if cmd[:6] == ["docker", "exec", "amnezia-awg", "wg", "show", "awg0"]:
            return (1, "Unable to access interface: No such device")
        if cmd[:6] == ["docker", "exec", "amnezia-awg", "wg", "show", "wg0"] and cmd[6] == "dump":
            return (0, wg_dump)
        if cmd == ["docker", "exec", "amnezia-awg", "ip", "-j", "addr", "show", "wg0"]:
            return (0, '[{"ifname":"wg0","addr_info":[{"local":"10.8.1.0"}]}]')
        if cmd == ["docker", "ps", "--format", "{{.Names}}"]:
            return (0, "amnezia-awg")
        return (1, "unexpected command")

    monkeypatch.setattr("app.services.node_runtime_docker._run_command", fake_run_command)
    adapter = DockerNodeRuntimeAdapter(container_filter="amnezia-awg", interface="awg0")
    node = await adapter._discover_one("amnezia-awg")

    assert node.interface_name == "wg0"
    assert node.public_key == pub
    assert node.listen_port == 32537
    assert node.status == "degraded"
    assert node.health_score >= 0.5


@pytest.mark.asyncio
async def test_add_peer_uses_discovered_interface(monkeypatch):
    node = NodeMetadata(
        node_id="n1",
        container_name="amnezia-awg",
        interface_name="wg0",
        status="healthy",
    )
    captured = {}
    list_peers_calls = []

    async def fake_run_command(cmd, *, timeout=30.0, stdin=None):
        captured["cmd"] = cmd
        return (0, "")

    async def noop_persist(*_a, **_k):
        pass

    monkeypatch.setattr("app.services.node_runtime_docker._persist_wg_config", noop_persist)
    monkeypatch.setattr("app.services.node_runtime_docker._run_command", fake_run_command)

    async def fake_discover_nodes():
        return [node]

    async def fake_list_peers(nid):
        list_peers_calls.append(nid)
        if len(list_peers_calls) == 1:
            return []
        return [
            {
                "public_key": "TLeYYW7ud/7EPHoMlyYGFcxAHgiTHafCMHq02f6LbCQ=",
                "allowed_ips": "10.8.1.2/32",
                "last_handshake": 0,
                "transfer_rx": 0,
                "transfer_tx": 0,
            }
        ]

    async def noop_ensure_route(*_args, **_kwargs):
        pass

    monkeypatch.setattr(
        "app.services.node_runtime_docker._ensure_client_subnet_routes", noop_ensure_route
    )
    adapter = DockerNodeRuntimeAdapter(container_filter="amnezia-awg", interface="awg0")
    monkeypatch.setattr(adapter, "discover_nodes", fake_discover_nodes)
    monkeypatch.setattr(adapter, "list_peers", fake_list_peers)
    peer_cfg = SimpleNamespace(
        public_key="TLeYYW7ud/7EPHoMlyYGFcxAHgiTHafCMHq02f6LbCQ=",
        allowed_ips="10.8.1.2/32",
        persistent_keepalive=25,
        preshared_key=None,
    )

    await adapter.add_peer("n1", peer_cfg)

    assert captured["cmd"][:7] == [
        "docker",
        "exec",
        "amnezia-awg",
        "wg",
        "set",
        "wg0",
        "peer",
    ]
    assert len(list_peers_calls) == 2


@pytest.mark.asyncio
async def test_add_peer_conflict_allowed_ips_raises(monkeypatch):
    """If another peer already has the same allowed_ips /32, add_peer raises."""
    from app.core.exceptions import WireGuardCommandError

    node = NodeMetadata(
        node_id="n1",
        container_name="amnezia-awg",
        interface_name="awg0",
        status="healthy",
    )

    async def fake_list_peers(_nid):
        return [
            {
                "public_key": "other_peer_public_key_xxxxxxxxxxxxxxxxxxxxxxxxxxxx",
                "allowed_ips": "10.8.1.2/32",
                "last_handshake": 0,
                "transfer_rx": 0,
                "transfer_tx": 0,
            }
        ]

    async def fake_discover_nodes():
        return [node]

    adapter = DockerNodeRuntimeAdapter(container_filter="amnezia-awg", interface="awg0")
    monkeypatch.setattr(adapter, "discover_nodes", fake_discover_nodes)
    monkeypatch.setattr(adapter, "list_peers", fake_list_peers)
    peer_cfg = SimpleNamespace(
        public_key="TLeYYW7ud/7EPHoMlyYGFcxAHgiTHafCMHq02f6LbCQ=",
        allowed_ips="10.8.1.2/32",
        persistent_keepalive=25,
        preshared_key=None,
    )

    with pytest.raises(WireGuardCommandError, match="allowed_ips conflict"):
        await adapter.add_peer("n1", peer_cfg)


def test_parse_wg_show_obfuscation_h1_h4_range_string():
    """H1-H4 range strings are captured."""
    output = """
public key: xTIBA5rboUvnH4htodjb6e697QjLERt1NAB4mZqp8Dg=
listen port: 45790
jc: 4
jmin: 64
jmax: 1024
s1: 0
s2: 0
h1: 0-255
h2: 32-128
h3: 1-100
h4: 0-64
"""
    result = _parse_wg_show_obfuscation(output)
    assert result is not None
    assert result["Jc"] == 4
    assert result["Jmin"] == 64
    assert result["Jmax"] == 1024
    assert result["S1"] == 0
    assert result["S2"] == 0
    assert result["H1"] == "0-255"
    assert result["H2"] == "32-128"
    assert result["H3"] == "1-100"
    assert result["H4"] == "0-64"


def test_parse_wg_show_obfuscation_h1_h4_numeric_only():
    """H1-H4 numeric-only values are captured."""
    output = """
public key: abc=
listen port: 51820
jc: 8
jmin: 32
jmax: 2048
s1: 1
s2: 2
h1: 100
h2: 200
h3: 300
h4: 400
"""
    result = _parse_wg_show_obfuscation(output)
    assert result is not None
    assert result["Jc"] == 8
    assert result["S1"] == 1
    assert result["S2"] == 2
    assert result["H1"] == 100
    assert result["H2"] == 200
    assert result["H3"] == 300
    assert result["H4"] == 400
