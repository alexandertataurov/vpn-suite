"""Canonical payment state machine and idempotent entitlement application."""

from __future__ import annotations

import logging
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
from decimal import Decimal, InvalidOperation

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
from app.services.referral_notification import notify_referrer_reward_granted
from app.services.referral_service import grant_referral_reward
from app.services.subscription_lifecycle_events import (
    emit_access_blocked,
    emit_payment_lifecycle,
    emit_referral_reward_accrued,
    emit_referral_reward_applied,
)
from app.services.subscription_state import (
    apply_subscription_cycle,
    block_access,
    commercially_active_where,
    mark_cancelled,
)

_log = logging.getLogger(__name__)

PAYMENT_STATUS_CREATED = "created"
PAYMENT_STATUS_REQUIRES_ACTION = "requires_action"
PAYMENT_STATUS_PENDING = "pending"
PAYMENT_STATUS_SUCCEEDED = "succeeded"
PAYMENT_STATUS_FAILED = "failed"
PAYMENT_STATUS_CANCELLED = "cancelled"
PAYMENT_STATUS_EXPIRED = "expired"
PAYMENT_STATUS_REFUNDED = "refunded"
PAYMENT_STATUS_CHARGEBACK = "chargeback"

PAYMENT_TERMINAL_STATUSES = frozenset(
    {
        PAYMENT_STATUS_SUCCEEDED,
        PAYMENT_STATUS_FAILED,
        PAYMENT_STATUS_CANCELLED,
        PAYMENT_STATUS_EXPIRED,
        PAYMENT_STATUS_REFUNDED,
        PAYMENT_STATUS_CHARGEBACK,
    }
)
PAYMENT_REFUND_STATUSES = frozenset({PAYMENT_STATUS_REFUNDED, PAYMENT_STATUS_CHARGEBACK})
PAYMENT_ACTIVE_PENDING_STATUSES = frozenset(
    {PAYMENT_STATUS_CREATED, PAYMENT_STATUS_REQUIRES_ACTION, PAYMENT_STATUS_PENDING}
)


class PaymentStateError(ValueError):
    """Raised when a requested payment transition is invalid."""


@dataclass(slots=True)
class PaymentTransitionResult:
    payment: Payment
    changed: bool
    applied: bool = False


def normalize_payment_status(value: str | None) -> str:
    raw = (value or "").strip().lower()
    aliases = {
        "completed": PAYMENT_STATUS_SUCCEEDED,
        "success": PAYMENT_STATUS_SUCCEEDED,
        "paid": PAYMENT_STATUS_SUCCEEDED,
        "canceled": PAYMENT_STATUS_CANCELLED,
        "cancelled": PAYMENT_STATUS_CANCELLED,
        "chargebacked": PAYMENT_STATUS_CHARGEBACK,
    }
    return aliases.get(raw, raw or PAYMENT_STATUS_PENDING)


def is_payment_succeeded(payment: Payment) -> bool:
    return normalize_payment_status(payment.status) == PAYMENT_STATUS_SUCCEEDED


def _decimal(value: object) -> Decimal:
    try:
        return Decimal(str(value if value is not None else 0))
    except (InvalidOperation, ValueError):
        return Decimal("0")


def _now() -> datetime:
    return datetime.now(timezone.utc)


def default_payment_expiry(provider: str, *, now: datetime | None = None) -> datetime:
    base = now or _now()
    provider_normalized = (provider or "").strip().lower()
    if provider_normalized == "telegram_stars":
        return base + timedelta(minutes=15)
    return base + timedelta(minutes=30)


def platega_expiry_from_expires_in(value: object, *, now: datetime | None = None) -> datetime | None:
    text = str(value or "").strip()
    if not text:
        return None
    parts = text.split(":")
    try:
        if len(parts) == 3:
            hours, minutes, seconds = (int(part) for part in parts)
            return (now or _now()) + timedelta(hours=hours, minutes=minutes, seconds=seconds)
        if len(parts) == 2:
            minutes, seconds = (int(part) for part in parts)
            return (now or _now()) + timedelta(minutes=minutes, seconds=seconds)
    except ValueError:
        return None
    return None


def _event(session: AsyncSession, payment: Payment, event_type: str, payload: dict | None) -> None:
    session.add(PaymentEvent(payment_id=payment.id, event_type=event_type, payload=payload or {}))


async def _load_payment_for_update(session: AsyncSession, payment_id: str) -> Payment | None:
    result = await session.execute(
        select(Payment).where(Payment.id == payment_id).with_for_update()
    )
    return result.scalar_one_or_none()


