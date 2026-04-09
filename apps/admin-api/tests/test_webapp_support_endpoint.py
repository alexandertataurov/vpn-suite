from __future__ import annotations

import uuid

import pytest
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import create_webapp_session_token
from app.main import app
from app.models import User


@pytest.mark.asyncio
async def test_webapp_support_post_remains_unmapped() -> None:
    """POST /webapp/support is not implemented."""
    async with AsyncClient(
        transport=ASGITransport(app=app),
        base_url="http://test",
        timeout=5.0,
    ) as client:
        response = await client.post("/api/v1/webapp/support", json={"message": "help"})
    assert response.status_code == 404


@pytest.mark.asyncio
async def test_webapp_support_faq_requires_auth() -> None:
    async with AsyncClient(
        transport=ASGITransport(app=app),
        base_url="http://test",
        timeout=5.0,
    ) as client:
        response = await client.get("/api/v1/webapp/support/faq")
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_webapp_support_faq_returns_ordered_keys(async_session: AsyncSession) -> None:
    tg_id = int(uuid.uuid4().int % 10_000_000_000)
    async_session.add(User(tg_id=tg_id))
    await async_session.commit()
    token = create_webapp_session_token(tg_id)

    async def override_get_db():
        yield async_session

    app.dependency_overrides[get_db] = override_get_db
    try:
        async with AsyncClient(
            transport=ASGITransport(app=app),
            base_url="http://test",
            timeout=5.0,
        ) as client:
            response = await client.get(
                "/api/v1/webapp/support/faq",
                headers={"Authorization": f"Bearer {token}"},
            )
        assert response.status_code == 200, response.text
        payload = response.json()
        assert "items" in payload
        assert len(payload["items"]) >= 1
        first = payload["items"][0]
        assert "title_key" in first and "body_key" in first
    finally:
        app.dependency_overrides.pop(get_db, None)

