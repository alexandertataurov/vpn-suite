"""Trial: one 24h trial per user, auto-provision subscription + one device + config."""

from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
from decimal import Decimal

from sqlalchemy import select
from sqlalchemy.dialects.postgresql import insert as pg_insert
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.metrics import vpn_revenue_trial_started_total
from app.models import Plan, Server, Subscription, User
from app.services.funnel_service import log_funnel_event
from app.services.issue_service import issue_device


@dataclass
class TrialStartResult:
    subscription_id: str
    device_id: str
    server_id: str
    server_name: str
    server_region: str
    config_awg: str
    config_wg_obf: str
    config_wg: str
    trial_ends_at: datetime
    peer_created: bool


async def start_trial(
    session: AsyncSession,
    *,
    tg_id: int,
    get_topology=None,
    runtime_adapter=None,
) -> TrialStartResult:
    """Create or get user, ensure one trial per user, create 24h trial sub + one device, return configs."""
    now = datetime.now(timezone.utc)
    # Get or create user
    user_result = await session.execute(select(User).where(User.tg_id == tg_id))
    user = user_result.scalar_one_or_none()
    if not user:
        await session.execute(
            pg_insert(User).values(tg_id=tg_id).on_conflict_do_nothing(index_elements=[User.tg_id])
        )
        await session.flush()
        user_result = await session.execute(select(User).where(User.tg_id == tg_id))
        user = user_result.scalar_one_or_none()
        if not user:
            raise ValueError("user_create_failed")
    if user.is_banned:
        raise ValueError("user_banned")

    # One trial per user: any subscription with is_trial=True
    existing_trial = await session.execute(
        select(Subscription).where(
            Subscription.user_id == user.id,
            Subscription.is_trial.is_(True),
        ).limit(1)
    )
    if existing_trial.scalar_one_or_none() is not None:
        raise ValueError("trial_already_used")

    # Trial plan: config or first plan with price <= 0
    plan = None
    if settings.trial_plan_id:
        plan_result = await session.execute(select(Plan).where(Plan.id == settings.trial_plan_id))
        plan = plan_result.scalar_one_or_none()
    if plan is None:
        plan_result = await session.execute(
            select(Plan).where(Plan.price_amount <= Decimal("0")).order_by(Plan.duration_days.asc()).limit(1)
        )
        plan = plan_result.scalar_one_or_none()
    if plan is None:
        raise ValueError("trial_plan_not_found")

    trial_hours = max(1, min(168, settings.trial_duration_hours))
    valid_until = now + timedelta(hours=trial_hours)
    trial_ends_at = valid_until

    sub = Subscription(
        user_id=user.id,
        plan_id=plan.id,
        valid_from=now,
        valid_until=valid_until,
        device_limit=1,
        status="active",
        is_trial=True,
        trial_ends_at=trial_ends_at,
    )
    session.add(sub)
    await session.flush()

    await log_funnel_event(
        session,
        event_type="trial_started",
        user_id=user.id,
        payload={"tg_id": tg_id, "subscription_id": sub.id},
    )
    try:
        vpn_revenue_trial_started_total.inc()
    except Exception:
        pass

    out = await issue_device(
        session,
        user_id=user.id,
        subscription_id=sub.id,
        server_id=None,
        device_name="Trial",
        get_topology=get_topology,
        runtime_adapter=runtime_adapter,
    )

    server_result = await session.execute(select(Server).where(Server.id == out.device.server_id))
    server = server_result.scalar_one_or_none()
    server_name = server.name if server else out.device.server_id
    server_region = server.region if server else ""

    return TrialStartResult(
        subscription_id=sub.id,
        device_id=out.device.id,
        server_id=out.device.server_id,
        server_name=server_name,
        server_region=server_region,
        config_awg=out.config_awg or "",
        config_wg_obf=out.config_wg_obf or "",
        config_wg=out.config_wg or "",
        trial_ends_at=trial_ends_at,
        peer_created=out.peer_created,
    )
