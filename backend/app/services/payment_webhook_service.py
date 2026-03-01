"""Process payment webhook: idempotent by external_id; extend subscription; referral reward; promo redemption."""

from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
from decimal import Decimal

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
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
)
from app.services.funnel_service import log_funnel_event


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
    if sub.status != "active":
        sub.status = "active"
        sub.valid_from = now
        base = now
    else:
        base = sub.valid_until if sub.valid_until and sub.valid_until > now else now
    sub.valid_until = base + timedelta(days=plan.duration_days)
    await session.flush()
    await log_funnel_event(
        session,
        event_type="payment",
        user_id=sub.user_id,
        payload={"subscription_id": str(subscription_id)},
    )
    await log_funnel_event(
        session,
        event_type="renewal",
        user_id=sub.user_id,
        payload={"subscription_id": str(subscription_id)},
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
    reward_days = getattr(ref, "reward_days", None) or settings.referral_reward_bonus_days
    if ref and reward_days:
        referrer_subs = await session.execute(
            select(Subscription)
            .where(
                Subscription.user_id == ref.referrer_user_id,
                Subscription.status == "active",
            )
            .order_by(Subscription.valid_until.desc())
            .limit(1)
        )
        referrer_sub = referrer_subs.scalar_one_or_none()
        if referrer_sub:
            base_ref = (
                referrer_sub.valid_until
                if referrer_sub.valid_until > datetime.now(timezone.utc)
                else datetime.now(timezone.utc)
            )
            referrer_sub.valid_until = base_ref + timedelta(days=reward_days)
        ref.reward_applied_at = datetime.now(timezone.utc)
        ref.status = "rewarded"
        await session.flush()
        try:
            vpn_revenue_referral_paid_total.inc()
        except Exception:
            pass
        await log_funnel_event(
            session,
            event_type="referral_signup",
            user_id=ref.referrer_user_id,
            payload={"referee_user_id": ref.referee_user_id, "reward_applied": True},
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
    await _apply_payment_success_effects(session, payment)
    return True


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
    external_id = payload.get("external_id") or payload.get("id") or payload.get("payment_id")
    if not external_id:
        raise ValueError("missing external_id")
    external_id = str(external_id)

    existing = await session.execute(select(Payment).where(Payment.external_id == external_id))
    payment = existing.scalar_one_or_none()
    if payment:
        session.add(
            PaymentEvent(
                payment_id=payment.id,
                event_type="webhook_repeat",
                payload=payload,
            )
        )
        await session.flush()
        # Idempotent: replay must not change business state (P0). Do not overwrite status:
        # a replayed "pending" would incorrectly overwrite existing "completed".
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
