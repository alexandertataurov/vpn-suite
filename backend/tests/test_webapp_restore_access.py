from __future__ import annotations

import uuid
from datetime import datetime, timedelta, timezone

import pytest
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import create_webapp_session_token
from app.main import app
from app.models import Plan, Subscription, User
from tests.utils_asserts import assert_error_response


@pytest.mark.asyncio
async def test_webapp_subscription_access_state_can_restore_for_grace(
    async_session: AsyncSession,
):
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
        price_amount=100,
    )
    async_session.add(plan)
    await async_session.flush()
    sub = Subscription(
        id=uuid.uuid4().hex[:32],
        user_id=user.id,
        plan_id=plan.id,
        status="expired",
        subscription_status="expired",
        access_status="grace",
        valid_from=now - timedelta(days=30),
        valid_until=now - timedelta(days=1),
        device_limit=1,
        grace_until=now + timedelta(days=1),
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
            r = await client.get(
                "/api/v1/webapp/subscription/access-state",
                headers={"Authorization": f"Bearer {token}"},
            )
        assert r.status_code == 200, r.text
        data = r.json()
        assert data["subscription_id"] == sub.id
        assert data["plan_id"] == plan.id
        assert data["access_status"] == "grace"
        assert data["can_restore"] is True
    finally:
        app.dependency_overrides.pop(get_db, None)


@pytest.mark.asyncio
async def test_webapp_subscription_access_state_no_subscription_returns_can_restore_false(
    async_session: AsyncSession,
):
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
            r = await client.get(
                "/api/v1/webapp/subscription/access-state",
                headers={"Authorization": f"Bearer {token}"},
            )
        assert r.status_code == 200, r.text
        data = r.json()
        assert data["subscription_id"] is None
        assert data["plan_id"] is None
        assert data["can_restore"] is False
    finally:
        app.dependency_overrides.pop(get_db, None)


@pytest.mark.asyncio
async def test_webapp_subscription_restore_success_for_restorable_subscription(
    async_session: AsyncSession,
):
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
        price_amount=100,
    )
    async_session.add(plan)
    await async_session.flush()
    sub = Subscription(
        id=uuid.uuid4().hex[:32],
        user_id=user.id,
        plan_id=plan.id,
        status="expired",
        subscription_status="expired",
        access_status="grace",
        valid_from=now - timedelta(days=30),
        valid_until=now - timedelta(days=1),
        device_limit=1,
        grace_until=now + timedelta(days=1),
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
            r = await client.post(
                "/api/v1/webapp/subscription/restore",
                headers={"Authorization": f"Bearer {token}"},
                json={"subscription_id": sub.id},
            )
        assert r.status_code == 200, r.text
        data = r.json()
        assert data["status"] == "ok"
        assert data["plan_id"] == plan.id
        assert data["redirect_to"] == f"/plan/checkout/{plan.id}"
    finally:
        app.dependency_overrides.pop(get_db, None)


@pytest.mark.asyncio
async def test_webapp_subscription_restore_not_restorable_returns_not_restorable(
    async_session: AsyncSession,
):
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
        price_amount=100,
    )
    async_session.add(plan)
    await async_session.flush()
    sub = Subscription(
        id=uuid.uuid4().hex[:32],
        user_id=user.id,
        plan_id=plan.id,
        status="active",
        subscription_status="active",
        access_status="enabled",
        valid_from=now - timedelta(days=1),
        valid_until=now + timedelta(days=29),
        device_limit=1,
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
            r = await client.post(
                "/api/v1/webapp/subscription/restore",
                headers={"Authorization": f"Bearer {token}"},
                json={"subscription_id": sub.id},
            )
        assert r.status_code == 400, r.text
        data = r.json()
        assert_error_response(data, "NOT_RESTORABLE")
    finally:
        app.dependency_overrides.pop(get_db, None)


@pytest.mark.asyncio
async def test_webapp_subscription_restore_no_subscription_returns_no_subscription(
    async_session: AsyncSession,
):
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
            r = await client.post(
                "/api/v1/webapp/subscription/restore",
                headers={"Authorization": f"Bearer {token}"},
                json={},
            )
        assert r.status_code == 400, r.text
        data = r.json()
        assert_error_response(data, "NO_SUBSCRIPTION")
    finally:
        app.dependency_overrides.pop(get_db, None)
