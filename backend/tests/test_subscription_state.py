from __future__ import annotations

import uuid
from datetime import datetime, timedelta, timezone
from decimal import Decimal
from types import SimpleNamespace

import pytest
from httpx import ASGITransport, AsyncClient
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import create_webapp_session_token
from app.main import app
from app.models import Device, EntitlementEvent, FunnelEvent, Plan, Subscription, User
from app.schemas.subscription import SubscriptionOut
from app.services.issued_config_service import persist_issued_configs
from app.services.subscription_lifecycle_events import (
    emit_access_blocked,
    emit_payment_lifecycle,
    emit_referral_reward_applied,
)
from app.services.subscription_state import (
    apply_state_overrides,
    apply_subscription_cycle,
    block_access,
    commercially_active_where,
    entitled_active_where,
    is_entitled_active,
    is_restorable,
    mark_cancel_at_period_end,
    mark_cancelled,
    mark_paused,
    normalize_active_state,
    normalize_pending_state,
    pick_primary_subscription,
    resume_active_access,
    start_grace_period,
)


def _subscription(
    *,
    valid_until: datetime,
    status: str = "active",
    subscription_status: str | None = None,
    access_status: str | None = None,
    cancel_at_period_end: bool = False,
) -> Subscription:
    return Subscription(
        user_id=1,
        plan_id="plan-test",
        valid_from=datetime.now(timezone.utc),
        valid_until=valid_until,
        device_limit=1,
        status=status,
        subscription_status=subscription_status or status,
        access_status=access_status or "enabled",
        billing_status="paid",
        renewal_status="auto_renew_on",
        cancel_at_period_end=cancel_at_period_end,
    )


def test_pick_primary_subscription_prefers_enabled_access_over_paused_newer():
    now = datetime.now(timezone.utc)
    paused = _subscription(
        valid_until=now + timedelta(days=90),
        subscription_status="active",
        access_status="paused",
    )
    enabled = _subscription(
        valid_until=now + timedelta(days=30),
        subscription_status="active",
        access_status="enabled",
    )

    primary = pick_primary_subscription([paused, enabled])

    assert primary is enabled


def test_subscription_state_helpers_handle_entitled_and_restorable_states():
    now = datetime.now(timezone.utc)
    entitled = _subscription(valid_until=now + timedelta(days=7))
    paused = _subscription(
        valid_until=now + timedelta(days=7),
        subscription_status="active",
        access_status="paused",
    )
    grace = _subscription(
        valid_until=now - timedelta(days=1),
        status="expired",
        subscription_status="expired",
        access_status="grace",
    )
    grace.grace_until = now + timedelta(hours=12)

    assert is_entitled_active(entitled, now=now) is True
    assert is_entitled_active(paused, now=now) is False
    assert is_restorable(grace, now=now) is True


def test_subscription_state_sql_helpers_encode_canonical_filters():
    now = datetime.now(timezone.utc)
    entitled_sql = str(
        select(Subscription.id).where(*entitled_active_where(now=now)).compile(
            compile_kwargs={"literal_binds": True}
        )
    )
    commercially_active_sql = str(
        select(Subscription.id).where(*commercially_active_where(now=now)).compile(
            compile_kwargs={"literal_binds": True}
        )
    )

    assert "subscription_status = 'active'" in entitled_sql
    assert "access_status = 'enabled'" in entitled_sql
    assert "valid_until" in entitled_sql
    assert "access_status = 'enabled'" not in commercially_active_sql


def test_normalize_active_state_clears_pause_grace_and_sets_split_fields():
    now = datetime.now(timezone.utc)
    sub = Subscription(
        user_id=1,
        plan_id="plan-test",
        valid_from=now - timedelta(days=10),
        valid_until=now - timedelta(days=1),
        device_limit=1,
        status="expired",
        subscription_status="expired",
        access_status="grace",
        billing_status="unpaid",
        renewal_status="auto_renew_off",
        cancel_at_period_end=True,
        grace_until=now + timedelta(days=1),
        grace_reason="expired",
        paused_at=now - timedelta(days=2),
        pause_reason="user_request",
    )
    sub.auto_renew = True

    normalize_active_state(sub)

    assert sub.status == "active"
    assert sub.subscription_status == "active"
    assert sub.access_status == "enabled"
    assert sub.billing_status == "paid"
    assert sub.renewal_status == "auto_renew_on"
    assert sub.cancel_at_period_end is False
    assert sub.grace_until is None
    assert sub.grace_reason is None
    assert sub.paused_at is None
    assert sub.pause_reason is None


