"""Tests for issue_service: issue_device and runtime obfuscation merge."""

from __future__ import annotations

import uuid
from datetime import datetime, timedelta, timezone
from decimal import Decimal
from unittest.mock import AsyncMock

import pytest

from app.core.database import async_session_factory, check_db
from app.models import Device, Plan, Server, Subscription, User
from app.schemas.node import ClusterTopology, NodeMetadata
from app.services.issue_service import issue_device
from app.services.server_live_key_service import LiveKeyResult


async def _create_issue_device_fixture():
    """Create User, Plan, Subscription, Server in DB. Returns (user_id, subscription_id, server_id)."""
    now = datetime.now(timezone.utc)
    async with async_session_factory() as db:
        user = User(tg_id=int(uuid.uuid4().int % 10_000_000_000), is_banned=False)
        db.add(user)
        await db.flush()

        plan = Plan(
            name=f"plan-{uuid.uuid4().hex[:8]}",
            duration_days=30,
            price_currency="XTR",
            price_amount=Decimal("100.00"),
        )
        db.add(plan)
        await db.flush()

        sub = Subscription(
            user_id=user.id,
            plan_id=plan.id,
            valid_from=now,
            valid_until=now + timedelta(days=30),
            device_limit=5,
            status="active",
        )
        db.add(sub)
        await db.flush()

        server = Server(
            name="test-node",
            region="test",
            api_endpoint="docker://amnezia-awg",
            public_key="xTIBA5rboUvnH4htodjb6e697QjLERt1NAB4mZqp8Dg=",
            is_active=True,
            vpn_endpoint="vpn.example.com:47604",
        )
        db.add(server)
        await db.flush()

        await db.commit()
        return user.id, sub.id, server.id


async def _create_relay_issue_device_fixture():
    now = datetime.now(timezone.utc)
    async with async_session_factory() as db:
        user = User(tg_id=int(uuid.uuid4().int % 10_000_000_000), is_banned=False)
        db.add(user)
        await db.flush()

        plan = Plan(
            name=f"plan-{uuid.uuid4().hex[:8]}",
            duration_days=30,
            price_currency="XTR",
            price_amount=Decimal("100.00"),
        )
        db.add(plan)
        await db.flush()

        sub = Subscription(
            user_id=user.id,
            plan_id=plan.id,
            valid_from=now,
            valid_until=now + timedelta(days=30),
            device_limit=5,
            status="active",
        )
        db.add(sub)
        await db.flush()

        relay = Server(
            name="relay-node",
            region="test",
            api_endpoint="docker://relay-node",
            public_key="xTIBA5rboUvnH4htodjb6e697QjLERt1NAB4mZqp8Dg=",
            is_active=True,
            vpn_endpoint="relay.example.com:51820",
            kind="legacy_wg_relay",
        )
        upstream = Server(
            name="awg-node",
            region="test",
            api_endpoint="docker://amnezia-awg",
            public_key="xTIBA5rboUvnH4htodjb6e697QjLERt1NAB4mZqp8Dg=",
            is_active=True,
            vpn_endpoint="vpn.example.com:47604",
            kind="awg_node",
        )
        db.add(relay)
        db.add(upstream)
        await db.flush()

        await db.commit()
        return user.id, sub.id, relay.id, upstream.id


def _mock_live_key(
    server_id: str, public_key: str = "xTIBA5rboUvnH4htodjb6e697QjLERt1NAB4mZqp8Dg="
):
    from datetime import datetime, timezone

    return LiveKeyResult(
        public_key=public_key,
        node_id=server_id,
        synced_at=datetime.now(timezone.utc),
        fingerprint="xTIBA5rboUv",
    )


@pytest.mark.asyncio
async def test_issue_device_merges_runtime_obfuscation_into_config(monkeypatch):
    """When runtime_adapter.get_obfuscation_from_node returns S1/S2, issued config contains them."""
    if not await check_db():
        pytest.skip("DB not available (requires Postgres)")
    monkeypatch.setattr("app.services.issue_service.settings.node_mode", "mock")
    monkeypatch.setattr(
        "app.services.issue_service.live_key_fetch",
        AsyncMock(side_effect=lambda sid, *_args, **_kwargs: _mock_live_key(sid)),
    )

    user_id, sub_id, server_id = await _create_issue_device_fixture()

    runtime_obf = {"S1": 1, "S2": 2, "H1": 10, "H2": 20, "H3": 30, "H4": 40}
    mock_adapter = AsyncMock()
    mock_adapter.get_obfuscation_from_node = AsyncMock(return_value=runtime_obf)

    async with async_session_factory() as session:
        result = await issue_device(
            session,
            user_id=user_id,
            subscription_id=sub_id,
            server_id=server_id,
            runtime_adapter=mock_adapter,
        )

    assert "S1 = 1" in result.config_awg
    assert "S2 = 2" in result.config_awg
    mock_adapter.get_obfuscation_from_node.assert_called_once_with(server_id)


