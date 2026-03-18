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
if not os.environ.get("MINIAPP_URL"):
    os.environ["MINIAPP_URL"] = "https://example.com/webapp"


@pytest.fixture
def mock_api_client():
    """Mock API responses for handlers. Patch get_referral_my_link, confirm_telegram_stars_payment."""
    from api_client import Result
    client = MagicMock()
    client.get_referral_my_link = AsyncMock(
        return_value=Result.ok({"payload": "ref_abc123"})
    )
    client.confirm_telegram_stars_payment = AsyncMock(return_value=Result.ok({}))
    return client
