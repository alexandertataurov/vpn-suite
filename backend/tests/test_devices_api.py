"""Unit tests for device reset API behavior."""

from types import SimpleNamespace
from unittest.mock import AsyncMock

import pytest
from fastapi import HTTPException

from app.api.v1.devices import reset_device
from app.core import config
from app.schemas.device import ResetRequest


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
