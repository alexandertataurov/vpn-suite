from __future__ import annotations

from datetime import datetime, timezone
from decimal import Decimal
from types import SimpleNamespace

import pytest
from httpx import ASGITransport, AsyncClient
from sqlalchemy import select

from app.api.v1.auth import get_current_admin
from app.core.constants import PERM_CLUSTER_WRITE, PERM_PRICING_WRITE, PERM_SUBSCRIPTIONS_WRITE
from app.core.database import get_db
from app.main import app
from app.models import EntitlementEvent, Plan, Role, Subscription, User


@pytest.fixture
def client():
    return AsyncClient(transport=ASGITransport(app=app), base_url="http://test", timeout=5.0)


async def _install_admin(async_session, permissions: list[str]) -> str:
    role_id = f"role-news-{datetime.now(timezone.utc).timestamp()}".replace(".", "")
    role = Role(id=role_id, name=role_id, permissions=permissions)
    async_session.add(role)
    await async_session.commit()
    app.dependency_overrides[get_current_admin] = lambda: SimpleNamespace(id="admin-test", role_id=role_id)

    async def override_get_db():
        yield async_session

    app.dependency_overrides[get_db] = override_get_db
    return role_id


@pytest.mark.asyncio
async def test_news_broadcast_remains_backward_compatible(client, async_session, monkeypatch):
    await _install_admin(async_session, [PERM_CLUSTER_WRITE])
    captured = {}

    async def fake_enqueue(**kwargs):
        captured.update(kwargs)
        return "broadcast-test"

    monkeypatch.setattr("app.api.v1.admin_news.enqueue_news_broadcast", fake_enqueue)
    try:
        response = await client.post(
            "/api/v1/admin/news/broadcast",
            json={"text": "<b>Hello</b>", "parse_mode": "HTML", "include_banned": False},
        )
    finally:
        app.dependency_overrides.clear()

    assert response.status_code == 200, response.text
    assert response.json() == {"broadcast_id": "broadcast-test", "status": "queued"}
    assert captured["target"] is None
    assert captured["include_banned"] is False


@pytest.mark.asyncio
async def test_trial_grant_creates_subscription_and_entitlement_event(client, async_session):
    await _install_admin(async_session, [PERM_SUBSCRIPTIONS_WRITE, PERM_PRICING_WRITE])
    user = User(tg_id=880011, email="grant@example.com")
    plan = Plan(
        id="grant-trial-plan",
        name="Trial",
        duration_days=3,
        device_limit=1,
        price_amount=Decimal("0"),
        price_currency="XTR",
    )
    async_session.add_all([user, plan])
    await async_session.commit()

    try:
        response = await client.post(
            "/api/v1/admin/grants/trial",
            json={
                "user_id": user.id,
                "plan_id": plan.id,
                "duration_hours": 72,
                "device_limit": 1,
                "notify_user": False,
            },
        )
    finally:
        app.dependency_overrides.clear()

    assert response.status_code == 200, response.text
    payload = response.json()
    assert payload["status"] == "granted"

    sub = (
        await async_session.execute(
            select(Subscription).where(Subscription.user_id == user.id, Subscription.is_trial.is_(True))
        )
    ).scalar_one_or_none()
    assert sub is not None
    assert sub.plan_id == plan.id

    event = (
        await async_session.execute(
            select(EntitlementEvent).where(
                EntitlementEvent.user_id == user.id,
                EntitlementEvent.event_type == "trial_grant_created",
            )
        )
    ).scalar_one_or_none()
    assert event is not None
    assert event.payload["duration_hours"] == 72
