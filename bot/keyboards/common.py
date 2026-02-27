"""Shared inline keyboard helpers and callback patterns.

Callback format: action:param1:param2 (no spaces, : separator).
Examples: plan:abc, dev:id:config, nav:home, nav:devices.
"""

from aiogram.types import InlineKeyboardButton, InlineKeyboardMarkup
from aiogram.utils.keyboard import InlineKeyboardBuilder

from i18n import t


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
        row.append(InlineKeyboardButton(text=HOME_TEXT, callback_data="nav:home"))
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
        row.append(InlineKeyboardButton(text=HOME_TEXT, callback_data="nav:home"))
    return row


def error_nav_markup() -> InlineKeyboardMarkup:
    """Inline Home for error / dead-end messages."""
    return InlineKeyboardMarkup(inline_keyboard=[nav_row_buttons(back_callback="nav:home")])


def connect_nav_markup(locale: str = "en") -> InlineKeyboardMarkup:
    """Inline [Connect] [Home] for no_subscription / device_limit so user can open plan list."""
    connect_text = "Connect" if locale == "en" else "Подключить"
    return InlineKeyboardMarkup(inline_keyboard=[[
        InlineKeyboardButton(text=connect_text, callback_data="show_tariffs"),
        InlineKeyboardButton(text=t(locale, HOME_TEXT), callback_data="nav:home"),
    ]])


def instruction_nav_markup(locale: str = "en") -> InlineKeyboardMarkup:
    """Inline [Open Connect menu] [Home] after instruction text."""
    open_connect = "Open Connect menu" if locale == "en" else "Открыть меню Подключить"
    return InlineKeyboardMarkup(inline_keyboard=[[
        InlineKeyboardButton(text=open_connect, callback_data="show_tariffs"),
        InlineKeyboardButton(text=t(locale, HOME_TEXT), callback_data="nav:home"),
    ]])
