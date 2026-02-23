"""Handler for /help - FAQ, installation link, contact support button."""

from aiogram import Router, F
from aiogram.filters import Command
from aiogram.types import Message, CallbackQuery, InlineKeyboardButton, InlineKeyboardMarkup

from config import SUPPORT_LINK, SUPPORT_HANDLE
from i18n import t
from utils.safe_send import safe_send_message

router = Router()


async def _locale_from_state(state) -> str:
    data = await state.get_data()
    return data.get("locale", "en")


def _faq_text(locale: str) -> str:
    if locale == "ru":
        return (
            "❓ Частые вопросы\n\n"
            "• Как получить конфиг? Меню → Подключить → выберите тариф → после оплаты «Добавить устройство».\n"
            "• Конфиг не подключается? Проверьте инструкцию (/install), переустановите приложение.\n"
            "• Сброс устройства? /devices → выберите устройство → Сброс.\n\n"
            "Установка и поддержка — кнопки ниже."
        )
    return (
        "❓ FAQ\n\n"
        "• How do I get a config? Menu → Connect → choose a plan → after payment tap Add device.\n"
        "• Config won't connect? Check the installation guide (/install), reinstall the app.\n"
        "• Reset a device? /devices → select device → Reset.\n\n"
        "Installation guide and support — buttons below."
    )


@router.message(Command("help"))
async def cmd_help(message: Message, state):
    locale = await _locale_from_state(state)
    await safe_send_message(message, _faq_text(locale))
    buttons = [
        [InlineKeyboardButton(text="📖 Installation guide" if locale == "en" else "📖 Инструкция", callback_data="help:install")],
    ]
    if SUPPORT_LINK:
        buttons.append([InlineKeyboardButton(text="💬 Contact support" if locale == "en" else "💬 Поддержка", url=SUPPORT_LINK)])
    else:
        buttons.append([InlineKeyboardButton(text="💬 Contact support" if locale == "en" else "💬 Поддержка", callback_data="help:support")])
    buttons.append([InlineKeyboardButton(text="🏠 Home", callback_data="menu:main")])
    await message.answer(
        "Commands: /start /status /devices /install /support" if locale == "en" else "Команды: /start /status /devices /install /support",
        reply_markup=InlineKeyboardMarkup(inline_keyboard=buttons),
    )


@router.callback_query(F.data == "help:install")
async def on_help_install(callback: CallbackQuery, state):
    await callback.answer()
    locale = (await state.get_data()).get("locale", "en")
    await safe_send_message(callback.message, t(locale, "instruction_text"))


@router.callback_query(F.data == "help:support")
async def on_help_support(callback: CallbackQuery, state):
    await callback.answer()
    locale = (await state.get_data()).get("locale", "en")
    h = (SUPPORT_HANDLE or "").strip()
    if h:
        handle = h if h.startswith("@") else "@" + h
        support_msg = ("Contact support: " + handle) if locale == "en" else ("Поддержка: " + handle)
    else:
        support_msg = "Contact support: @support" if locale == "en" else "Поддержка: @support"
    await callback.message.answer(support_msg)
