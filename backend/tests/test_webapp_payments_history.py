from __future__ import annotations

from datetime import datetime, timedelta, timezone
from decimal import Decimal
import uuid

import pytest
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.v1 import webapp as webapp_module
from app.core.database import get_db
from app.main import app
from app.models import Payment, PaymentEvent, Plan, Subscription, User


@pytest.mark.asyncio
async def test_webapp_payments_history_requires_auth_401():
    async with AsyncClient(
        transport=ASGITransport(app=app),
        base_url="http://test",
        timeout=5.0,
    ) as client:
        response = await client.get("/api/v1/webapp/payments/history")
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_webapp_payments_history_returns_user_rows_sorted_and_status_mapped(
    async_session: AsyncSession, monkeypatch: pytest.MonkeyPatch
):
    now = datetime.now(timezone.utc)
    tg_id = int(uuid.uuid4().int % 10_000_000_000)
    other_tg_id = int(uuid.uuid4().int % 10_000_000_000)

    user = User(tg_id=tg_id)
    other_user = User(tg_id=other_tg_id)
    async_session.add_all([user, other_user])
    await async_session.flush()

    plan = Plan(
        id=uuid.uuid4().hex[:32],
        name="[popular] Pro",
        duration_days=365,
        price_currency="USD",
        price_amount=Decimal("59.88"),
    )
    async_session.add(plan)
    await async_session.flush()

    subscription = Subscription(
        id=uuid.uuid4().hex[:32],
        user_id=user.id,
        plan_id=plan.id,
        valid_from=now - timedelta(days=30),
        valid_until=now + timedelta(days=335),
        device_limit=3,
        status="active",
    )
    other_subscription = Subscription(
        id=uuid.uuid4().hex[:32],
        user_id=other_user.id,
        plan_id=plan.id,
        valid_from=now - timedelta(days=5),
        valid_until=now + timedelta(days=360),
        device_limit=1,
        status="active",
    )
    async_session.add_all([subscription, other_subscription])
    await async_session.flush()

    pending_payment = Payment(
        user_id=user.id,
        subscription_id=subscription.id,
        provider="telegram_stars",
        status="pending",
        amount=Decimal("5.99"),
        currency="USD",
        external_id=f"inv-{uuid.uuid4().hex[:12]}",
        created_at=now - timedelta(days=3),
    )
    failed_payment = Payment(
        user_id=user.id,
        subscription_id=subscription.id,
        provider="telegram_stars",
        status="failed",
        amount=Decimal("5.99"),
        currency="USD",
        external_id=f"inv-{uuid.uuid4().hex[:12]}",
        created_at=now - timedelta(days=2),
    )
    refunded_payment = Payment(
        user_id=user.id,
        subscription_id=subscription.id,
        provider="telegram_stars",
        status="completed",
        amount=Decimal("5.99"),
        currency="USD",
        external_id=f"inv-{uuid.uuid4().hex[:12]}",
        created_at=now - timedelta(days=1),
    )
    paid_payment = Payment(
        user_id=user.id,
        subscription_id=subscription.id,
        provider="telegram_stars",
        status="completed",
        amount=Decimal("5.99"),
        currency="USD",
        external_id=f"inv-{uuid.uuid4().hex[:12]}",
        created_at=now,
    )
    other_user_payment = Payment(
        user_id=other_user.id,
        subscription_id=other_subscription.id,
        provider="telegram_stars",
        status="completed",
        amount=Decimal("9.99"),
        currency="USD",
        external_id=f"inv-{uuid.uuid4().hex[:12]}",
        created_at=now + timedelta(minutes=1),
    )
    async_session.add_all(
        [pending_payment, failed_payment, refunded_payment, paid_payment, other_user_payment]
    )
    await async_session.flush()

    async_session.add(
        PaymentEvent(
            payment_id=refunded_payment.id,
            event_type="refund_completed",
            payload={"source": "test"},
        )
    )
    await async_session.commit()

    async def override_get_db():
        yield async_session

    app.dependency_overrides[get_db] = override_get_db
    monkeypatch.setattr(webapp_module, "_get_tg_id_from_bearer", lambda request: tg_id)

    try:
        async with AsyncClient(
            transport=ASGITransport(app=app),
            base_url="http://test",
            timeout=5.0,
        ) as client:
            response = await client.get("/api/v1/webapp/payments/history?limit=10&offset=0")
            assert response.status_code == 200, response.text
            payload = response.json()

            assert payload["total"] == 4
            assert len(payload["items"]) == 4

            ordered_ids = [item["payment_id"] for item in payload["items"]]
            assert ordered_ids == [
                paid_payment.id,
                refunded_payment.id,
                failed_payment.id,
                pending_payment.id,
            ]

            statuses_by_id = {item["payment_id"]: item["status"] for item in payload["items"]}
            assert statuses_by_id[paid_payment.id] == "paid"
            assert statuses_by_id[refunded_payment.id] == "refunded"
            assert statuses_by_id[failed_payment.id] == "failed"
            assert statuses_by_id[pending_payment.id] == "pending"

            # plan_name should be cleaned from style prefix.
            assert all(item["plan_name"] == "Pro" for item in payload["items"])
            assert all(item["payment_id"] != other_user_payment.id for item in payload["items"])

            paged = await client.get("/api/v1/webapp/payments/history?limit=2&offset=1")
            assert paged.status_code == 200, paged.text
            paged_payload = paged.json()
            assert paged_payload["total"] == 4
            assert [item["payment_id"] for item in paged_payload["items"]] == [
                refunded_payment.id,
                failed_payment.id,
            ]
    finally:
        app.dependency_overrides.clear()
