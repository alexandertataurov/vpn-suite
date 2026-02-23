import json
from types import SimpleNamespace

import pytest

from app.api.v1 import servers_peers
from app.core import config


class _Result:
    def __init__(self, value):
        self._value = value

    def scalar_one_or_none(self):
        return self._value

    def all(self):
        return self._value


class _DB:
    def __init__(self, server, devices):
        self._server = server
        self._devices = devices
        self._calls = 0

    async def execute(self, _stmt):
        self._calls += 1
        if self._calls == 1:
            return _Result(self._server)
        return _Result(self._devices)


@pytest.mark.asyncio
async def test_servers_peers_agent_mode_uses_heartbeat(monkeypatch):
    monkeypatch.setattr(config.settings, "node_discovery", "agent")

    server = SimpleNamespace(id="srv-1")
    devices = [("dev-1", "pk-1")]
    db = _DB(server, devices)

    hb = {
        "peers": [
            {
                "public_key": "pk-1",
                "allowed_ips": "10.0.0.2/32",
                "last_handshake_age_sec": 10,
                "rx_bytes": 123,
                "tx_bytes": 456,
            }
        ]
    }

    async def _fake_hb(_sid: str):
        return hb

    monkeypatch.setattr(servers_peers, "get_agent_heartbeat", _fake_hb)

    out = await servers_peers.get_server_peers(
        request=SimpleNamespace(),
        server_id="srv-1",
        db=db,
        _admin=None,
    )
    assert out.total == 1
    assert out.peers[0].public_key == "pk-1"
    assert out.peers[0].status == "online"