def test_apply_subscription_cycle_extends_active_and_resets_inactive_subscription():
    now = datetime.now(timezone.utc)
    active = _subscription(valid_until=now + timedelta(days=5))
    inactive = _subscription(
        valid_until=now - timedelta(days=2),
        status="pending",
        subscription_status="pending",
        access_status="blocked",
    )
    inactive.auto_renew = False

    was_active = apply_subscription_cycle(active, now=now, duration_days=30, device_limit=3)
    was_inactive = apply_subscription_cycle(inactive, now=now, duration_days=30, device_limit=2)

    assert was_active is True
    assert active.valid_until > now + timedelta(days=34)
    assert active.device_limit == 3
    assert was_inactive is False
    assert inactive.status == "active"
    assert inactive.subscription_status == "active"
    assert inactive.access_status == "enabled"
    assert inactive.billing_status == "paid"
    assert inactive.renewal_status == "auto_renew_off"
    assert inactive.valid_from == now
    assert inactive.valid_until == now + timedelta(days=30)
    assert inactive.device_limit == 2


def test_pause_cancel_and_grace_helpers_keep_split_state_consistent():
    now = datetime.now(timezone.utc)
    sub = _subscription(valid_until=now + timedelta(days=10))

    mark_paused(sub, now=now, reason="user_request")
    assert sub.access_status == "paused"
    assert sub.paused_at == now
    assert sub.pause_reason == "user_request"

    resume_active_access(sub)
    assert sub.access_status == "enabled"
    assert sub.paused_at is None
    assert sub.pause_reason is None

    mark_cancel_at_period_end(sub)
    assert sub.status == "active"
    assert sub.subscription_status == "active"
    assert sub.access_status == "enabled"
    assert sub.cancel_at_period_end is True

    grace_until = now + timedelta(hours=24)
    start_grace_period(sub, now=now, grace_until=grace_until, reason="period_end")
    assert sub.status == "expired"
    assert sub.subscription_status == "expired"
    assert sub.access_status == "grace"
    assert sub.grace_until == grace_until
    assert sub.grace_reason == "period_end"
    assert sub.cancel_at_period_end is False

    block_access(sub)
    assert sub.access_status == "blocked"
    assert sub.grace_until is None
    assert sub.grace_reason is None

    mark_cancelled(sub)
    assert sub.status == "cancelled"
    assert sub.subscription_status == "cancelled"
    assert sub.access_status == "blocked"
    assert sub.cancel_at_period_end is False


def test_normalize_pending_state_blocks_access_and_sets_unpaid_split_fields():
    now = datetime.now(timezone.utc)
    sub = Subscription(
        user_id=1,
        plan_id="plan-test",
        valid_from=now,
        valid_until=now,
        device_limit=1,
        status="active",
        subscription_status="active",
        access_status="enabled",
        billing_status="paid",
        renewal_status="auto_renew_on",
        cancel_at_period_end=True,
        grace_until=now + timedelta(days=1),
        grace_reason="period_end",
        paused_at=now,
        pause_reason="user_request",
    )
    sub.auto_renew = False

    normalize_pending_state(sub)

    assert sub.status == "pending"
    assert sub.subscription_status == "pending"
    assert sub.access_status == "blocked"
    assert sub.billing_status == "unpaid"
    assert sub.renewal_status == "auto_renew_off"
    assert sub.cancel_at_period_end is False
    assert sub.grace_until is None
    assert sub.grace_reason is None
    assert sub.paused_at is None
    assert sub.pause_reason is None


