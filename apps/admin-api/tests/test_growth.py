"""Smoke tests for Growth: promo validate, referral attach idempotency."""

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
async def test_promo_validate_requires_auth(client: AsyncClient):
    """POST /api/v1/bot/promo/validate without X-API-Key returns 401."""
    r = await client.post(
        "/api/v1/bot/promo/validate",
        json={"code": "TEST", "plan_id": "p1", "tg_id": 123},
    )
    assert r.status_code == 401


@pytest.mark.asyncio
async def test_referral_my_link_requires_auth(client: AsyncClient):
    """GET /api/v1/bot/referral/my-link without X-API-Key returns 401."""
    r = await client.get("/api/v1/bot/referral/my-link?tg_id=123")
    assert r.status_code == 401


@pytest.mark.asyncio
async def test_referral_attach_requires_auth(client: AsyncClient):
    """POST /api/v1/bot/referral/attach without X-API-Key returns 401."""
    r = await client.post(
        "/api/v1/bot/referral/attach",
        json={"tg_id": 123, "referral_code": "1"},
    )
    assert r.status_code == 401