async def create_payment_intent(
    session: AsyncSession,
    *,
    user_id: int,
    subscription_id: str,
    provider: str,
    amount: Decimal | int | float | str,
    currency: str,
    external_id: str,
    kind: str,
    source: str,
    idempotency_key: str | None = None,
    provider_payment_id: str | None = None,
    provider_status: str | None = None,
    invoice_url: str | None = None,
    expires_at: datetime | None = None,
    webhook_payload: dict | None = None,
    status: str | None = None,
) -> Payment:
    amount_decimal = _decimal(amount)
    payment = Payment(
        user_id=user_id,
        subscription_id=subscription_id,
        provider=provider,
        status=normalize_payment_status(status or PAYMENT_STATUS_PENDING),
        amount=amount_decimal,
        currency=(currency or "XTR")[:8],
        external_id=external_id,
        webhook_payload=webhook_payload,
        kind=(kind or "subscription")[:32],
        source=(source or "webhook")[:32],
        idempotency_key=idempotency_key,
        provider_payment_id=provider_payment_id or external_id,
        provider_status=provider_status,
        invoice_url=invoice_url,
        expected_amount=amount_decimal,
        expires_at=expires_at or default_payment_expiry(provider),
    )
    session.add(payment)
    await session.flush()
    _event(session, payment, "payment_intent_created", webhook_payload)
    await session.flush()
    return payment


