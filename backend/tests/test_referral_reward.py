"""Referral reward: grant_referral_reward idempotency, isolation, and payment flow."""

from __future__ import annotations

import uuid
from datetime import datetime, timedelta, timezone
from decimal import Decimal
from unittest.mock import AsyncMock, patch

import pytest
from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.constants import REFERRAL_REWARD_DAYS
from app.core.database import async_session_factory, check_db
from app.models import Payment, Plan, Referral, Subscription, User
from app.services.payment_webhook_service import (
    complete_pending_payment_by_bot,
)
from app.services.referral_service import grant_referral_reward


@pytest.fixture
async def plan() -> Plan:
    async with async_session_factory() as db:
        p = Plan(
            name=f"test-{uuid.uuid4().hex[:8]}",
            duration_days=30,
            device_limit=1,
            price_currency="XTR",
            price_amount=Decimal("100"),
        )
        db.add(p)
        await db.commit()
        await db.refresh(p)
        return p


async def _ensure_user(session: AsyncSession, tg_id: int) -> User:
    row = await session.execute(select(User).where(User.tg_id == tg_id))
    user = row.scalar_one_or_none()
    if user:
        return user
    user = User(tg_id=tg_id)
    session.add(user)
    await session.flush()
    return user


async def _ensure_pending_referral(
    session: AsyncSession,
    *,
    referrer_user_id: int,
    referee_user_id: int,
) -> Referral:
    """Get or create a pending Referral row for a referee, resetting state for repeatable tests."""
    row = await session.execute(
        select(Referral).where(Referral.referee_user_id == referee_user_id)
    )
    ref = row.scalar_one_or_none()
    if ref is None:
        ref = Referral(
            referrer_user_id=referrer_user_id,
            referee_user_id=referee_user_id,
            referral_code=str(referrer_user_id),
            status="pending",
        )
        session.add(ref)
        await session.flush()
    else:
        ref.referrer_user_id = referrer_user_id
        ref.referral_code = str(referrer_user_id)
        ref.status = "pending"
        ref.reward_applied_at = None
        ref.pending_reward_days = 0
    return ref


async def _delete_referrals_for_referee(session: AsyncSession, referee_user_id: int) -> None:
    """Remove all referrals for a referee to simulate 'no referral' state across repeated runs."""
    await session.execute(
        delete(Referral).where(Referral.referee_user_id == referee_user_id)
    )
    await session.flush()


@pytest.mark.asyncio
async def test_grant_referral_reward_extends_referrer_sub(async_session: AsyncSession, plan: Plan):
    """Referee pays → referrer plan extended by REFERRAL_REWARD_DAYS; reward_applied_at set."""
    if not await check_db():
        pytest.skip("DB not available (requires Postgres)")
    referrer = await _ensure_user(async_session, 90001)
    referee = await _ensure_user(async_session, 90002)
    sub_ref = Subscription(
        user_id=referrer.id,
        plan_id=plan.id,
        status="active",
        valid_from=datetime.now(timezone.utc),
        valid_until=datetime.now(timezone.utc) + timedelta(days=30),
        device_limit=1,
    )
    sub_refee = Subscription(
        user_id=referee.id,
        plan_id=plan.id,
        status="pending",
        valid_from=datetime.now(timezone.utc),
        valid_until=datetime.now(timezone.utc) + timedelta(days=30),
        device_limit=1,
    )
    async_session.add(sub_ref)
    async_session.add(sub_refee)
    await async_session.flush()
    ref = await _ensure_pending_referral(
        async_session,
        referrer_user_id=referrer.id,
        referee_user_id=referee.id,
    )
    await async_session.commit()
    await async_session.refresh(ref)
    await async_session.refresh(sub_ref)

    processed, applied = await grant_referral_reward(async_session, ref.id)

    assert processed is True
    assert applied is True
    await async_session.refresh(ref)
    await async_session.refresh(sub_ref)
    assert ref.reward_applied_at is not None
    assert ref.status == "rewarded"
    # valid_until extended by REFERRAL_REWARD_DAYS (was 30d, now 30+14=44d)
    min_days = 30 + REFERRAL_REWARD_DAYS - 1
    days_until = (sub_ref.valid_until - datetime.now(timezone.utc)).days
    assert days_until >= min_days


@pytest.mark.asyncio
async def test_grant_referral_reward_idempotent(async_session: AsyncSession, plan: Plan):
    """grant_referral_reward called twice for same referral → second returns (False, False)."""
    if not await check_db():
        pytest.skip("DB not available (requires Postgres)")
    referrer = await _ensure_user(async_session, 90011)
    referee = await _ensure_user(async_session, 90012)
    sub_ref = Subscription(
        user_id=referrer.id,
        plan_id=plan.id,
        status="active",
        valid_from=datetime.now(timezone.utc),
        valid_until=datetime.now(timezone.utc) + timedelta(days=30),
        device_limit=1,
    )
    async_session.add(sub_ref)
    await async_session.flush()
    ref = await _ensure_pending_referral(
        async_session,
        referrer_user_id=referrer.id,
        referee_user_id=referee.id,
    )
    await async_session.commit()
    await async_session.refresh(ref)

    first, _ = await grant_referral_reward(async_session, ref.id)
    second, _ = await grant_referral_reward(async_session, ref.id)

    assert first is True
    assert second is False


