"""Promo service and redemption path tests."""

from __future__ import annotations

import uuid
from datetime import datetime, timedelta, timezone
from decimal import Decimal

import pytest
from sqlalchemy import delete, select

from app.core.constants import MIN_PRICE_XTR, PROMO_1FREESTAR_DISCOUNT_XTR
from app.core.database import check_db
from app.models import Plan, PromoCode, PromoRedemption, User
from app.services.promo_service import (
    PromoCodeError,
    PromoErrorCode,
    redeem_promo_code,
    validate_promo_code,
)

pytestmark = pytest.mark.asyncio


async def _ensure_plan(db, plan_id: str | None = None) -> Plan:
    if plan_id:
        r = await db.execute(select(Plan).where(Plan.id == plan_id))
        p = r.scalar_one_or_none()
        if p:
            return p
    plan = Plan(
        id=plan_id or f"p-{uuid.uuid4().hex[:12]}",
        name=f"plan-{uuid.uuid4().hex[:6]}",
        duration_days=30,
        device_limit=1,
        price_currency="XTR",
        price_amount=Decimal("5.00"),
    )
    db.add(plan)
    await db.flush()
    return plan


async def _ensure_user(db, tg_id: int) -> User:
    r = await db.execute(select(User).where(User.tg_id == tg_id))
    u = r.scalar_one_or_none()
    if u:
        return u
    u = User(tg_id=tg_id, is_banned=False)
    db.add(u)
    await db.flush()
    return u


async def _create_promo(
    db,
    code: str = "TEST1",
    discount_xtr: int = 1,
    is_active: bool = True,
    expires_at: datetime | None = None,
    applicable_plan_ids: list[str] | None = None,
    promo_type: str = "fixed_xtr",
    value: Decimal | None = None,
) -> PromoCode:
    # Idempotent helper: reuse existing promo with same code if present.
    existing = await db.execute(select(PromoCode).where(PromoCode.code == code.upper()))
    promo = existing.scalar_one_or_none()
    if promo:
        return promo
    promo = PromoCode(
        code=code.upper(),
        type=promo_type,
        value=value if value is not None else Decimal(str(discount_xtr)),
        status="active",
        discount_xtr=discount_xtr,
        max_uses_per_user=1,
        global_use_limit=None,
        is_active=is_active,
        expires_at=expires_at,
        applicable_plan_ids=applicable_plan_ids,
    )
    db.add(promo)
    await db.flush()
    return promo


async def test_validate_promo_code_valid(async_session):
    if not await check_db():
        pytest.skip("DB not available (requires Postgres)")
    db = async_session
    plan = await _ensure_plan(db)
    user = await _ensure_user(db, tg_id=999001)
    await _create_promo(db, "VALID1", discount_xtr=PROMO_1FREESTAR_DISCOUNT_XTR)
    await db.commit()

    result = await validate_promo_code(db, "valid1", user.id, plan.id, 5)
    assert result.discount_amount == PROMO_1FREESTAR_DISCOUNT_XTR
    assert result.discounted_price == 4
    assert "1 XTR off" in result.display_label


async def test_validate_promo_price_floor(async_session):
    if not await check_db():
        pytest.skip("DB not available (requires Postgres)")
    db = async_session
    plan = await _ensure_plan(db)
    user = await _ensure_user(db, tg_id=999002)
    await _create_promo(db, "FLOOR1", discount_xtr=10)
    await db.commit()

    result = await validate_promo_code(db, "floor1", user.id, plan.id, 5)
    assert result.discounted_price == MIN_PRICE_XTR
    assert result.discount_amount == 4
    assert result.display_label == "4 XTR off"


async def test_validate_promo_uses_discount_xtr_when_legacy_value_is_zero(async_session):
    if not await check_db():
        pytest.skip("DB not available (requires Postgres)")
    db = async_session
    plan = await _ensure_plan(db)
    user = await _ensure_user(db, tg_id=999012)
    await _create_promo(db, "ZEROLEGACY1", discount_xtr=3, value=Decimal("0"))
    await db.commit()

    result = await validate_promo_code(db, "zerolegacy1", user.id, plan.id, 10)
    assert result.discount_amount == 3
    assert result.discounted_price == 7


