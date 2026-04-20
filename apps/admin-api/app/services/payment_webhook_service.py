"""Process payment webhook: idempotent by external_id; extend subscription; referral reward; promo redemption."""

import logging
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
from decimal import Decimal

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.constants import REFERRAL_REWARD_DAYS
from app.core.metrics import (
    vpn_revenue_payment_total,
    vpn_revenue_referral_paid_total,
    vpn_revenue_renewal_total,
)
from app.models import (
    Payment,
    PaymentEvent,
    Plan,
    PromoCode,
    PromoRedemption,
    Referral,
    Subscription,
    User,
)
from app.services.entitlement_service import emit_entitlement_event
from app.services.funnel_service import log_funnel_event
from app.services.platega_service import normalize_platega_status
from app.services.referral_notification import notify_referrer_reward_granted
from app.services.referral_service import grant_referral_reward
from app.services.subscription_lifecycle_events import (
    emit_payment_lifecycle,
    emit_referral_reward_accrued,
    emit_referral_reward_applied,
)
from app.services.subscription_state import (
    apply_subscription_cycle,
    commercially_active_where,
    mark_cancelled,
)


@dataclass
class WebhookResult:
    payment_id: str
    created: bool


async def _apply_payment_success_effects(
    session: AsyncSession,
    payment: Payment,
    *,
    payload_for_promo: dict | None = None,
) -> None:
    """Extend subscription, log funnel, referral reward, promo. Call after payment is completed."""
    user_id = payment.user_id
    subscription_id = payment.subscription_id
    payload = payload_for_promo or payment.webhook_payload or {}
    sub_result = await session.execute(
        select(Subscription).where(
            Subscription.id == subscription_id,
            Subscription.user_id == int(user_id),
        )
    )
    sub = sub_result.scalar_one_or_none()
    if not sub:
        return
    plan_result = await session.execute(select(Plan).where(Plan.id == sub.plan_id))
    plan = plan_result.scalar_one_or_none()
    if not plan:
        return
    now = datetime.now(timezone.utc)
    was_active = sub.status == "active"
    was_grace = getattr(sub, "access_status", "enabled") == "grace"
    was_active = apply_subscription_cycle(
        sub,
        now=now,
        duration_days=plan.duration_days,
        device_limit=int(getattr(plan, "device_limit", sub.device_limit) or sub.device_limit),
    )
    if not was_active:
        # Single active sub per user: cancel other active subscriptions for this user.
        other_active = await session.execute(
            select(Subscription).where(
                Subscription.user_id == int(user_id),
                Subscription.id != subscription_id,
                *commercially_active_where(),
            )
        )
        for other in other_active.scalars().all():
            mark_cancelled(other)
    await session.flush()
    await emit_payment_lifecycle(
        session,
        subscription=sub,
        activated=not was_active,
        grace_converted=was_grace,
    )
    try:
        vpn_revenue_payment_total.labels(plan_id=str(sub.plan_id)[:32]).inc()
        vpn_revenue_renewal_total.inc()
    except Exception:
        pass
    ref_result = await session.execute(
        select(Referral)
        .where(
            Referral.referee_user_id == int(user_id),
            Referral.reward_applied_at.is_(None),
        )
        .limit(1)
    )
    ref = ref_result.scalar_one_or_none()
    if ref:
        try:
            processed, applied_immediate = await grant_referral_reward(session, ref.id)
            if processed:
                try:
                    vpn_revenue_referral_paid_total.inc()
                except Exception:
                    pass
                if not applied_immediate:
                    await emit_referral_reward_accrued(
                        session,
                        user_id=ref.referrer_user_id,
                        referral_id=ref.id,
                        days=REFERRAL_REWARD_DAYS,
                    )
                if applied_immediate:
                    try:
                        referrer_u = (
                            await session.execute(
                                select(User).where(User.id == ref.referrer_user_id)
                            )
                        ).scalar_one_or_none()
                        if referrer_u:
                            meta = getattr(referrer_u, "meta", {}) or {}
                            locale = (meta.get("locale") or "").strip().lower()
                            if locale not in {"en", "ru"}:
                                locale = "en"
                            await notify_referrer_reward_granted(referrer_u.tg_id, locale=locale)
                    except Exception:
                        logging.getLogger(__name__).warning(
                            "referral_notification_failed referral_id=%s referrer_user_id=%s",
                            ref.id,
                            ref.referrer_user_id,
                            exc_info=True,
                        )
                await session.refresh(ref)
                await log_funnel_event(
                    session,
                    event_type="referral_signup",
                    user_id=ref.referrer_user_id,
                    payload={
                        "referee_user_id": ref.referee_user_id,
                        "reward_applied": applied_immediate,
                        "pending_reward_days": getattr(ref, "pending_reward_days", 0),
                    },
                )
        except Exception as exc:
            logging.getLogger(__name__).error(
                "referral_reward_failed referral_id=%s referee_user_id=%s: %s",
                ref.id,
                user_id,
                exc,
                exc_info=True,
            )
    referrer_pending = await session.execute(
        select(Referral).where(
            Referral.referrer_user_id == int(user_id),
            Referral.pending_reward_days > 0,
        )
    )
    for ref_as_referrer in referrer_pending.scalars().all():
        days = ref_as_referrer.pending_reward_days or 0
        if days <= 0:
            continue
        base_p = sub.valid_until if sub.valid_until > now else now
        sub.valid_until = base_p + timedelta(days=days)
        ref_as_referrer.pending_reward_days = 0
        ref_as_referrer.reward_applied_at = now
        ref_as_referrer.status = "rewarded"
        await session.flush()
        await emit_referral_reward_applied(
            session,
            subscription_id=subscription_id,
            user_id=user_id,
            referral_id=ref_as_referrer.id,
            days=days,
        )
    promo_code_str = (payload.get("promo_code") or "").strip() or None
    if promo_code_str:
        promo_result = await session.execute(
            select(PromoCode).where(PromoCode.code == promo_code_str, PromoCode.status == "active")
        )
        promo = promo_result.scalar_one_or_none()
        if promo:
            existing_red = await session.execute(
                select(PromoRedemption)
                .where(
                    PromoRedemption.promo_code_id == promo.id,
                    PromoRedemption.user_id == int(user_id),
                )
                .limit(1)
            )
            if existing_red.scalar_one_or_none() is None:
                red = PromoRedemption(
                    promo_code_id=promo.id,
                    user_id=int(user_id),
                    payment_id=payment.id,
                    subscription_id=str(subscription_id),
                )
                session.add(red)
                await session.flush()
                if promo.type == "bonus_days" and sub:
                    try:
                        days = int(promo.value)
                        base_p = (
                            sub.valid_until
                            if sub.valid_until > datetime.now(timezone.utc)
                            else datetime.now(timezone.utc)
                        )
                        sub.valid_until = base_p + timedelta(days=days)
                    except (TypeError, ValueError):
                        pass
                await emit_entitlement_event(
                    session,
                    subscription_id=str(subscription_id),
                    user_id=sub.user_id,
                    event_type="promo_applied",
                    payload={"promo_code_id": promo.id},
                )
                await log_funnel_event(
                    session,
                    event_type="promo_applied",
                    user_id=sub.user_id,
                    payload={"promo_code_id": promo.id},
                )


