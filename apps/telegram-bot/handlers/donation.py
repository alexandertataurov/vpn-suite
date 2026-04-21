"""Donation flow: send Stars invoice or Platega payment link directly from bot."""

from __future__ import annotations

from aiogram import F, Router
from aiogram import Bot
from aiogram.filters import Command
from aiogram.fsm.context import FSMContext
from aiogram.fsm.state import State, StatesGroup
from aiogram.types import CallbackQuery, InlineKeyboardButton, InlineKeyboardMarkup, Message

from api_client import create_donation_invoice, create_platega_donation_link, get_user_by_tg
from i18n import t
from utils.logging import get_logger

_log = get_logger(__name__)

router = Router()

DONATION_PRESETS = (150, 250, 350)
DONATION_MIN = 1
DONATION_MAX = 25_000


class DonationFlow(StatesGroup):
    waiting_custom_amount = State()


def _locale_from_user(message: Message) -> str:
    # Explicit requirement: donation flow must be Russian-only.
    return "ru"


def _donation_keyboard(locale: str) -> InlineKeyboardMarkup:
    return InlineKeyboardMarkup(
        inline_keyboard=[
            [
                InlineKeyboardButton(
                    text=t(locale, "donate_with_stars_btn"),
                    callback_data="donate:stars",
                )
            ],
            [
                InlineKeyboardButton(
                    text=f"{DONATION_PRESETS[0]} ⭐",
                    callback_data=f"donate:stars:{DONATION_PRESETS[0]}",
                ),
                InlineKeyboardButton(
                    text=f"{DONATION_PRESETS[1]} ⭐",
                    callback_data=f"donate:stars:{DONATION_PRESETS[1]}",
                ),
                InlineKeyboardButton(
                    text=f"{DONATION_PRESETS[2]} ⭐",
                    callback_data=f"donate:stars:{DONATION_PRESETS[2]}",
                ),
            ],
            [
                InlineKeyboardButton(
                    text=t(locale, "donate_custom_btn"),
                    callback_data="donate:stars:custom",
                )
            ],
            [
                InlineKeyboardButton(
                    text=t(locale, "donate_with_platega_btn"),
                    callback_data="donate:platega",
                )
            ],
            [
                InlineKeyboardButton(
                    text=f"{DONATION_PRESETS[0]} ₽",
                    callback_data=f"donate:platega:{DONATION_PRESETS[0]}",
                ),
                InlineKeyboardButton(
                    text=f"{DONATION_PRESETS[1]} ₽",
                    callback_data=f"donate:platega:{DONATION_PRESETS[1]}",
                ),
                InlineKeyboardButton(
                    text=f"{DONATION_PRESETS[2]} ₽",
                    callback_data=f"donate:platega:{DONATION_PRESETS[2]}",
                ),
            ],
            [
                InlineKeyboardButton(
                    text=t(locale, "donate_custom_btn"),
                    callback_data="donate:platega:custom",
                )
            ],
        ]
    )


@router.message(Command("donate"))
async def cmd_donate(message: Message, state: FSMContext) -> None:
    await state.clear()
    locale = _locale_from_user(message)
    await message.answer(
        t(locale, "donate_offer_text"),
        reply_markup=_donation_keyboard(locale),
        parse_mode=None,
    )


async def _ensure_has_subscription(bot: Bot, *, tg_id: int, locale: str) -> bool:
    user_result = await get_user_by_tg(tg_id)
    if user_result.success and isinstance(user_result.data, dict):
        subs = user_result.data.get("subscriptions")
        if isinstance(subs, list) and len(subs) == 0:
            await bot.send_message(chat_id=tg_id, text=t(locale, "donate_requires_subscription"), parse_mode=None)
            return False
    return True


