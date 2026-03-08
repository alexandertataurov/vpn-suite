"""Authz boundary tests: admin cannot access without permission, tenant scoping."""

import pytest
from httpx import ASGITransport, AsyncClient

from app.main import app


@pytest.fixture
def client():
    return AsyncClient(
        transport=ASGITransport(app=app),
        base_url="http://test",
        timeout=5.0,
    )


@pytest.mark.asyncio
async def test_audit_requires_admin_not_bot(client: AsyncClient):
    """GET /api/v1/audit rejects bot (X-API-Key) with 403."""
    from app.core.config import settings

    if not settings.bot_api_key:
        pytest.skip("BOT_API_KEY not set")
    r = await client.get(
        "/api/v1/audit",
        headers={"X-API-Key": settings.bot_api_key},
    )
    assert r.status_code == 403


@pytest.mark.asyncio
async def test_cluster_topology_requires_auth(client: AsyncClient):
    """GET /api/v1/cluster/topology requires auth."""
    r = await client.get("/api/v1/cluster/topology")
    assert r.status_code == 401


@pytest.mark.asyncio
async def test_devices_list_requires_auth(client: AsyncClient):
    """GET /api/v1/devices requires auth."""
    r = await client.get("/api/v1/devices")
    assert r.status_code == 401


@pytest.mark.asyncio
async def test_payments_list_requires_auth(client: AsyncClient):
    """GET /api/v1/payments requires auth."""
    r = await client.get("/api/v1/payments")
    assert r.status_code == 401


@pytest.mark.asyncio
async def test_users_delete_requires_auth(client: AsyncClient):
    """DELETE /api/v1/users/:id requires admin auth (and body with confirm_token)."""
    r = await client.request(
        "DELETE",
        "/api/v1/users/1",
        json={"confirm_token": "any"},
    )
    assert r.status_code == 401
