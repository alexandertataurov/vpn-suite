"""Security tests: redaction, 500 no traceback, invalid token, SSRF validation, rate-limit behaviour."""

import pytest
from httpx import ASGITransport, AsyncClient

from app.core.redaction import mask_sensitive, redact_dict, redact_for_log
from app.main import app


def test_redact_bearer_token():
    """Logs must not contain raw Bearer token (P0)."""
    s = "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0In0.x"
    assert "eyJ" not in redact_for_log(s)
    assert "REDACTED" in redact_for_log(s)


def test_redact_password_like():
    """Logs must not contain password/secret values (key=value or key:value style)."""
    s = "password=secret123"
    out = redact_for_log(s)
    assert "secret123" not in out
    assert "REDACTED" in out


def test_redact_none():
    assert redact_for_log(None) == ""


def test_redact_confirm_token():
    s = "confirm_token=abc123xyz"
    out = redact_for_log(s)
    assert "abc123xyz" not in out
    assert "REDACTED" in out


def test_redact_config_url():
    s = "https://api.example.com/api/v1/admin/configs/deadbeef123456/download"
    out = redact_for_log(s)
    assert "deadbeef123456" not in out
    assert "REDACTED" in out


def test_redact_dict():
    d = {"user": "alice", "password": "secret", "email": "a@b.com"}
    out = redact_dict(d, ["password", "token"])
    assert out["user"] == "alice"
    assert out["email"] == "a@b.com"
    assert out["password"] == "REDACTED"


def test_mask_sensitive():
    assert mask_sensitive("Bearer xyz") == "REDACTED"
    assert mask_sensitive("hello") == "hello"


@pytest.mark.asyncio
async def test_error_responses_never_contain_traceback():
    """400/404/422 responses must not leak Traceback or file paths (production-ready)."""
    from httpx import ASGITransport, AsyncClient

    from app.main import app

    async with AsyncClient(
        transport=ASGITransport(app=app),
        base_url="http://test",
    ) as client:
        r404 = await client.get("/api/v1/nonexistent")
        assert r404.status_code == 404
        assert "Traceback" not in r404.text
        assert "File " not in r404.text
        r_err = await client.post("/webhooks/payments/telegram_stars", json={})
        assert r_err.status_code in (400, 401, 422)
        assert "Traceback" not in r_err.text


@pytest.mark.asyncio
async def test_500_exception_handler_returns_generic_body():
    """Main app exception handler returns stable 500 body, no traceback (P0)."""
    import json
    from unittest.mock import MagicMock

    from app.main import app

    handler = app.exception_handlers.get(Exception)
    assert handler is not None
    req = MagicMock()
    req.state = MagicMock()
    req.state.request_id = None
    req.state.correlation_id = None
    req.url = MagicMock()
    req.url.path = "/test"
    resp = await handler(req, RuntimeError("internal"))
    assert resp.status_code == 500
    body = resp.body.decode()
    assert "Traceback" not in body
    assert "File " not in body
    assert "internal" not in body
    data = json.loads(body)
    assert (
        data.get("error", {}).get("message") == "Internal server error"
        or data.get("detail") == "Internal server error"
    )


@pytest.mark.asyncio
async def test_invalid_bearer_401():
    """Invalid or missing Bearer token on protected route → 401."""
    async with AsyncClient(
        transport=ASGITransport(app=app),
        base_url="http://test",
    ) as client:
        r = await client.get("/api/v1/servers", headers={"Authorization": "Bearer invalid"})
    assert r.status_code == 401


@pytest.mark.asyncio
async def test_missing_bearer_401():
    async with AsyncClient(
        transport=ASGITransport(app=app),
        base_url="http://test",
    ) as client:
        r = await client.get("/api/v1/servers")
    assert r.status_code == 401


