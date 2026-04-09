from datetime import datetime, timezone
from types import SimpleNamespace

import pytest

from app.schemas.device import DeviceOut
from app.schemas.server import ServerCreate, ServerOut, ServerUpdate


def test_server_kind_schema_defaults_and_validation():
    body = ServerCreate(name="n1", region="eu", api_endpoint="https://vpn.example.com")
    assert body.kind == "awg_node"

    relay = ServerUpdate(kind="legacy_wg_relay")
    assert relay.kind == "legacy_wg_relay"

    with pytest.raises(ValueError):
        ServerCreate(name="n1", region="eu", api_endpoint="https://vpn.example.com", kind="bad")


def test_server_out_exposes_kind():
    now = datetime.now(timezone.utc)
    out = ServerOut(
        id="srv-1",
        name="relay-1",
        region="eu",
        api_endpoint="https://relay.example.com",
        kind="legacy_wg_relay",
        vpn_endpoint="relay.example.com:51820",
        public_key=None,
        status="unknown",
        is_active=True,
        created_at=now,
    )
    assert out.kind == "legacy_wg_relay"


def test_device_out_exposes_relay_delivery_fields():
    now = datetime.now(timezone.utc)
    device = SimpleNamespace(
        id="dev-1",
        user_id=1,
        subscription_id="sub-1",
        server_id="srv-direct",
        delivery_mode="legacy_wg_via_relay",
        client_facing_server_id="srv-relay",
        upstream_server_id="srv-awg",
        device_name="router",
        public_key="pubkey",
        allowed_ips="10.8.1.2/32",
        issued_at=now,
        revoked_at=None,
        suspended_at=None,
        data_limit_bytes=None,
        expires_at=None,
        created_at=now,
        issued_configs=[],
        apply_status="PENDING_APPLY",
        last_applied_at=None,
        last_seen_handshake_at=None,
        last_error=None,
        protocol_version=None,
    )
    out = DeviceOut.model_validate(device)
    assert out.delivery_mode == "legacy_wg_via_relay"
    assert out.client_facing_server_id == "srv-relay"
    assert out.upstream_server_id == "srv-awg"
