"""Handler for /install - instruction text and Get Config quick action."""

from aiogram import Router, F
from aiogram.filters import Command
from aiogram.types import Message, CallbackQuery, InlineKeyboardButton, InlineKeyboardMarkup

from i18n import t
from utils.safe_send import safe_send_message

router = Router()


async def _locale_from_state(state) -> str:
    data = await state.get_data()
    return data.get("locale", "en")


@router.message(Command("install"))
async def cmd_install(message: Message, state):
    locale = await _locale_from_state(state)
    await safe_send_message(message, t(locale, "instruction_text"))
    open_menu_text = t(locale, "➡️ Open Connect menu")
    home_text = t(locale, "🏠 Home")
    keyboard = InlineKeyboardMarkup(inline_keyboard=[
        [InlineKeyboardButton(text=open_menu_text, callback_data="install:get_config")],
        [InlineKeyboardButton(text=home_text, callback_data="nav:home")],
    ])
    hint = t(locale, "install_hint_open_connect")
    await message.answer(hint, reply_markup=keyboard)


@router.callback_query(F.data == "install:get_config")
async def on_get_config(callback: CallbackQuery, state):
    """Offer quick navigation to Connect menu."""
    await callback.answer()
    locale = (await state.get_data()).get("locale", "en")
    await callback.message.answer(
        t(locale, "install_hint_open_connect_short"),
        reply_markup=InlineKeyboardMarkup(inline_keyboard=[
            [InlineKeyboardButton(text=t(locale, "🚀 Connect VPN"), callback_data="nav:connect")],
            [InlineKeyboardButton(text=t(locale, "🏠 Home"), callback_data="nav:home")],
        ]),
    )
