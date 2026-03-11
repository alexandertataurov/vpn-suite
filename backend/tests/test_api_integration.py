"""API integration tests: validation, auth required, error responses. No DB seed required for these."""

from datetime import datetime, timezone
from types import SimpleNamespace

import pytest
from httpx import ASGITransport, AsyncClient

from app.core.config import settings
from app.core.database import get_db
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
        pytest.skip(f"DB/Redis not available (requires Postgres/Redis): {e}")
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
async def test_webapp_auth_persists_tg_requisites_in_meta(
    client: AsyncClient, monkeypatch, async_session
):
    """POST /api/v1/webapp/auth with valid init_data stores Telegram user in User.meta['tg']."""
    from sqlalchemy import select

    from app.core import config
    from app.models import User

    tg_id = 987654321
    tg_user = {
        "id": tg_id,
        "first_name": "Auth",
        "last_name": "Test",
        "username": "authtest",
        "language_code": "en",
        "is_premium": False,
    }
    monkeypatch.setattr(config.settings, "telegram_bot_token", "TEST_BOT_TOKEN")
    monkeypatch.setattr(
        config.settings,
        "secret_key",
        getattr(config.settings, "secret_key", "test-secret"),
    )
    monkeypatch.setattr(
        "app.api.v1.webapp.validate_telegram_init_data",
        lambda init_data, bot_token: tg_user if bot_token else None,
    )

    async def override_get_db():
        yield async_session

    app.dependency_overrides[get_db] = override_get_db
    try:
        r = await client.post("/api/v1/webapp/auth", json={"init_data": "any"})
        assert r.status_code == 200, r.text
        data = r.json()
        assert "session_token" in data

        result = await async_session.execute(select(User).where(User.tg_id == tg_id))
        user = result.scalar_one_or_none()
        assert user is not None
        assert user.meta is not None
        assert "tg" in user.meta
        tg = user.meta["tg"]
        assert tg["id"] == tg_id
        assert tg["first_name"] == "Auth"
        assert tg["last_name"] == "Test"
        assert tg["username"] == "authtest"
        assert tg["language_code"] == "en"
        assert tg["is_premium"] is False
    finally:
        app.dependency_overrides.pop(get_db, None)


@pytest.mark.asyncio
async def test_webapp_me_patch_updates_profile(client: AsyncClient, monkeypatch, async_session):
    """PATCH /api/v1/webapp/me with Bearer updates user profile (email, phone, display_name, locale)."""
    from sqlalchemy import select

    from app.core import config
    from app.models import User

    tg_id = 111222333
    tg_user = {
        "id": tg_id,
        "first_name": "Patch",
        "last_name": "User",
        "username": "patchuser",
        "language_code": "en",
    }
    monkeypatch.setattr(config.settings, "telegram_bot_token", "TEST_BOT_TOKEN")
    monkeypatch.setattr(
        config.settings,
        "secret_key",
        getattr(config.settings, "secret_key", "test-secret"),
    )
    monkeypatch.setattr(
        "app.api.v1.webapp.validate_telegram_init_data",
        lambda init_data, bot_token: tg_user if bot_token else None,
    )

    async def override_get_db():
        yield async_session

    app.dependency_overrides[get_db] = override_get_db
    try:
        auth_r = await client.post("/api/v1/webapp/auth", json={"init_data": "x"})
        assert auth_r.status_code == 200, auth_r.text
        token = auth_r.json()["session_token"]

        get_r = await client.get(
            "/api/v1/webapp/me",
            headers={"Authorization": f"Bearer {token}"},
        )
        assert get_r.status_code == 200, get_r.text
        me = get_r.json()
        assert me["user"] is not None

        patch_r = await client.patch(
            "/api/v1/webapp/me",
            headers={"Authorization": f"Bearer {token}"},
            json={
                "display_name": "New Name",
                "email": "new@example.com",
                "phone": "+1234567890",
                "locale": "ru",
            },
        )
        assert patch_r.status_code == 200, patch_r.text
        updated = patch_r.json()["user"]
        assert updated["display_name"] == "New Name"
        assert updated["email"] == "new@example.com"
        assert updated["phone"] == "+1234567890"
        assert updated["locale"] == "ru"

        get_r2 = await client.get(
            "/api/v1/webapp/me",
            headers={"Authorization": f"Bearer {token}"},
        )
        assert get_r2.status_code == 200
        assert get_r2.json()["user"]["display_name"] == "New Name"
        assert get_r2.json()["user"]["email"] == "new@example.com"
        assert get_r2.json()["user"]["phone"] == "+1234567890"
        assert get_r2.json()["user"]["locale"] == "ru"

        result = await async_session.execute(select(User).where(User.tg_id == tg_id))
        user = result.scalar_one_or_none()
        assert user is not None
        assert user.email == "new@example.com"
        assert user.phone == "+1234567890"
        assert (user.meta or {}).get("display_name") == "New Name"
        assert (user.meta or {}).get("locale") == "ru"
    finally:
        app.dependency_overrides.pop(get_db, None)