def test_apply_state_overrides_normalizes_admin_status_changes():
    now = datetime.now(timezone.utc)
    sub = _subscription(valid_until=now + timedelta(days=10))
    sub.auto_renew = False

    apply_state_overrides(
        sub,
        now=now,
        status="cancelled",
    )
    assert sub.status == "cancelled"
    assert sub.subscription_status == "cancelled"
    assert sub.access_status == "blocked"

    apply_state_overrides(
        sub,
        now=now,
        status="pending",
    )
    assert sub.status == "pending"
    assert sub.subscription_status == "pending"
    assert sub.access_status == "blocked"
    assert sub.billing_status == "unpaid"

    grace_until = now + timedelta(hours=12)
    apply_state_overrides(
        sub,
        now=now,
        status="expired",
        access_state="grace",
        grace_until=grace_until,
        grace_reason="period_end",
    )
    assert sub.status == "expired"
    assert sub.subscription_status == "expired"
    assert sub.access_status == "grace"
    assert sub.grace_until == grace_until
    assert sub.grace_reason == "period_end"

    apply_state_overrides(
        sub,
        now=now,
        status="active",
        access_state="blocked",
    )
    assert sub.status == "active"
    assert sub.subscription_status == "active"
    assert sub.access_status == "blocked"
    assert sub.billing_status == "paid"
    assert sub.renewal_status == "auto_renew_off"


def test_subscription_out_effective_status_uses_split_state():
    now = datetime.now(timezone.utc)

    paused = SubscriptionOut(
        id="sub-paused",
        user_id=1,
        plan_id="plan-test",
        valid_from=now,
        valid_until=now + timedelta(days=7),
        device_limit=1,
        status="active",
        created_at=now,
        subscription_status="active",
        access_status="paused",
        billing_status="paid",
        renewal_status="auto_renew_on",
    )
    grace = SubscriptionOut(
        id="sub-grace",
        user_id=1,
        plan_id="plan-test",
        valid_from=now - timedelta(days=30),
        valid_until=now - timedelta(days=1),
        device_limit=1,
        status="expired",
        created_at=now,
        subscription_status="expired",
        access_status="grace",
        billing_status="paid",
        renewal_status="auto_renew_on",
        grace_until=now + timedelta(hours=12),
    )
    scheduled_cancel = SubscriptionOut(
        id="sub-cancel-at-end",
        user_id=1,
        plan_id="plan-test",
        valid_from=now,
        valid_until=now + timedelta(days=7),
        device_limit=1,
        status="active",
        created_at=now,
        subscription_status="active",
        access_status="enabled",
        billing_status="paid",
        renewal_status="auto_renew_on",
        cancel_at_period_end=True,
    )
    blocked = SubscriptionOut(
        id="sub-blocked",
        user_id=1,
        plan_id="plan-test",
        valid_from=now,
        valid_until=now + timedelta(days=7),
        device_limit=1,
        status="active",
        created_at=now,
        subscription_status="active",
        access_status="blocked",
        billing_status="paid",
        renewal_status="auto_renew_on",
    )

    assert paused.effective_status == "paused"
    assert grace.effective_status == "grace"
    assert scheduled_cancel.effective_status == "cancel_at_period_end"
    assert blocked.effective_status == "blocked"


@pytest.mark.asyncio
async def test_lifecycle_event_helpers_write_expected_rows(async_session: AsyncSession):
    now = datetime.now(timezone.utc)
    user = User(tg_id=int(uuid.uuid4().int % 10_000_000_000))
    async_session.add(user)
    await async_session.flush()
    plan = Plan(
        id=uuid.uuid4().hex[:32],
        name="Pro",
        duration_days=30,
        price_currency="XTR",
        price_amount=Decimal("100"),
    )
    async_session.add(plan)
    await async_session.flush()
    sub = Subscription(
        id=uuid.uuid4().hex[:32],
        user_id=user.id,
        plan_id=plan.id,
        valid_from=now,
        valid_until=now + timedelta(days=30),
        device_limit=1,
        status="active",
        subscription_status="active",
        access_status="enabled",
        billing_status="paid",
        renewal_status="auto_renew_on",
    )
    async_session.add(sub)
    await async_session.flush()

    await emit_payment_lifecycle(
        async_session,
        subscription=sub,
        activated=True,
        grace_converted=True,
    )
    await emit_access_blocked(
        async_session,
        subscription_id=sub.id,
        user_id=user.id,
        reason="user_request",
    )
    await emit_referral_reward_applied(
        async_session,
        subscription_id=sub.id,
        user_id=user.id,
        referral_id=123,
        days=7,
    )
    await async_session.commit()

    entitlement_rows = (
        await async_session.execute(
            select(EntitlementEvent.event_type, EntitlementEvent.payload)
            .where(EntitlementEvent.user_id == user.id)
            .order_by(EntitlementEvent.created_at.asc())
        )
    ).all()
    funnel_rows = (
        await async_session.execute(
            select(FunnelEvent.event_type, FunnelEvent.payload)
            .where(FunnelEvent.user_id == user.id)
            .order_by(FunnelEvent.created_at.asc())
        )
    ).all()

    assert [row[0] for row in entitlement_rows] == [
        "subscription_activated",
        "access_blocked",
        "referral_reward_applied",
    ]
    assert [row[0] for row in funnel_rows] == [
        "payment",
        "renewal",
        "grace_converted",
        "referral_reward_applied",
    ]
    assert entitlement_rows[-1][1]["days"] == 7
    assert funnel_rows[-1][1]["referral_id"] == 123


