from __future__ import annotations

import pytest
from httpx import ASGITransport, AsyncClient

from app.main import app


@pytest.mark.asyncio
async def test_webapp_support_endpoint_absent() -> None:
    """There is currently no dedicated /webapp/support API; ensure contract remains 404 (documented absence)."""
    async with AsyncClient(
        transport=ASGITransport(app=app),
        base_url="http://test",
        timeout=5.0,
    ) as client:
        response = await client.post("/api/v1/webapp/support", json={"message": "help"})
    assert response.status_code == 404

