import json
from types import SimpleNamespace

import pytest

from app.api.v1 import servers_telemetry
from app.core import config


class _Result:
    def __init__(self, value):
        self._value = value

    def scalar_one_or_none(self):
        return self._value


class _DB:
    def __init__(self, server):
        self._server = server

    async def execute(self, _stmt):
        return _Result(self._server)


class _Redis:
    def __init__(self, payload):
        self._payload = payload

    async def get(self, _key: str):
        return json.dumps(self._payload)


@pytest.mark.asyncio
async def test_servers_telemetry_agent_mode_online_count(monkeypatch):
    monkeypatch.setattr(config.settings, "node_discovery", "agent")

    server = SimpleNamespace(id="srv-1")
    db = _DB(server)

    hb = {
        "peer_count": 3,
        "total_rx_bytes": 100,
        "total_tx_bytes": 200,
        "ts_utc": "2026-02-22T10:00:00Z",
        "peers": [
            {"last_handshake_age_sec": 5},
            {"last_handshake_age_sec": 50},
            {"last_handshake_age_sec": 500},
        ],
    }

    monkeypatch.setattr(servers_telemetry, "get_redis", lambda: _Redis(hb))

    out = await servers_telemetry.get_server_telemetry(
        request=SimpleNamespace(),
        server_id="srv-1",
        db=db,
        _admin=None,
    )
    assert out.peers_count == 3
    assert out.online_count == 2
