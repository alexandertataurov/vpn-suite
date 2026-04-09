"""Regression: static /servers/device-counts and /servers/vpn-nodes must not be shadowed by /servers/{server_id}."""

from types import SimpleNamespace

import pytest
from httpx import ASGITransport, AsyncClient

from app.api.v1.auth import get_current_admin
from app.core.bot_auth import get_admin_or_bot
from app.core.database import get_db
from app.main import app


class _FakeResult:
    def __init__(self, rows=None, scalar=None):
        self._rows = rows if rows is not None else []
        self._scalar = scalar

    def all(self):
        return self._rows

    def scalar_one_or_none(self):
        return self._scalar

    def scalars(self):
        return type("_Scalars", (), {"all": lambda _self: self._rows})()


class _FakeSession:
    def __init__(self, execute_returns=None):
        self._execute_returns = list(execute_returns or [])

    async def execute(self, stmt):
        if not self._execute_returns:
            return _FakeResult()
        return self._execute_returns.pop(0)

    async def close(self):
        pass


@pytest.fixture
def client():
    return AsyncClient(
        transport=ASGITransport(app=app),
        base_url="http://test",
        timeout=5.0,
    )


@pytest.mark.asyncio
async def test_servers_device_counts_route_not_shadowed(client: AsyncClient):
    session = _FakeSession([_FakeResult(rows=[SimpleNamespace(server_id="srv-1", c=3)])])

    async def fake_get_db():
        try:
            yield session
        finally:
            await session.close()

    app.dependency_overrides[get_db] = fake_get_db
    app.dependency_overrides[get_admin_or_bot] = lambda: SimpleNamespace(id="admin-1")
    try:
        response = await client.get("/api/v1/servers/device-counts")
        assert response.status_code == 200
        assert response.json() == {"counts": {"srv-1": 3}}
    finally:
        app.dependency_overrides.pop(get_db, None)
        app.dependency_overrides.pop(get_admin_or_bot, None)


@pytest.mark.asyncio
async def test_servers_vpn_nodes_route_returns_200(client: AsyncClient):
    """GET /api/v1/servers/vpn-nodes must be reachable (not 404)."""
    role = SimpleNamespace(id="r1", permissions=["servers:read"])
    session = _FakeSession(
        [
            _FakeResult(scalar=role),
            _FakeResult(rows=[]),
        ]
    )

    async def fake_get_db():
        try:
            yield session
        finally:
            await session.close()

    async def fake_admin():
        return SimpleNamespace(id="admin-1", role_id="r1")

    app.dependency_overrides[get_db] = fake_get_db
    app.dependency_overrides[get_current_admin] = fake_admin
    try:
        response = await client.get("/api/v1/servers/vpn-nodes")
        assert response.status_code == 200, response.text
        assert response.json() == []
    finally:
        app.dependency_overrides.pop(get_db, None)
        app.dependency_overrides.pop(get_current_admin, None)
