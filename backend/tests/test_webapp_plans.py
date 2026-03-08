from __future__ import annotations

import uuid
from decimal import Decimal

import pytest
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import create_webapp_session_token
from app.main import app
from app.models import Plan, User


@pytest.mark.asyncio
async def test_webapp_plans_returns_device_limit(async_session: AsyncSession):
    tg_id = int(uuid.uuid4().int % 10_000_000_000)
    user = User(tg_id=tg_id)
    plan = Plan(
        id=uuid.uuid4().hex[:32],
        name="[popular] Pro",
        duration_days=30,
        device_limit=5,
        price_currency="XTR",
        price_amount=Decimal("250"),
        upsell_methods=["device_limit"],
    )
    async_session.add_all([user, plan])
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
                "/api/v1/webapp/plans",
                headers={"Authorization": f"Bearer {token}"},
            )
        assert response.status_code == 200, response.text
        payload = response.json()
        assert payload["items"][0]["device_limit"] == 5
        assert payload["items"][0]["upsell_methods"] == ["device_limit"]
    finally:
        app.dependency_overrides.pop(get_db, None)
