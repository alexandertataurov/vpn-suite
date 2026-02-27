"""Handler for /help - FAQ, installation link, contact support button."""

from aiogram import Router, F
from aiogram.filters import Command
from aiogram.types import Message, CallbackQuery, InlineKeyboardButton, InlineKeyboardMarkup

from config import SUPPORT_LINK, SUPPORT_HANDLE
from i18n import t
from keyboards.common import error_nav_markup
from utils.safe_send import safe_send_message

router = Router()


async def _locale_from_state(state) -> str:
    data = await state.get_data()
    return data.get("locale", "en")


def _trust_block(locale: str) -> str:
    support = (SUPPORT_HANDLE or "").strip()
    if not support.startswith("@"):
        support = "@" + support if support else "@support"
    return (
        f"\n\n{t(locale, 'trust_uptime')}\n"
        f"{t(locale, 'trust_no_logs')}\n"
        f"{t(locale, 'trust_refund')}{support}\n"
        f"{t(locale, 'trust_operated')}"
    )


def _faq_text(locale: str) -> str:
    if locale == "ru":
        base = (
            "❓ Частые вопросы\n\n"
            "• Как получить конфиг? Меню → Подключить → выберите тариф → после оплаты «Добавить устройство».\n"
            "• Конфиг не подключается? Проверьте инструкцию (/install), переустановите приложение.\n"
            "• Сброс устройства? /devices → выберите устройство → Сброс.\n\n"
            "Установка и поддержка — кнопки ниже."
        )
    else:
        base = (
            "❓ FAQ\n\n"
            "• How do I get a config? Menu → Connect → choose a plan → after payment tap Add device.\n"
            "• Config won't connect? Check the installation guide (/install), reinstall the app.\n"
            "• Reset a device? /devices → select device → Reset.\n\n"
            "Installation guide and support — buttons below."
        )
    return base + _trust_block(locale)


@router.message(Command("help"))
async def cmd_help(message: Message, state):
    locale = await _locale_from_state(state)
    await safe_send_message(message, _faq_text(locale))
    buttons = [
        [InlineKeyboardButton(text=t(locale, "help_install_btn"), callback_data="help:install")],
        [InlineKeyboardButton(text=t(locale, "help_support_menu_btn"), callback_data="nav:support")],
    ]
    if SUPPORT_LINK:
        buttons.append([InlineKeyboardButton(text=t(locale, "help_contact_btn"), url=SUPPORT_LINK)])
    else:
        buttons.append([InlineKeyboardButton(text=t(locale, "help_contact_btn"), callback_data="help:support")])
    buttons.append([InlineKeyboardButton(text=t(locale, "🏠 Home"), callback_data="nav:home")])
    await message.answer(
        t(locale, "help_commands_short"),
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
    handle = (h if h.startswith("@") else "@" + h) if h else "@support"
    support_msg = t(locale, "contact_support_prefix") + handle
    await callback.message.answer(support_msg, reply_markup=error_nav_markup())
