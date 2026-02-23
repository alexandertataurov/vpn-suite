"""Payment/subscription integrity regressions: no pre-payment access, no create-or-get race 500."""

from __future__ import annotations

import asyncio
import uuid
from datetime import datetime, timezone
from decimal import Decimal

import pytest
from httpx import ASGITransport, AsyncClient
from sqlalchemy import select

from app.core import config
from app.core.database import async_session_factory, check_db
from app.main import app
from app.models import AuditLog, Payment, PaymentEvent, Plan


@pytest.fixture
def client():
    return AsyncClient(
        transport=ASGITransport(app=app),
        base_url="http://test",
        timeout=10.0,
    )


async def _create_plan(duration_days: int = 30) -> Plan:
    async with async_session_factory() as db:
        plan = Plan(
            name=f"audit-{uuid.uuid4().hex[:8]}",
            duration_days=duration_days,
            price_currency="XTR",
            price_amount=Decimal("100.00"),
        )
        db.add(plan)
        await db.commit()
        await db.refresh(plan)
        return plan


def _parse_dt(value: str) -> datetime:
    return datetime.fromisoformat(value.replace("Z", "+00:00"))


@pytest.mark.asyncio
async def test_create_or_get_creates_pending_subscription(client: AsyncClient, monkeypatch):
    if not await check_db():
        pytest.skip("DB not available")
    monkeypatch.setattr(config.settings, "bot_api_key", "test-bot-key")
    plan = await _create_plan(duration_days=30)
    tg_id = int(uuid.uuid4().int % 10_000_000_000)

    r = await client.post(
        "/api/v1/bot/subscriptions/create-or-get",
        json={"tg_id": tg_id, "plan_id": plan.id},
        headers={"X-API-Key": "test-bot-key"},
    )
    assert r.status_code == 200, r.text
    data = r.json()
    sub = data["subscription"]
    assert sub["status"] == "pending"
    # Pending window should not carry prepaid entitlement.
    until = _parse_dt(sub["valid_until"])
    now = datetime.now(timezone.utc)
    assert (until - now).total_seconds() < 120


@pytest.mark.asyncio
async def test_pending_subscription_cannot_issue_device_before_payment(
    client: AsyncClient, monkeypatch
):
    if not await check_db():
        pytest.skip("DB not available")
    monkeypatch.setattr(config.settings, "bot_api_key", "test-bot-key")
    plan = await _create_plan(duration_days=30)
    tg_id = int(uuid.uuid4().int % 10_000_000_000)

    r = await client.post(
        "/api/v1/bot/subscriptions/create-or-get",
        json={"tg_id": tg_id, "plan_id": plan.id},
        headers={"X-API-Key": "test-bot-key"},
    )
    assert r.status_code == 200, r.text
    data = r.json()
    user_id = data["user_id"]
    sub_id = data["subscription_id"]

    issue = await client.post(
        f"/api/v1/users/{user_id}/devices/issue",
        json={"subscription_id": sub_id, "server_id": "dummy-server-id"},
        headers={"X-API-Key": "test-bot-key"},
    )
    assert issue.status_code == 400, issue.text
    assert "subscription" in issue.text.lower()


@pytest.mark.asyncio
async def test_first_completed_webhook_activates_pending_single_period(
    client: AsyncClient, monkeypatch
):
    if not await check_db():
        pytest.skip("DB not available")
    monkeypatch.setattr(config.settings, "bot_api_key", "test-bot-key")
    monkeypatch.setattr(config.settings, "telegram_stars_webhook_secret", "")
    duration_days = 30
    plan = await _create_plan(duration_days=duration_days)
    tg_id = int(uuid.uuid4().int % 10_000_000_000)

    cog = await client.post(
        "/api/v1/bot/subscriptions/create-or-get",
        json={"tg_id": tg_id, "plan_id": plan.id},
        headers={"X-API-Key": "test-bot-key"},
    )
    assert cog.status_code == 200, cog.text
    sub = cog.json()["subscription"]
    sub_id = cog.json()["subscription_id"]
    user_id = cog.json()["user_id"]
    before_until = _parse_dt(sub["valid_until"])

    webhook = await client.post(
        "/webhooks/payments/telegram_stars",
        json={
            "external_id": f"audit-{uuid.uuid4().hex}",
            "user_id": user_id,
            "subscription_id": sub_id,
            "amount": 100,
            "currency": "XTR",
            "status": "completed",
        },
    )
    assert webhook.status_code == 200, webhook.text
    assert webhook.json().get("created") is True

    user = await client.get(
        f"/api/v1/users/by-tg/{tg_id}",
        headers={"X-API-Key": "test-bot-key"},
    )
    assert user.status_code == 200, user.text
    subs = user.json().get("subscriptions") or []
    sub_after = next(s for s in subs if s["id"] == sub_id)
    assert sub_after["status"] == "active"
    after_until = _parse_dt(sub_after["valid_until"])
    delta_days = (after_until - before_until).total_seconds() / 86400
    assert delta_days >= duration_days - 0.1
    assert delta_days <= duration_days + 0.5


