from __future__ import annotations

from datetime import datetime, timedelta, timezone
from unittest.mock import AsyncMock

import pytest
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core import config
from app.core.subscription_expiry_reminder_task import (
    _send_telegram_message,
    run_subscription_reminder_check,
)
from app.models import Plan, Subscription, User


@pytest.mark.asyncio
async def test_subscription_reminder_sends_3d_and_1d_once(
    async_session: AsyncSession,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    """Entitled active subscriptions in 3d/1d windows get exactly one reminder each."""
    now = datetime.now(timezone.utc)

    user = User(tg_id=123456789)
    async_session.add(user)
    await async_session.flush()

    plan = Plan(
        id="plan-reminders",
        name="Pro",
        duration_days=30,
        price_currency="XTR",
        price_amount=100,
    )
    async_session.add(plan)
    await async_session.flush()

    sub_3d = Subscription(
        user_id=user.id,
        plan_id=plan.id,
        valid_from=now - timedelta(days=27),
        valid_until=now + timedelta(hours=72),
        device_limit=1,
        status="active",
        subscription_status="active",
        access_status="enabled",
        billing_status="paid",
        renewal_status="auto_renew_on",
    )
    sub_1d = Subscription(
        user_id=user.id,
        plan_id=plan.id,
        valid_from=now - timedelta(days=29),
        valid_until=now + timedelta(hours=24),
        device_limit=1,
        status="active",
        subscription_status="active",
        access_status="enabled",
        billing_status="paid",
        renewal_status="auto_renew_on",
    )
    async_session.add_all([sub_3d, sub_1d])
    await async_session.flush()

    send_mock = AsyncMock(return_value=True)
    monkeypatch.setattr(
        "app.core.subscription_expiry_reminder_task._send_telegram_message",
        send_mock,
    )

    n_3d, n_1d = await run_subscription_reminder_check(async_session)

    assert n_3d == 1
    assert n_1d == 1

    result = await async_session.execute(
        select(Subscription).where(Subscription.id.in_([sub_3d.id, sub_1d.id]))
    )
    rows = {row.id: row for row in result.scalars().all()}
    updated_3d = rows[sub_3d.id]
    updated_1d = rows[sub_1d.id]

    assert updated_3d.reminder_3d_sent_at is not None
    assert updated_1d.reminder_1d_sent_at is not None

    # Two sends: one for each subscription.
    assert send_mock.await_count == 2


@pytest.mark.asyncio
async def test_subscription_reminder_does_not_mark_when_send_fails(
    async_session: AsyncSession,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    """If sending fails, reminder_*_sent_at stays None and counters are zero."""
    now = datetime.now(timezone.utc)

    user = User(tg_id=987654321)
    async_session.add(user)
    await async_session.flush()

    plan = Plan(
        id="plan-reminders-fail",
        name="Basic",
        duration_days=30,
        price_currency="XTR",
        price_amount=50,
    )
    async_session.add(plan)
    await async_session.flush()

    sub = Subscription(
        user_id=user.id,
        plan_id=plan.id,
        valid_from=now - timedelta(days=27),
        valid_until=now + timedelta(hours=72),
        device_limit=1,
        status="active",
        subscription_status="active",
        access_status="enabled",
        billing_status="paid",
        renewal_status="auto_renew_on",
    )
    async_session.add(sub)
    await async_session.flush()

    send_mock = AsyncMock(return_value=False)
    monkeypatch.setattr(
        "app.core.subscription_expiry_reminder_task._send_telegram_message",
        send_mock,
    )

    n_3d, n_1d = await run_subscription_reminder_check(async_session)

    assert n_3d == 0
    assert n_1d == 0

    await async_session.refresh(sub)
    assert sub.reminder_3d_sent_at is None
    assert sub.reminder_1d_sent_at is None


@pytest.mark.asyncio
async def test_send_telegram_message_short_circuits_when_token_missing(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    """_send_telegram_message returns False immediately when TELEGRAM_BOT_TOKEN is empty."""
    monkeypatch.setattr(config.settings, "telegram_bot_token", "")
    ok = await _send_telegram_message(tg_id=1, text="test")
    assert ok is False