@pytest.mark.asyncio
async def test_webapp_me_sorts_primary_subscription_and_routes_from_enabled_access(
    async_session: AsyncSession,
):
    now = datetime.now(timezone.utc)
    tg_id = int(uuid.uuid4().int % 10_000_000_000)
    user = User(tg_id=tg_id)
    async_session.add(user)
    await async_session.flush()
    plan = Plan(
        id=uuid.uuid4().hex[:32],
        name="Pro",
        duration_days=30,
        price_currency="XTR",
        price_amount=Decimal("100"),
    )
    async_session.add(plan)
    await async_session.flush()
    paused = Subscription(
        id=uuid.uuid4().hex[:32],
        user_id=user.id,
        plan_id=plan.id,
        valid_from=now,
        valid_until=now + timedelta(days=60),
        device_limit=1,
        status="active",
        subscription_status="active",
        access_status="paused",
        billing_status="paid",
        renewal_status="auto_renew_on",
        paused_at=now,
    )
    enabled = Subscription(
        id=uuid.uuid4().hex[:32],
        user_id=user.id,
        plan_id=plan.id,
        valid_from=now,
        valid_until=now + timedelta(days=30),
        device_limit=1,
        status="active",
        subscription_status="active",
        access_status="enabled",
        billing_status="paid",
        renewal_status="auto_renew_on",
    )
    async_session.add_all([paused, enabled])
    await async_session.commit()

    token = create_webapp_session_token(tg_id)

    async def override_get_db():
        yield async_session

    app.dependency_overrides[get_db] = override_get_db
    try:
        async with AsyncClient(
            transport=ASGITransport(app=app),
            base_url="http://test",
            timeout=5.0,
        ) as client:
            response = await client.get(
                "/api/v1/webapp/me",
                headers={"Authorization": f"Bearer {token}"},
            )
        assert response.status_code == 200, response.text
        payload = response.json()
        assert payload["subscriptions"][0]["id"] == enabled.id
        assert payload["routing"]["recommended_route"] == "/devices/issue"
        assert payload["routing"]["reason"] == "no_device"
    finally:
        app.dependency_overrides.pop(get_db, None)


@pytest.mark.asyncio
async def test_webapp_me_routes_no_subscription_to_plan(async_session: AsyncSession) -> None:
    """When user has no subscriptions, routing should point to /plan."""
    tg_id = int(uuid.uuid4().int % 10_000_000_000)
    user = User(tg_id=tg_id)
    async_session.add(user)
    await async_session.commit()

    token = create_webapp_session_token(tg_id)

    async def override_get_db():
        yield async_session

    app.dependency_overrides[get_db] = override_get_db
    try:
        async with AsyncClient(
            transport=ASGITransport(app=app),
            base_url="http://test",
            timeout=5.0,
        ) as client:
            response = await client.get(
                "/api/v1/webapp/me",
                headers={"Authorization": f"Bearer {token}"},
            )
        assert response.status_code == 200, response.text
        payload = response.json()
        assert payload["subscriptions"] == []
        assert payload["routing"]["recommended_route"] == "/plan"
        assert payload["routing"]["reason"] == "no_subscription"
    finally:
        app.dependency_overrides.pop(get_db, None)


