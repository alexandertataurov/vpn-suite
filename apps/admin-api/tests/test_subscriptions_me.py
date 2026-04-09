"""PATCH /api/v1/subscriptions/me: webapp Bearer auth, auto_renew update."""

from __future__ import annotations

import uuid
from datetime import datetime, timedelta, timezone
from decimal import Decimal

import pytest
from httpx import ASGITransport, AsyncClient
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import create_webapp_session_token
from app.main import app
from app.models import Plan, Subscription, User


async def _ensure_user(session: AsyncSession, tg_id: int) -> User:
    row = await session.execute(select(User).where(User.tg_id == tg_id))
    user = row.scalar_one_or_none()
    if user:
        return user
    user = User(tg_id=tg_id)
    session.add(user)
    await session.flush()
    return user


@pytest.mark.asyncio
async def test_subscriptions_me_patch_requires_auth_401():
    """PATCH /api/v1/subscriptions/me without Bearer returns 401."""
    async with AsyncClient(
        transport=ASGITransport(app=app),
        base_url="http://test",
        timeout=5.0,
    ) as client:
        r = await client.patch("/api/v1/subscriptions/me", json={"auto_renew": False})
    assert r.status_code == 401


@pytest.mark.asyncio
async def test_subscriptions_me_patch_with_webapp_token_updates_auto_renew(
    async_session: AsyncSession,
):
    """PATCH /api/v1/subscriptions/me with webapp Bearer updates subscription auto_renew and user meta."""
    now = datetime.now(timezone.utc)
    tg_id = 700000001
    user = await _ensure_user(async_session, tg_id)
    plan = Plan(
        id=uuid.uuid4().hex[:32],
        name="Pro",
        duration_days=365,
        price_currency="XTR",
        price_amount=Decimal("100"),
    )
    async_session.add(plan)
    await async_session.flush()
    sub = Subscription(
        user_id=user.id,
        plan_id=plan.id,
        valid_from=now,
        valid_until=now + timedelta(days=365),
        device_limit=1,
        status="active",
        auto_renew=True,
    )
    async_session.add(sub)
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
            r = await client.patch(
                "/api/v1/subscriptions/me",
                json={"auto_renew": False},
                headers={"Authorization": f"Bearer {token}"},
            )
        assert r.status_code == 200, r.text
        assert r.json() == {"auto_renew": False}

        await async_session.refresh(sub)
        await async_session.refresh(user)
        assert sub.auto_renew is False
        assert user.meta is not None
        assert user.meta.get("webapp_auto_renew_default") is False
    finally:
        app.dependency_overrides.pop(get_db, None)
