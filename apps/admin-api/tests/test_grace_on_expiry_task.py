from __future__ import annotations

import uuid
from datetime import datetime, timedelta, timezone
from decimal import Decimal
from unittest.mock import AsyncMock

import pytest
from sqlalchemy.ext.asyncio import AsyncSession

from app.core import config
from app.core.grace_on_expiry_task import run_grace_on_expiry_check
from app.models import Payment, Plan, Subscription, User


def _tg_id() -> int:
    return int(uuid.uuid4().int % 10_000_000_000)


async def _create_paid_plan(async_session: AsyncSession, *, price: Decimal | str = "100") -> Plan:
    plan = Plan(
        name=f"plan-{datetime.now(timezone.utc).timestamp()}",
        duration_days=30,
        device_limit=1,
        price_currency="XTR",
        price_amount=Decimal(str(price)),
    )
    async_session.add(plan)
    await async_session.flush()
    return plan


async def _create_completed_payment(
    async_session: AsyncSession,
    *,
    user_id: int,
    subscription_id: str,
    amount: Decimal | str = "100",
) -> Payment:
    payment = Payment(
        user_id=user_id,
        subscription_id=subscription_id,
        provider="test",
        status="completed",
        amount=Decimal(str(amount)),
        currency="XTR",
        external_id=f"test-grace-{subscription_id}",
    )
    async_session.add(payment)
    await async_session.flush()
    return payment


