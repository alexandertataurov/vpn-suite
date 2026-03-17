"""Canonical subscription-state helpers for business logic and audits."""

from __future__ import annotations

from collections.abc import Iterable
from datetime import datetime, timedelta, timezone

from app.models import Subscription


def commercial_status(subscription: Subscription) -> str:
    return getattr(subscription, "subscription_status", subscription.status)


def access_status(subscription: Subscription) -> str:
    return getattr(subscription, "access_status", "enabled")


def billing_status(subscription: Subscription) -> str:
    return getattr(subscription, "billing_status", "paid")


def renewal_status(subscription: Subscription) -> str:
    return getattr(
        subscription,
        "renewal_status",
        "auto_renew_on" if bool(getattr(subscription, "auto_renew", True)) else "auto_renew_off",
    )


def is_commercially_active(subscription: Subscription) -> bool:
    return commercial_status(subscription) == "active"


def is_access_enabled(subscription: Subscription) -> bool:
    return access_status(subscription) == "enabled"


def is_in_grace(subscription: Subscription) -> bool:
    return access_status(subscription) == "grace"


def is_paused(subscription: Subscription) -> bool:
    return access_status(subscription) == "paused"


def commercially_active_where(*, now: datetime | None = None) -> tuple[object, ...]:
    clauses: list[object] = [
        Subscription.status == "active",
        Subscription.subscription_status == "active",
    ]
    if now is not None:
        clauses.append(Subscription.valid_until > now)
    return tuple(clauses)


def entitled_active_where(*, now: datetime | None = None) -> tuple[object, ...]:
    clauses = list(commercially_active_where(now=now))
    clauses.append(Subscription.access_status == "enabled")
    return tuple(clauses)


def normalize_active_state(subscription: Subscription) -> None:
    subscription.status = "active"
    subscription.subscription_status = "active"
    subscription.access_status = "enabled"
    subscription.billing_status = "paid"
    subscription.renewal_status = (
        "auto_renew_on" if bool(getattr(subscription, "auto_renew", True)) else "auto_renew_off"
    )
    subscription.grace_until = None
    subscription.grace_reason = None
    subscription.cancel_at_period_end = False
    subscription.paused_at = None
    subscription.pause_reason = None


def normalize_pending_state(subscription: Subscription) -> None:
    subscription.status = "pending"
    subscription.subscription_status = "pending"
    subscription.access_status = "blocked"
    subscription.billing_status = "unpaid"
    subscription.renewal_status = (
        "auto_renew_on" if bool(getattr(subscription, "auto_renew", True)) else "auto_renew_off"
    )
    subscription.grace_until = None
    subscription.grace_reason = None
    subscription.cancel_at_period_end = False
    subscription.paused_at = None
    subscription.pause_reason = None


def mark_paused(subscription: Subscription, *, now: datetime, reason: str | None = None) -> None:
    subscription.paused_at = now
    subscription.pause_reason = reason[:64] if reason else None
    subscription.access_status = "paused"
    subscription.grace_until = None
    subscription.grace_reason = None


def resume_active_access(subscription: Subscription) -> None:
    subscription.paused_at = None
    subscription.pause_reason = None
    if commercial_status(subscription) == "active":
        subscription.access_status = "enabled"


def mark_cancelled(subscription: Subscription) -> None:
    subscription.status = "cancelled"
    subscription.subscription_status = "cancelled"
    subscription.access_status = "blocked"
    subscription.cancel_at_period_end = False
    subscription.grace_until = None
    subscription.grace_reason = None
    subscription.paused_at = None
    subscription.pause_reason = None


def mark_cancel_at_period_end(subscription: Subscription) -> None:
    subscription.status = "active"
    subscription.subscription_status = "active"
    subscription.access_status = "enabled"
    subscription.cancel_at_period_end = True


def start_grace_period(
    subscription: Subscription,
    *,
    now: datetime,
    grace_until: datetime,
    reason: str,
) -> None:
    subscription.status = "expired"
    subscription.subscription_status = "expired"
    subscription.access_status = "grace"
    subscription.grace_until = grace_until
    subscription.grace_reason = reason
    subscription.cancel_at_period_end = False
    subscription.paused_at = None
    subscription.pause_reason = None


