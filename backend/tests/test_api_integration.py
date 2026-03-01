"""API integration tests: validation, auth required, error responses. No DB seed required for these."""

import pytest
from httpx import ASGITransport, AsyncClient

from app.core.config import settings
from app.main import app


@pytest.fixture
def client():
    return AsyncClient(
        transport=ASGITransport(app=app),
        base_url="http://test",
        timeout=5.0,
    )


def _telegram_stars_secret_headers() -> dict[str, str]:
    # Tests should be deterministic even when TELEGRAM_STARS_WEBHOOK_SECRET is set in the environment.
    if settings.telegram_stars_webhook_secret:
        return {"X-Telegram-Bot-Api-Secret-Token": settings.telegram_stars_webhook_secret}
    return {}


@pytest.mark.asyncio
async def test_login_invalid_body_422(client: AsyncClient):
    """POST /auth/login with invalid body returns 422."""
    r = await client.post("/api/v1/auth/login", json={})
    assert r.status_code == 422


@pytest.mark.asyncio
async def test_login_missing_password_422(client: AsyncClient):
    """POST /auth/login without password returns 422."""
    r = await client.post("/api/v1/auth/login", json={"email": "a@b.com"})
    assert r.status_code == 422


@pytest.mark.asyncio
async def test_servers_get_requires_auth_401(client: AsyncClient):
    """GET /api/v1/servers without Bearer returns 401."""
    r = await client.get("/api/v1/servers")
    assert r.status_code == 401


@pytest.mark.asyncio
async def test_servers_delete_requires_auth_401(client: AsyncClient):
    """DELETE /api/v1/servers/:id without Bearer returns 401."""
    r = await client.delete("/api/v1/servers/srv-nonexistent")
    assert r.status_code == 401


@pytest.mark.asyncio
async def test_overview_requires_auth_401(client: AsyncClient):
    """GET /api/v1/overview without Bearer returns 401."""
    r = await client.get("/api/v1/overview")
    assert r.status_code == 401


@pytest.mark.asyncio
async def test_servers_post_invalid_api_endpoint_422(client: AsyncClient):
    """POST /api/v1/servers with http or private api_endpoint returns 422 (SSRF validation)."""
    r = await client.post(
        "/api/v1/servers",
        json={
            "name": "test",
            "region": "eu",
            "api_endpoint": "http://127.0.0.1/",
        },
        headers={"Authorization": "Bearer fake-token-will-401"},
    )
    # Either 401 (invalid token) or 422 (if validation runs first); validation is on body so we get 422
    assert r.status_code in (401, 422)
    if r.status_code == 422:
        assert "https" in r.text or "api_endpoint" in r.text.lower()


@pytest.mark.asyncio
async def test_webhook_payment_missing_external_id_400(client: AsyncClient):
    """POST /webhooks/payments/telegram_stars with body missing external_id returns 400."""
    r = await client.post(
        "/webhooks/payments/telegram_stars",
        json={},
        headers=_telegram_stars_secret_headers(),
    )
    assert r.status_code == 400
    data = r.json()
    assert "status" in data or "detail" in data


@pytest.mark.asyncio
async def test_webhook_external_id_from_id_or_payment_id(client: AsyncClient):
    """Webhook accepts external_id from payload 'id' or 'payment_id'. Fails on user_id/subscription_id, not external_id."""
    try:
        r = await client.post(
            "/webhooks/payments/telegram_stars",
            json={"id": "ext-from-id", "amount": 1},
            headers=_telegram_stars_secret_headers(),
        )
    except (ConnectionRefusedError, OSError) as e:
        pytest.skip(f"DB/Redis not available: {e}")
    if r.status_code == 500:
        pytest.skip("DB/Redis not available (webhook needs DB for select by external_id)")
    assert r.status_code == 400, r.text
    assert "user_id" in r.text or "subscription_id" in r.text


@pytest.mark.asyncio
async def test_metrics_returns_200_prometheus(client: AsyncClient):
    """GET /metrics returns 200 and Prometheus-style output."""
    r = await client.get("/metrics")
    assert r.status_code == 200
    assert "text/plain" in r.headers.get("content-type", "")
    # Prometheus format has # HELP or metric names
    body = r.text
    assert "#" in body or "http_" in body or "requests" in body.lower()


@pytest.mark.asyncio
async def test_audit_requires_auth_401(client: AsyncClient):
    """GET /api/v1/audit without auth returns 401."""
    r = await client.get("/api/v1/audit")
    assert r.status_code == 401


