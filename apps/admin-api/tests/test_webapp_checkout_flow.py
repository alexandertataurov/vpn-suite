from __future__ import annotations

import uuid
from datetime import datetime, timedelta, timezone
from decimal import Decimal

import pytest
from httpx import ASGITransport, AsyncClient
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import create_webapp_session_token
from app.main import app
from app.models import Payment, Plan, Server, Subscription, User
from app.services.platega_service import PlategaCreateTransactionResult
from app.services.promo_service import PromoCodeError, PromoErrorCode


@pytest.mark.asyncio
async def test_webapp_create_invoice_creates_pending_payment_for_paid_plan(
    async_session: AsyncSession,
) -> None:
    """Paid plan: create-invoice returns invoice payload and persists pending Payment linked to Subscription."""
    now = datetime.now(timezone.utc)
    tg_id = int(uuid.uuid4().int % 10_000_000_000)

    user = User(tg_id=tg_id)
    async_session.add(user)
    await async_session.flush()

    plan = Plan(
        id=uuid.uuid4().hex[:32],
        name="Pro",
        duration_days=30,
        device_limit=3,
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
        device_limit=3,
        status="active",
        subscription_status="active",
        access_status="enabled",
        billing_status="paid",
        renewal_status="auto_renew_on",
    )
    async_session.add(sub)

    server = Server(
        id=uuid.uuid4().hex[:32],
        name="srv",
        region="test",
        api_endpoint="https://vpn-node.example.com/api",
        public_key="xTIBA5rboUvnH4htodjb6e697QjLERt1NAB4mZqp8Dg=",
        vpn_endpoint="vpn.example.com:47604",
        is_active=True,
    )
    async_session.add(server)
    await async_session.commit()

    token = create_webapp_session_token(tg_id)

    async def override_get_db():
        yield async_session

    app.dependency_overrides[get_db] = override_get_db
    try:
        async with AsyncClient(
            transport=ASGITransport(app=app),
            base_url="http://test",
            timeout=10.0,
        ) as client:
            response = await client.post(
                "/api/v1/webapp/payments/create-invoice",
                headers={"Authorization": f"Bearer {token}"},
                json={"plan_id": plan.id},
            )
        assert response.status_code == 200, response.text
        payload = response.json()

        assert payload["plan_id"] == plan.id
        assert payload["subscription_id"] == sub.id
        assert payload["currency"] == "XTR"
        assert payload["free_activation"] is False
        # 100 XTR plan price -> 100 Stars
        assert payload["star_count"] == 100
        assert payload["discounted_price_xtr"] == 100
        assert payload["promo_discount_applied"] == 0
        assert payload["payment_id"]

        result = await async_session.execute(
            select(Payment).where(Payment.id == payload["payment_id"])
        )
        payment = result.scalar_one_or_none()
        assert payment is not None
        assert payment.user_id == user.id
        assert payment.subscription_id == sub.id
        assert payment.status == "pending"
        assert payment.amount == 100.0
        assert payment.currency == "XTR"
    finally:
        app.dependency_overrides.pop(get_db, None)


@pytest.mark.asyncio
async def test_webapp_create_invoice_free_plan_activates_subscription(
    async_session: AsyncSession,
) -> None:
    """Free plan should complete payment immediately and activate subscription without requiring server."""
    now = datetime.now(timezone.utc)
    tg_id = int(uuid.uuid4().int % 10_000_000_000)

    user = User(tg_id=tg_id)
    async_session.add(user)
    await async_session.flush()

    plan = Plan(
        id=uuid.uuid4().hex[:32],
        name="Trial",
        duration_days=7,
        device_limit=1,
        price_currency="XTR",
        price_amount=Decimal("0"),
    )
    async_session.add(plan)
    await async_session.commit()

    token = create_webapp_session_token(tg_id)

    async def override_get_db():
        yield async_session

    app.dependency_overrides[get_db] = override_get_db
    try:
        async with AsyncClient(
            transport=ASGITransport(app=app),
            base_url="http://test",
            timeout=10.0,
        ) as client:
            response = await client.post(
                "/api/v1/webapp/payments/create-invoice",
                headers={"Authorization": f"Bearer {token}"},
                json={"plan_id": plan.id},
            )
        assert response.status_code == 200, response.text
        payload = response.json()

        assert payload["plan_id"] == plan.id
        assert payload["free_activation"] is True
        assert payload["star_count"] == 0
        assert payload["discounted_price_xtr"] == 0

        result = await async_session.execute(
            select(Subscription).where(
                Subscription.user_id == user.id, Subscription.plan_id == plan.id
            )
        )
        sub = result.scalar_one_or_none()
        assert sub is not None
        assert sub.status == "active"
        assert sub.subscription_status == "active"
        assert sub.access_status == "enabled"
        assert sub.valid_until > now

        pay_row = await async_session.execute(
            select(Payment).where(Payment.id == payload["payment_id"])
        )
        payment = pay_row.scalar_one_or_none()
        assert payment is not None
        assert payment.status == "completed"
    finally:
        app.dependency_overrides.pop(get_db, None)


