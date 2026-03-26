from __future__ import annotations

import uuid
from datetime import datetime, timedelta, timezone
from decimal import Decimal

import pytest
from httpx import ASGITransport, AsyncClient
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.bot_auth import BotPrincipal
from app.core.database import get_db
from app.main import app
from app.models import Payment, Plan, Subscription, User


@pytest.mark.asyncio
async def test_bot_create_donation_invoice_and_confirm_does_not_extend_subscription(
    async_session: AsyncSession,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    tg_id = int(uuid.uuid4().int % 10_000_000_000)
    now = datetime.now(timezone.utc)

    user = User(tg_id=tg_id)
    async_session.add(user)
    await async_session.flush()

    plan = Plan(
        id=uuid.uuid4().hex[:32],
        name="Base",
        duration_days=30,
        device_limit=1,
        price_currency="XTR",
        price_amount=Decimal("10"),
    )
    async_session.add(plan)
    await async_session.flush()

    sub = Subscription(
        id=uuid.uuid4().hex[:32],
        user_id=user.id,
        plan_id=plan.id,
        valid_from=now - timedelta(days=1),
        valid_until=now + timedelta(days=5),
        device_limit=1,
        status="active",
        subscription_status="active",
        access_status="enabled",
        billing_status="paid",
        renewal_status="auto_renew_on",
    )
    async_session.add(sub)
    await async_session.commit()

    original_valid_until = sub.valid_until

    async def override_get_db():
        yield async_session

    app.dependency_overrides[get_db] = override_get_db

    # Force bot principal for this route without depending on API key parsing details.
    from app.core import bot_auth

    async def fake_get_admin_or_bot_only():  # noqa: ANN001
        return BotPrincipal()

    monkeypatch.setattr(bot_auth, "get_admin_or_bot_only", fake_get_admin_or_bot_only)

    try:
        async with AsyncClient(
            transport=ASGITransport(app=app),
            base_url="http://test",
            timeout=10.0,
        ) as client:
            r = await client.post(
                "/api/v1/bot/payments/telegram_stars/create-donation-invoice",
                json={"tg_id": tg_id, "star_count": 7},
                headers={"Idempotency-Key": "test"},
            )
            assert r.status_code == 200, r.text
            payload = r.json()
            payment_id = payload["payment_id"]

            r2 = await client.post(
                "/api/v1/bot/payments/telegram-stars-confirm",
                json={"tg_id": tg_id, "invoice_payload": payment_id, "telegram_payment_charge_id": "x"},
            )
            assert r2.status_code == 200, r2.text

        pay_row = await async_session.execute(select(Payment).where(Payment.id == payment_id))
        payment = pay_row.scalar_one()
        assert payment.status == "completed"
        assert (payment.webhook_payload or {}).get("kind") == "donation"

        sub_row = await async_session.execute(select(Subscription).where(Subscription.id == sub.id))
        sub_after = sub_row.scalar_one()
        assert sub_after.valid_until == original_valid_until
    finally:
        app.dependency_overrides.pop(get_db, None)