async def apply_successful_payment_once(
    session: AsyncSession,
    payment_id: str,
    *,
    payload_for_promo: dict | None = None,
) -> bool:
    payment = await _load_payment_for_update(session, payment_id)
    if payment is None:
        return False
    if payment.subscription_applied_at is not None:
        return False
    if (payment.kind or "subscription") == "donation":
        payment.subscription_applied_at = _now()
        _event(session, payment, "donation_recorded", payment.webhook_payload)
        await session.flush()
        return False
    if _decimal(payment.paid_amount if payment.paid_amount is not None else payment.amount) <= 0:
        payment.subscription_applied_at = _now()
        _event(session, payment, "free_payment_recorded", payment.webhook_payload)
        await session.flush()
        return False

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
        return False
    plan_result = await session.execute(select(Plan).where(Plan.id == sub.plan_id))
    plan = plan_result.scalar_one_or_none()
    if not plan:
        return False

    now = _now()
    was_grace = getattr(sub, "access_status", "enabled") == "grace"
    was_active = apply_subscription_cycle(
        sub,
        now=now,
        duration_days=plan.duration_days,
        device_limit=int(getattr(plan, "device_limit", sub.device_limit) or sub.device_limit),
    )
    if not was_active:
        other_active = await session.execute(
            select(Subscription).where(
                Subscription.user_id == int(user_id),
                Subscription.id != subscription_id,
                *commercially_active_where(),
            )
        )
        for other in other_active.scalars().all():
            mark_cancelled(other)
    payment.subscription_applied_at = now
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
                        _log.warning(
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
            _log.error(
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
                    discount_applied_xtr=max(
                        0,
                        int(
                            (payment.expected_amount or payment.amount or 0)
                            - (payment.paid_amount or payment.amount or 0)
                        ),
                    ),
                )
                session.add(red)
                await session.flush()
                if promo.type == "bonus_days" and sub:
                    try:
                        days = int(promo.value)
                        base_p = sub.valid_until if sub.valid_until > _now() else _now()
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

    _event(session, payment, "subscription_effects_applied", {"subscription_id": subscription_id})
    await session.flush()
    return True


async def mark_payment_succeeded(
    session: AsyncSession,
    payment_id: str,
    *,
    paid_amount: Decimal | int | float | str | None,
    currency: str | None,
    provider_payment_id: str | None = None,
    provider_status: str | None = None,
    telegram_payment_charge_id: str | None = None,
    payload: dict | None = None,
) -> PaymentTransitionResult:
    payment = await _load_payment_for_update(session, payment_id)
    if payment is None:
        raise PaymentStateError("payment_not_found")
    current = normalize_payment_status(payment.status)
    if current == PAYMENT_STATUS_SUCCEEDED:
        return PaymentTransitionResult(payment=payment, changed=False, applied=False)
    if current in PAYMENT_TERMINAL_STATUSES:
        return PaymentTransitionResult(payment=payment, changed=False, applied=False)

    expected = _decimal(payment.expected_amount if payment.expected_amount is not None else payment.amount)
    actual = _decimal(paid_amount if paid_amount is not None else payment.amount)
    expected_currency = (payment.currency or "").strip().upper()
    actual_currency = (currency or payment.currency or "").strip().upper()
    if actual != expected or actual_currency != expected_currency:
        payment.status = PAYMENT_STATUS_FAILED
        payment.failure_code = "amount_mismatch"
        payment.failure_message = (
            f"Expected {expected} {expected_currency}, got {actual} {actual_currency}"
        )[:255]
        payment.provider_payment_id = provider_payment_id or payment.provider_payment_id
        payment.provider_status = provider_status or payment.provider_status
        payment.webhook_payload = {**(payment.webhook_payload or {}), "last_payload": payload or {}}
        _event(
            session,
            payment,
            "payment_amount_mismatch",
            {
                "expected_amount": str(expected),
                "paid_amount": str(actual),
                "expected_currency": expected_currency,
                "paid_currency": actual_currency,
            },
        )
        await session.flush()
        return PaymentTransitionResult(payment=payment, changed=True, applied=False)

    payment.status = PAYMENT_STATUS_SUCCEEDED
    payment.paid_amount = actual
    payment.paid_at = payment.paid_at or _now()
    payment.provider_payment_id = provider_payment_id or payment.provider_payment_id
    payment.provider_status = provider_status or payment.provider_status or PAYMENT_STATUS_SUCCEEDED
    payment.telegram_payment_charge_id = (
        telegram_payment_charge_id or payment.telegram_payment_charge_id
    )
    payment.failure_code = None
    payment.failure_message = None
    payment.webhook_payload = {**(payment.webhook_payload or {}), "last_payload": payload or {}}
    _event(session, payment, "payment_succeeded", payload)
    await session.flush()
    applied = await apply_successful_payment_once(session, payment.id, payload_for_promo=payment.webhook_payload)
    return PaymentTransitionResult(payment=payment, changed=True, applied=applied)


async def mark_payment_terminal(
    session: AsyncSession,
    payment_id: str,
    *,
    status: str,
    code: str | None = None,
    message: str | None = None,
    payload: dict | None = None,
) -> PaymentTransitionResult:
    payment = await _load_payment_for_update(session, payment_id)
    if payment is None:
        raise PaymentStateError("payment_not_found")
    target = normalize_payment_status(status)
    if target not in PAYMENT_TERMINAL_STATUSES:
        raise PaymentStateError(f"invalid_terminal_status:{target}")
    current = normalize_payment_status(payment.status)
    if current == target:
        return PaymentTransitionResult(payment=payment, changed=False, applied=False)
    if current == PAYMENT_STATUS_SUCCEEDED and target not in PAYMENT_REFUND_STATUSES:
        return PaymentTransitionResult(payment=payment, changed=False, applied=False)
    if current in PAYMENT_TERMINAL_STATUSES and current != PAYMENT_STATUS_SUCCEEDED:
        return PaymentTransitionResult(payment=payment, changed=False, applied=False)
    payment.status = target
    payment.failure_code = code[:64] if code else payment.failure_code
    payment.failure_message = message[:255] if message else payment.failure_message
    payment.provider_status = target
    payment.webhook_payload = {**(payment.webhook_payload or {}), "last_payload": payload or {}}
    _event(session, payment, f"payment_{target}", payload)
    await session.flush()
    if target in PAYMENT_REFUND_STATUSES and (payment.kind or "subscription") != "donation":
        sub = await session.get(Subscription, payment.subscription_id)
        if sub:
            block_access(sub)
            await session.flush()
            await emit_access_blocked(
                session,
                subscription_id=sub.id,
                user_id=sub.user_id,
                reason=target,
            )
            await emit_entitlement_event(
                session,
                subscription_id=sub.id,
                user_id=sub.user_id,
                event_type=f"payment_{target}",
                payload={"payment_id": payment.id},
            )
    return PaymentTransitionResult(payment=payment, changed=True, applied=False)


async def expire_stale_payments(session: AsyncSession, *, now: datetime | None = None) -> int:
    current_time = now or _now()
    result = await session.execute(
        select(Payment)
        .where(
            Payment.status.in_(tuple(PAYMENT_ACTIVE_PENDING_STATUSES | {"created"})),
            Payment.expires_at.is_not(None),
            Payment.expires_at <= current_time,
        )
        .with_for_update(skip_locked=True)
    )
    count = 0
    for payment in result.scalars().all():
        payment.status = PAYMENT_STATUS_EXPIRED
        payment.failure_code = "payment_expired"
        payment.failure_message = "Payment expired before provider confirmation"
        _event(session, payment, "payment_expired", {"expires_at": payment.expires_at.isoformat()})
        count += 1
    if count:
        await session.flush()
    return count