@pytest.mark.asyncio
async def test_webapp_create_invoice_platega_returns_redirect_url(
    async_session: AsyncSession,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    """Platega provider: create-invoice returns redirect URL and persists payment with transactionId."""
    now = datetime.now(timezone.utc)
    tg_id = int(uuid.uuid4().int % 10_000_000_000)
    user = User(tg_id=tg_id)
    async_session.add(user)
    await async_session.flush()

    plan = Plan(
        id=uuid.uuid4().hex[:32],
        name="Pro",
        duration_days=30,
        device_limit=3,
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
        device_limit=3,
        status="active",
        subscription_status="active",
        access_status="enabled",
        billing_status="paid",
        renewal_status="auto_renew_on",
    )
    async_session.add(sub)

    server = Server(
        id=uuid.uuid4().hex[:32],
        name="srv",
        region="test",
        api_endpoint="https://vpn-node.example.com/api",
        public_key="xTIBA5rboUvnH4htodjb6e697QjLERt1NAB4mZqp8Dg=",
        vpn_endpoint="vpn.example.com:47604",
        is_active=True,
    )
    async_session.add(server)
    await async_session.commit()

    monkeypatch.setattr("app.api.v1.webapp.settings.webapp_payment_provider", "platega")
    monkeypatch.setattr("app.api.v1.webapp.settings.platega_return_url", "https://miniapp.example/success")
    monkeypatch.setattr("app.api.v1.webapp.settings.platega_failed_url", "https://miniapp.example/fail")
    monkeypatch.setattr("app.api.v1.webapp.settings.platega_currency", "RUB")

    async def fake_create_platega_transaction(
        *,
        amount: int,
        currency: str,
        description: str,
        return_url: str,
        failed_url: str,
        payload: str,
    ) -> PlategaCreateTransactionResult:
        assert amount == 100
        assert currency == "RUB"
        assert description.startswith("VPN plan")
        assert return_url == "https://miniapp.example/success"
        assert failed_url == "https://miniapp.example/fail"
        assert "subscription_id" in payload
        return PlategaCreateTransactionResult(
            transaction_id="platega-tx-001",
            redirect_url="https://pay.platega.io/mock-checkout",
            status="PENDING",
            payment_method="SBPQR",
            expires_in="00:15:00",
            usdt_rate=95.0,
        )

    monkeypatch.setattr("app.api.v1.webapp.create_platega_transaction", fake_create_platega_transaction)
    token = create_webapp_session_token(tg_id)

    async def override_get_db():
        yield async_session

    app.dependency_overrides[get_db] = override_get_db
    try:
        async with AsyncClient(
            transport=ASGITransport(app=app),
            base_url="http://test",
            timeout=10.0,
        ) as client:
            response = await client.post(
                "/api/v1/webapp/payments/create-invoice",
                headers={"Authorization": f"Bearer {token}"},
                json={"plan_id": plan.id},
            )
        assert response.status_code == 200, response.text
        payload = response.json()
        assert payload["currency"] == "RUB"
        assert payload["invoice_url"] == "https://pay.platega.io/mock-checkout"
        assert payload["invoice_link"] == "https://pay.platega.io/mock-checkout"
        assert payload["free_activation"] is False

        result = await async_session.execute(
            select(Payment).where(Payment.id == payload["payment_id"])
        )
        payment = result.scalar_one_or_none()
        assert payment is not None
        assert payment.provider == "platega"
        assert payment.external_id == "platega-tx-001"
        assert payment.status == "pending"
    finally:
        app.dependency_overrides.pop(get_db, None)


@pytest.mark.asyncio
async def test_webapp_promo_validate_success(
    async_session: AsyncSession,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    """Promo validate returns discount metadata for authenticated user and plan."""
    tg_id = int(uuid.uuid4().int % 10_000_000_000)
    user = User(tg_id=tg_id)
    async_session.add(user)
    await async_session.flush()

    plan = Plan(
        id=uuid.uuid4().hex[:32],
        name="Pro",
        duration_days=30,
        device_limit=1,
        price_currency="XTR",
        price_amount=Decimal("100"),
    )
    async_session.add(plan)
    await async_session.commit()

    token = create_webapp_session_token(tg_id)

    async def override_get_db():
        yield async_session

    app.dependency_overrides[get_db] = override_get_db

    class DummyValidationResult:
        def __init__(self) -> None:
            self.discount_amount = 10
            self.discounted_price = 90
            self.display_label = "10 XTR off"

    async def fake_validate_promo_code(db, code, user_id, plan_id, original_price_xtr):  # noqa: ARG001
        return DummyValidationResult()

    monkeypatch.setattr(
        "app.api.v1.webapp.rate_limit_promo_validate",
        lambda tg: None,  # noqa: ARG005
    )
    monkeypatch.setattr(
        "app.api.v1.webapp.validate_promo_code",
        fake_validate_promo_code,
    )

    try:
        async with AsyncClient(
            transport=ASGITransport(app=app),
            base_url="http://test",
            timeout=5.0,
        ) as client:
            response = await client.post(
                "/api/v1/webapp/promo/validate",
                headers={"Authorization": f"Bearer {token}"},
                json={"code": "PROMO10", "plan_id": plan.id},
            )
        assert response.status_code == 200, response.text
        payload = response.json()
        assert payload == {
            "valid": True,
            "discount_xtr": 10,
            "discounted_price_xtr": 90,
            "display_label": "10 XTR off",
        }
    finally:
        app.dependency_overrides.pop(get_db, None)


@pytest.mark.asyncio
async def test_webapp_promo_validate_returns_422_for_invalid_code(
    async_session: AsyncSession,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    """Promo validation errors surface as 422 with code/message."""
    tg_id = int(uuid.uuid4().int % 10_000_000_000)
    user = User(tg_id=tg_id)
    async_session.add(user)
    await async_session.flush()

    plan = Plan(
        id=uuid.uuid4().hex[:32],
        name="Pro",
        duration_days=30,
        device_limit=1,
        price_currency="XTR",
        price_amount=Decimal("100"),
    )
    async_session.add(plan)
    await async_session.commit()

    token = create_webapp_session_token(tg_id)

    async def override_get_db():
        yield async_session

    app.dependency_overrides[get_db] = override_get_db

    async def fake_validate_promo_code(db, code, user_id, plan_id, original_price_xtr):  # noqa: ARG001
        raise PromoCodeError(PromoErrorCode.PROMO_EXPIRED, "Code expired")

    monkeypatch.setattr(
        "app.api.v1.webapp.rate_limit_promo_validate",
        lambda tg: None,  # noqa: ARG005
    )
    monkeypatch.setattr(
        "app.api.v1.webapp.validate_promo_code",
        fake_validate_promo_code,
    )

    try:
        async with AsyncClient(
            transport=ASGITransport(app=app),
            base_url="http://test",
            timeout=5.0,
        ) as client:
            response = await client.post(
                "/api/v1/webapp/promo/validate",
                headers={"Authorization": f"Bearer {token}"},
                json={"code": "EXPIRED", "plan_id": plan.id},
            )
        assert response.status_code == 422, response.text
        payload = response.json()
        assert payload["code"] == PromoErrorCode.PROMO_EXPIRED.value
        assert "expired" in payload["message"].lower()
    finally:
        app.dependency_overrides.pop(get_db, None)
