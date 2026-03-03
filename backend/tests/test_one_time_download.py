from datetime import datetime, timedelta, timezone

import pytest
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.one_time_download import create_one_time_token, verify_and_consume_one_time_token
from app.models import Device, OneTimeDownloadToken
from app.models.base import uuid4_hex


@pytest.mark.asyncio
async def test_one_time_token_lifecycle(async_session: AsyncSession):
    device = Device(
        id=uuid4_hex(),
        user_id=1,
        subscription_id="sub",
        server_id="server",
        device_name="test-device",
        public_key="pk",
        allowed_ips="10.8.1.7/32",
    )
    async_session.add(device)
    await async_session.commit()

    token = await create_one_time_token(async_session, device_id=device.id, kind="awg_conf", ttl_seconds=600)
    assert token

    # First verification succeeds
    payload = await verify_and_consume_one_time_token(async_session, token=token)
    assert payload == {"device_id": device.id, "kind": "awg_conf"}

    # Token is marked consumed
    result = await async_session.execute(
        select(OneTimeDownloadToken).where(OneTimeDownloadToken.device_id == device.id)
    )
    row = result.scalar_one()
    assert row.consumed_at is not None

    # Second verification fails
    payload2 = await verify_and_consume_one_time_token(async_session, token=token)
    assert payload2 is None


@pytest.mark.asyncio
async def test_one_time_token_expired(async_session: AsyncSession):
    device = Device(
        id=uuid4_hex(),
        user_id=1,
        subscription_id="sub",
        server_id="server",
        device_name="test-device-expired",
        public_key="pk2",
        allowed_ips="10.8.1.8/32",
    )
    async_session.add(device)
    await async_session.commit()

    token = await create_one_time_token(async_session, device_id=device.id, kind="awg_conf", ttl_seconds=1)
    assert token

    # Manually backdate expires_at
    result = await async_session.execute(
        select(OneTimeDownloadToken).where(OneTimeDownloadToken.device_id == device.id)
    )
    row = result.scalar_one()
    row.expires_at = datetime.now(timezone.utc) - timedelta(seconds=1)
    await async_session.commit()

    payload = await verify_and_consume_one_time_token(async_session, token=token)
    assert payload is None