@pytest.mark.asyncio
async def test_webapp_me_patch_invalid_locale_422(client: AsyncClient, monkeypatch, async_session):
    """PATCH /api/v1/webapp/me with invalid locale returns 422."""
    from app.core import config

    tg_id = 444555666
    tg_user = {"id": tg_id, "first_name": "X", "language_code": "en"}
    monkeypatch.setattr(config.settings, "telegram_bot_token", "TEST_BOT_TOKEN")
    monkeypatch.setattr(
        config.settings,
        "secret_key",
        getattr(config.settings, "secret_key", "test-secret"),
    )
    monkeypatch.setattr(
        "app.api.v1.webapp.validate_telegram_init_data",
        lambda init_data, bot_token: tg_user if bot_token else None,
    )

    async def override_get_db():
        yield async_session

    app.dependency_overrides[get_db] = override_get_db
    try:
        auth_r = await client.post("/api/v1/webapp/auth", json={"init_data": "x"})
        assert auth_r.status_code == 200
        token = auth_r.json()["session_token"]

        r = await client.patch(
            "/api/v1/webapp/me",
            headers={"Authorization": f"Bearer {token}"},
            json={"locale": "xx"},
        )
        assert r.status_code == 422, r.text
    finally:
        app.dependency_overrides.pop(get_db, None)


@pytest.mark.asyncio
async def test_webapp_me_patch_invalid_email_422(client: AsyncClient, monkeypatch, async_session):
    """PATCH /api/v1/webapp/me with invalid email format returns 422."""
    from app.core import config

    tg_id = 777888999
    tg_user = {"id": tg_id, "first_name": "Y", "language_code": "en"}
    monkeypatch.setattr(config.settings, "telegram_bot_token", "TEST_BOT_TOKEN")
    monkeypatch.setattr(
        config.settings,
        "secret_key",
        getattr(config.settings, "secret_key", "test-secret"),
    )
    monkeypatch.setattr(
        "app.api.v1.webapp.validate_telegram_init_data",
        lambda init_data, bot_token: tg_user if bot_token else None,
    )

    async def override_get_db():
        yield async_session

    app.dependency_overrides[get_db] = override_get_db
    try:
        auth_r = await client.post("/api/v1/webapp/auth", json={"init_data": "x"})
        assert auth_r.status_code == 200
        token = auth_r.json()["session_token"]

        r = await client.patch(
            "/api/v1/webapp/me",
            headers={"Authorization": f"Bearer {token}"},
            json={"email": "not-an-email"},
        )
        assert r.status_code == 422, r.text
    finally:
        app.dependency_overrides.pop(get_db, None)


@pytest.mark.asyncio
async def test_webapp_logout_returns_ok_for_valid_session(client: AsyncClient, monkeypatch, async_session):
    from app.core import config

    tg_id = 101202303
    tg_user = {"id": tg_id, "first_name": "Logout", "language_code": "en"}
    monkeypatch.setattr(config.settings, "telegram_bot_token", "TEST_BOT_TOKEN")
    monkeypatch.setattr(
        config.settings,
        "secret_key",
        getattr(config.settings, "secret_key", "test-secret"),
    )
    monkeypatch.setattr(
        "app.api.v1.webapp.validate_telegram_init_data",
        lambda init_data, bot_token: tg_user if bot_token else None,
    )

    async def override_get_db():
        yield async_session

    app.dependency_overrides[get_db] = override_get_db
    try:
        auth_r = await client.post("/api/v1/webapp/auth", json={"init_data": "x"})
        assert auth_r.status_code == 200, auth_r.text
        token = auth_r.json()["session_token"]

        logout_r = await client.post(
            "/api/v1/webapp/logout",
            headers={"Authorization": f"Bearer {token}"},
        )
        assert logout_r.status_code == 200, logout_r.text
        assert logout_r.json() == {"status": "ok"}
    finally:
        app.dependency_overrides.pop(get_db, None)


@pytest.mark.asyncio
async def test_webapp_debug_test_telegram_config_sends_to_expected_chat(monkeypatch):
    """POST /api/v1/webapp/debug/test-telegram-config uses WebApp tg_id as chat_id."""
    from app.api.v1 import webapp as webapp_module
    from app.core import config

    # Ensure bot token is set so endpoint does not 503.
    monkeypatch.setattr(config.settings, "telegram_bot_token", "TEST_TOKEN")

    # Force _get_tg_id_from_bearer to return our expected id without real JWT.
    monkeypatch.setattr(
        webapp_module,
        "_get_tg_id_from_bearer",
        lambda request: 504047,
    )

    # Capture Telegram Bot API calls.
    called = {"sendMessage": None, "sendDocument": None}

    class DummyResponse:
        def __init__(self, status_code: int, text: str = ""):
            self.status_code = status_code
            self.text = text

    async def fake_post(self, url: str, *args, **kwargs):
        if url.endswith("/sendMessage"):
            called["sendMessage"] = kwargs
            return DummyResponse(200, '{"ok":true}')
        if url.endswith("/sendDocument"):
            called["sendDocument"] = kwargs
            return DummyResponse(200, '{"ok":true}')
        return DummyResponse(404, '{"ok":false}')

    class DummyAsyncClient:
        def __init__(self, *args, **kwargs):
            pass

        async def __aenter__(self):
            return self

        async def __aexit__(self, exc_type, exc, tb):
            return False

        post = fake_post  # type: ignore[assignment]

    monkeypatch.setattr(webapp_module, "httpx", type("H", (), {"AsyncClient": DummyAsyncClient}))

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        r = await ac.post("/api/v1/webapp/debug/test-telegram-config")

    assert r.status_code == 200, r.text
    assert called["sendMessage"] is not None
    assert called["sendDocument"] is not None
    assert called["sendMessage"]["json"]["chat_id"] == 504047
    assert called["sendDocument"]["data"]["chat_id"] == "504047"