def block_access(subscription: Subscription, *, clear_grace: bool = True) -> None:
    subscription.access_status = "blocked"
    if clear_grace:
        subscription.grace_until = None
        subscription.grace_reason = None
    subscription.paused_at = None
    subscription.pause_reason = None


def apply_state_overrides(
    subscription: Subscription,
    *,
    now: datetime,
    status: str | None = None,
    access_state: str | None = None,
    grace_until: datetime | None = None,
    grace_reason: str | None = None,
) -> None:
    target_status = status or commercial_status(subscription)
    target_access = access_state or access_status(subscription)

    if target_status == "pending":
        normalize_pending_state(subscription)
        return
    if target_status == "cancelled":
        mark_cancelled(subscription)
        return
    if target_status == "expired":
        if target_access == "grace":
            start_grace_period(
                subscription,
                now=now,
                grace_until=grace_until or getattr(subscription, "grace_until", None) or now,
                reason=grace_reason or getattr(subscription, "grace_reason", None) or "admin_override",
            )
            return
        subscription.status = "expired"
        subscription.subscription_status = "expired"
        subscription.cancel_at_period_end = False
        block_access(subscription)
        return
    if target_status == "active":
        if target_access == "paused":
            normalize_active_state(subscription)
            mark_paused(
                subscription,
                now=getattr(subscription, "paused_at", None) or now,
                reason=getattr(subscription, "pause_reason", None),
            )
            return
        if target_access == "grace":
            start_grace_period(
                subscription,
                now=now,
                grace_until=grace_until or getattr(subscription, "grace_until", None) or now,
                reason=grace_reason or getattr(subscription, "grace_reason", None) or "admin_override",
            )
            return
        normalize_active_state(subscription)
        if target_access == "blocked":
            block_access(subscription)
            subscription.status = "active"
            subscription.subscription_status = "active"
        return


def apply_subscription_cycle(
    subscription: Subscription,
    *,
    now: datetime,
    duration_days: int,
    device_limit: int | None = None,
) -> bool:
    was_active = is_commercially_active(subscription)
    base = (
        subscription.valid_until
        if was_active and getattr(subscription, "valid_until", None) and subscription.valid_until > now
        else now
    )
    normalize_active_state(subscription)
    if not was_active:
        subscription.valid_from = now
    subscription.valid_until = base + timedelta(days=duration_days)
    if device_limit is not None:
        subscription.device_limit = int(device_limit)
    return was_active


def is_entitled_active(subscription: Subscription, *, now: datetime | None = None) -> bool:
    current_time = now or datetime.now(timezone.utc)
    valid_until = getattr(subscription, "valid_until", None)
    return (
        is_commercially_active(subscription)
        and is_access_enabled(subscription)
        and valid_until is not None
        and valid_until > current_time
    )


def is_restorable(subscription: Subscription, *, now: datetime | None = None) -> bool:
    current_time = now or datetime.now(timezone.utc)
    if commercial_status(subscription) == "expired":
        return True
    if not is_in_grace(subscription):
        return False
    grace_until = getattr(subscription, "grace_until", None)
    return grace_until is None or grace_until > current_time


def primary_sort_key(subscription: Subscription) -> tuple[int, float]:
    if is_commercially_active(subscription) and is_access_enabled(subscription):
        priority = 0
    elif is_in_grace(subscription):
        priority = 1
    elif is_paused(subscription) and is_commercially_active(subscription):
        priority = 2
    elif bool(getattr(subscription, "cancel_at_period_end", False)) and is_commercially_active(
        subscription
    ):
        priority = 3
    elif commercial_status(subscription) == "pending":
        priority = 4
    elif commercial_status(subscription) == "expired":
        priority = 5
    else:
        priority = 6
    valid_until = getattr(subscription, "valid_until", None)
    valid_until_ts = valid_until.timestamp() if valid_until else 0.0
    return (priority, -valid_until_ts)


def sort_subscriptions(subscriptions: Iterable[Subscription]) -> list[Subscription]:
    return sorted(subscriptions, key=primary_sort_key)


def pick_primary_subscription(subscriptions: Iterable[Subscription]) -> Subscription | None:
    ordered = sort_subscriptions(subscriptions)
    return ordered[0] if ordered else None
