"""Contract test: peers list response shape."""

from datetime import datetime, timezone
from types import SimpleNamespace

import pytest
from httpx import ASGITransport, AsyncClient

from app.api.v1.auth import get_current_admin
from app.core.database import get_db
from app.main import app


class _FakeResult:
    def __init__(self, scalar_value=None, items=None):
        self._scalar_value = scalar_value
        self._items = items or []

    def scalar(self):
        return self._scalar_value

    def scalar_one_or_none(self):
        return self._scalar_value

    def scalars(self):
        return SimpleNamespace(all=lambda: self._items)


class _FakeSession:
    def __init__(self, execute_returns: list):
        self._execute_returns = list(execute_returns)

    async def execute(self, stmt):
        if not self._execute_returns:
            return _FakeResult(None)
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
async def test_peers_list_contract_shape(client: AsyncClient):
    role = SimpleNamespace(id="r1", permissions=["cluster:read"])
    device = SimpleNamespace(
        id="peer-1",
        server_id="srv-1",
        user_id=10,
        subscription_id="sub-1",
        public_key="pk-1",
        device_name="ios",
        revoked_at=None,
        issued_at=datetime(2024, 1, 1, tzinfo=timezone.utc),
    )
    session = _FakeSession(
        [
            _FakeResult(role),
            _FakeResult(1),
            _FakeResult(items=[device]),
        ]
    )

    app.dependency_overrides[get_db] = lambda: session
    app.dependency_overrides[get_current_admin] = lambda: SimpleNamespace(
        id="admin-1", role_id="r1"
    )

    try:
        res = await client.get("/api/v1/peers?status=active&limit=1&offset=0")
        assert res.status_code == 200
        payload = res.json()
        assert payload["total"] == 1
        assert payload["peers"]
        peer = payload["peers"][0]
        assert peer["peer_id"] == "peer-1"
        assert peer["node_id"] == "srv-1"
        assert peer["user_id"] == 10
        assert peer["subscription_id"] == "sub-1"
        assert peer["public_key"] == "pk-1"
        assert peer["status"] == "active"
        assert "issued_at" in peer
        assert "revoked_at" in peer
    finally:
        app.dependency_overrides.clear()
