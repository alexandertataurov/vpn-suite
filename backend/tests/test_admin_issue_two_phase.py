"""Tests for admin_issue two-phase flow: PENDING_APPLY -> apply -> APPLIED."""

from __future__ import annotations

import uuid
from datetime import datetime, timedelta, timezone
from decimal import Decimal
from unittest.mock import AsyncMock

import pytest

from app.core.config import settings
from app.core.database import async_session_factory
from app.models import Device, Plan, Server, ServerProfile, Subscription, User
from app.services.admin_issue_service import admin_issue_peer
from app.services.node_runtime import PeerConfigLike


async def _fixture_server_user_sub():
    """Create User, Plan, Subscription, Server, ServerProfile. Returns (server_id, user_id, subscription_id)."""
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
            vpn_endpoint="vpn.example.com:45790",
            public_key="xTIBA5rboUvnH4htodjb6e697QjLERt1NAB4mZqp8Dg=",
            is_active=True,
        )
        db.add(server)
        await db.flush()
        db.add(
            ServerProfile(
                server_id=server.id,
                request_params={"amnezia_s1": 213, "amnezia_s2": 237},
            )
        )
        await db.flush()
        await db.commit()
        return server.id, user.id, sub.id


@pytest.mark.asyncio
async def test_admin_issue_peer_two_phase_applied(monkeypatch):
    """When runtime add_peer and list_peers succeed, device is updated to APPLIED."""
    from app.core.database import check_db

    if not await check_db():
        pytest.skip("DB not available")
    monkeypatch.setattr(settings, "node_mode", "real")
    monkeypatch.setattr(settings, "node_discovery", "docker")

    server_id, user_id, sub_id = await _fixture_server_user_sub()
    added_peers: list[tuple[str, PeerConfigLike]] = []

    async def mock_add_peer(node_id: str, peer: PeerConfigLike):
        added_peers.append((node_id, peer))

    async def mock_list_peers(node_id: str):
        return [
            {"public_key": pk, "allowed_ips": p.allowed_ips}
            for _, p in added_peers
            for pk in (p.public_key,)
        ]

    mock_adapter = AsyncMock()
    mock_adapter.add_peer = mock_add_peer
    mock_adapter.list_peers = mock_list_peers
    mock_adapter.ensure_reply_routes = AsyncMock(return_value=None)

    async with async_session_factory() as session:
        result = await admin_issue_peer(
            session,
            server_id=server_id,
            user_id=user_id,
            subscription_id=sub_id,
            device_name="test-dev",
            runtime_adapter=mock_adapter,
        )
        device_id = result.device.id
        assert result.peer_created is True

    async with async_session_factory() as session:
        from sqlalchemy import select

        r = await session.execute(select(Device).where(Device.id == device_id))
        dev = r.scalar_one_or_none()
        assert dev is not None
        assert dev.apply_status == "APPLIED"
        assert dev.last_applied_at is not None
        assert dev.protocol_version in ("awg_20", "awg_legacy")
        assert dev.obfuscation_profile is None or "Jc" in dev.obfuscation_profile
