"""Tests for servers_stream router endpoints."""

from types import SimpleNamespace

import pytest
from httpx import ASGITransport, AsyncClient

from app.api.v1.auth import get_current_admin
from app.core.database import get_db
from app.main import app


class _FakeResult:
    def __init__(self, value):
        self._value = value

    def scalar_one_or_none(self):
        return self._value

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
    return AsyncClient(
        transport=ASGITransport(app=app),
        base_url="http://test",
        timeout=5.0,
    )


@pytest.mark.asyncio
async def test_servers_stream_route_exists(client: AsyncClient):
    """Verify that the moved GET /servers/stream route is reachable."""
    from app.models import AdminUser

    admin = AdminUser(id="admin-1", role_id="r1")
    role = SimpleNamespace(id="r1", permissions=["*"])
    session = _FakeSession([_FakeResult(role)])

    app.dependency_overrides[get_current_admin] = lambda: admin
    app.dependency_overrides[get_db] = lambda: session

    async def mock_events():
        yield "data: {}\n\n"

    from unittest.mock import patch

    try:
        # We need to patch the generator where it's used
        with patch("app.api.v1.servers_stream._servers_stream_events", mock_events):
            async with client.stream("GET", "/api/v1/servers/stream") as response:
                assert response.status_code == 200
                assert response.headers["content-type"].startswith("text/event-stream")
    finally:
        app.dependency_overrides.clear()
