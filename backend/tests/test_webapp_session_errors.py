from __future__ import annotations

import pytest
from httpx import ASGITransport, AsyncClient

from app.main import app
from tests.utils_asserts import assert_error_response


@pytest.mark.asyncio
async def test_webapp_me_invalid_bearer_returns_401_unified_error() -> None:
    """Invalid Bearer token on /webapp/me should yield structured UNAUTHORIZED error."""
    async with AsyncClient(
        transport=ASGITransport(app=app),
        base_url="http://test",
        timeout=5.0,
    ) as client:
        response = await client.get(
            "/api/v1/webapp/me",
            headers={"Authorization": "Bearer not-a-valid-token"},
        )
    assert response.status_code == 401
    body = response.json()
    assert_error_response(body, code="UNAUTHORIZED", message_substring="Invalid session")


@pytest.mark.asyncio
async def test_webapp_payments_history_invalid_bearer_returns_401_unified_error() -> None:
    """Invalid Bearer token on /webapp/payments/history should also use unified UNAUTHORIZED error shape."""
    async with AsyncClient(
        transport=ASGITransport(app=app),
        base_url="http://test",
        timeout=5.0,
    ) as client:
        response = await client.get(
            "/api/v1/webapp/payments/history",
            headers={"Authorization": "Bearer invalid-session"},
        )
    assert response.status_code == 401
    body = response.json()
    assert_error_response(body, code="UNAUTHORIZED", message_substring="Invalid session")


@pytest.mark.asyncio
async def test_webapp_logout_invalid_bearer_returns_401_unified_error() -> None:
    async with AsyncClient(
        transport=ASGITransport(app=app),
        base_url="http://test",
        timeout=5.0,
    ) as client:
        response = await client.post(
            "/api/v1/webapp/logout",
            headers={"Authorization": "Bearer invalid-session"},
        )
    assert response.status_code == 401
    body = response.json()
    assert_error_response(body, code="UNAUTHORIZED", message_substring="Invalid session")