@pytest.mark.asyncio
async def test_webapp_me_routes_connected_user_with_device_to_home(async_session: AsyncSession) -> None:
    """Active subscription + confirmed device should route to home '/' with connected_user reason."""
    now = datetime.now(timezone.utc)
    tg_id = int(uuid.uuid4().int % 10_000_000_000)
    user = User(tg_id=tg_id)
    async_session.add(user)
    await async_session.flush()

    plan = Plan(
        id=uuid.uuid4().hex[:32],
        name="Pro",
        duration_days=30,
        price_currency="XTR",
        price_amount=Decimal("100"),
    )
    async_session.add(plan)
    await async_session.flush()

    sub = Subscription(
        id=uuid.uuid4().hex[:32],
        user_id=user.id,
        plan_id=plan.id,
        valid_from=now - timedelta(days=1),
        valid_until=now + timedelta(days=29),
        device_limit=1,
        status="active",
        subscription_status="active",
        access_status="enabled",
        billing_status="paid",
        renewal_status="auto_renew_on",
    )
    async_session.add(sub)
    await async_session.flush()

    device = Device(
        id=uuid.uuid4().hex[:32],
        user_id=user.id,
        subscription_id=sub.id,
        server_id="srv-1",
        device_name="test-device",
        public_key="pk",
        allowed_ips="10.8.1.2/32",
        issued_at=now - timedelta(hours=1),
        last_connection_confirmed_at=now - timedelta(minutes=1),
    )
    async_session.add(device)
    await async_session.commit()

    token = create_webapp_session_token(tg_id)

    async def override_get_db():
        yield async_session

    app.dependency_overrides[get_db] = override_get_db
    try:
        async with AsyncClient(
            transport=ASGITransport(app=app),
            base_url="http://test",
            timeout=5.0,
        ) as client:
            response = await client.get(
                "/api/v1/webapp/me",
                headers={"Authorization": f"Bearer {token}"},
            )
        assert response.status_code == 200, response.text
        payload = response.json()
        assert payload["routing"]["recommended_route"] == "/"
        assert payload["routing"]["reason"] == "connected_user"
    finally:
        app.dependency_overrides.pop(get_db, None)


@pytest.mark.asyncio
async def test_webapp_me_includes_latest_device_delivery_when_awg_config_exists(
    async_session: AsyncSession, monkeypatch
) -> None:
    now = datetime.now(timezone.utc)
    tg_id = int(uuid.uuid4().int % 10_000_000_000)
    user = User(tg_id=tg_id)
    async_session.add(user)
    await async_session.flush()

    plan = Plan(
        id=uuid.uuid4().hex[:32],
        name="Pro",
        duration_days=30,
        price_currency="XTR",
        price_amount=Decimal("100"),
    )
    async_session.add(plan)
    await async_session.flush()

    sub = Subscription(
        id=uuid.uuid4().hex[:32],
        user_id=user.id,
        plan_id=plan.id,
        valid_from=now - timedelta(days=1),
        valid_until=now + timedelta(days=29),
        device_limit=1,
        status="active",
        subscription_status="active",
        access_status="enabled",
        billing_status="paid",
        renewal_status="auto_renew_on",
    )
    async_session.add(sub)
    await async_session.flush()

    device = Device(
        id=uuid.uuid4().hex[:32],
        user_id=user.id,
        subscription_id=sub.id,
        server_id="srv-1",
        device_name="MacBook Pro",
        public_key="pk",
        allowed_ips="10.8.1.2/32",
        issued_at=now - timedelta(hours=1),
        last_connection_confirmed_at=now - timedelta(minutes=1),
    )
    async_session.add(device)
    await async_session.flush()
    await persist_issued_configs(
        async_session,
        device_id=device.id,
        server_id=device.server_id,
        config_awg="[Interface]\nPrivateKey = test\nAddress = 10.8.1.2/32\n[Peer]\nPublicKey = server\nAllowedIPs = 0.0.0.0/0\nEndpoint = 203.0.113.10:51820\n",
        config_wg_obf=None,
        config_wg=None,
    )
    await async_session.commit()

    monkeypatch.setattr("app.api.v1.webapp.settings.public_domain", "downloads.example")
    token = create_webapp_session_token(tg_id)

    async def override_get_db():
        yield async_session

    app.dependency_overrides[get_db] = override_get_db
    try:
        async with AsyncClient(
            transport=ASGITransport(app=app),
            base_url="http://test",
            timeout=5.0,
        ) as client:
            response = await client.get(
                "/api/v1/webapp/me",
                headers={"Authorization": f"Bearer {token}"},
            )
        assert response.status_code == 200, response.text
        payload = response.json()
        assert payload["latest_device_delivery"]["device_id"] == device.id
        assert payload["latest_device_delivery"]["device_name"] == "MacBook Pro"
        assert payload["latest_device_delivery"]["amnezia_vpn_key"].startswith("vpn://")
        assert payload["latest_device_delivery"]["download_url"].startswith("https://downloads.example/d/")
    finally:
        app.dependency_overrides.pop(get_db, None)


