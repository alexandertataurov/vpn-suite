"""Abuse detection: compute signals and risk score per user, persist abuse_signals."""

from __future__ import annotations

import math
from collections import defaultdict
from datetime import datetime, timedelta, timezone

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import AbuseSignal, Device, Payment, Referral, Subscription
from app.services.subscription_state import entitled_active_where


def _median(values: list[float]) -> float:
    if not values:
        return 0.0
    ordered = sorted(values)
    n = len(ordered)
    mid = n // 2
    if n % 2 == 1:
        return float(ordered[mid])
    return (ordered[mid - 1] + ordered[mid]) / 2.0


def _positive_robust_z(value: float, series: list[float]) -> float:
    if not series:
        return 0.0
    med = _median(series)
    mad = _median([abs(v - med) for v in series])
    scale = 1.4826 * mad
    if scale <= 1e-9:
        mean = sum(series) / float(len(series))
        std = math.sqrt(sum((v - mean) ** 2 for v in series) / float(len(series)))
        scale = std if std > 1e-9 else 1.0
        center = mean
    else:
        center = med
    z = (value - center) / scale
    return max(0.0, float(z))


SIGNAL_WEIGHTS = {
    "shared_config": 0.35,
    "excess_devices": 0.25,
    "peer_regen": 0.20,
    "payment_fraud": 0.15,
    "referral_fraud": 0.05,
}


def _suggested_action(score: float, has_shared: bool, has_excess: bool) -> str:
    if score >= 0.8 or has_shared:
        return "hard_ban"
    if score >= 0.6:
        return "suspend"
    if score >= 0.4 or has_excess:
        return "revoke_peers"
    if score >= 0.2:
        return "throttle"
    return "soft_warning" if score > 0 else "none"


async def run_abuse_detection(session: AsyncSession) -> dict:
    """Compute abuse signals and risk scores; persist to abuse_signals. Returns summary."""
    now = datetime.now(timezone.utc)
    since_24h = now - timedelta(hours=24)
    since_7d = now - timedelta(days=7)

    # Active devices per user with plan device_limit
    device_rows = (
        await session.execute(
            select(
                Device.user_id,
                Device.public_key,
                Device.issued_at,
                Device.server_id,
            ).where(Device.revoked_at.is_(None))
        )
    ).all()

    user_devices: dict[int, list] = defaultdict(list)
    public_key_to_users: dict[str, set[int]] = defaultdict(set)
    user_issued_24h: dict[int, int] = defaultdict(int)

    for r in device_rows:
        uid = int(r.user_id)
        user_devices[uid].append(r)
        public_key_to_users[r.public_key].add(uid)
        if r.issued_at and r.issued_at >= since_24h:
            user_issued_24h[uid] += 1

    # Plan device_limit per user (from active subscription)
    sub_plan = (
        await session.execute(
            select(Subscription.user_id, Subscription.plan_id, Subscription.device_limit).where(
                *entitled_active_where(now=now)
            )
        )
    ).all()
    user_limit: dict[int, int] = {}
    for r in sub_plan:
        uid = int(r[0]) if r[0] is not None else 0
        if uid not in user_limit:
            user_limit[uid] = (r[2] or 1) if (r[2] is not None) else 1

    # Shared config: public_key used by >1 user
    key_reuse_by_user: dict[int, float] = defaultdict(float)
    for _key, users in public_key_to_users.items():
        if len(users) <= 1:
            continue
        for uid in users:
            key_reuse_by_user[uid] += 1.0

    # Failed payments per user (24h)
    failed_payments = (
        await session.execute(
            select(Payment.user_id, func.count())
            .where(Payment.status == "failed", Payment.created_at >= since_24h)
            .group_by(Payment.user_id)
        )
    ).all()
    user_failed_payments = {int(r.user_id): r[1] for r in failed_payments}

    # Referral fraud: referrers with many refs in 7d and reward_applied without clear payment
    ref_counts = (
        await session.execute(
            select(Referral.referrer_user_id, func.count())
            .where(Referral.created_at >= since_7d)
            .group_by(Referral.referrer_user_id)
        )
    ).all()
    user_ref_count = {int(r.referrer_user_id): r[1] for r in ref_counts}

    # Build feature rows
    all_users = (
        set(user_devices.keys()) | set(user_failed_payments.keys()) | set(user_ref_count.keys())
    )
    if not all_users:
        return {"users_scored": 0, "signals_created": 0, "high_risk": 0}

    feature_rows: dict[int, dict[str, float]] = {}
    for uid in all_users:
        devices = user_devices.get(uid, [])
        limit = user_limit.get(uid, 1)
        excess = max(0, len(devices) - limit)
        feature_rows[uid] = {
            "shared_config": float(key_reuse_by_user.get(uid, 0)),
            "excess_devices": float(excess),
            "peer_regen": float(user_issued_24h.get(uid, 0)),
            "payment_fraud": float(user_failed_payments.get(uid, 0)),
            "referral_fraud": float(user_ref_count.get(uid, 0))
            if user_ref_count.get(uid, 0) > 5
            else 0.0,
        }

    # Normalize and score
    feature_names = list(SIGNAL_WEIGHTS.keys())
    series = {n: [feature_rows[u][n] for u in feature_rows] for n in feature_names}
    scored: list[tuple[int, float, list[str]]] = []
    for uid, feats in feature_rows.items():
        z_scores = {n: _positive_robust_z(feats[n], series[n]) for n in feature_names}
        raw = sum(z_scores[n] * SIGNAL_WEIGHTS[n] for n in feature_names)
        score = 1.0 - math.exp(-raw / 3.0)
        score = min(max(score, 0.0), 1.0)
        reasons = [n for n in feature_names if z_scores[n] >= 0.5 and feats[n] > 0]
        scored.append((uid, score, reasons))

    scored.sort(key=lambda x: (x[1], -x[0]), reverse=True)

    # Persist one composite abuse_signal per user with score > 0
    signals_created = 0
    signals_by_severity: dict[str, int] = {"high": 0, "medium": 0, "low": 0}
    for uid, score, reasons in scored:
        if score <= 0:
            continue
        severity = "high" if score >= 0.6 else "medium" if score >= 0.3 else "low"
        signals_by_severity[severity] = signals_by_severity.get(severity, 0) + 1
        has_shared = "shared_config" in reasons
        has_excess = "excess_devices" in reasons and feature_rows[uid]["excess_devices"] > 0
        action = _suggested_action(score, has_shared, has_excess)
        sig = AbuseSignal(
            user_id=uid,
            signal_type="composite",
            severity=severity,
            payload={
                "score": round(score, 4),
                "reasons": reasons,
                "suggested_action": action,
            },
        )
        session.add(sig)
        signals_created += 1

    await session.flush()
    high_risk = sum(1 for _, s, _ in scored if s >= 0.6)
    medium_risk = sum(1 for _, s, _ in scored if 0.3 <= s < 0.6)
    return {
        "users_scored": len(scored),
        "signals_created": signals_created,
        "high_risk": high_risk,
        "medium_risk": medium_risk,
        "signals_by_severity": signals_by_severity,
    }
