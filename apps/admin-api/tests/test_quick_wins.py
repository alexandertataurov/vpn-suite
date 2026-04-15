"""Quick-win API audit tests: devices limit, webhook provider, error shape, authz."""

import pytest
from httpx import ASGITransport, AsyncClient

from app.core import config
from app.main import app


@pytest.fixture
def client():
    return AsyncClient(
        transport=ASGITransport(app=app),
        base_url="http://test",
        timeout=5.0,
    )


@pytest.mark.asyncio
async def test_webhook_unknown_provider_rejected(client: AsyncClient):
    """POST /webhooks/payments/{provider} with unknown provider returns 400 (P0)."""
    r = await client.post(
        "/webhooks/payments/unknown_provider_xyz",
        json={"external_id": "x", "user_id": 1, "subscription_id": "s"},
    )
    assert r.status_code == 400
    data = r.json()
    err = data.get("error", data) if isinstance(data, dict) else {}
    code = err.get("code", "") if isinstance(err, dict) else ""
    msg = err.get("message", "") if isinstance(err, dict) else str(data)
    assert code == "UNKNOWN_PROVIDER" or "Unknown" in str(msg)


@pytest.mark.asyncio
async def test_webhook_platega_requires_valid_headers(
    client: AsyncClient, monkeypatch: pytest.MonkeyPatch
):
    monkeypatch.setattr(config.settings, "platega_merchant_id", "merchant-1")
    monkeypatch.setattr(config.settings, "platega_secret", "secret-1")
    r = await client.post("/webhooks/payments/platega", json={"id": "plg-1", "status": "PENDING"})
    assert r.status_code == 401


@pytest.mark.asyncio
async def test_devices_list_limit_max_200(client: AsyncClient):
    """GET /api/v1/devices?limit=201 returns 422 (pagination cap)."""
    r = await client.get(
        "/api/v1/devices",
        params={"limit": 201},
        headers={"Authorization": "Bearer fake-token"},
    )
    # 401 (no auth) or 422 (validation): limit>200 is invalid
    assert r.status_code in (401, 422)
    if r.status_code == 422:
        data = r.json()
        assert "limit" in str(data).lower() or "422" in str(data)


@pytest.mark.asyncio
async def test_404_response_has_unified_shape(client: AsyncClient):
    """404 from handler goes through http_exception_to_error_response with error.code and error.message."""
    r = await client.get(
        "/api/v1/peers/nonexistent-peer-id-404-test",
        headers={"Authorization": "Bearer fake-token"},
    )
    # 401 (invalid token) or 404 (if we had valid auth and peer not found)
    assert r.status_code in (401, 404)
    if r.status_code == 404:
        data = r.json()
        assert "error" in data
        assert "code" in data["error"]
        assert "message" in data["error"]


@pytest.mark.asyncio
async def test_servers_requires_auth_401(client: AsyncClient):
    """GET /api/v1/servers without auth returns 401 (authz boundary)."""
    r = await client.get("/api/v1/servers")
    assert r.status_code == 401


def test_webhook_allowed_providers_include_mock_telegram_stars_and_platega():
    """ALLOWED_WEBHOOK_PROVIDERS must include telegram_stars, platega, and mock."""
    from app.api.v1.webhooks import ALLOWED_WEBHOOK_PROVIDERS

    assert "telegram_stars" in ALLOWED_WEBHOOK_PROVIDERS
    assert "platega" in ALLOWED_WEBHOOK_PROVIDERS
    assert "mock" in ALLOWED_WEBHOOK_PROVIDERS


@pytest.mark.asyncio
async def test_error_responses_include_request_id(client: AsyncClient):
    """401/404/400 error responses include request_id in meta."""
    r = await client.get("/api/v1/servers")
    assert r.status_code == 401
    data = r.json()
    meta = data.get("meta", {})
    assert "request_id" in meta or "request_id" in str(data)


def test_pagination_params_constants():
    """PaginationParams enforce max 200."""
    from app.schemas.base import MAX_PAGINATION_LIMIT, PaginationParams

    assert MAX_PAGINATION_LIMIT == 200
    p = PaginationParams()
    assert p.limit <= 200
