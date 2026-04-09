"""Pytest entry for VPN config test stand; captures debug logs via caplog."""

import logging
import os

import pytest

# Import after possibly loading .env (test runs from apps/admin-api/)
from app.core.config import Settings
from app.core.config_builder import (
    ConfigProfile,
    InterfaceFields,
    PeerFields,
    build_config,
    generate_wg_keypair,
)


def run_checks(settings: Settings) -> tuple[bool, list[str]]:
    """Same checks as scripts/test_stand_vpn_config.run_checks (no file I/O)."""
    errors: list[str] = []
    logger = logging.getLogger("vpn_test_stand")
    logger.debug("NODE_MODE=%s NODE_DISCOVERY=%s", settings.node_mode, settings.node_discovery)
    logger.debug("VPN_DEFAULT_HOST=%s", settings.vpn_default_host or "(empty)")
    if settings.node_mode == "agent" and not (settings.agent_shared_token or "").strip():
        errors.append("NODE_MODE=agent requires AGENT_SHARED_TOKEN")
    if not settings.vpn_default_host and settings.node_mode != "mock":
        logger.warning("VPN_DEFAULT_HOST empty; Issue Config endpoint may be wrong")

    try:
        priv, pub = generate_wg_keypair()
        logger.debug("Generated keypair (pub len=%s)", len(pub))
    except Exception as e:
        errors.append(f"generate_wg_keypair: {e}")
        return False, errors

    try:
        endpoint = (settings.vpn_default_host or "vpn.example.com") + ":47604"
        cfg = build_config(
            interface=InterfaceFields(private_key=priv, address="10.8.1.2/32", dns="1.1.1.1"),
            peer=PeerFields(public_key=pub, endpoint=endpoint),
            profile=ConfigProfile.universal_safe,
        )
        logger.debug("build_config produced %s bytes", len(cfg))
        if "[Interface]" not in cfg or "[Peer]" not in cfg:
            errors.append("build_config missing [Interface] or [Peer]")
        if "Endpoint =" not in cfg:
            errors.append("build_config missing Endpoint")
    except Exception as e:
        errors.append(f"build_config: {e}")

    return len(errors) == 0, errors


def test_vpn_config_checks_pass_with_mock_settings(caplog):
    """VPN connection config checks pass with NODE_MODE=mock (default in tests)."""
    caplog.set_level(logging.DEBUG, logger="vpn_test_stand")
    os.environ.setdefault("NODE_MODE", "mock")
    settings = Settings()
    ok, errs = run_checks(settings)
    assert ok, f"run_checks failed: {errs}"
    assert "build_config produced" in caplog.text or "Generated keypair" in caplog.text


def test_vpn_config_build_config_emits_valid_wireguard():
    """Config builder produces valid WireGuard-style config."""
    priv, pub = generate_wg_keypair()
    cfg = build_config(
        interface=InterfaceFields(private_key=priv, address="10.8.1.2/32", dns="1.1.1.1"),
        peer=PeerFields(public_key=pub, endpoint="vpn.example.com:47604"),
        profile=ConfigProfile.universal_safe,
    )
    assert "[Interface]" in cfg and "PrivateKey =" in cfg
    assert "[Peer]" in cfg and "PublicKey =" in cfg and "Endpoint = vpn.example.com:47604" in cfg
    assert "AllowedIPs =" in cfg and "PersistentKeepalive =" in cfg


@pytest.mark.asyncio
async def test_server_issues_correct_config(caplog):
    """Server issue_device returns config_wg with all required sections for VPN connectivity."""
    import uuid
    from datetime import datetime, timedelta, timezone
    from decimal import Decimal
    from unittest.mock import patch

    from app.core.database import async_session_factory, check_db
    from app.models import Plan, Server, Subscription, User
    from app.services.issue_service import issue_device

    if not await check_db():
        pytest.skip("DB not available (requires Postgres)")
    caplog.set_level(logging.DEBUG, logger="vpn_test_stand")
    now = datetime.now(timezone.utc)
    async with async_session_factory() as session:
        user = User(tg_id=int(uuid.uuid4().int % 10_000_000_000), is_banned=False)
        session.add(user)
        await session.flush()
        plan = Plan(
            name=f"test-{uuid.uuid4().hex[:8]}",
            duration_days=30,
            price_currency="XTR",
            price_amount=Decimal("0"),
        )
        session.add(plan)
        await session.flush()
        sub = Subscription(
            user_id=user.id,
            plan_id=plan.id,
            valid_from=now,
            valid_until=now + timedelta(days=30),
            device_limit=5,
            status="active",
        )
        session.add(sub)
        await session.flush()
        server = Server(
            name="test-node",
            region="test",
            api_endpoint="docker://amnezia-awg",
            public_key="xTIBA5rboUvnH4htodjb6e697QjLERt1NAB4mZqp8Dg=",
            is_active=True,
            vpn_endpoint="vpn.example.com:47604",
        )
        session.add(server)
        await session.flush()
        with patch("app.services.issue_service.settings.node_mode", "mock"):
            result = await issue_device(
                session,
                user_id=user.id,
                subscription_id=sub.id,
                server_id=server.id,
                runtime_adapter=None,
            )
        await session.rollback()
    cfg = result.config_wg
    assert "[Interface]" in cfg and "[Peer]" in cfg
    assert "Endpoint =" in cfg and "AllowedIPs =" in cfg
    assert "PrivateKey =" in cfg and "PublicKey =" in cfg
