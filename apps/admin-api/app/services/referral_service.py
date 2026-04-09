"""Referral reward: grant plan extension to referrer when referee pays."""

import logging
from datetime import datetime, timedelta, timezone

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.constants import REFERRAL_REWARD_DAYS
from app.models import Referral, Subscription
from app.services.subscription_state import entitled_active_where, is_entitled_active


async def grant_referral_reward(
    session: AsyncSession,
    referral_id: int | str,
) -> tuple[bool, bool]:
    """
    Grant REFERRAL_REWARD_DAYS plan extension to referrer for a qualifying referral.
    Idempotent: returns (False, False) without error if already rewarded.
    Must be called inside an existing transaction.
    Uses SELECT ... FOR UPDATE to prevent concurrent double-grant.
    """
    log = logging.getLogger(__name__)
    result = await session.execute(
        select(Referral).where(Referral.id == str(referral_id)).with_for_update()
    )
    ref = result.scalar_one_or_none()
    if not ref:
        log.info("referral_reward_skip: no_referral_found referral_id=%s", referral_id)
        return (False, False)
    if ref.reward_applied_at is not None:
        log.info("referral_reward_skip: already_rewarded referral_id=%s", ref.id)
        return (False, False)

    now = datetime.now(timezone.utc)
    referrer_subs = await session.execute(
        select(Subscription)
        .where(
            Subscription.user_id == ref.referrer_user_id,
            *entitled_active_where(now=now),
        )
        .order_by(Subscription.valid_until.desc())
        .limit(1)
    )
    referrer_sub = referrer_subs.scalar_one_or_none()
    if referrer_sub and is_entitled_active(referrer_sub, now=now):
        base = referrer_sub.valid_until if referrer_sub.valid_until > now else now
        referrer_sub.valid_until = base + timedelta(days=REFERRAL_REWARD_DAYS)
        ref.reward_applied_at = now
        ref.status = "rewarded"
        log.info(
            "referral_reward_granted referral_id=%s referrer_user_id=%s days=%d",
            ref.id,
            ref.referrer_user_id,
            REFERRAL_REWARD_DAYS,
        )
        await session.flush()
        return (True, True)
    pending = getattr(ref, "pending_reward_days", 0) or 0
    ref.pending_reward_days = pending + REFERRAL_REWARD_DAYS
    ref.status = "pending_reward"
    log.info(
        "referral_reward_pending referral_id=%s referrer_user_id=%s days=%d",
        ref.id,
        ref.referrer_user_id,
        REFERRAL_REWARD_DAYS,
    )
    await session.flush()
    return (True, False)
