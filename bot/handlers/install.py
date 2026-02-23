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
    open_menu_text = "➡️ Open Connect menu" if locale == "en" else "➡️ Открыть меню подключения"
    home_text = "🏠 Home" if locale == "en" else "🏠 Домой"
    keyboard = InlineKeyboardMarkup(inline_keyboard=[
        [InlineKeyboardButton(text=open_menu_text, callback_data="install:get_config")],
        [InlineKeyboardButton(text=home_text, callback_data="menu:main")],
    ])
    hint = (
        "Use the button below, then choose Connect in the main menu to get your config."
        if locale == "en"
        else "Нажмите кнопку ниже, затем в главном меню выберите Подключить, чтобы получить конфиг."
    )
    await message.answer(hint, reply_markup=keyboard)


@router.callback_query(F.data == "install:get_config")
async def on_get_config(callback: CallbackQuery, state):
    """Redirect to main menu for Connect / Add device."""
    from handlers.start import _send_main_keyboard
    await callback.answer()
    locale = (await state.get_data()).get("locale", "en")
    await callback.message.answer(
        "Use Connect or Add device from the menu below."
        if locale == "en"
        else "Используйте Подключить или Добавить устройство в меню ниже."
    )
    await _send_main_keyboard(callback.message, locale)
