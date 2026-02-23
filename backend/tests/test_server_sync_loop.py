"""Tests for server sync loop selection and job_type."""

from datetime import datetime, timezone
from types import SimpleNamespace

from app.core.server_sync_loop import _server_ids_due_for_sync


def _server(id: str, auto_sync_interval_sec: int = 60, last_snapshot_at=None):
    return SimpleNamespace(
        id=id,
        auto_sync_interval_sec=auto_sync_interval_sec,
        last_snapshot_at=last_snapshot_at,
    )


def test_server_ids_due_for_sync_respects_min_interval(monkeypatch):
    """Servers with interval below MIN_INTERVAL are synced at MIN_INTERVAL."""
    from app.core import server_sync_loop  # noqa: F401 - used in setattr

    monkeypatch.setattr(server_sync_loop, "INTERVAL", 60)
    monkeypatch.setattr(server_sync_loop, "MIN_INTERVAL", 15)
    now = 1000.0
    s = _server("s1", auto_sync_interval_sec=10, last_snapshot_at=None)
    ids = _server_ids_due_for_sync([s], now)
    assert ids == ["s1"]  # last_snapshot_at None -> last_run 0 -> due

    s2 = _server(
        "s2",
        auto_sync_interval_sec=10,
        last_snapshot_at=datetime.fromtimestamp(now - 20, tz=timezone.utc),
    )
    ids2 = _server_ids_due_for_sync([s2], now)
    assert ids2 == ["s2"]  # 20 >= 15


def test_server_ids_due_for_sync_skips_recent():
    """Server synced recently is not due."""
    from app.core import server_sync_loop  # noqa: F401

    # MIN_INTERVAL 15, INTERVAL 60
    now = 1000.0
    s = _server(
        "s1",
        auto_sync_interval_sec=60,
        last_snapshot_at=datetime.fromtimestamp(999, tz=timezone.utc),
    )
    ids = _server_ids_due_for_sync([s], now)
    assert ids == []  # 1s < 60


def test_server_ids_due_for_sync_includes_stale():
    """Server with last_snapshot_at beyond interval is due."""
    from app.core import server_sync_loop  # noqa: F401

    now = 1000.0
    s = _server(
        "s1",
        auto_sync_interval_sec=30,
        last_snapshot_at=datetime.fromtimestamp(960, tz=timezone.utc),
    )
    ids = _server_ids_due_for_sync([s], now)
    assert ids == ["s1"]  # 40s >= 30