@pytest.mark.asyncio
async def test_webapp_me_includes_live_connection_from_recent_handshake(
    async_session: AsyncSession, monkeypatch
) -> None:
    now = datetime.now(timezone.utc)
    tg_id = int(uuid.uuid4().int % 10_000_000_000)
    user = User(tg_id=tg_id)
    async_session.add(user)
    await async_session.flush()

    plan = Plan(
        id=uuid.uuid4().hex[:32],
        name="Pro",
        duration_days=30,
        price_currency="XTR",
        price_amount=Decimal("100"),
    )
    async_session.add(plan)
    await async_session.flush()

    sub = Subscription(
        id=uuid.uuid4().hex[:32],
        user_id=user.id,
        plan_id=plan.id,
        valid_from=now - timedelta(days=1),
        valid_until=now + timedelta(days=29),
        device_limit=1,
        status="active",
        subscription_status="active",
        access_status="enabled",
        billing_status="paid",
        renewal_status="auto_renew_on",
    )
    async_session.add(sub)
    await async_session.flush()

    device = Device(
        id=uuid.uuid4().hex[:32],
        user_id=user.id,
        subscription_id=sub.id,
        server_id="srv-1",
        device_name="MacBook Pro",
        public_key="pk",
        allowed_ips="10.8.1.2/32",
        issued_at=now - timedelta(hours=1),
    )
    async_session.add(device)
    await async_session.commit()

    async def _fake_telemetry_bulk(_device_ids):
        return {
            device.id: SimpleNamespace(
                handshake_latest_at=now - timedelta(seconds=30),
                handshake_age_sec=30,
            )
        }

    async def _fake_telemetry_last_updated():
        return now

    monkeypatch.setattr("app.api.v1.webapp.get_device_telemetry_bulk", _fake_telemetry_bulk)
    monkeypatch.setattr("app.api.v1.webapp.get_telemetry_last_updated", _fake_telemetry_last_updated)

    token = create_webapp_session_token(tg_id)

    async def override_get_db():
        yield async_session

    app.dependency_overrides[get_db] = override_get_db
    try:
        async with AsyncClient(
            transport=ASGITransport(app=app),
            base_url="http://test",
            timeout=5.0,
        ) as client:
            response = await client.get(
                "/api/v1/webapp/me",
                headers={"Authorization": f"Bearer {token}"},
            )
        assert response.status_code == 200, response.text
        payload = response.json()
        assert payload["live_connection"]["status"] == "connected"
        assert payload["live_connection"]["source"] == "server_handshake"
        assert payload["live_connection"]["device_id"] == device.id
        assert payload["live_connection"]["handshake_age_sec"] == 30
        assert payload["live_connection"]["telemetry_updated_at"] == now.isoformat()
    finally:
        app.dependency_overrides.pop(get_db, None)


