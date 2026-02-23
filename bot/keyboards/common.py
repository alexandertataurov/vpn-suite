"""Shared inline keyboard helpers and callback patterns.

Callback format: action:param1:param2 (no spaces, : separator).
Examples: plan:abc, device_config:123, device_reset:456, menu:main, menu:devices.
"""

from aiogram.types import InlineKeyboardButton
from aiogram.utils.keyboard import InlineKeyboardBuilder


BACK_TEXT = "⬅️ Back"
BACK_TO_DEVICES_TEXT = "⬅️ Back to Devices"
HOME_TEXT = "🏠 Home"


def add_navigation_row(
    keyboard: InlineKeyboardBuilder,
    back_callback: str | None = None,
    show_home: bool = True,
    back_text: str = BACK_TEXT,
) -> InlineKeyboardBuilder:
    """Add Back/Home row to inline keyboard. Modifies builder in place and returns it."""
    row: list[InlineKeyboardButton] = []
    if back_callback:
        row.append(InlineKeyboardButton(text=back_text, callback_data=back_callback))
    if show_home:
        row.append(InlineKeyboardButton(text=HOME_TEXT, callback_data="menu:main"))
    if row:
        keyboard.row(*row)
    return keyboard


def nav_row_buttons(
    back_callback: str | None = None,
    show_home: bool = True,
    back_text: str = BACK_TEXT,
) -> list[InlineKeyboardButton]:
    """Return a single row of Back/Home buttons for use with list-of-lists markup."""
    row: list[InlineKeyboardButton] = []
    if back_callback:
        row.append(InlineKeyboardButton(text=back_text, callback_data=back_callback))
    if show_home:
        row.append(InlineKeyboardButton(text=HOME_TEXT, callback_data="menu:main"))
    return row
