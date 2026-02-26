"""Unit tests for device reset, revoke, and delete API behavior."""

from datetime import datetime, timezone
from types import SimpleNamespace
from unittest.mock import AsyncMock

import pytest
from fastapi import HTTPException

from app.api.v1.devices import delete_device, reset_device, revoke_device
from app.core import config
from app.schemas.device import DeleteRequest, ResetRequest, RevokeRequest


def _make_request(adapter):
    return SimpleNamespace(
        method="POST",
        url=SimpleNamespace(path="/api/v1/devices/dev-1/reset"),
        state=SimpleNamespace(),
        app=SimpleNamespace(state=SimpleNamespace(node_runtime_adapter=adapter)),
    )


def _make_db(device):
    return SimpleNamespace(
        execute=AsyncMock(return_value=SimpleNamespace(scalar_one_or_none=lambda: device)),
        commit=AsyncMock(),
        refresh=AsyncMock(),
    )


@pytest.mark.asyncio
async def test_reset_device_fails_closed_when_node_remove_fails(monkeypatch):
    monkeypatch.setattr(config.settings, "node_mode", "real")
    device = SimpleNamespace(
        id="dev-1",
        server_id="srv-1",
        public_key="pub-1",
        user_id=10,
        revoked_at=None,
    )
    adapter = SimpleNamespace(remove_peer=AsyncMock(side_effect=RuntimeError("boom")))
    db = _make_db(device)
    req = _make_request(adapter)

    with pytest.raises(HTTPException) as exc:
        await reset_device(req, "dev-1", None, db, SimpleNamespace(id="admin"))

    assert exc.value.status_code == 502
    assert device.revoked_at is None
    db.commit.assert_not_called()
    assert req.state.audit_old_new["reset"]["node_accepted"] is False


@pytest.mark.asyncio
async def test_reset_device_force_db_only_when_requested(monkeypatch):
    monkeypatch.setattr(config.settings, "node_mode", "real")
    device = SimpleNamespace(
        id="dev-1",
        server_id="srv-1",
        public_key="pub-1",
        user_id=10,
        revoked_at=None,
    )
    adapter = SimpleNamespace(remove_peer=AsyncMock(side_effect=RuntimeError("boom")))
    db = _make_db(device)
    req = _make_request(adapter)

    out = await reset_device(
        req,
        "dev-1",
        ResetRequest(force_revoke_db_only=True),
        db,
        SimpleNamespace(id="admin"),
    )

    assert out["status"] == "degraded"
    assert device.revoked_at is not None
    db.commit.assert_called_once()
    assert req.state.audit_old_new["reset"]["db_only"] is True


@pytest.mark.asyncio
async def test_reset_device_ok_when_node_remove_succeeds(monkeypatch):
    monkeypatch.setattr(config.settings, "node_mode", "real")
    device = SimpleNamespace(
        id="dev-1",
        server_id="srv-1",
        public_key="pub-1",
        user_id=10,
        revoked_at=None,
    )
    adapter = SimpleNamespace(remove_peer=AsyncMock(return_value=None))
    db = _make_db(device)
    req = _make_request(adapter)

    out = await reset_device(req, "dev-1", None, db, SimpleNamespace(id="admin"))

    assert out["status"] == "ok"
    assert device.revoked_at is not None
    db.commit.assert_called_once()
    assert req.state.audit_old_new["reset"]["node_accepted"] is True


# ---- Revoke ----
def _make_revoke_request():
    return SimpleNamespace(state=SimpleNamespace())


@pytest.mark.asyncio
async def test_revoke_device_invalid_confirm_token(monkeypatch):
    monkeypatch.setattr("app.api.v1.devices.REVOKE_CONFIRM", "secret-token")
    device = SimpleNamespace(id="dev-1", user_id=10, revoked_at=None)
    db = _make_db(device)
    req = _make_revoke_request()

    with pytest.raises(HTTPException) as exc:
        await revoke_device(req, "dev-1", RevokeRequest(confirm_token="wrong"), db, SimpleNamespace(id="admin"))
    assert exc.value.status_code == 400
    assert "Invalid" in str(exc.value.detail)
    assert device.revoked_at is None