@pytest.mark.asyncio
async def test_webhook_replay_is_idempotent_and_audited(client: AsyncClient, monkeypatch):
    """Same external_id must be safe to replay: 200, created=false, no double extension, audit logged."""
    if not await check_db():
        pytest.skip("DB not available")
    monkeypatch.setattr(config.settings, "bot_api_key", "test-bot-key")
    monkeypatch.setattr(config.settings, "telegram_stars_webhook_secret", "")

    plan = await _create_plan(duration_days=30)
    tg_id = int(uuid.uuid4().int % 10_000_000_000)

    cog = await client.post(
        "/api/v1/bot/subscriptions/create-or-get",
        json={"tg_id": tg_id, "plan_id": plan.id},
        headers={"X-API-Key": "test-bot-key"},
    )
    assert cog.status_code == 200, cog.text
    sub_id = cog.json()["subscription_id"]
    user_id = cog.json()["user_id"]

    external_id = f"audit-replay-{uuid.uuid4().hex}"
    payload = {
        "external_id": external_id,
        "user_id": user_id,
        "subscription_id": sub_id,
        "amount": 100,
        "currency": "XTR",
        "status": "completed",
    }

    first = await client.post("/webhooks/payments/telegram_stars", json=payload)
    assert first.status_code == 200, first.text
    assert first.json().get("created") is True

    user = await client.get(
        f"/api/v1/users/by-tg/{tg_id}",
        headers={"X-API-Key": "test-bot-key"},
    )
    assert user.status_code == 200, user.text
    subs = user.json().get("subscriptions") or []
    after_first = next(s for s in subs if s["id"] == sub_id)
    until_first = _parse_dt(after_first["valid_until"])

    second = await client.post("/webhooks/payments/telegram_stars", json=payload)
    assert second.status_code == 200, second.text
    assert second.json().get("created") is False

    user2 = await client.get(
        f"/api/v1/users/by-tg/{tg_id}",
        headers={"X-API-Key": "test-bot-key"},
    )
    assert user2.status_code == 200, user2.text
    subs2 = user2.json().get("subscriptions") or []
    after_second = next(s for s in subs2 if s["id"] == sub_id)
    until_second = _parse_dt(after_second["valid_until"])
    # Replay must not extend subscription again.
    assert abs((until_second - until_first).total_seconds()) < 2.0

    async with async_session_factory() as db:
        row = await db.execute(select(Payment).where(Payment.external_id == external_id))
        payment = row.scalar_one_or_none()
        assert payment is not None

        ev = await db.execute(
            select(PaymentEvent.event_type).where(PaymentEvent.payment_id == payment.id)
        )
        types = [r[0] for r in ev.all()]
        assert "webhook_received" in types
        assert "webhook_repeat" in types

        aud = await db.execute(
            select(AuditLog.action, AuditLog.old_new)
            .where(
                AuditLog.resource_type == "payment",
                AuditLog.resource_id == str(payment.id),
                AuditLog.admin_id == "webhook",
            )
            .order_by(AuditLog.id.desc())
            .limit(5)
        )
        rows = aud.all()
        assert rows, "expected audit log rows for webhook"
        assert any("webhooks/payments" in (a or "") for a, _ in rows)


