"""Authz and production-gating tests for app settings endpoints."""

from pathlib import Path
from types import SimpleNamespace

import pytest
from httpx import ASGITransport, AsyncClient

from app.api.v1.auth import get_current_admin
from app.core.bot_auth import get_admin_or_bot
from app.core.config import settings
from app.core.database import get_db
from app.main import app
from app.models import AdminUser


class _FakeResult:
    def __init__(self, value):
        self._value = value

    def scalar_one_or_none(self):
        return self._value

    def all(self):
        return []


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


def _admin(role_id: str = "role-1") -> AdminUser:
    return AdminUser(
        id="admin-1",
        email="admin@example.com",
        password_hash="test-hash",
        role_id=role_id,
    )


@pytest.fixture
def client():
    return AsyncClient(
        transport=ASGITransport(app=app),
        base_url="http://test",
        timeout=5.0,
    )


def _override_db_with_perms(perms: list[str]):
    role = SimpleNamespace(id="role-1", permissions=perms)
    session = _FakeSession([_FakeResult(role)])

    async def fake_get_db():
        try:
            yield session
        finally:
            await session.close()

    app.dependency_overrides[get_db] = fake_get_db


@pytest.mark.asyncio
async def test_app_settings_requires_settings_permissions(client: AsyncClient):
    _override_db_with_perms(["servers:read"])
    app.dependency_overrides[get_admin_or_bot] = lambda: _admin("role-1")
    try:
        response = await client.get("/api/v1/app/settings")
        assert response.status_code == 403
    finally:
        app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_app_settings_returns_capabilities_for_reader(client: AsyncClient):
    _override_db_with_perms(["settings:read"])
    app.dependency_overrides[get_admin_or_bot] = lambda: _admin("role-1")
    try:
        response = await client.get("/api/v1/app/settings")
        assert response.status_code == 200
        body = response.json()
        assert body["capabilities"]["can_read"] is True
        assert body["capabilities"]["can_write"] is False
        assert body["capabilities"]["can_manage_dangerous"] is False
    finally:
        app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_env_editor_requires_flag_even_with_dangerous_permission(
    client: AsyncClient, monkeypatch
):
    role = SimpleNamespace(id="role-1", permissions=["settings:dangerous"])
    session = _FakeSession([_FakeResult(role)])

    async def fake_get_db():
        try:
            yield session
        finally:
            await session.close()

    app.dependency_overrides[get_db] = fake_get_db
    app.dependency_overrides[get_current_admin] = lambda: _admin("role-1")
    monkeypatch.setattr(settings, "app_env_editor_enabled", False)
    try:
        response = await client.get("/api/v1/app/env")
        assert response.status_code == 403
        body = response.json()
        msg = (body.get("error", {}) or {}).get("message", "")
        assert "disabled" in msg.lower()
    finally:
        app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_env_editor_allowed_when_dangerous_and_enabled(
    client: AsyncClient, monkeypatch, tmp_path: Path
):
    env_path = tmp_path / ".env.test"
    env_path.write_text("FOO=bar\n", encoding="utf-8")
    monkeypatch.setenv("ENV_FILE", str(env_path))
    monkeypatch.setattr(settings, "app_env_editor_enabled", True)

    role = SimpleNamespace(id="role-1", permissions=["settings:dangerous"])
    session = _FakeSession([_FakeResult(role)])

    async def fake_get_db():
        try:
            yield session
        finally:
            await session.close()

    app.dependency_overrides[get_db] = fake_get_db
    app.dependency_overrides[get_current_admin] = lambda: _admin("role-1")
    try:
        response = await client.get("/api/v1/app/env")
        assert response.status_code == 200
        body = response.json()
        assert body["path"] == str(env_path)
        assert "FOO=bar" in body["content"]
    finally:
        app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_cleanup_db_requires_settings_dangerous(client: AsyncClient):
    role = SimpleNamespace(id="role-1", permissions=["settings:write"])
    session = _FakeSession([_FakeResult(role)])

    async def fake_get_db():
        try:
            yield session
        finally:
            await session.close()

    app.dependency_overrides[get_db] = fake_get_db
    app.dependency_overrides[get_current_admin] = lambda: _admin("role-1")
    try:
        response = await client.post(
            "/api/v1/app/settings/cleanup-db",
            json={"confirm_token": settings.cleanup_db_confirm_token},
        )
        assert response.status_code == 403
    finally:
        app.dependency_overrides.clear()
