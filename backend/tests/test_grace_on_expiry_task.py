from __future__ import annotations

from datetime import datetime, timedelta, timezone
from unittest.mock import AsyncMock

import pytest
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core import config
from app.core.grace_on_expiry_task import run_grace_on_expiry_check
from app.models import Subscription, User


@pytest.mark.asyncio
async def test_grace_on_expiry_applies_grace_for_recently_expired_subscription(
    async_session: AsyncSession,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    """Active subscription just past valid_until should enter grace and emit event."""
    now = datetime.now(timezone.utc)

    user = User(tg_id=int(now.timestamp()) % 10_000_000_000)
    async_session.add(user)
    await async_session.flush()

    sub = Subscription(
        user_id=user.id,
        plan_id="plan-test",
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

    user = User(tg_id=int(now.timestamp()) % 10_000_000_000)
    async_session.add(user)
    await async_session.flush()

    sub = Subscription(
        user_id=user.id,
        plan_id="plan-test",
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
async def test_grace_on_expiry_disabled_when_window_zero(
    async_session: AsyncSession,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    """When grace_window_hours is 0, no new grace periods are started."""
    now = datetime.now(timezone.utc)

    user = User(tg_id=int(now.timestamp()) % 10_000_000_000)
    async_session.add(user)
    await async_session.flush()

    sub = Subscription(
        user_id=user.id,
        plan_id="plan-test",
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
    assert blocked == 0

    await async_session.refresh(sub)
    # Subscription should remain unchanged.
    assert sub.status == "active"
    assert sub.subscription_status == "active"
    assert sub.access_status == "enabled"
    assert sub.grace_until is None

    emit_grace_started.assert_not_awaited()
    emit_access_blocked.assert_not_awaited()

