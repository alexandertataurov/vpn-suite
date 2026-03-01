"""Regression: static /servers/device-counts must not be shadowed by /servers/{server_id}."""

from types import SimpleNamespace

import pytest
from httpx import ASGITransport, AsyncClient

from app.core.bot_auth import get_admin_or_bot
from app.core.database import get_db
from app.main import app


class _FakeResult:
    def __init__(self, rows):
        self._rows = rows

    def all(self):
        return self._rows


class _FakeSession:
    async def execute(self, stmt):
        return _FakeResult([SimpleNamespace(server_id="srv-1", c=3)])

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
    session = _FakeSession()

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
