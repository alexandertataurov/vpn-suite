"""Tests for config validation."""

import sys
from pathlib import Path

import pytest

bot_root = Path(__file__).resolve().parent.parent
if str(bot_root) not in sys.path:
    sys.path.insert(0, str(bot_root))


def test_validate_missing_bot_username(monkeypatch):
    """Validation fails when BOT_USERNAME is missing."""
    import utils.config_validator as mod
    monkeypatch.setattr(mod, "BOT_USERNAME", "")
    with pytest.raises(ValueError, match="BOT_USERNAME"):
        mod.validate_config()


def test_polling_timeout_has_minimum(monkeypatch):
    """BOT_POLLING_TIMEOUT is clamped to at least 10s."""
    monkeypatch.setenv("BOT_POLLING_TIMEOUT", "1")
    monkeypatch.setenv("BOT_USERNAME", "test")
    monkeypatch.setenv("SUPPORT_HANDLE", "@support")
    import importlib
    import config as mod
    importlib.reload(mod)
    assert mod.BOT_POLLING_TIMEOUT >= 10


def test_polling_timeout_has_maximum(monkeypatch):
    """BOT_POLLING_TIMEOUT is clamped to at most 120s."""
    monkeypatch.setenv("BOT_POLLING_TIMEOUT", "300")
    monkeypatch.setenv("BOT_USERNAME", "test")
    monkeypatch.setenv("SUPPORT_HANDLE", "@support")
    import importlib
    import config as mod
    importlib.reload(mod)
    assert mod.BOT_POLLING_TIMEOUT <= 120