def test_server_schema_api_endpoint_ssrf_scheme_and_public():
    """api_endpoint must be https or http; private/localhost rejected."""
    from pydantic import ValidationError

    from app.schemas.server import ServerCreate

    with pytest.raises(ValidationError, match="https or http"):
        ServerCreate(name="n", region="r", api_endpoint="ftp://example.com")
    # valid: https and http for public host
    s = ServerCreate(name="n", region="r", api_endpoint="https://vpn-node.example.com/api")
    assert s.api_endpoint == "https://vpn-node.example.com/api"
    s2 = ServerCreate(name="n", region="r", api_endpoint="http://185.139.228.171")
    assert s2.api_endpoint == "http://185.139.228.171"
    # bare IP → normalized to http://
    s3 = ServerCreate(name="n", region="r", api_endpoint="185.139.228.171")
    assert s3.api_endpoint == "http://185.139.228.171"


def test_server_schema_api_endpoint_ssrf_no_private():
    """api_endpoint must not be localhost/private IP."""
    from pydantic import ValidationError

    from app.schemas.server import ServerCreate

    for bad in (
        "https://127.0.0.1/",
        "https://localhost/",
        "https://10.0.0.1/",
        "https://169.254.1.1/",
    ):
        with pytest.raises(ValidationError):
            ServerCreate(name="n", region="r", api_endpoint=bad)


def test_server_schema_vpn_endpoint_format():
    """vpn_endpoint must be host:port with port 1-65535."""
    from pydantic import ValidationError

    from app.schemas.server import ServerCreate, ServerUpdate

    # valid
    s = ServerCreate(
        name="n", region="r", api_endpoint="https://a.b/c", vpn_endpoint="vpn.example.com:47604"
    )
    assert s.vpn_endpoint == "vpn.example.com:47604"
    s2 = ServerCreate(
        name="n", region="r", api_endpoint="https://a.b/c", vpn_endpoint="10.0.0.1:51820"
    )
    assert s2.vpn_endpoint == "10.0.0.1:51820"
    # None / empty
    s3 = ServerCreate(name="n", region="r", api_endpoint="https://a.b/c", vpn_endpoint=None)
    assert s3.vpn_endpoint is None
    # invalid: no port
    with pytest.raises(ValidationError, match="host:port"):
        ServerCreate(name="n", region="r", api_endpoint="https://a.b/c", vpn_endpoint="hostonly")
    # invalid: port out of range
    with pytest.raises(ValidationError, match="1-65535"):
        ServerCreate(name="n", region="r", api_endpoint="https://a.b/c", vpn_endpoint="h:0")
    with pytest.raises(ValidationError, match="1-65535"):
        ServerCreate(name="n", region="r", api_endpoint="https://a.b/c", vpn_endpoint="h:65536")
    # ServerUpdate
    u = ServerUpdate(vpn_endpoint="node1:45790")
    assert u.vpn_endpoint == "node1:45790"


@pytest.mark.asyncio
async def test_api_rate_limit_health_not_limited():
    """Health and non-API paths are not subject to global API rate limit."""
    async with AsyncClient(
        transport=ASGITransport(app=app),
        base_url="http://test",
    ) as client:
        for _ in range(5):
            r = await client.get("/health")
            assert r.status_code == 200


@pytest.mark.asyncio
async def test_api_rate_limit_under_limit_returns_401_not_429():
    """Without auth, /api/v1 returns 401 (rate limit allows request through)."""
    async with AsyncClient(
        transport=ASGITransport(app=app),
        base_url="http://test",
    ) as client:
        r = await client.get("/api/v1/servers")
    assert r.status_code == 401
    # If rate limit applied and was exceeded we'd get 429; one request is under default limit


def test_api_rate_limit_exempt_ips_private(monkeypatch):
    """Exempt 'private' includes localhost and RFC1918."""
    from app.core import config
    from app.core.rate_limit import _is_exempt_from_api_rate_limit

    monkeypatch.setattr(config.settings, "api_rate_limit_exempt_ips", "private")
    assert _is_exempt_from_api_rate_limit("127.0.0.1") is True
    assert _is_exempt_from_api_rate_limit("10.1.2.3") is True
    assert _is_exempt_from_api_rate_limit("172.16.0.1") is True
    assert _is_exempt_from_api_rate_limit("192.168.1.1") is True
    assert _is_exempt_from_api_rate_limit("8.8.8.8") is False