async def complete_pending_payment_by_bot(
    session: AsyncSession,
    payment_id: str,
    tg_id: int,
    telegram_payment_charge_id: str | None = None,
) -> bool:
    """Complete a pending payment created by bot (invoice). Idempotent: already completed -> True.
    Returns True if payment was found and (was or is now) completed; False if not found / wrong user."""
    from sqlalchemy.orm import selectinload

    result = await session.execute(
        select(Payment)
        .where(Payment.id == payment_id)
        .options(
            selectinload(Payment.user),
            selectinload(Payment.subscription).selectinload(Subscription.plan),
        )
    )
    payment = result.scalar_one_or_none()
    if not payment or payment.user.tg_id != tg_id:
        return False
    if payment.status == "completed":
        return True
    if payment.status != "pending":
        return False
    payment.status = "completed"
    session.add(
        PaymentEvent(
            payment_id=payment.id,
            event_type="bot_confirm",
            payload={"tg_id": tg_id, "telegram_payment_charge_id": telegram_payment_charge_id},
        )
    )
    await session.flush()
    payload = payment.webhook_payload or {}
    if str(payload.get("kind") or "").strip().lower() != "donation":
        await _apply_payment_success_effects(session, payment)
    return True


async def _process_platega_webhook(session: AsyncSession, payload: dict) -> WebhookResult:
    external_id = payload.get("id") or payload.get("transactionId") or payload.get("external_id")
    if not external_id:
        raise ValueError("missing transaction id")
    external_id = str(external_id)
    existing = await session.execute(
        select(Payment).where(Payment.external_id == external_id, Payment.provider == "platega")
    )
    payment = existing.scalar_one_or_none()
    if not payment:
        raise ValueError("payment not found for transaction id")
    previous_status = str(payment.status or "")
    next_status = normalize_platega_status(str(payload.get("status") or "PENDING"))

    merged_payload = dict(payment.webhook_payload or {})
    merged_payload["platega_last_webhook"] = payload
    payment.webhook_payload = merged_payload
    payment.status = next_status
    event_type = "webhook_repeat" if previous_status == next_status else "webhook_status_update"
    session.add(PaymentEvent(payment_id=payment.id, event_type=event_type, payload=payload))
    await session.flush()
    if next_status == "completed" and previous_status != "completed":
        await _apply_payment_success_effects(session, payment, payload_for_promo=merged_payload)
    return WebhookResult(payment_id=str(payment.id), created=False)