@pytest.mark.asyncio
async def test_grant_referral_reward_paused_referrer_accrues_pending_days(
    async_session: AsyncSession, plan: Plan
):
    """Paused referrer should accrue pending days instead of immediate extension."""
    if not await check_db():
        pytest.skip("DB not available (requires Postgres)")
    referrer = await _ensure_user(async_session, 90013)
    referee = await _ensure_user(async_session, 90014)
    sub_ref = Subscription(
        user_id=referrer.id,
        plan_id=plan.id,
        status="active",
        subscription_status="active",
        access_status="paused",
        paused_at=datetime.now(timezone.utc),
        valid_from=datetime.now(timezone.utc),
        valid_until=datetime.now(timezone.utc) + timedelta(days=30),
        device_limit=1,
    )
    async_session.add(sub_ref)
    await async_session.flush()
    ref = await _ensure_pending_referral(
        async_session,
        referrer_user_id=referrer.id,
        referee_user_id=referee.id,
    )
    await async_session.commit()
    await async_session.refresh(ref)
    original_valid_until = sub_ref.valid_until

    processed, applied = await grant_referral_reward(async_session, ref.id)

    assert processed is True
    assert applied is False
    await async_session.refresh(ref)
    await async_session.refresh(sub_ref)
    assert ref.status == "pending_reward"
    assert ref.pending_reward_days == REFERRAL_REWARD_DAYS
    assert sub_ref.valid_until == original_valid_until


@pytest.mark.asyncio
async def test_grant_referral_reward_no_referral_returns_false(async_session: AsyncSession):
    """Qualifying action for user with no referral → grant_referral_reward returns (False, False)."""
    if not await check_db():
        pytest.skip("DB not available (requires Postgres)")
    processed, applied = await grant_referral_reward(async_session, "nonexistent-id")
    assert processed is False
    assert applied is False


@pytest.mark.asyncio
async def test_referral_reward_failure_does_not_fail_payment(
    async_session: AsyncSession, plan: Plan
):
    """grant_referral_reward raises → primary payment completion still succeeds."""
    if not await check_db():
        pytest.skip("DB not available (requires Postgres)")
    referrer = await _ensure_user(async_session, 90031)
    referee = await _ensure_user(async_session, 90032)
    sub_refee = Subscription(
        user_id=referee.id,
        plan_id=plan.id,
        status="pending",
        valid_from=datetime.now(timezone.utc),
        valid_until=datetime.now(timezone.utc) + timedelta(days=30),
        device_limit=1,
    )
    async_session.add(sub_refee)
    await async_session.flush()
    ref = await _ensure_pending_referral(
        async_session,
        referrer_user_id=referrer.id,
        referee_user_id=referee.id,
    )
    pay = Payment(
        user_id=referee.id,
        subscription_id=sub_refee.id,
        provider="test",
        status="pending",
        amount=Decimal("100"),
        currency="XTR",
        external_id=f"test-ext-{uuid.uuid4().hex}",
    )
    async_session.add(pay)
    await async_session.commit()
    await async_session.refresh(pay)

    with patch(
        "app.services.payment_webhook_service.grant_referral_reward",
        new_callable=AsyncMock,
        side_effect=RuntimeError("simulated referral failure"),
    ):
        ok = await complete_pending_payment_by_bot(
            async_session,
            payment_id=pay.id,
            tg_id=referee.tg_id,
        )

    assert ok is True
    await async_session.refresh(pay)
    assert pay.status == "completed"
    await async_session.refresh(sub_refee)
    assert sub_refee.status == "active"


@pytest.mark.asyncio
async def test_referral_reward_no_referral_no_error(async_session: AsyncSession, plan: Plan):
    """Referee pays with no referral record → no error, payment completes."""
    if not await check_db():
        pytest.skip("DB not available (requires Postgres)")
    referee = await _ensure_user(async_session, 90041)
    # Ensure no referral record exists for this referee across repeated runs.
    await _delete_referrals_for_referee(async_session, referee_user_id=referee.id)
    sub_refee = Subscription(
        user_id=referee.id,
        plan_id=plan.id,
        status="pending",
        valid_from=datetime.now(timezone.utc),
        valid_until=datetime.now(timezone.utc) + timedelta(days=30),
        device_limit=1,
    )
    async_session.add(sub_refee)
    await async_session.flush()
    pay = Payment(
        user_id=referee.id,
        subscription_id=sub_refee.id,
        provider="test",
        status="pending",
        amount=Decimal("100"),
        currency="XTR",
        external_id=f"test-ext-{uuid.uuid4().hex}",
    )
    async_session.add(pay)
    await async_session.commit()
    await async_session.refresh(pay)

    ok = await complete_pending_payment_by_bot(
        async_session,
        payment_id=pay.id,
        tg_id=referee.tg_id,
    )

    assert ok is True
    await async_session.refresh(pay)
    assert pay.status == "completed"