def test_api_rate_limit_exempt_ips_explicit(monkeypatch):
    """Exempt explicit IPs/CIDRs."""
    from app.core import config
    from app.core.rate_limit import _is_exempt_from_api_rate_limit

    monkeypatch.setattr(config.settings, "api_rate_limit_exempt_ips", "127.0.0.1,10.0.0.0/8")
    assert _is_exempt_from_api_rate_limit("127.0.0.1") is True
    assert _is_exempt_from_api_rate_limit("10.5.5.5") is True
    assert _is_exempt_from_api_rate_limit("172.16.0.1") is False


@pytest.mark.asyncio
async def test_webhook_body_size_limit_413():
    """Webhook body over 1MB returns 413 (DoS mitigation)."""
    from app.api.v1.webhooks import WEBHOOK_MAX_BODY_BYTES

    oversized = b"x" * (WEBHOOK_MAX_BODY_BYTES + 1)
    async with AsyncClient(
        transport=ASGITransport(app=app),
        base_url="http://test",
    ) as client:
        r = await client.post(
            "/webhooks/payments/telegram_stars",
            content=oversized,
            headers={"Content-Type": "application/json"},
        )
    assert r.status_code == 413


# --- Agent API (token / mTLS boundary) ---

_AGENT_HEARTBEAT_PAYLOAD = {
    "server_id": "node-1",
    "container_name": "amnezia-awg",
    "ts_utc": "2026-02-19T12:00:00Z",
}


@pytest.mark.asyncio
async def test_agent_missing_token_401(monkeypatch):
    """Agent API: missing X-Agent-Token → 401."""
    from app.core import config

    monkeypatch.setattr(config.settings, "agent_shared_token", "valid-agent-token-32-chars-min")
    async with AsyncClient(
        transport=ASGITransport(app=app),
        base_url="http://test",
    ) as client:
        r = await client.post(
            "/api/v1/agent/heartbeat",
            json=_AGENT_HEARTBEAT_PAYLOAD,
        )
    assert r.status_code == 401
    data = r.json()
    assert data.get("error", {}).get("code") == "AGENT_UNAUTHORIZED"


@pytest.mark.asyncio
async def test_agent_invalid_token_401(monkeypatch):
    """Agent API: invalid X-Agent-Token → 401."""
    from app.core import config

    monkeypatch.setattr(config.settings, "agent_shared_token", "valid-agent-token-32-chars-min")
    async with AsyncClient(
        transport=ASGITransport(app=app),
        base_url="http://test",
    ) as client:
        r = await client.post(
            "/api/v1/agent/heartbeat",
            json=_AGENT_HEARTBEAT_PAYLOAD,
            headers={"X-Agent-Token": "wrong-token"},
        )
    assert r.status_code == 401
    data = r.json()
    assert data.get("error", {}).get("code") == "AGENT_UNAUTHORIZED"


@pytest.mark.asyncio
async def test_agent_disabled_503(monkeypatch):
    """Agent API: AGENT_SHARED_TOKEN not set → 503 (disabled)."""
    from app.core import config

    monkeypatch.setattr(config.settings, "agent_shared_token", "")
    async with AsyncClient(
        transport=ASGITransport(app=app),
        base_url="http://test",
    ) as client:
        r = await client.post(
            "/api/v1/agent/heartbeat",
            json=_AGENT_HEARTBEAT_PAYLOAD,
            headers={"X-Agent-Token": "any-token"},
        )
    assert r.status_code == 503
    data = r.json()
    assert data.get("error", {}).get("code") == "AGENT_API_DISABLED"