@pytest.mark.asyncio
async def test_grace_on_expiry_applies_grace_for_recently_expired_subscription(
    async_session: AsyncSession,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    """Active subscription just past valid_until should enter grace and emit event."""
    now = datetime.now(timezone.utc)

    user = User(tg_id=_tg_id())
    async_session.add(user)
    await async_session.flush()
    plan = await _create_paid_plan(async_session)

    sub = Subscription(
        user_id=user.id,
        plan_id=plan.id,
        valid_from=now - timedelta(days=30),
        valid_until=now - timedelta(minutes=5),
        device_limit=1,
        status="active",
        subscription_status="active",
        access_status="enabled",
        billing_status="paid",
        renewal_status="auto_renew_on",
    )
    async_session.add(sub)
    await async_session.flush()
    await _create_completed_payment(
        async_session,
        user_id=user.id,
        subscription_id=sub.id,
    )

    monkeypatch.setattr(config.settings, "grace_window_hours", 24)
    emit_grace_started = AsyncMock()
    emit_access_blocked = AsyncMock()
    monkeypatch.setattr(
        "app.core.grace_on_expiry_task.emit_grace_started",
        emit_grace_started,
    )
    monkeypatch.setattr(
        "app.core.grace_on_expiry_task.emit_access_blocked",
        emit_access_blocked,
    )

    grace_applied, blocked = await run_grace_on_expiry_check(async_session)

    assert grace_applied == 1
    assert blocked == 0

    await async_session.refresh(sub)
    assert sub.status == "expired"
    assert sub.subscription_status == "expired"
    assert sub.access_status == "grace"
    assert sub.grace_until is not None
    # Grace window should extend into the future.
    assert sub.grace_until > now

    emit_grace_started.assert_awaited_once()
    args, kwargs = emit_grace_started.call_args
    assert kwargs["subscription_id"] == sub.id
    assert kwargs["user_id"] == user.id


@pytest.mark.asyncio
async def test_grace_on_expiry_blocks_after_grace_window_elapsed(
    async_session: AsyncSession,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    """Subscriptions already in grace and past grace_until should be blocked and emit event."""
    now = datetime.now(timezone.utc)

    user = User(tg_id=_tg_id())
    async_session.add(user)
    await async_session.flush()
    plan = await _create_paid_plan(async_session)

    sub = Subscription(
        user_id=user.id,
        plan_id=plan.id,
        valid_from=now - timedelta(days=40),
        valid_until=now - timedelta(days=10),
        device_limit=1,
        status="expired",
        subscription_status="expired",
        access_status="grace",
        billing_status="unpaid",
        renewal_status="auto_renew_off",
        grace_until=now - timedelta(hours=1),
        grace_reason="period_end",
    )
    async_session.add(sub)
    await async_session.flush()
    await _create_completed_payment(
        async_session,
        user_id=user.id,
        subscription_id=sub.id,
    )

    # grace_window_hours does not affect already-in-grace blocking behaviour.
    monkeypatch.setattr(config.settings, "grace_window_hours", 24)
    emit_grace_started = AsyncMock()
    emit_access_blocked = AsyncMock()
    monkeypatch.setattr(
        "app.core.grace_on_expiry_task.emit_grace_started",
        emit_grace_started,
    )
    monkeypatch.setattr(
        "app.core.grace_on_expiry_task.emit_access_blocked",
        emit_access_blocked,
    )

    grace_applied, blocked = await run_grace_on_expiry_check(async_session)

    assert grace_applied == 0
    assert blocked == 1

    await async_session.refresh(sub)
    assert sub.access_status == "blocked"
    assert sub.grace_until is None
    assert sub.grace_reason is None

    emit_grace_started.assert_not_awaited()
    emit_access_blocked.assert_awaited_once()
    args, kwargs = emit_access_blocked.call_args
    assert kwargs["subscription_id"] == sub.id
    assert kwargs["user_id"] == user.id
    assert kwargs["reason"] == "grace_elapsed"


@pytest.mark.asyncio
async def test_grace_on_expiry_blocks_immediately_when_window_zero(
    async_session: AsyncSession,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    """When grace_window_hours is 0, expired paid subscriptions are blocked immediately."""
    now = datetime.now(timezone.utc)

    user = User(tg_id=_tg_id())
    async_session.add(user)
    await async_session.flush()
    plan = await _create_paid_plan(async_session)

    sub = Subscription(
        user_id=user.id,
        plan_id=plan.id,
        valid_from=now - timedelta(days=30),
        valid_until=now - timedelta(minutes=5),
        device_limit=1,
        status="active",
        subscription_status="active",
        access_status="enabled",
        billing_status="paid",
        renewal_status="auto_renew_on",
    )
    async_session.add(sub)
    await async_session.flush()
    await _create_completed_payment(
        async_session,
        user_id=user.id,
        subscription_id=sub.id,
    )

    monkeypatch.setattr(config.settings, "grace_window_hours", 0)
    emit_grace_started = AsyncMock()
    emit_access_blocked = AsyncMock()
    monkeypatch.setattr(
        "app.core.grace_on_expiry_task.emit_grace_started",
        emit_grace_started,
    )
    monkeypatch.setattr(
        "app.core.grace_on_expiry_task.emit_access_blocked",
        emit_access_blocked,
    )

    grace_applied, blocked = await run_grace_on_expiry_check(async_session)

    assert grace_applied == 0
    assert blocked == 1

    await async_session.refresh(sub)
    assert sub.status == "expired"
    assert sub.subscription_status == "expired"
    assert sub.access_status == "blocked"
    assert sub.grace_until is None

    emit_grace_started.assert_not_awaited()
    emit_access_blocked.assert_awaited_once()
    args, kwargs = emit_access_blocked.call_args
    assert kwargs["subscription_id"] == sub.id
    assert kwargs["user_id"] == user.id
    assert kwargs["reason"] == "period_end_no_grace"


@pytest.mark.asyncio
async def test_grace_on_expiry_blocks_unpaid_active_subscription_without_grace(
    async_session: AsyncSession,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    """Active rows without a completed positive payment are not eligible for grace."""
    now = datetime.now(timezone.utc)

    user = User(tg_id=_tg_id())
    async_session.add(user)
    await async_session.flush()
    plan = await _create_paid_plan(async_session)

    sub = Subscription(
        user_id=user.id,
        plan_id=plan.id,
        valid_from=now - timedelta(days=30),
        valid_until=now - timedelta(minutes=5),
        device_limit=1,
        status="active",
        subscription_status="active",
        access_status="enabled",
        billing_status="paid",
        renewal_status="auto_renew_on",
    )
    async_session.add(sub)
    await async_session.flush()

    monkeypatch.setattr(config.settings, "grace_window_hours", 24)
    emit_grace_started = AsyncMock()
    emit_access_blocked = AsyncMock()
    monkeypatch.setattr(
        "app.core.grace_on_expiry_task.emit_grace_started",
        emit_grace_started,
    )
    monkeypatch.setattr(
        "app.core.grace_on_expiry_task.emit_access_blocked",
        emit_access_blocked,
    )

    grace_applied, blocked = await run_grace_on_expiry_check(async_session)

    assert grace_applied == 0
    assert blocked == 1

    await async_session.refresh(sub)
    assert sub.status == "expired"
    assert sub.subscription_status == "expired"
    assert sub.access_status == "blocked"
    assert sub.grace_until is None

    emit_grace_started.assert_not_awaited()
    emit_access_blocked.assert_awaited_once()
    args, kwargs = emit_access_blocked.call_args
    assert kwargs["subscription_id"] == sub.id
    assert kwargs["user_id"] == user.id
    assert kwargs["reason"] == "period_end_unpaid_no_grace"


@pytest.mark.asyncio
async def test_grace_on_expiry_blocks_trial_subscription_without_grace(
    async_session: AsyncSession,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    """Trials and free activations do not receive grace without a completed paid payment."""
    now = datetime.now(timezone.utc)

    user = User(tg_id=_tg_id())
    async_session.add(user)
    await async_session.flush()
    plan = await _create_paid_plan(async_session, price="0")

    sub = Subscription(
        user_id=user.id,
        plan_id=plan.id,
        valid_from=now - timedelta(days=3),
        valid_until=now - timedelta(minutes=5),
        device_limit=1,
        status="active",
        subscription_status="active",
        access_status="enabled",
        billing_status="paid",
        renewal_status="auto_renew_off",
        is_trial=True,
        trial_ends_at=now - timedelta(minutes=5),
    )
    async_session.add(sub)
    await async_session.flush()

    monkeypatch.setattr(config.settings, "grace_window_hours", 24)
    emit_grace_started = AsyncMock()
    emit_access_blocked = AsyncMock()
    monkeypatch.setattr(
        "app.core.grace_on_expiry_task.emit_grace_started",
        emit_grace_started,
    )
    monkeypatch.setattr(
        "app.core.grace_on_expiry_task.emit_access_blocked",
        emit_access_blocked,
    )

    grace_applied, blocked = await run_grace_on_expiry_check(async_session)

    assert grace_applied == 0
    assert blocked == 1

    await async_session.refresh(sub)
    assert sub.status == "expired"
    assert sub.subscription_status == "expired"
    assert sub.access_status == "blocked"
    assert sub.grace_until is None

    emit_grace_started.assert_not_awaited()
    emit_access_blocked.assert_awaited_once()
    args, kwargs = emit_access_blocked.call_args
    assert kwargs["subscription_id"] == sub.id
    assert kwargs["user_id"] == user.id
    assert kwargs["reason"] == "period_end_unpaid_no_grace"


@pytest.mark.asyncio
async def test_grace_on_expiry_ignores_pending_unpaid_subscription(
    async_session: AsyncSession,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    """Pending unpaid checkout rows should not be converted to grace or expired."""
    now = datetime.now(timezone.utc)

    user = User(tg_id=_tg_id())
    async_session.add(user)
    await async_session.flush()
    plan = await _create_paid_plan(async_session)

    sub = Subscription(
        user_id=user.id,
        plan_id=plan.id,
        valid_from=now - timedelta(hours=1),
        valid_until=now - timedelta(minutes=5),
        device_limit=1,
        status="pending",
        subscription_status="pending",
        access_status="blocked",
        billing_status="unpaid",
        renewal_status="auto_renew_on",
    )
    async_session.add(sub)
    await async_session.flush()

    monkeypatch.setattr(config.settings, "grace_window_hours", 24)
    emit_grace_started = AsyncMock()
    emit_access_blocked = AsyncMock()
    monkeypatch.setattr(
        "app.core.grace_on_expiry_task.emit_grace_started",
        emit_grace_started,
    )
    monkeypatch.setattr(
        "app.core.grace_on_expiry_task.emit_access_blocked",
        emit_access_blocked,
    )

    grace_applied, blocked = await run_grace_on_expiry_check(async_session)

    assert grace_applied == 0
    assert blocked == 0

    await async_session.refresh(sub)
    assert sub.status == "pending"
    assert sub.subscription_status == "pending"
    assert sub.access_status == "blocked"
    assert sub.grace_until is None

    emit_grace_started.assert_not_awaited()
    emit_access_blocked.assert_not_awaited()
