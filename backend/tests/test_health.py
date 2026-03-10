"""Health endpoints integration tests."""

import pytest
from httpx import ASGITransport, AsyncClient

from app.main import app


@pytest.fixture
def anyio_backend():
    return "asyncio"


@pytest.mark.asyncio
async def test_health_returns_200():
    async with AsyncClient(
        transport=ASGITransport(app=app),
        base_url="http://test",
    ) as client:
        r = await client.get("/health")
    assert r.status_code == 200
    data = r.json()
    assert data["status"] == "ok"
    assert data.get("referral_configured") is False
    assert "node_mode" in data


@pytest.mark.asyncio
async def test_health_ready_returns_200_or_503():
    """Readiness: 200 when DB+Redis up, 503 when down. Body must be stable (no stacktrace)."""
    async with AsyncClient(
        transport=ASGITransport(app=app),
        base_url="http://test",
    ) as client:
        r = await client.get("/health/ready")
    assert r.status_code in (200, 503)
    data = r.json()
    assert "status" in data
    assert "database" in data
    assert "redis" in data
    # Regression: 503 must not leak stacktrace or internal errors
    assert data["status"] in ("ok", "degraded")
    assert data["database"] in ("ok", "error")
    assert data["redis"] in ("ok", "error")
    if r.status_code == 503:
        assert data["status"] == "degraded"
