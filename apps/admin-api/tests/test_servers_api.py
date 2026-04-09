"""Server API tests: PATCH validation (e.g. auto_sync_enabled on active server)."""

from types import SimpleNamespace

import pytest
from httpx import ASGITransport, AsyncClient

from app.main import app


class _FakeResult:
    def __init__(self, value):
        self._value = value

    def scalar_one_or_none(self):
        return self._value


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
async def test_patch_server_auto_sync_disabled_on_active_returns_422(client: AsyncClient):
    """PATCH server with auto_sync_enabled=false when server is active returns 422."""
    from app.api.v1.auth import get_current_admin
    from app.core.database import get_db

    role = SimpleNamespace(id="r1", permissions=["servers:write"])
    server = SimpleNamespace(
        id="srv-1",
        name="n",
        region="r",
        api_endpoint="https://a.b/c",
        kind="legacy_wg_relay",
        vpn_endpoint=None,
        public_key=None,
        status="online",
        is_active=True,
        health_score=None,
        is_draining=False,
        max_connections=None,
        created_at=None,
        last_snapshot_at=None,
        updated_at=None,
        provider=None,
        tags=None,
        auto_sync_enabled=True,
        auto_sync_interval_sec=60,
    )
    session = _FakeSession(
        [
            _FakeResult(role),
            _FakeResult(server),
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
        r = await client.patch(
            "/api/v1/servers/srv-1",
            json={"auto_sync_enabled": False},
        )
        assert r.status_code == 422
        body = r.json()
        msg = (body.get("detail") or body.get("error", {}).get("message") or "").lower()
        assert "auto-sync" in msg or "active" in msg
    finally:
        app.dependency_overrides.pop(get_db, None)
        app.dependency_overrides.pop(get_current_admin, None)


@pytest.mark.asyncio
async def test_patch_server_response_includes_kind(client: AsyncClient):
    from app.api.v1.auth import get_current_admin
    from app.core.database import get_db

    role = SimpleNamespace(id="r1", permissions=["servers:write"])
    server = SimpleNamespace(
        id="srv-1",
        name="relay-1",
        region="eu",
        api_endpoint="https://relay.example.com",
        kind="legacy_wg_relay",
        vpn_endpoint="relay.example.com:51820",
        public_key=None,
        preshared_key=None,
        amnezia_h1=None,
        amnezia_h2=None,
        amnezia_h3=None,
        amnezia_h4=None,
        status="online",
        is_active=False,
        health_score=None,
        is_draining=False,
        max_connections=None,
        created_at=None,
        last_snapshot_at=None,
        updated_at=None,
        provider=None,
        tags=None,
        auto_sync_enabled=False,
        auto_sync_interval_sec=60,
        ops_notes=None,
        ops_notes_updated_at=None,
        ops_notes_updated_by=None,
        cert_fingerprint=None,
        cert_expires_at=None,
    )
    session = _FakeSession([_FakeResult(role), _FakeResult(server)])

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
        r = await client.patch("/api/v1/servers/srv-1", json={"ops_notes": "relay tier"})
        assert r.status_code == 200
        body = r.json()
        assert body["kind"] == "legacy_wg_relay"
    finally:
        app.dependency_overrides.pop(get_db, None)
        app.dependency_overrides.pop(get_current_admin, None)


@pytest.mark.asyncio
async def test_delete_server_with_devices_returns_409(client: AsyncClient):
    """DELETE /servers/:id when server has devices returns 409."""
    from app.api.v1.auth import get_current_admin
    from app.core.database import get_db

    role = SimpleNamespace(id="r1", permissions=["servers:write"])
    server = SimpleNamespace(
        id="srv-with-devices",
        name="test",
        region="r",
        api_endpoint="https://a.b/c",
    )

    class _FakeCountResult:
        def scalar(self):
            return 1

    session = _FakeSession(
        [
            _FakeResult(role),  # require_permission: load role
            _FakeResult(server),  # delete_server: get server
            _FakeCountResult(),  # delete_server: count devices
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
        r = await client.delete("/api/v1/servers/srv-with-devices")
        assert r.status_code == 409
        body = r.json()
        msg = (body.get("detail") or body.get("error", {}).get("message") or "").lower()
        assert "device" in msg
    finally:
        app.dependency_overrides.pop(get_db, None)
        app.dependency_overrides.pop(get_current_admin, None)
