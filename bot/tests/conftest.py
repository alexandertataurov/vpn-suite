"""Pytest fixtures for bot tests. Run from bot dir: pytest tests/ -v."""

import os
import sys
from pathlib import Path
from unittest.mock import AsyncMock, MagicMock

import pytest

# Ensure bot package is importable
bot_root = Path(__file__).resolve().parent.parent
if str(bot_root) not in sys.path:
    sys.path.insert(0, str(bot_root))

# Required by config.py; set before any bot module import so tests run without .env
if not os.environ.get("BOT_USERNAME"):
    os.environ["BOT_USERNAME"] = "TestBot"
if not os.environ.get("SUPPORT_HANDLE"):
    os.environ["SUPPORT_HANDLE"] = "@TestSupport"


@pytest.fixture
def mock_api_client():
    """Mock API responses for handlers. Patch get_user_by_tg, get_user_devices with these."""
    from api_client import Result
    client = MagicMock()
    client.get_user_by_tg = AsyncMock(
        return_value=Result.ok({
            "id": 1,
            "subscriptions": [{"status": "active", "valid_until": "2026-12-31T00:00:00Z", "device_limit": 5}],
        })
    )
    client.get_user_devices = AsyncMock(
        return_value=Result.ok([{"id": "dev_1", "device_name": "iPhone", "revoked_at": None, "server_id": "s1"}])
    )
    client.post_event = AsyncMock(return_value=Result.ok(None))
    return client


@pytest.fixture
def mock_message():
    msg = MagicMock()
    msg.from_user = MagicMock()
    msg.from_user.id = 12345
    msg.from_user.username = "test_user"
    msg.text = "/start"
    msg.answer = AsyncMock()
    msg.answer_invoice = AsyncMock()
    return msg


@pytest.fixture
def mock_state():
    state = AsyncMock()
    state.get_data = AsyncMock(return_value={"locale": "en"})
    state.update_data = AsyncMock()
    state.clear = AsyncMock()
    return state


@pytest.fixture
def mock_callback():
    cb = MagicMock()
    cb.from_user = MagicMock()
    cb.from_user.id = 12345
    cb.data = "plan:plan-1"
    cb.message = MagicMock()
    cb.message.text = "Select plan"
    cb.message.answer = AsyncMock()
    cb.message.edit_text = AsyncMock()
    cb.answer = AsyncMock()
    return cb
