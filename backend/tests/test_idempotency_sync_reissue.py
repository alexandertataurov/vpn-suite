"""Idempotency and correlation header regression tests for critical mutating endpoints."""

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


class _FakeSession:
    def __init__(self, execute_returns: list):
        self._execute_returns = list(execute_returns)

    async def execute(self, stmt):
        if not self._execute_returns:
            return _FakeResult(None)
        return self._execute_returns.pop(0)

    async def commit(self):
        pass

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
async def test_sync_idempotency_replay_returns_same_payload(client: AsyncClient, monkeypatch):
    role = SimpleNamespace(id="role-1", permissions=["servers:write"])
    server = SimpleNamespace(id="srv-1")
    session = _FakeSession(
        [_FakeResult(role), _FakeResult(server), _FakeResult(role), _FakeResult(server)]
    )

    async def fake_get_db():
        try:
            yield session
        finally:
            await session.close()

    app.dependency_overrides[get_db] = fake_get_db
    app.dependency_overrides[get_current_admin] = lambda: SimpleNamespace(
        id="admin-1", role_id="role-1"
    )
    monkeypatch.setattr(settings, "node_discovery", "agent")
    monkeypatch.setattr(settings, "node_mode", "agent")

    cached: dict[tuple[str, str, str], dict] = {}

    async def fake_get_cached(scope: str, resource_id: str, idempotency_key: str | None):
        if not idempotency_key:
            return None
        return cached.get((scope, resource_id, idempotency_key))

    async def fake_store(
        scope: str, resource_id: str, idempotency_key: str | None, body: dict, **kwargs
    ):
        if idempotency_key:
            cached[(scope, resource_id, idempotency_key)] = {"status_code": 200, "body": body}

    try:
        with (
            patch("app.api.v1.servers_sync.get_cached_idempotency_response", fake_get_cached),
            patch("app.api.v1.servers_sync.store_idempotency_response", fake_store),
            patch(
                "app.api.v1.servers_sync.create_action",
                AsyncMock(return_value=SimpleNamespace(id="act-1")),
            ) as create_action_mock,
            patch("app.api.v1.servers_sync.log_audit", AsyncMock(return_value=None)),
        ):
            headers = {"Idempotency-Key": "idem-sync-1"}
            r1 = await client.post(
                "/api/v1/servers/srv-1/sync", json={"mode": "manual"}, headers=headers
            )
            r2 = await client.post(
                "/api/v1/servers/srv-1/sync", json={"mode": "manual"}, headers=headers
            )

            assert r1.status_code == 200
            assert r2.status_code == 200
            assert r1.json() == r2.json()
            assert create_action_mock.await_count == 1
    finally:
        app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_reissue_idempotency_replay_returns_same_payload(client: AsyncClient):
    role = SimpleNamespace(id="role-1", permissions=["devices:write"])
    session = _FakeSession([_FakeResult(role), _FakeResult(role)])

    async def fake_get_db():
        try:
            yield session
        finally:
            await session.close()

    app.dependency_overrides[get_db] = fake_get_db
    app.dependency_overrides[get_current_admin] = lambda: SimpleNamespace(
        id="admin-1", role_id="role-1"
    )

    cached: dict[tuple[str, str, str], dict] = {}

    async def fake_get_cached(scope: str, resource_id: str, idempotency_key: str | None):
        if not idempotency_key:
            return None
        return cached.get((scope, resource_id, idempotency_key))

    async def fake_store(
        scope: str, resource_id: str, idempotency_key: str | None, body: dict, **kwargs
    ):
        if idempotency_key:
            cached[(scope, resource_id, idempotency_key)] = {"status_code": 200, "body": body}

    out = SimpleNamespace(
        config_awg=SimpleNamespace(download_url="http://cfg/awg", qr_payload="awg"),
        config_wg_obf=SimpleNamespace(download_url="http://cfg/wg-obf", qr_payload="wg-obf"),
        config_wg=SimpleNamespace(download_url="http://cfg/wg", qr_payload="wg"),
        request_id="req-service-1",
    )

    old_runtime_adapter = getattr(app.state, "node_runtime_adapter", None)
    app.state.node_runtime_adapter = object()
    try:
        with (
            patch("app.api.v1.devices.get_cached_idempotency_response", fake_get_cached),
            patch("app.api.v1.devices.store_idempotency_response", fake_store),
            patch(
                "app.api.v1.devices.reissue_config_for_device",
                AsyncMock(return_value=out),
            ) as reissue_mock,
            patch(
                "app.api.v1.devices.invalidate_devices_summary_cache", AsyncMock(return_value=None)
            ),
            patch("app.api.v1.devices.invalidate_devices_list_cache", AsyncMock(return_value=None)),
        ):
            headers = {"Idempotency-Key": "idem-reissue-1"}
            r1 = await client.post("/api/v1/devices/dev-1/reissue", json={}, headers=headers)
            r2 = await client.post("/api/v1/devices/dev-1/reissue", json={}, headers=headers)
            assert r1.status_code == 200
            assert r2.status_code == 200
            assert r1.json() == r2.json()
            assert reissue_mock.await_count == 1
    finally:
        if old_runtime_adapter is None and hasattr(app.state, "node_runtime_adapter"):
            delattr(app.state, "node_runtime_adapter")
        elif old_runtime_adapter is not None:
            app.state.node_runtime_adapter = old_runtime_adapter
        app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_request_and_correlation_headers_are_echoed(client: AsyncClient):
    response = await client.get(
        "/health",
        headers={"X-Request-ID": "req-explicit", "X-Correlation-ID": "corr-tab-1"},
    )
    assert response.status_code == 200
    assert response.headers.get("X-Request-ID") == "req-explicit"
    assert response.headers.get("X-Correlation-ID") == "corr-tab-1"
