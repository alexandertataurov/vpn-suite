"""Tests for keyboard helpers."""

import sys
from pathlib import Path

import pytest

bot_root = Path(__file__).resolve().parent.parent
if str(bot_root) not in sys.path:
    sys.path.insert(0, str(bot_root))

from aiogram.utils.keyboard import InlineKeyboardBuilder
from keyboards.common import add_navigation_row, BACK_TEXT, HOME_TEXT


def test_navigation_row():
    """add_navigation_row adds Back + Home row."""
    kb = InlineKeyboardBuilder()
    kb.button(text="Action", callback_data="do_something")
    add_navigation_row(kb, back_callback="menu:settings")
    markup = kb.as_markup()
    assert len(markup.inline_keyboard) == 2
    nav_row = markup.inline_keyboard[1]
    assert len(nav_row) == 2
    assert nav_row[0].text == BACK_TEXT
    assert nav_row[1].text == HOME_TEXT
    assert nav_row[0].callback_data == "menu:settings"
    assert nav_row[1].callback_data == "menu:main"
