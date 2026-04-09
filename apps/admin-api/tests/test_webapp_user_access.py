"""GET /api/v1/webapp/user/access — flat access state for state-driven Home UI."""

from __future__ import annotations

import uuid
from datetime import datetime, timedelta, timezone
from decimal import Decimal

import pytest
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import create_webapp_session_token
from app.main import app
from app.models import Plan, Subscription, User


@pytest.mark.asyncio
async def test_webapp_user_access_no_subscription_returns_no_plan(
    async_session: AsyncSession,
) -> None:
    """User with no subscriptions gets status=no_plan."""
    tg_id = int(uuid.uuid4().int % 10_000_000_000)
    user = User(tg_id=tg_id)
    async_session.add(user)
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
                "/api/v1/webapp/user/access",
                headers={"Authorization": f"Bearer {token}"},
            )
        assert response.status_code == 200, response.text
        payload = response.json()
        assert payload["status"] == "no_plan"
        assert payload["has_plan"] is False
        assert payload["plan_id"] is None
        assert payload["plan_name"] is None
        assert payload["plan_duration_days"] is None
        assert payload["devices_used"] == 0
        assert payload["device_limit"] is None
        assert payload["traffic_used_bytes"] == 0
        assert payload["config_ready"] is False
        assert payload["config_id"] is None
        assert payload["expires_at"] is None
    finally:
        app.dependency_overrides.pop(get_db, None)


@pytest.mark.asyncio
async def test_webapp_user_access_active_sub_no_devices_returns_needs_device(
    async_session: AsyncSession,
) -> None:
    """Active subscription with no devices returns status=needs_device."""
    now = datetime.now(timezone.utc)
    tg_id = int(uuid.uuid4().int % 10_000_000_000)
    user = User(tg_id=tg_id)
    async_session.add(user)
    await async_session.flush()

    plan = Plan(
        id=uuid.uuid4().hex[:32],
        name="Pro",
        duration_days=30,
        price_currency="XTR",
        price_amount=Decimal("100"),
    )
    async_session.add(plan)
    await async_session.flush()

    sub = Subscription(
        id=uuid.uuid4().hex[:32],
        user_id=user.id,
        plan_id=plan.id,
        valid_from=now,
        valid_until=now + timedelta(days=30),
        device_limit=5,
        status="active",
        subscription_status="active",
        access_status="enabled",
        billing_status="paid",
        renewal_status="auto_renew_on",
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
            response = await client.get(
                "/api/v1/webapp/user/access",
                headers={"Authorization": f"Bearer {token}"},
            )
        assert response.status_code == 200, response.text
        payload = response.json()
        assert payload["status"] == "needs_device"
        assert payload["has_plan"] is True
        assert payload["plan_id"] == plan.id
        assert payload["plan_name"] == "Pro"
        assert payload["plan_duration_days"] == 30
        assert payload["devices_used"] == 0
        assert payload["device_limit"] == 5
        assert payload["traffic_used_bytes"] == 0
        assert payload["config_ready"] is False
        assert payload["config_id"] is None
        assert payload["expires_at"] is None
    finally:
        app.dependency_overrides.pop(get_db, None)


@pytest.mark.asyncio
async def test_webapp_user_access_expired_returns_expired(
    async_session: AsyncSession,
) -> None:
    """Expired subscription returns status=expired."""
    now = datetime.now(timezone.utc)
    tg_id = int(uuid.uuid4().int % 10_000_000_000)
    user = User(tg_id=tg_id)
    async_session.add(user)
    await async_session.flush()

    plan = Plan(
        id=uuid.uuid4().hex[:32],
        name="Pro",
        duration_days=30,
        price_currency="XTR",
        price_amount=Decimal("100"),
    )
    async_session.add(plan)
    await async_session.flush()

    sub = Subscription(
        id=uuid.uuid4().hex[:32],
        user_id=user.id,
        plan_id=plan.id,
        valid_from=now - timedelta(days=60),
        valid_until=now - timedelta(days=1),
        device_limit=5,
        status="expired",
        subscription_status="expired",
        access_status="blocked",
        billing_status="paid",
        renewal_status="auto_renew_off",
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
            response = await client.get(
                "/api/v1/webapp/user/access",
                headers={"Authorization": f"Bearer {token}"},
            )
        assert response.status_code == 200, response.text
        payload = response.json()
        assert payload["status"] == "expired"
        assert payload["has_plan"] is True
        assert payload["plan_id"] == plan.id
        assert payload["plan_name"] == "Pro"
        assert payload["plan_duration_days"] == 30
        assert payload["traffic_used_bytes"] == 0
        assert payload["expires_at"] is not None
    finally:
        app.dependency_overrides.pop(get_db, None)
