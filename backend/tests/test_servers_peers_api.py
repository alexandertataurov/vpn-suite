"""Tests for servers_peers router endpoints."""

from datetime import datetime, timezone
from types import SimpleNamespace
from unittest.mock import AsyncMock, patch

import pytest
from httpx import ASGITransport, AsyncClient

from app.api.v1.auth import get_current_admin
from app.core.config import settings
from app.core.database import get_db
from app.main import app


class _FakeResult:
    def __init__(self, value):
        self._value = value

    def scalar_one_or_none(self):
        return self._value

    def all(self):
        return []

    def scalars(self):
        return SimpleNamespace(all=lambda: [self._value] if self._value else [])


class _FakeSession:
    def __init__(self, execute_returns: list):
        self._execute_returns = list(execute_returns)

    async def execute(self, stmt):
        if not self._execute_returns:
            return _FakeResult(None)
        return self._execute_returns.pop(0)

    async def flush(self):
        pass

    async def commit(self):
        pass

    async def refresh(self, obj):
        pass

    async def close(self):
        pass

    def __aenter__(self):
        return self

    def __aexit__(self, *args):
        return None


@pytest.fixture
def client():
    # Mock node_runtime_adapter in app.state
    from unittest.mock import MagicMock

    app.state.node_runtime_adapter = MagicMock()
    return AsyncClient(
        transport=ASGITransport(app=app),
        base_url="http://test",
        timeout=5.0,
    )


@pytest.mark.asyncio
async def test_get_server_peers_sync_route_exists(client: AsyncClient, monkeypatch):
    """Verify that the moved GET /servers/{server_id}/peers-sync route is reachable."""
    monkeypatch.setattr(settings, "node_mode", "server")
    monkeypatch.setattr(settings, "node_discovery", "db")
    role = SimpleNamespace(id="r1", permissions=["servers:read"])
    server = SimpleNamespace(id="srv-1", status="online")
    session = _FakeSession([_FakeResult(role), _FakeResult(server)])

    app.dependency_overrides[get_db] = lambda: session
    app.dependency_overrides[get_current_admin] = lambda: SimpleNamespace(
        id="admin-1", role_id="r1"
    )

    try:
        # Patch where it's USED
        with patch(
            "app.api.v1.servers_peers.sync_peers_after_restart", AsyncMock(return_value={"diff": 0})
        ):
            r = await client.get("/api/v1/servers/srv-1/peers-sync")
            assert r.status_code == 200
            assert r.json() == {"diff": 0}
    finally:
        app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_create_server_peer_route_exists(client: AsyncClient):
    """Verify that the moved POST /servers/{server_id}/peers route is reachable."""
    role = SimpleNamespace(id="r1", permissions=["servers:write"])
    session = _FakeSession([_FakeResult(role)])

    app.dependency_overrides[get_db] = lambda: session
    app.dependency_overrides[get_current_admin] = lambda: SimpleNamespace(
        id="admin-1", role_id="r1"
    )

    mock_out = SimpleNamespace(
        device=SimpleNamespace(
            id="dev-1",
            server_id="srv-1",
            device_name="n",
            public_key="pk",
            issued_at=datetime.now(timezone.utc),
        ),
        config_awg=SimpleNamespace(download_url="http://download-awg", qr_payload="qr-awg"),
        config_wg_obf=SimpleNamespace(
            download_url="http://download-wg-obf", qr_payload="qr-wg-obf"
        ),
        config_wg=SimpleNamespace(download_url="http://download-wg", qr_payload="qr-wg"),
        peer_created=True,
    )

    try:
        with patch("app.api.v1.servers_peers.admin_issue_peer", AsyncMock(return_value=mock_out)):
            r = await client.post(
                "/api/v1/servers/srv-1/peers", json={"label": "test", "user_id": 1}
            )
            assert r.status_code == 201
            assert r.json()["peer"]["id"] == "dev-1"
            assert "config_awg" in r.json()
            assert "config_wg_obf" in r.json()
            assert "config_wg" in r.json()
    finally:
        app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_get_server_peers_live_route_exists(client: AsyncClient, monkeypatch):
    """Verify that GET /servers/{server_id}/peers-live returns live peers via docker adapter."""
    role = SimpleNamespace(id="r1", permissions=["servers:read"])
    server = SimpleNamespace(id="srv-1", status="online")
    # Second execute() call is for Device mapping; return empty.
    session = _FakeSession([_FakeResult(role), _FakeResult(server), _FakeResult(None)])

    app.dependency_overrides[get_db] = lambda: session
    app.dependency_overrides[get_current_admin] = lambda: SimpleNamespace(
        id="admin-1", role_id="r1"
    )

    try:
        fake_adapter = SimpleNamespace(
            list_peers=AsyncMock(
                return_value=[
                    {
                        "public_key": "pk",
                        "allowed_ips": "10.8.1.2/32",
                        "last_handshake": 1700000000,
                        "transfer_rx": 1,
                        "transfer_tx": 2,
                    }
                ]
            )
        )
        with patch(
            "app.services.node_runtime_docker.DockerNodeRuntimeAdapter", return_value=fake_adapter
        ):
            r = await client.get("/api/v1/servers/srv-1/peers-live")
            assert r.status_code == 200
            data = r.json()
            assert data["node_reachable"] is True
            assert data["total"] == 1
            assert data["peers"][0]["public_key"] == "pk"
    finally:
        app.dependency_overrides.clear()