@pytest.mark.asyncio
async def test_issue_device_uses_profile_defaults_when_runtime_returns_none(monkeypatch):
    """When get_obfuscation_from_node returns None, config uses profile defaults (S1=0, S2=0)."""
    if not await check_db():
        pytest.skip("DB not available (requires Postgres)")
    monkeypatch.setattr("app.services.issue_service.settings.node_mode", "mock")
    monkeypatch.setattr(
        "app.services.issue_service.live_key_fetch",
        AsyncMock(side_effect=lambda sid, *_args, **_kwargs: _mock_live_key(sid)),
    )

    user_id, sub_id, server_id = await _create_issue_device_fixture()

    mock_adapter = AsyncMock()
    mock_adapter.get_obfuscation_from_node = AsyncMock(return_value=None)

    async with async_session_factory() as session:
        result = await issue_device(
            session,
            user_id=user_id,
            subscription_id=sub_id,
            server_id=server_id,
            runtime_adapter=mock_adapter,
        )

    assert "S1 = 0" not in result.config_awg
    assert "S2 = 0" not in result.config_awg
    assert "Jc = 3" in result.config_awg


@pytest.mark.asyncio
async def test_issue_device_uses_profile_defaults_when_runtime_raises(monkeypatch):
    """When get_obfuscation_from_node raises, config still built with profile defaults."""
    if not await check_db():
        pytest.skip("DB not available (requires Postgres)")
    monkeypatch.setattr("app.services.issue_service.settings.node_mode", "mock")
    monkeypatch.setattr(
        "app.services.issue_service.live_key_fetch",
        AsyncMock(side_effect=lambda sid, *_args, **_kwargs: _mock_live_key(sid)),
    )

    user_id, sub_id, server_id = await _create_issue_device_fixture()

    mock_adapter = AsyncMock()
    mock_adapter.get_obfuscation_from_node = AsyncMock(side_effect=RuntimeError("node unreachable"))

    async with async_session_factory() as session:
        result = await issue_device(
            session,
            user_id=user_id,
            subscription_id=sub_id,
            server_id=server_id,
            runtime_adapter=mock_adapter,
        )

    assert "[Interface]" in result.config_awg
    assert "[Peer]" in result.config_awg
    assert "S1 = 0" not in result.config_awg


@pytest.mark.asyncio
async def test_issue_device_legacy_relay_mode_persists_two_leg_metadata(monkeypatch):
    if not await check_db():
        pytest.skip("DB not available (requires Postgres)")
    monkeypatch.setattr("app.services.issue_service.settings.node_mode", "mock")
    monkeypatch.setattr(
        "app.services.issue_service.live_key_fetch",
        AsyncMock(side_effect=lambda sid, *_args, **_kwargs: _mock_live_key(sid)),
    )

    user_id, sub_id, relay_id, upstream_id = await _create_relay_issue_device_fixture()

    async def _get_topology():
        now = datetime.now(timezone.utc)
        return ClusterTopology(
            timestamp=now,
            nodes=[
                NodeMetadata(
                    node_id=relay_id,
                    container_name="relay-node",
                    kind="legacy_wg_relay",
                    peer_count=1,
                    max_peers=100,
                    status="healthy",
                    health_score=0.95,
                ),
                NodeMetadata(
                    node_id=upstream_id,
                    container_name="awg-node",
                    kind="awg_node",
                    peer_count=1,
                    max_peers=100,
                    status="healthy",
                    health_score=0.98,
                ),
            ],
            total_capacity=200,
            current_load=2,
            load_factor=0.01,
            health_score=0.96,
            topology_version=1,
        )

    async with async_session_factory() as session:
        result = await issue_device(
            session,
            user_id=user_id,
            subscription_id=sub_id,
            delivery_mode="legacy_wg_via_relay",
            get_topology=_get_topology,
        )
        await session.commit()
        await session.refresh(result.device)

        stored = await session.get(Device, result.device.id)

    assert stored is not None
    assert stored.server_id == relay_id
    assert stored.delivery_mode == "legacy_wg_via_relay"
    assert stored.client_facing_server_id == relay_id
    assert stored.upstream_server_id == upstream_id
    assert "relay.example.com:51820" in result.config_wg
    assert result.config_awg == result.config_wg
    assert result.config_wg_obf == result.config_wg