@pytest.mark.asyncio
async def test_revoke_device_not_found(monkeypatch):
    monkeypatch.setattr("app.api.v1.devices.REVOKE_CONFIRM", "secret-token")
    db = SimpleNamespace(
        execute=AsyncMock(return_value=SimpleNamespace(scalar_one_or_none=lambda: None)),
        commit=AsyncMock(),
        refresh=AsyncMock(),
    )
    req = _make_revoke_request()

    with pytest.raises(HTTPException) as exc:
        await revoke_device(req, "dev-1", RevokeRequest(confirm_token="secret-token"), db, SimpleNamespace(id="admin"))
    assert exc.value.status_code == 404


@pytest.mark.asyncio
async def test_revoke_device_already_revoked(monkeypatch):
    monkeypatch.setattr("app.api.v1.devices.REVOKE_CONFIRM", "secret-token")
    device = SimpleNamespace(id="dev-1", user_id=10, revoked_at=datetime.now(timezone.utc))
    db = _make_db(device)
    req = _make_revoke_request()

    with pytest.raises(HTTPException) as exc:
        await revoke_device(req, "dev-1", RevokeRequest(confirm_token="secret-token"), db, SimpleNamespace(id="admin"))
    assert exc.value.status_code == 400
    assert "already revoked" in str(exc.value.detail).lower()


@pytest.mark.asyncio
async def test_revoke_device_success(monkeypatch):
    monkeypatch.setattr("app.api.v1.devices.REVOKE_CONFIRM", "secret-token")
    now = datetime.now(timezone.utc)
    device = SimpleNamespace(
        id="dev-1",
        user_id=10,
        revoked_at=None,
        device_name=None,
        public_key="pk",
        server_id="srv",
        subscription_id="sub",
        issued_at=now,
        created_at=now,
        suspended_at=None,
        issued_configs=[],
    )
    db = _make_db(device)
    req = _make_revoke_request()

    out = await revoke_device(req, "dev-1", RevokeRequest(confirm_token="secret-token"), db, SimpleNamespace(id="admin"))

    assert out.revoked_at is not None
    assert out.id == "dev-1"
    db.commit.assert_called_once()
    assert req.state.audit_old_new["revoked"]["user_id"] == 10


# ---- Delete ----
@pytest.mark.asyncio
async def test_delete_device_invalid_confirm_token(monkeypatch):
    monkeypatch.setattr("app.api.v1.devices.REVOKE_CONFIRM", "secret-token")
    device = SimpleNamespace(id="dev-1", user_id=10)
    db = _make_db(device)
    db.delete = AsyncMock()
    req = SimpleNamespace(state=SimpleNamespace())

    with pytest.raises(HTTPException) as exc:
        await delete_device(req, "dev-1", DeleteRequest(confirm_token="wrong"), db, SimpleNamespace(id="admin"))
    assert exc.value.status_code == 400
    db.delete.assert_not_called()


@pytest.mark.asyncio
async def test_delete_device_not_found(monkeypatch):
    monkeypatch.setattr("app.api.v1.devices.REVOKE_CONFIRM", "secret-token")
    db = SimpleNamespace(
        execute=AsyncMock(return_value=SimpleNamespace(scalar_one_or_none=lambda: None)),
        commit=AsyncMock(),
        delete=AsyncMock(),
    )
    req = SimpleNamespace(state=SimpleNamespace())

    with pytest.raises(HTTPException) as exc:
        await delete_device(req, "dev-1", DeleteRequest(confirm_token="secret-token"), db, SimpleNamespace(id="admin"))
    assert exc.value.status_code == 404


@pytest.mark.asyncio
async def test_delete_device_success(monkeypatch):
    monkeypatch.setattr("app.api.v1.devices.REVOKE_CONFIRM", "secret-token")
    device = SimpleNamespace(id="dev-1", user_id=10)
    db = _make_db(device)
    db.delete = AsyncMock()
    req = SimpleNamespace(state=SimpleNamespace())

    out = await delete_device(req, "dev-1", DeleteRequest(confirm_token="secret-token"), db, SimpleNamespace(id="admin"))

    assert out == 204  # HTTP_204_NO_CONTENT
    db.delete.assert_called_once_with(device)
    db.commit.assert_called_once()
    assert req.state.audit_old_new["delete"]["user_id"] == 10
