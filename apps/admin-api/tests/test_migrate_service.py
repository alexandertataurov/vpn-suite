"""Unit tests for migrate service safety/rollback behavior."""

from types import SimpleNamespace
from unittest.mock import AsyncMock

import pytest

from app.core.exceptions import WireGuardCommandError
from app.services.migrate_service import migrate_peer


@pytest.mark.asyncio
async def test_migrate_peer_success_updates_server_id():
    device = SimpleNamespace(
        id="dev-1",
        server_id="srv-a",
        public_key="pub-1",
        allowed_ips="10.8.1.2/32",
        revoked_at=None,
    )
    adapter = SimpleNamespace(
        remove_peer=AsyncMock(return_value=None),
        add_peer=AsyncMock(return_value=None),
    )
    db = SimpleNamespace()

    await migrate_peer(db, device, "srv-b", adapter)

    assert device.server_id == "srv-b"
    adapter.remove_peer.assert_called_once_with("srv-a", "pub-1")
    adapter.add_peer.assert_called_once()


@pytest.mark.asyncio
async def test_migrate_peer_add_failure_attempts_rollback_to_source():
    device = SimpleNamespace(
        id="dev-1",
        server_id="srv-a",
        public_key="pub-1",
        allowed_ips="10.8.1.2/32",
        revoked_at=None,
    )
    adapter = SimpleNamespace(
        remove_peer=AsyncMock(return_value=None),
        add_peer=AsyncMock(side_effect=[RuntimeError("target down"), None]),
    )
    db = SimpleNamespace()

    with pytest.raises(WireGuardCommandError) as exc:
        await migrate_peer(db, device, "srv-b", adapter)

    assert "rollback restored on source" in str(exc.value)
    assert device.server_id == "srv-a"
    assert adapter.add_peer.await_count == 2


@pytest.mark.asyncio
async def test_migrate_peer_add_failure_and_rollback_failure_reported():
    device = SimpleNamespace(
        id="dev-1",
        server_id="srv-a",
        public_key="pub-1",
        allowed_ips="10.8.1.2/32",
        revoked_at=None,
    )
    adapter = SimpleNamespace(
        remove_peer=AsyncMock(return_value=None),
        add_peer=AsyncMock(
            side_effect=[RuntimeError("target down"), RuntimeError("source restore failed")]
        ),
    )
    db = SimpleNamespace()

    with pytest.raises(WireGuardCommandError) as exc:
        await migrate_peer(db, device, "srv-b", adapter)

    assert "rollback_failed" in str(exc.value)
    assert device.server_id == "srv-a"
    assert adapter.add_peer.await_count == 2


@pytest.mark.asyncio
async def test_migrate_peer_requires_allowed_ips():
    device = SimpleNamespace(
        id="dev-1",
        server_id="srv-a",
        public_key="pub-1",
        allowed_ips=None,
        revoked_at=None,
    )
    adapter = SimpleNamespace(remove_peer=AsyncMock(), add_peer=AsyncMock())

    with pytest.raises(WireGuardCommandError, match="no valid allowed_ips"):
        await migrate_peer(None, device, "srv-b", adapter)

    adapter.add_peer.assert_not_called()
