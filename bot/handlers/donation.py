"""Donation flow: offer 100/200/300 Stars or custom amount, then send Telegram Stars invoice."""

from __future__ import annotations

from aiogram import F, Router
from aiogram.filters import Command
from aiogram.fsm.context import FSMContext
from aiogram.fsm.state import State, StatesGroup
from aiogram import Bot
from aiogram.types import CallbackQuery, InlineKeyboardButton, InlineKeyboardMarkup, Message

from api_client import create_donation_invoice
from i18n import t
from utils.logging import get_logger

_log = get_logger(__name__)

router = Router()

DONATION_PRESETS = (150, 250, 350)
DONATION_MIN = 1
DONATION_MAX = 25_000


class DonationFlow(StatesGroup):
    waiting_custom_amount = State()


def _locale_from_user(message_or_query: Message | CallbackQuery) -> str:
    # Explicit requirement: donation flow must be Russian-only.
    return "ru"


def _donation_keyboard(locale: str) -> InlineKeyboardMarkup:
    rows: list[list[InlineKeyboardButton]] = [
        [
            InlineKeyboardButton(text=f"{n} ⭐", callback_data=f"donate:{n}")
            for n in DONATION_PRESETS
        ],
        [InlineKeyboardButton(text=t(locale, "donate_custom_btn"), callback_data="donate:custom")],
    ]
    return InlineKeyboardMarkup(inline_keyboard=rows)


async def _send_invoice_to_user(bot: Bot, *, tg_id: int, locale: str, stars: int) -> None:
    result = await create_donation_invoice(tg_id=tg_id, star_count=stars)
    if not result.success or not isinstance(result.data, dict):
        _log.warning("donation_invoice_create_failed", tg_id=tg_id, stars=stars, error=result.error)
        await bot.send_message(chat_id=tg_id, text=t(locale, "donate_error"), parse_mode=None)
        return
    inv = result.data
    payload = str(inv.get("payload") or "")
    title = str(inv.get("title") or "Донат")
    description = str(inv.get("description") or "Поддержка проекта")
    star_count = int(inv.get("star_count") or 0)
    if not payload or star_count <= 0:
        _log.warning(
            "donation_invoice_invalid",
            tg_id=tg_id,
            stars=stars,
            payload_present=bool(payload),
            star_count=star_count,
        )
        await bot.send_message(chat_id=tg_id, text=t(locale, "donate_error"), parse_mode=None)
        return

    from aiogram.types import LabeledPrice

    try:
        await bot.send_invoice(
            chat_id=tg_id,
            title=title[:32],
            description=description[:255],
            payload=payload[:128],
            provider_token="",
            currency="XTR",
            prices=[LabeledPrice(label=title[:32] or "Донат", amount=star_count)],
        )
    except Exception as e:
        _log.warning("donation_send_invoice_failed", tg_id=tg_id, stars=stars, error=str(e))
        await bot.send_message(
            chat_id=tg_id,
            text="Не удалось отправить инвойс. Попробуйте ещё раз.",
            parse_mode=None,
        )


@router.message(Command("donate"))
async def cmd_donate(message: Message, state: FSMContext) -> None:
    await state.clear()
    locale = _locale_from_user(message)
    await message.answer(t(locale, "donate_offer_text"), reply_markup=_donation_keyboard(locale), parse_mode=None)


@router.callback_query(F.data.startswith("donate:"))
async def on_donate_callback(query: CallbackQuery, state: FSMContext) -> None:
    locale = _locale_from_user(query)
    data = (query.data or "").split(":", 1)[-1]
    try:
        await query.answer()
    except Exception as e:
        # Users can click old inline buttons; answering may fail if query is too old.
        _log.debug("donation_callback_answer_failed", error=str(e))
    if not query.message:
        return
    if data == "custom":
        await state.set_state(DonationFlow.waiting_custom_amount)
        await query.message.answer(t(locale, "donate_custom_prompt"), parse_mode=None)
        return
    try:
        stars = int(data)
    except ValueError:
        return
    if stars < DONATION_MIN or stars > DONATION_MAX:
        await query.message.answer(t(locale, "donate_custom_invalid"), parse_mode=None)
        return
    tg_id = query.from_user.id if query.from_user else None
    if not tg_id:
        return
    await _send_invoice_to_user(query.bot, tg_id=tg_id, locale=locale, stars=stars)


@router.message(DonationFlow.waiting_custom_amount)
async def on_custom_amount(message: Message, state: FSMContext) -> None:
    locale = _locale_from_user(message)
    raw = (message.text or "").strip().replace(" ", "")
    try:
        stars = int(raw)
    except ValueError:
        await message.answer(t(locale, "donate_custom_invalid"), parse_mode=None)
        return
    if stars < DONATION_MIN or stars > DONATION_MAX:
        await message.answer(t(locale, "donate_custom_invalid"), parse_mode=None)
        return
    await state.clear()
    tg_id = message.from_user.id if message.from_user else None
    if not tg_id:
        return
    await _send_invoice_to_user(message.bot, tg_id=tg_id, locale=locale, stars=stars)