async def process_payment_webhook(
    session: AsyncSession,
    *,
    provider: str,
    payload: dict,
) -> WebhookResult:
    """Find or create payment by external_id. On first create, extend subscription valid_until if needed.
    Stub: expects payload with external_id, user_id, subscription_id, amount, currency.
    Real impl: provider-specific parse + signature verify.
    """
    provider_normalized = (provider or "").strip().lower()
    if provider_normalized == "platega":
        return await _process_platega_webhook(session, payload)

    external_id = payload.get("external_id") or payload.get("id") or payload.get("payment_id")
    if not external_id:
        raise ValueError("missing external_id")
    external_id = str(external_id)

    existing = await session.execute(select(Payment).where(Payment.external_id == external_id))
    payment = existing.scalar_one_or_none()
    if payment:
        previous_status = str(payment.status or "").strip().lower()
        incoming_status = str(payload.get("status") or "").strip().lower()
        terminal_statuses = {"completed", "failed", "cancelled"}

        # Allow forward status transitions for the same external_id (e.g. pending -> completed),
        # but never downgrade terminal states back to pending/retry-like states.
        can_transition = (
            bool(incoming_status)
            and incoming_status != previous_status
            and not (
                previous_status in terminal_statuses and incoming_status not in terminal_statuses
            )
        )
        if can_transition:
            payment.status = incoming_status[:32]
            payment.webhook_payload = payload
            event_type = "webhook_status_update"
            if incoming_status == "completed" and previous_status != "completed":
                await _apply_payment_success_effects(session, payment, payload_for_promo=payload)
        else:
            event_type = "webhook_repeat"

        session.add(
            PaymentEvent(
                payment_id=payment.id,
                event_type=event_type,
                payload=payload,
            )
        )
        await session.flush()
        return WebhookResult(payment_id=str(payment.id), created=False)

    raw_user_id = payload.get("user_id")
    raw_sub_id = payload.get("subscription_id")
    if raw_user_id is None or raw_sub_id is None:
        raise ValueError("missing user_id or subscription_id")
    user_id = int(raw_user_id)
    subscription_id = str(raw_sub_id)
    amount = Decimal(str(payload.get("amount", 0)))
    status = str(payload.get("status", "completed"))[:32]
    currency = str(payload.get("currency", "XTR"))[:8]

    payment = Payment(
        user_id=user_id,
        subscription_id=subscription_id,
        provider=provider,
        status=status,
        amount=amount,
        currency=currency,
        external_id=external_id,
        webhook_payload=payload,
    )
    session.add(payment)
    await session.flush()
    session.add(PaymentEvent(payment_id=payment.id, event_type="webhook_received", payload=payload))
    await session.flush()

    if status == "completed":
        await _apply_payment_success_effects(session, payment, payload_for_promo=payload)
    return WebhookResult(payment_id=payment.id, created=True)
