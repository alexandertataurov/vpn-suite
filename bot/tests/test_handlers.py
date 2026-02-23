"""Tests for bot handlers (with mocked API)."""

import pytest
from unittest.mock import AsyncMock, patch, MagicMock

from api_client import Result

# Import after path is set
from handlers.start import cmd_start, set_lang, _lang_keyboard
from handlers.status import cmd_status
from handlers.install import cmd_install
from handlers.help import cmd_help
from handlers.support import cmd_support, _support_text
from handlers.devices import cmd_configs
from handlers.tariffs import on_successful_payment
from i18n import t


@pytest.mark.asyncio
async def test_lang_keyboard():
    kb = _lang_keyboard()
    assert kb is not None
    assert len(kb.inline_keyboard) == 1
    assert len(kb.inline_keyboard[0]) == 2
    assert kb.inline_keyboard[0][0].callback_data == "lang_ru"
    assert kb.inline_keyboard[0][1].callback_data == "lang_en"


@pytest.mark.asyncio
async def test_cmd_start_shows_lang(mock_message, mock_state):
    mock_message.text = "/start"
    with patch("api_client.post_event", AsyncMock()):
        await cmd_start(mock_message, mock_state)
    mock_message.answer.assert_called_once()
    call_args = mock_message.answer.call_args
    assert "language" in call_args[0][0].lower() or "choose" in call_args[0][0].lower()
    assert call_args[1].get("reply_markup") is not None


@pytest.mark.asyncio
async def test_cmd_status_no_user(mock_message, mock_state):
    with patch("handlers.status.get_user_by_tg", AsyncMock(return_value=Result.ok(None))):
        await cmd_status(mock_message, mock_state)
    mock_message.answer.assert_called_once()
    text = mock_message.answer.call_args[0][0].lower()
    assert "subscription" in text or "no" in text or "active" in text


@pytest.mark.asyncio
async def test_cmd_status_with_user(mock_message, mock_state):
    user_data = {
        "id": 1,
        "subscriptions": [
            {"id": "sub1", "status": "active", "valid_until": "2026-12-31T00:00:00Z", "device_limit": 5},
        ],
    }
    with patch("handlers.status.get_user_by_tg", AsyncMock(return_value=Result.ok(user_data))):
        with patch("handlers.status.get_user_devices", AsyncMock(return_value=Result.ok([]))):
            await cmd_status(mock_message, mock_state)
    mock_message.answer.assert_called_once()
    assert "2026" in mock_message.answer.call_args[0][0] or "subscription" in mock_message.answer.call_args[0][0].lower()


@pytest.mark.asyncio
async def test_cmd_install_returns_instruction(mock_message, mock_state):
    await cmd_install(mock_message, mock_state)
    assert mock_message.answer.call_count >= 1
    texts = " ".join(c[0][0] for c in mock_message.answer.call_args_list)
    assert "amnezia" in texts.lower() or "http" in texts.lower()


@pytest.mark.asyncio
async def test_cmd_help_returns_help_text(mock_message, mock_state):
    await cmd_help(mock_message, mock_state)
    assert mock_message.answer.call_count >= 1
    texts = " ".join(c[0][0] for c in mock_message.answer.call_args_list)
    assert "/start" in texts


@pytest.mark.asyncio
async def test_cmd_support_returns_message(mock_message, mock_state):
    await cmd_support(mock_message, mock_state)
    mock_message.answer.assert_called_once()
    assert "support" in mock_message.answer.call_args[0][0].lower() or "поддержка" in mock_message.answer.call_args[0][0].lower()


def test_support_message_fallback():
    with patch("handlers.support.SUPPORT_HANDLE", "@MySupport"):
        msg = _support_text("en")
    assert "support" in msg.lower() or "@" in msg


def test_menu_texts_keys():
    from handlers.tariffs import _menu_texts
    texts = _menu_texts("en")
    assert "tariffs" in texts
    assert "profile" in texts
    assert "add_device" in texts
    assert t("en", "connect_cta") in texts["connect"]
    assert "Connect" in texts["connect"]


@pytest.mark.asyncio
async def test_cmd_configs_sends_intro_and_devices(mock_message, mock_state):
    user_data = {"id": 1, "subscriptions": [{"id": "s1", "status": "active", "valid_until": "2026-12-31T00:00:00Z"}]}
    with patch("handlers.devices.get_user_by_tg", AsyncMock(return_value=Result.ok(user_data))):
        with patch("handlers.devices.get_user_devices", AsyncMock(return_value=Result.ok([{"id": "d1", "device_name": "phone", "revoked_at": None}]))):
            await cmd_configs(mock_message, mock_state)
    assert mock_message.answer.call_count >= 2
    assert "config" in mock_message.answer.call_args_list[0][0][0].lower() or "конфиг" in mock_message.answer.call_args_list[0][0][0].lower()


@pytest.mark.asyncio
async def test_status_api_timeout(mock_message, mock_state):
    """Test /status when API returns timeout error shows 'slow' message."""
    with patch("handlers.status.get_user_by_tg", AsyncMock(return_value=Result.fail("error_timeout"))):
        await cmd_status(mock_message, mock_state)
    mock_message.answer.assert_called_once()
    text = mock_message.answer.call_args[0][0].lower()
    assert "slow" in text or "медленно" in text or "retry" in text or "попробуйте" in text


@pytest.mark.asyncio
async def test_reset_device_result_type():
    from api_client import reset_device
    mock_api = MagicMock()
    mock_api.reset_device = AsyncMock(return_value=Result.fail("error_device_not_found"))
    with patch("api_client.get_api", return_value=mock_api):
        r = await reset_device("dev-123")
    assert r.success is False
    assert r.error == "error_device_not_found"


@pytest.mark.asyncio
async def test_successful_payment_message_when_backend_confirmed(mock_message, mock_state):
    with patch(
        "handlers.tariffs._wait_for_active_subscription",
        AsyncMock(return_value=True),
    ):
        await on_successful_payment(mock_message, mock_state)
    mock_message.answer.assert_called_once()
    text = mock_message.answer.call_args[0][0].lower()
    assert "successful" in text or "оплата" in text or "active" in text


@pytest.mark.asyncio
async def test_successful_payment_message_when_backend_pending(mock_message, mock_state):
    with patch(
        "handlers.tariffs._wait_for_active_subscription",
        AsyncMock(return_value=False),
    ):
        await on_successful_payment(mock_message, mock_state)
    mock_message.answer.assert_called_once()
    text = mock_message.answer.call_args[0][0].lower()
    assert "activation" in text or "активац" in text