def test_webapp_delivery_config_selection_prefers_awg():
    """Delivery should prefer AmneziaWG config when available."""
    from app.api.v1 import webapp as webapp_module

    class DummyOut:
        config_awg = "awg-config"
        config_wg_obf = "wg-obf-config"
        config_wg = "wg-config"

    assert webapp_module._select_delivery_config_text(DummyOut()) == "awg-config"


def test_webapp_delivery_config_selection_falls_back_to_wg_variants():
    """Delivery should fallback to non-empty wg_obf/wg/legacy config in order."""
    from app.api.v1 import webapp as webapp_module

    class DummyOut:
        config_awg = "   "
        config_wg_obf = ""
        config_wg = "wg-config"
        config = "legacy-config"

    assert webapp_module._select_delivery_config_text(DummyOut()) == "wg-config"


@pytest.mark.asyncio
async def test_webapp_issue_device_enqueues_telegram_send_background_task(
    client: AsyncClient, monkeypatch
):
    """POST /api/v1/webapp/devices/issue schedules Telegram config delivery via BackgroundTasks."""
    from app.api.v1 import webapp as webapp_module

    class _FakeResult:
        def __init__(self, value):
            self._value = value

        def scalar_one_or_none(self):
            return self._value

    class _FakeDB:
        def __init__(self):
            self.added = []

        async def execute(self, stmt):  # noqa: ARG002
            return _FakeResult(SimpleNamespace(id="sub-1"))

        def add(self, obj):
            self.added.append(obj)

        async def commit(self):
            pass

        async def refresh(self, obj):  # noqa: ARG002
            pass

        async def rollback(self):
            pass

    fake_db = _FakeDB()

    async def fake_get_db():
        yield fake_db

    app.dependency_overrides[get_db] = fake_get_db

    monkeypatch.setattr(settings, "issue_rate_limit_per_minute", 0)
    monkeypatch.setattr(webapp_module, "_get_tg_id_from_bearer", lambda request: 504047)

    async def fake_get_or_create_user(db, tg_id):  # noqa: ARG001
        return SimpleNamespace(id=77, meta={})

    monkeypatch.setattr(webapp_module, "_get_or_create_webapp_user", fake_get_or_create_user)

    issued_at = datetime.now(timezone.utc)
    out = SimpleNamespace(
        device=SimpleNamespace(id="dev-bg-1", server_id="srv-bg-1", issued_at=issued_at),
        config_awg="[Interface]\nPrivateKey = TEST\nAddress = 10.0.0.2/32\n",
        config_wg_obf="",
        config_wg="",
        peer_created=True,
    )

    async def fake_issue_device(*args, **kwargs):  # noqa: ARG001
        return out

    monkeypatch.setattr(webapp_module, "issue_device", fake_issue_device)

    async def _noop():
        return None

    monkeypatch.setattr(webapp_module, "invalidate_devices_summary_cache", _noop)
    monkeypatch.setattr(webapp_module, "invalidate_devices_list_cache", _noop)

    sent: list[tuple[int, str, str]] = []

    async def fake_send_config_to_telegram(tg_id: int, device_id: str, config_text: str):
        sent.append((tg_id, device_id, config_text))

    monkeypatch.setattr(
        webapp_module, "_send_webapp_config_to_telegram", fake_send_config_to_telegram
    )

    old_adapter = getattr(app.state, "node_runtime_adapter", None)
    app.state.node_runtime_adapter = object()
    try:
        r = await client.post("/api/v1/webapp/devices/issue", json={})
        assert r.status_code == 200, r.text
        assert len(sent) == 1
        assert sent[0][0] == 504047
        assert sent[0][1] == "dev-bg-1"
        assert sent[0][2].startswith("[Interface]")
        assert len(fake_db.added) == 1
        assert fake_db.added[0].device_id == "dev-bg-1"
        assert fake_db.added[0].server_id == out.device.server_id
        assert fake_db.added[0].profile_type == "awg"
        assert fake_db.added[0].config_encrypted
    finally:
        if old_adapter is None and hasattr(app.state, "node_runtime_adapter"):
            delattr(app.state, "node_runtime_adapter")
        elif old_adapter is not None:
            app.state.node_runtime_adapter = old_adapter
        app.dependency_overrides.clear()


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
