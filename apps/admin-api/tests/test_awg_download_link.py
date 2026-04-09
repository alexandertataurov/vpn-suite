import uuid
from datetime import datetime, timedelta, timezone

import pytest
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import encrypt_config
from app.main import app
from app.models import Device, IssuedConfig, Plan, Server, Subscription, User
from app.models.base import uuid4_hex


@pytest.mark.asyncio
async def test_awg_download_link_flow(async_session: AsyncSession):
    user = User(tg_id=int(uuid.uuid4().int % 10_000_000_000))
    async_session.add(user)
    await async_session.flush()
    plan = Plan(name="plan", duration_days=30, price_currency="XTR", price_amount=0)
    async_session.add(plan)
    await async_session.flush()
    sub = Subscription(
        id=uuid4_hex(),
        user_id=user.id,
        plan_id=plan.id,
        valid_from=datetime.now(timezone.utc),
        valid_until=datetime.now(timezone.utc) + timedelta(days=30),
        device_limit=5,
        status="active",
    )
    async_session.add(sub)
    await async_session.flush()
    server = Server(
        id=uuid4_hex(),
        name="srv",
        region="test",
        api_endpoint="docker://amnezia-awg",
        public_key="xTIBA5rboUvnH4htodjb6e697QjLERt1NAB4mZqp8Dg=",
        vpn_endpoint="vpn.example.com:47604",
        is_active=True,
    )
    async_session.add(server)
    await async_session.flush()
    device_id = uuid4_hex()
    server_id = server.id
    device = Device(
        id=device_id,
        user_id=user.id,
        subscription_id=sub.id,
        server_id=server_id,
        device_name="awg-device",
        public_key="pub",
        allowed_ips="10.8.1.7/32",
        issued_at=datetime.now(timezone.utc),
    )
    async_session.add(device)
    cfg_text = "[Interface]\nPrivateKey = PRIV\n\n[Peer]\nPublicKey = PUB\n"
    issued = IssuedConfig(
        device_id=device_id,
        server_id=server_id,
        profile_type="awg",
        expires_at=datetime.now(timezone.utc) + timedelta(days=1),
        download_token_hash="x" * 64,
        config_encrypted=encrypt_config(cfg_text),
    )
    async_session.add(issued)
    await async_session.commit()

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        resp = await client.get("/d/invalid-token")
        assert resp.status_code in (400, 410, 404)