@pytest.mark.asyncio
async def test_webapp_me_marks_live_connection_unknown_when_telemetry_is_stale(
    async_session: AsyncSession, monkeypatch
) -> None:
    now = datetime.now(timezone.utc)
    tg_id = int(uuid.uuid4().int % 10_000_000_000)
    user = User(tg_id=tg_id)
    async_session.add(user)
    await async_session.flush()

    plan = Plan(
        id=uuid.uuid4().hex[:32],
        name="Pro",
        duration_days=30,
        price_currency="XTR",
        price_amount=Decimal("100"),
    )
    async_session.add(plan)
    await async_session.flush()

    sub = Subscription(
        id=uuid.uuid4().hex[:32],
        user_id=user.id,
        plan_id=plan.id,
        valid_from=now - timedelta(days=1),
        valid_until=now + timedelta(days=29),
        device_limit=1,
        status="active",
        subscription_status="active",
        access_status="enabled",
        billing_status="paid",
        renewal_status="auto_renew_on",
    )
    async_session.add(sub)
    await async_session.flush()

    device = Device(
        id=uuid.uuid4().hex[:32],
        user_id=user.id,
        subscription_id=sub.id,
        server_id="srv-1",
        device_name="MacBook Pro",
        public_key="pk",
        allowed_ips="10.8.1.2/32",
        issued_at=now - timedelta(hours=1),
    )
    async_session.add(device)
    await async_session.commit()

    async def _fake_telemetry_bulk(_device_ids):
        return {
            device.id: SimpleNamespace(
                handshake_latest_at=now - timedelta(seconds=30),
                handshake_age_sec=30,
            )
        }

    async def _fake_telemetry_last_updated():
        return now - timedelta(minutes=10)

    monkeypatch.setattr("app.api.v1.webapp.get_device_telemetry_bulk", _fake_telemetry_bulk)
    monkeypatch.setattr("app.api.v1.webapp.get_telemetry_last_updated", _fake_telemetry_last_updated)

    token = create_webapp_session_token(tg_id)

    async def override_get_db():
        yield async_session

    app.dependency_overrides[get_db] = override_get_db
    try:
        async with AsyncClient(
            transport=ASGITransport(app=app),
            base_url="http://test",
            timeout=5.0,
        ) as client:
            response = await client.get(
                "/api/v1/webapp/me",
                headers={"Authorization": f"Bearer {token}"},
            )
        assert response.status_code == 200, response.text
        payload = response.json()
        assert payload["live_connection"]["status"] == "unknown"
        assert payload["live_connection"]["device_id"] == device.id
        assert payload["live_connection"]["last_handshake_at"] == (now - timedelta(seconds=30)).isoformat()
    finally:
        app.dependency_overrides.pop(get_db, None)


@pytest.mark.asyncio
async def test_webapp_me_omits_latest_device_delivery_without_awg_config(
    async_session: AsyncSession,
) -> None:
    now = datetime.now(timezone.utc)
    tg_id = int(uuid.uuid4().int % 10_000_000_000)
    user = User(tg_id=tg_id)
    async_session.add(user)
    await async_session.flush()

    plan = Plan(
        id=uuid.uuid4().hex[:32],
        name="Pro",
        duration_days=30,
        price_currency="XTR",
        price_amount=Decimal("100"),
    )
    async_session.add(plan)
    await async_session.flush()

    sub = Subscription(
        id=uuid.uuid4().hex[:32],
        user_id=user.id,
        plan_id=plan.id,
        valid_from=now - timedelta(days=1),
        valid_until=now + timedelta(days=29),
        device_limit=1,
        status="active",
        subscription_status="active",
        access_status="enabled",
        billing_status="paid",
        renewal_status="auto_renew_on",
    )
    async_session.add(sub)
    await async_session.flush()

    device = Device(
        id=uuid.uuid4().hex[:32],
        user_id=user.id,
        subscription_id=sub.id,
        server_id="srv-1",
        device_name="MacBook Pro",
        public_key="pk",
        allowed_ips="10.8.1.2/32",
        issued_at=now - timedelta(hours=1),
        last_connection_confirmed_at=now - timedelta(minutes=1),
    )
    async_session.add(device)
    await async_session.commit()

    token = create_webapp_session_token(tg_id)

    async def override_get_db():
        yield async_session

    app.dependency_overrides[get_db] = override_get_db
    try:
        async with AsyncClient(
            transport=ASGITransport(app=app),
            base_url="http://test",
            timeout=5.0,
        ) as client:
            response = await client.get(
                "/api/v1/webapp/me",
                headers={"Authorization": f"Bearer {token}"},
            )
        assert response.status_code == 200, response.text
        payload = response.json()
        assert payload["latest_device_delivery"] is None
    finally:
        app.dependency_overrides.pop(get_db, None)


