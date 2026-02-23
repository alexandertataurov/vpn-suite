"""E2E: login → GET servers → GET users. Requires DB + Redis and seeded admin (e.g. in CI)."""

import os

import pytest
from httpx import ASGITransport, AsyncClient

from app.main import app

# When set, E2E must run and fail the build on 401 or connection error (no skip).
E2E_GATED = os.environ.get("GITHUB_ACTIONS") == "true" or os.environ.get("RUN_E2E") == "1"


@pytest.mark.asyncio
async def test_login_then_servers_then_users():
    """Chain: POST login → GET /api/v1/servers → GET /api/v1/users. In CI/RUN_E2E=1 no skip."""
    email = os.environ.get("ADMIN_EMAIL", "admin@localhost")
    password = os.environ.get("ADMIN_PASSWORD", "change-me")
    async with AsyncClient(
        transport=ASGITransport(app=app),
        base_url="http://test",
        timeout=10.0,
    ) as client:
        if E2E_GATED:
            r = await client.post(
                "/api/v1/auth/login",
                json={"email": email, "password": password},
            )
            assert (
                r.status_code == 200
            ), f"E2E gated: login must succeed, got {r.status_code}: {r.text}"
        else:
            try:
                r = await client.post(
                    "/api/v1/auth/login",
                    json={"email": email, "password": password},
                )
            except (ConnectionRefusedError, OSError) as e:
                pytest.skip(f"DB/Redis not available: {e}")
            if r.status_code == 401:
                pytest.skip("Login failed (no DB or admin not seeded)")
            assert r.status_code == 200, r.text
        data = r.json()
        token = data.get("access_token")
        assert token

        r2 = await client.get(
            "/api/v1/servers",
            headers={"Authorization": f"Bearer {token}"},
        )
        assert r2.status_code == 200, r2.text
        servers_data = r2.json()
        assert "items" in servers_data
        valid_statuses = ("online", "offline", "degraded", "unknown")
        for item in servers_data["items"]:
            assert (
                item.get("status") in valid_statuses
            ), f"server {item.get('id')} has status {item.get('status')!r} not in {valid_statuses}"

        r3 = await client.get(
            "/api/v1/users",
            headers={"Authorization": f"Bearer {token}"},
        )
        assert r3.status_code == 200, r3.text
        assert "items" in r3.json()