@pytest.mark.asyncio
async def test_create_or_get_concurrent_requests_no_500(monkeypatch):
    if not await check_db():
        pytest.skip("DB not available")
    monkeypatch.setattr(config.settings, "bot_api_key", "test-bot-key")
    plan = await _create_plan(duration_days=30)
    tg_id = int(uuid.uuid4().int % 10_000_000_000)

    async def _call_once():
        async with AsyncClient(
            transport=ASGITransport(app=app),
            base_url="http://test",
            timeout=10.0,
        ) as c:
            return await c.post(
                "/api/v1/bot/subscriptions/create-or-get",
                json={"tg_id": tg_id, "plan_id": plan.id},
                headers={"X-API-Key": "test-bot-key"},
            )

    responses = await asyncio.gather(*[_call_once() for _ in range(6)])
    statuses = [r.status_code for r in responses]
    assert all(code == 200 for code in statuses), statuses
    sub_ids = {r.json()["subscription_id"] for r in responses}
    assert len(sub_ids) == 1


@pytest.mark.asyncio
async def test_webhook_concurrent_replay_single_payment(client: AsyncClient, monkeypatch):
    """Concurrent webhooks with same external_id: both 200, exactly one Payment, one subscription extension."""
    if not await check_db():
        pytest.skip("DB not available")
    monkeypatch.setattr(config.settings, "bot_api_key", "test-bot-key")
    monkeypatch.setattr(config.settings, "telegram_stars_webhook_secret", "")

    plan = await _create_plan(duration_days=30)
    tg_id = int(uuid.uuid4().int % 10_000_000_000)

    cog = await client.post(
        "/api/v1/bot/subscriptions/create-or-get",
        json={"tg_id": tg_id, "plan_id": plan.id},
        headers={"X-API-Key": "test-bot-key"},
    )
    assert cog.status_code == 200, cog.text
    sub_id = cog.json()["subscription_id"]
    user_id = cog.json()["user_id"]

    external_id = f"concurrent-{uuid.uuid4().hex}"
    payload = {
        "external_id": external_id,
        "user_id": user_id,
        "subscription_id": sub_id,
        "amount": 100,
        "currency": "XTR",
        "status": "completed",
    }

    async def post_webhook():
        return await client.post("/webhooks/payments/telegram_stars", json=payload)

    results = await asyncio.gather(post_webhook(), post_webhook())
    assert all(r.status_code == 200 for r in results), [r.status_code for r in results]
    created_flags = [r.json().get("created") for r in results]
    assert sum(1 for c in created_flags if c is True) == 1
    assert sum(1 for c in created_flags if c is False) == 1

    async with async_session_factory() as db:
        row = await db.execute(select(Payment).where(Payment.external_id == external_id))
        payments = list(row.scalars().unique().all())
        assert len(payments) == 1


@pytest.mark.asyncio
async def test_audit_log_webhook_has_required_fields(client: AsyncClient, monkeypatch):
    """After webhook, audit log row has admin_id, action, resource_type, resource_id (audit model correctness)."""
    if not await check_db():
        pytest.skip("DB not available")
    monkeypatch.setattr(config.settings, "bot_api_key", "test-bot-key")
    monkeypatch.setattr(config.settings, "telegram_stars_webhook_secret", "")

    plan = await _create_plan(duration_days=7)
    tg_id = int(uuid.uuid4().int % 10_000_000_000)

    cog = await client.post(
        "/api/v1/bot/subscriptions/create-or-get",
        json={"tg_id": tg_id, "plan_id": plan.id},
        headers={"X-API-Key": "test-bot-key"},
    )
    assert cog.status_code == 200, cog.text
    ext_id = f"audit-model-{uuid.uuid4().hex}"
    r = await client.post(
        "/webhooks/payments/telegram_stars",
        json={
            "external_id": ext_id,
            "user_id": cog.json()["user_id"],
            "subscription_id": cog.json()["subscription_id"],
            "amount": 50,
            "currency": "XTR",
            "status": "completed",
        },
    )
    assert r.status_code == 200, r.text
    payment_id = r.json().get("payment_id")
    assert payment_id

    async with async_session_factory() as db:
        aud = await db.execute(
            select(AuditLog)
            .where(
                AuditLog.resource_type == "payment",
                AuditLog.resource_id == str(payment_id),
                AuditLog.admin_id == "webhook",
            )
            .order_by(AuditLog.id.desc())
            .limit(1)
        )
        entry = aud.scalar_one_or_none()
        assert entry is not None
        assert entry.admin_id == "webhook"
        assert entry.action is not None and len(entry.action) > 0
        assert entry.resource_type == "payment"
        assert entry.resource_id == str(payment_id)
        assert entry.old_new is None or isinstance(entry.old_new, dict)
