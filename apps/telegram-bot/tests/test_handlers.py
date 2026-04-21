"""Tests for bot handlers — /start only."""

import pytest
from unittest.mock import AsyncMock, MagicMock

from handlers.start import cmd_start
from i18n import t


@pytest.fixture
def mock_message():
    msg = MagicMock()
    msg.from_user = MagicMock()
    msg.from_user.id = 12345
    msg.from_user.language_code = "en"  # Force English for deterministic assertions
    msg.chat = MagicMock()
    msg.chat.id = 99999
    msg.bot = MagicMock()
    msg.bot.set_chat_menu_button = AsyncMock(return_value=True)
    msg.text = "/start"
    msg.answer = AsyncMock()
    return msg


@pytest.mark.asyncio
async def test_cmd_start_sends_greeting_and_button(mock_message):
    await cmd_start(mock_message)
    mock_message.answer.assert_called_once()
    call_args = mock_message.answer.call_args
    text = call_args[0][0]
    assert t("en", "welcome") in text or "Welcome" in text
    assert "example.com/webapp" in text
    reply_markup = call_args[1].get("reply_markup")
    assert reply_markup is not None
    assert len(reply_markup.inline_keyboard) == 1
    assert len(reply_markup.inline_keyboard[0]) == 1
    btn = reply_markup.inline_keyboard[0][0]
    assert btn.web_app is not None
    assert btn.web_app.url
    assert "webapp" in btn.web_app.url or "http" in btn.web_app.url
    assert btn.text == t("en", "open_app") or "Open" in btn.text


@pytest.mark.asyncio
async def test_cmd_start_with_ref_appends_ref_to_url(mock_message):
    mock_message.text = "/start ref_ABC123"
    await cmd_start(mock_message)
    call_args = mock_message.answer.call_args
    reply_markup = call_args[1].get("reply_markup")
    btn = reply_markup.inline_keyboard[0][0]
    assert "ref=ABC123" in btn.web_app.url or "ref=" in btn.web_app.url


@pytest.mark.asyncio
async def test_cmd_start_sets_menu_button_open_app(mock_message):
    """Per-user set_chat_menu_button is called with text 'Open App' and MINIAPP_URL."""
    await cmd_start(mock_message)
    mock_message.bot.set_chat_menu_button.assert_called_once()
    call_kw = mock_message.bot.set_chat_menu_button.call_args[1]
    assert call_kw["chat_id"] == mock_message.chat.id
    menu_btn = call_kw["menu_button"]
    assert menu_btn.text == "Open App"
    assert menu_btn.web_app is not None
    assert "webapp" in menu_btn.web_app.url or "example.com" in menu_btn.web_app.url