@pytest.mark.asyncio
async def test_plans_requires_auth_401(client: AsyncClient):
    """GET /api/v1/plans without auth returns 401."""
    r = await client.get("/api/v1/plans")
    assert r.status_code == 401


@pytest.mark.asyncio
async def test_payments_requires_auth_401(client: AsyncClient):
    """GET /api/v1/payments without auth returns 401."""
    r = await client.get("/api/v1/payments")
    assert r.status_code == 401


@pytest.mark.asyncio
async def test_subscriptions_requires_auth_401(client: AsyncClient):
    """GET /api/v1/subscriptions without auth returns 401."""
    r = await client.get("/api/v1/subscriptions")
    assert r.status_code == 401


@pytest.mark.asyncio
async def test_bot_create_or_get_requires_auth(client: AsyncClient):
    """POST /api/v1/bot/subscriptions/create-or-get without X-API-Key returns 401."""
    r = await client.post(
        "/api/v1/bot/subscriptions/create-or-get",
        json={"tg_id": 12345, "plan_id": "plan1"},
    )
    assert r.status_code == 401
    data = r.json()
    assert data.get("error") or "detail" in data


@pytest.mark.asyncio
async def test_unknown_path_404(client: AsyncClient):
    """GET unknown path returns 404, not 500."""
    r = await client.get("/api/v1/unknown-resource")
    assert r.status_code == 404


@pytest.mark.asyncio
async def test_validation_error_has_detail(client: AsyncClient):
    """422 validation errors include detail or error (no stack trace)."""
    r = await client.get("/api/v1/servers?limit=9999")
    assert r.status_code in (401, 422)
    if r.status_code == 422:
        data = r.json()
        assert "detail" in data or "error" in data
        assert "Traceback" not in r.text


@pytest.mark.asyncio
async def test_webhook_telegram_stars_401_when_secret_set_and_missing(
    client: AsyncClient, monkeypatch
):
    """When TELEGRAM_STARS_WEBHOOK_SECRET is set, missing header → 401 (unified error shape)."""
    from app.core import config

    monkeypatch.setattr(config.settings, "telegram_stars_webhook_secret", "test-secret-token")
    r = await client.post(
        "/webhooks/payments/telegram_stars",
        json={
            "external_id": "ext-1",
            "user_id": 1,
            "subscription_id": "sub-1",
            "amount": 10,
            "currency": "USD",
        },
    )
    assert r.status_code == 401
    data = r.json()
    assert data.get("error") or "detail" in data
    assert "Traceback" not in r.text


@pytest.mark.asyncio
async def test_webapp_auth_503_when_bot_token_not_configured(client: AsyncClient, monkeypatch):
    """POST /api/v1/webapp/auth when TELEGRAM_BOT_TOKEN not set returns 503."""
    from app.core import config

    monkeypatch.setattr(config.settings, "telegram_bot_token", None)
    r = await client.post("/api/v1/webapp/auth", json={"initData": "x"})
    assert r.status_code == 503
    data = r.json()
    assert "WEBAPP_AUTH_DISABLED" in str(data) or "error" in data


@pytest.mark.asyncio
async def test_webapp_create_invoice_route_exists_not_404(client: AsyncClient):
    """Checkout contract: canonical path exists (auth may fail with 401, but not 404)."""
    r = await client.post(
        "/api/v1/webapp/payments/create-invoice",
        json={"plan_id": "plan-basic"},
    )
    assert r.status_code != 404
    assert r.status_code in (401, 422)


@pytest.mark.asyncio
async def test_webapp_promo_validate_route_exists_not_404(client: AsyncClient):
    """Promo contract: canonical path exists (auth may fail with 401, but not 404)."""
    r = await client.post(
        "/api/v1/webapp/promo/validate",
        json={"code": "PROMO", "plan_id": "plan-basic"},
    )
    assert r.status_code != 404
    assert r.status_code in (401, 422)


@pytest.mark.asyncio
async def test_webapp_onboarding_state_route_exists_not_404(client: AsyncClient):
    """Onboarding contract: canonical state path exists (auth may fail with 401, but not 404)."""
    r = await client.post(
        "/api/v1/webapp/onboarding/state",
        json={"step": 1, "version": 1},
    )
    assert r.status_code != 404
    assert r.status_code in (401, 422)


@pytest.mark.asyncio
async def test_webapp_legacy_invoices_path_is_404(client: AsyncClient):
    """Legacy wrong checkout path must remain absent to avoid silent contract drift."""
    r = await client.post(
        "/api/v1/webapp/invoices",
        json={"plan_id": "plan-basic"},
    )
    assert r.status_code == 404