@pytest.mark.asyncio
async def test_webapp_me_routes_paused_subscription_to_settings(async_session: AsyncSession):
    now = datetime.now(timezone.utc)
    tg_id = int(uuid.uuid4().int % 10_000_000_000)
    user = User(tg_id=tg_id)
    async_session.add(user)
    await async_session.flush()
    plan = Plan(
        id=uuid.uuid4().hex[:32],
        name="Pro",
        duration_days=30,
        price_currency="XTR",
        price_amount=Decimal("100"),
    )
    async_session.add(plan)
    await async_session.flush()
    sub = Subscription(
        id=uuid.uuid4().hex[:32],
        user_id=user.id,
        plan_id=plan.id,
        valid_from=now,
        valid_until=now + timedelta(days=30),
        device_limit=1,
        status="active",
        subscription_status="active",
        access_status="paused",
        billing_status="paid",
        renewal_status="auto_renew_on",
        paused_at=now,
    )
    async_session.add(sub)
    await async_session.commit()

    token = create_webapp_session_token(tg_id)

    async def override_get_db():
        yield async_session

    app.dependency_overrides[get_db] = override_get_db
    try:
        async with AsyncClient(
            transport=ASGITransport(app=app),
            base_url="http://test",
            timeout=5.0,
        ) as client:
            response = await client.get(
                "/api/v1/webapp/me",
                headers={"Authorization": f"Bearer {token}"},
            )
        assert response.status_code == 200, response.text
        payload = response.json()
        assert payload["routing"]["recommended_route"] == "/settings"
        assert payload["routing"]["reason"] == "paused_access"
    finally:
        app.dependency_overrides.pop(get_db, None)


@pytest.mark.asyncio
async def test_webapp_subscription_offers_prefers_enabled_active_subscription(
    async_session: AsyncSession,
):
    now = datetime.now(timezone.utc)
    tg_id = int(uuid.uuid4().int % 10_000_000_000)
    user = User(tg_id=tg_id)
    async_session.add(user)
    await async_session.flush()
    plan = Plan(
        id=uuid.uuid4().hex[:32],
        name="Pro",
        duration_days=30,
        price_currency="XTR",
        price_amount=Decimal("100"),
    )
    async_session.add(plan)
    await async_session.flush()
    paused = Subscription(
        id=uuid.uuid4().hex[:32],
        user_id=user.id,
        plan_id=plan.id,
        valid_from=now,
        valid_until=now + timedelta(days=90),
        device_limit=1,
        status="active",
        subscription_status="active",
        access_status="paused",
        billing_status="paid",
        renewal_status="auto_renew_on",
        paused_at=now,
    )
    enabled = Subscription(
        id=uuid.uuid4().hex[:32],
        user_id=user.id,
        plan_id=plan.id,
        valid_from=now,
        valid_until=now + timedelta(days=7),
        device_limit=1,
        status="active",
        subscription_status="active",
        access_status="enabled",
        billing_status="paid",
        renewal_status="auto_renew_on",
    )
    async_session.add_all([paused, enabled])
    await async_session.commit()

    token = create_webapp_session_token(tg_id)

    async def override_get_db():
        yield async_session

    app.dependency_overrides[get_db] = override_get_db
    try:
        async with AsyncClient(
            transport=ASGITransport(app=app),
            base_url="http://test",
            timeout=5.0,
        ) as client:
            response = await client.get(
                "/api/v1/webapp/subscription/offers",
                headers={"Authorization": f"Bearer {token}"},
            )
        assert response.status_code == 200, response.text
        payload = response.json()
        assert payload["subscription_id"] == enabled.id
        assert payload["can_pause"] is True
        assert payload["can_resume"] is False
    finally:
        app.dependency_overrides.pop(get_db, None)
