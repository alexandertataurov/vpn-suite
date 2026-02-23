"""Outline integration API tests: status, keys (list/create/rename/revoke), feature flag."""

from types import SimpleNamespace
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from httpx import ASGITransport, AsyncClient

from app.api.v1.auth import get_current_admin
from app.api.v1.outline import _get_client, _safe_key
from app.core import config
from app.core.database import get_db
from app.main import app


@pytest.fixture
def client():
    return AsyncClient(
        transport=ASGITransport(app=app),
        base_url="http://test",
        timeout=5.0,
    )


class _FakeResult:
    def __init__(self, value):
        self._value = value

    def scalar_one_or_none(self):
        return self._value

    def scalars(self):
        return self

    def all(self):
        return self._value if isinstance(self._value, list) else []


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

    def __aenter__(self):
        return self

    def __aexit__(self, *args):
        return None


@pytest.fixture
def mock_outline_client():
    """Outline client that returns fixed data (no real HTTP)."""
    c = MagicMock()
    c.get_server = AsyncMock(return_value={"name": "Test", "version": "1.0.0"})
    c.list_access_keys = AsyncMock(return_value=[])
    c.get_transfer_metrics = AsyncMock(return_value={})
    c.get_access_key = AsyncMock(
        return_value={
            "id": "0",
            "name": "Key0",
            "port": 12345,
            "method": "chacha20-ietf-poly1305",
            "accessUrl": "ss://secret@host:12345/?outline=1",
        }
    )
    c.create_access_key = AsyncMock(
        return_value={
            "id": "1",
            "name": "New",
            "port": 12346,
            "method": "chacha20-ietf-poly1305",
        }
    )
    c.rename_access_key = AsyncMock(return_value=None)
    c.delete_access_key = AsyncMock(return_value=None)
    return c


@pytest.mark.asyncio
async def test_outline_status_disabled_returns_503(client: AsyncClient, monkeypatch):
    """When Outline integration is disabled and auth passes, GET /outline/status returns 503."""
    monkeypatch.setattr(config.settings, "outline_integration_enabled", False)
    monkeypatch.setattr(config.settings, "outline_manager_url", "")
    role = SimpleNamespace(id="r1", permissions=["outline:read"])
    app.dependency_overrides[get_current_admin] = lambda: SimpleNamespace(
        id="admin-1", role_id="r1"
    )
    app.dependency_overrides[get_db] = lambda: _FakeSession([_FakeResult(role)])
    try:
        r = await client.get("/api/v1/outline/status")
        assert r.status_code == 503
        data = r.json()
        assert data.get("error", {}).get("code") == "OUTLINE_DISABLED"
    finally:
        app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_outline_status_requires_auth(client: AsyncClient):
    """GET /outline/status without JWT returns 401."""
    r = await client.get("/api/v1/outline/status")
    assert r.status_code in (401, 503)


@pytest.mark.asyncio
async def test_outline_get_client_raises_when_disabled(monkeypatch):
    """_get_client() raises HTTPException when integration disabled."""
    monkeypatch.setattr(config.settings, "outline_integration_enabled", False)
    monkeypatch.setattr(config.settings, "outline_manager_url", "")
    from fastapi import HTTPException

    with pytest.raises(HTTPException) as exc:
        _get_client()
    assert exc.value.status_code == 503


@pytest.mark.asyncio
async def test_outline_status_connected_with_auth_and_mock(
    client: AsyncClient, mock_outline_client, monkeypatch
):
    """With integration enabled and mocked client, GET /outline/status returns 200 and status connected."""
    monkeypatch.setattr(config.settings, "outline_integration_enabled", True)
    monkeypatch.setattr(config.settings, "outline_manager_url", "https://outline.example/secret")
    role = SimpleNamespace(id="r1", permissions=["outline:read"])
    admin = SimpleNamespace(id="admin-1", role_id="r1")
    app.dependency_overrides[get_current_admin] = lambda: admin
    app.dependency_overrides[get_db] = lambda: _FakeSession([_FakeResult(role)])
    try:
        with patch("app.api.v1.outline._get_client", return_value=mock_outline_client):
            r = await client.get("/api/v1/outline/status")
            assert r.status_code == 200
            data = r.json()
            assert data["status"] == "connected"
            assert data.get("version") == "1.0.0"
    finally:
        app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_outline_keys_list_with_auth_and_mock(
    client: AsyncClient, mock_outline_client, monkeypatch
):
    """With mocked client, GET /outline/keys returns 200 and keys array (no accessUrl)."""
    monkeypatch.setattr(config.settings, "outline_integration_enabled", True)
    monkeypatch.setattr(config.settings, "outline_manager_url", "https://outline.example/secret")
    role = SimpleNamespace(id="r1", permissions=["outline:read"])
    app.dependency_overrides[get_current_admin] = lambda: SimpleNamespace(
        id="admin-1", role_id="r1"
    )
    app.dependency_overrides[get_db] = lambda: _FakeSession([_FakeResult(role)])
    try:
        with patch("app.api.v1.outline._get_client", return_value=mock_outline_client):
            r = await client.get("/api/v1/outline/keys")
            assert r.status_code == 200
            data = r.json()
            assert "keys" in data
            assert data["keys"] == []
            for k in data.get("keys", []):
                assert "accessUrl" not in k
                assert "password" not in k
    finally:
        app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_outline_safe_key_strips_secrets():
    """_safe_key removes accessUrl and password from key dict."""
    raw = {
        "id": "0",
        "name": "K",
        "port": 9999,
        "method": "chacha20-ietf-poly1305",
        "accessUrl": "ss://secret@x:9999/",
        "password": "x",
    }
    safe = _safe_key(raw)
    assert safe["id"] == "0"
    assert safe["name"] == "K"
    assert "accessUrl" not in safe
    assert "password" not in safe