async def test_validate_promo_percent_discount_is_capped_to_price_floor(async_session):
    if not await check_db():
        pytest.skip("DB not available (requires Postgres)")
    db = async_session
    plan = await _ensure_plan(db)
    user = await _ensure_user(db, tg_id=999013)
    await _create_promo(
        db,
        "HALF1",
        discount_xtr=0,
        promo_type="discount_percent",
        value=Decimal("50"),
    )
    await db.commit()

    result = await validate_promo_code(db, "half1", user.id, plan.id, 9)
    assert result.discount_amount == 4
    assert result.discounted_price == 5


async def test_validate_promo_not_found(async_session):
    if not await check_db():
        pytest.skip("DB not available (requires Postgres)")
    db = async_session
    plan = await _ensure_plan(db)
    user = await _ensure_user(db, tg_id=999003)
    await db.commit()

    with pytest.raises(PromoCodeError) as exc_info:
        await validate_promo_code(db, "NONEXISTENT", user.id, plan.id, 5)
    assert exc_info.value.code == PromoErrorCode.PROMO_NOT_FOUND


async def test_validate_promo_inactive(async_session):
    if not await check_db():
        pytest.skip("DB not available (requires Postgres)")
    db = async_session
    plan = await _ensure_plan(db)
    user = await _ensure_user(db, tg_id=999004)
    await _create_promo(db, "INACTIVE1", is_active=False)
    await db.commit()

    with pytest.raises(PromoCodeError) as exc_info:
        await validate_promo_code(db, "inactive1", user.id, plan.id, 5)
    assert exc_info.value.code == PromoErrorCode.PROMO_INACTIVE


async def test_validate_promo_expired(async_session):
    if not await check_db():
        pytest.skip("DB not available (requires Postgres)")
    db = async_session
    plan = await _ensure_plan(db)
    user = await _ensure_user(db, tg_id=999005)
    past = datetime.now(timezone.utc) - timedelta(days=1)
    await _create_promo(db, "EXPIRED1", expires_at=past)
    await db.commit()

    with pytest.raises(PromoCodeError) as exc_info:
        await validate_promo_code(db, "expired1", user.id, plan.id, 5)
    assert exc_info.value.code == PromoErrorCode.PROMO_EXPIRED


async def test_validate_promo_case_insensitive(async_session):
    if not await check_db():
        pytest.skip("DB not available (requires Postgres)")
    db = async_session
    plan = await _ensure_plan(db)
    user = await _ensure_user(db, tg_id=999006)
    await _create_promo(db, "MIXED1")
    await db.commit()

    r1 = await validate_promo_code(db, "mixed1", user.id, plan.id, 5)
    r2 = await validate_promo_code(db, "MIXED1", user.id, plan.id, 5)
    r3 = await validate_promo_code(db, "Mixed1", user.id, plan.id, 5)
    assert r1.discount_amount == r2.discount_amount == r3.discount_amount
    assert r1.discounted_price == r2.discounted_price == r3.discounted_price


async def test_redeem_promo_code_per_user_idempotency(async_session):
    if not await check_db():
        pytest.skip("DB not available (requires Postgres)")
    db = async_session
    plan = await _ensure_plan(db)
    user = await _ensure_user(db, tg_id=999007)
    promo = await _create_promo(db, "ONCE1")
    # Ensure no leftover redemptions from previous runs for this user/promo.
    await db.execute(
        delete(PromoRedemption).where(
            PromoRedemption.promo_code_id == promo.id,
            PromoRedemption.user_id == user.id,
        )
    )
    # Create a fake payment for redemption
    from app.models import Payment, Subscription

    sub = Subscription(
        user_id=user.id,
        plan_id=plan.id,
        valid_from=datetime.now(timezone.utc),
        valid_until=datetime.now(timezone.utc) + timedelta(days=30),
        device_limit=1,
        status="pending",
    )
    db.add(sub)
    await db.flush()
    payment = Payment(
        user_id=user.id,
        subscription_id=sub.id,
        provider="test",
        status="pending",
        amount=Decimal("4"),
        currency="XTR",
        external_id=f"test-{uuid.uuid4().hex}",
    )
    db.add(payment)
    await db.flush()
    await db.commit()

    price = await redeem_promo_code(db, "once1", user.id, plan.id, payment.id, 5)
    assert price == 4
    await db.commit()

    with pytest.raises(PromoCodeError) as exc_info:
        await redeem_promo_code(db, "once1", user.id, plan.id, payment.id, 5)
    assert exc_info.value.code == PromoErrorCode.PROMO_ALREADY_USED
