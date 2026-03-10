"""Canonical event emitters for subscription lifecycle transitions."""

from __future__ import annotations

from app.models import Subscription
from app.services.entitlement_service import emit_entitlement_event
from app.services.funnel_service import log_funnel_event


async def emit_access_paused(
    session,
    *,
    subscription_id: str,
    user_id: int,
    reason: str,
) -> None:
    await emit_entitlement_event(
        session,
        subscription_id=subscription_id,
        user_id=user_id,
        event_type="access_paused",
        payload={"reason": reason},
    )


async def emit_access_resumed(
    session,
    *,
    subscription_id: str,
    user_id: int,
) -> None:
    await emit_entitlement_event(
        session,
        subscription_id=subscription_id,
        user_id=user_id,
        event_type="access_resumed",
        payload={},
    )


async def emit_grace_started(
    session,
    *,
    subscription_id: str,
    user_id: int,
    grace_until: str,
    reason: str,
) -> None:
    await emit_entitlement_event(
        session,
        subscription_id=subscription_id,
        user_id=user_id,
        event_type="grace_started",
        payload={"grace_until": grace_until, "reason": reason},
    )


async def emit_access_blocked(
    session,
    *,
    subscription_id: str,
    user_id: int,
    reason: str,
) -> None:
    await emit_entitlement_event(
        session,
        subscription_id=subscription_id,
        user_id=user_id,
        event_type="access_blocked",
        payload={"reason": reason},
    )


async def emit_payment_lifecycle(
    session,
    *,
    subscription: Subscription,
    activated: bool,
    grace_converted: bool,
) -> None:
    subscription_id = str(subscription.id)
    await emit_entitlement_event(
        session,
        subscription_id=subscription_id,
        user_id=subscription.user_id,
        event_type="subscription_activated" if activated else "subscription_renewed",
        payload={"plan_id": subscription.plan_id},
    )
    await log_funnel_event(
        session,
        event_type="payment",
        user_id=subscription.user_id,
        payload={"subscription_id": subscription_id},
    )
    await log_funnel_event(
        session,
        event_type="renewal",
        user_id=subscription.user_id,
        payload={"subscription_id": subscription_id},
    )
    if grace_converted:
        await log_funnel_event(
            session,
            event_type="grace_converted",
            user_id=subscription.user_id,
            payload={"subscription_id": subscription_id, "plan_id": subscription.plan_id},
        )


async def emit_referral_reward_accrued(
    session,
    *,
    user_id: int,
    referral_id: int | str,
    days: int,
) -> None:
    await emit_entitlement_event(
        session,
        subscription_id=None,
        user_id=user_id,
        event_type="referral_reward_accrued",
        payload={"referral_id": referral_id, "days": days},
    )


async def emit_referral_reward_applied(
    session,
    *,
    subscription_id: str,
    user_id: int,
    referral_id: int | str,
    days: int,
) -> None:
    payload = {"referral_id": referral_id, "days": days}
    await emit_entitlement_event(
        session,
        subscription_id=subscription_id,
        user_id=user_id,
        event_type="referral_reward_applied",
        payload=payload,
    )
    await log_funnel_event(
        session,
        event_type="referral_reward_applied",
        user_id=user_id,
        payload=payload,
    )