async def _send_stars_invoice(bot: Bot, *, tg_id: int, locale: str, stars: int) -> None:
    if stars < DONATION_MIN or stars > DONATION_MAX:
        await bot.send_message(chat_id=tg_id, text=t(locale, "donate_custom_invalid"), parse_mode=None)
        return
    if not await _ensure_has_subscription(bot, tg_id=tg_id, locale=locale):
        return
    result = await create_donation_invoice(tg_id=tg_id, star_count=stars)
    if not result.success or not isinstance(result.data, dict):
        _log.warning("donation_invoice_create_failed", tg_id=tg_id, stars=stars, error=result.error)
        await bot.send_message(chat_id=tg_id, text=t(locale, "donate_error"), parse_mode=None)
        return
    inv = result.data
    payload = str(inv.get("payload") or "")
    title = str(inv.get("title") or "Donation")
    description = str(inv.get("description") or "Support the project")
    star_count = int(inv.get("star_count") or 0)
    if not payload or star_count <= 0:
        await bot.send_message(chat_id=tg_id, text=t(locale, "donate_error"), parse_mode=None)
        return
    from aiogram.types import LabeledPrice
    await bot.send_invoice(
        chat_id=tg_id,
        title=title[:32],
        description=description[:255],
        payload=payload[:128],
        provider_token="",
        currency="XTR",
        prices=[LabeledPrice(label=title[:32] or "Donation", amount=star_count)],
    )


async def _send_platega_link(bot: Bot, *, tg_id: int, locale: str, amount: int) -> None:
    if amount < DONATION_MIN or amount > DONATION_MAX:
        await bot.send_message(chat_id=tg_id, text=t(locale, "donate_custom_invalid"), parse_mode=None)
        return
    if not await _ensure_has_subscription(bot, tg_id=tg_id, locale=locale):
        return
    result = await create_platega_donation_link(tg_id=tg_id, amount=amount)
    if not result.success or not isinstance(result.data, dict):
        _log.warning("platega_donation_link_failed", tg_id=tg_id, amount=amount, error=result.error)
        await bot.send_message(chat_id=tg_id, text=t(locale, "donate_error"), parse_mode=None)
        return
    url = str(result.data.get("invoice_url") or "").strip()
    if not url:
        await bot.send_message(chat_id=tg_id, text=t(locale, "donate_error"), parse_mode=None)
        return
    kb = InlineKeyboardMarkup(
        inline_keyboard=[
            [InlineKeyboardButton(text=t(locale, "donate_open_payment_btn"), url=url)],
        ]
    )
    await bot.send_message(chat_id=tg_id, text=t(locale, "donate_open_payment_text"), reply_markup=kb, parse_mode=None)


@router.callback_query(F.data.startswith("donate:"))
async def on_donate_callback(query: CallbackQuery, state: FSMContext) -> None:
    locale = "ru"
    try:
        await query.answer()
    except Exception:
        pass
    tg_id = query.from_user.id if query.from_user else None
    if not tg_id:
        return
    parts = (query.data or "").split(":")
    if len(parts) < 2:
        return
    provider = parts[1].strip().lower()
    amount_raw = parts[2] if len(parts) >= 3 else ""
    if amount_raw == "custom":
        await state.set_state(DonationFlow.waiting_custom_amount)
        await state.update_data(provider=provider)
        if query.message:
            await query.message.answer(t(locale, "donate_custom_prompt"), parse_mode=None)
        return
    try:
        amount = int(amount_raw)
    except ValueError:
        return
    if provider == "stars":
        await _send_stars_invoice(query.bot, tg_id=tg_id, locale=locale, stars=amount)
        return
    if provider == "platega":
        await _send_platega_link(query.bot, tg_id=tg_id, locale=locale, amount=amount)


@router.message(DonationFlow.waiting_custom_amount)
async def on_custom_amount(message: Message, state: FSMContext) -> None:
    locale = _locale_from_user(message)
    raw = (message.text or "").strip().replace(" ", "")
    try:
        amount = int(raw)
    except ValueError:
        await message.answer(t(locale, "donate_custom_invalid"), parse_mode=None)
        return
    data = await state.get_data()
    provider = str(data.get("provider") or "").strip().lower()
    await state.clear()
    tg_id = message.from_user.id if message.from_user else None
    if not tg_id:
        return
    if provider == "platega":
        await _send_platega_link(message.bot, tg_id=tg_id, locale=locale, amount=amount)
    else:
        await _send_stars_invoice(message.bot, tg_id=tg_id, locale=locale, stars=amount)
