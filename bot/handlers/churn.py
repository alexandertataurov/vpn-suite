"""Churn survey: what went wrong, retention discount, pause offer."""

import structlog
from aiogram import F, Router
from aiogram.types import CallbackQuery, InlineKeyboardButton, InlineKeyboardMarkup, Message

from api_client import churn_survey
from i18n import t
from keyboards.common import nav_row_buttons

router = Router()
_log = structlog.get_logger(__name__)

CHURN_REASONS = [
    ("too_expensive", "churn_too_expensive"),
    ("speed_issue", "churn_speed"),
    ("not_needed", "churn_not_needed"),
    ("other", "churn_other"),
]


def churn_survey_keyboard(locale: str) -> InlineKeyboardMarkup:
    return InlineKeyboardMarkup(inline_keyboard=[
        [InlineKeyboardButton(text=t(locale, key), callback_data=f"churn:{reason}")]
        for reason, key in CHURN_REASONS
    ] + [nav_row_buttons(back_callback="nav:home")])


async def show_churn_survey(message: Message, locale: str, subscription_id: str | None = None, state=None):
    """Show 'Before you leave, what went wrong?' with reason buttons."""
    if state is not None:
        await state.update_data(churn_subscription_id=subscription_id)
    await message.answer(
        t(locale, "churn_before_leave"),
        reply_markup=churn_survey_keyboard(locale),
    )


@router.callback_query(F.data.startswith("churn:start"))
async def on_churn_start_callback(callback: CallbackQuery, state):
    """Entry from cabinet: churn:start or churn:start:SUB_ID."""
    await callback.answer()
    data = await state.get_data()
    locale = data.get("locale", "en")
    parts = callback.data.split(":", 2)
    sub_id = parts[2] if len(parts) > 2 else None
    await show_churn_survey(callback.message, locale, subscription_id=sub_id, state=state)


@router.callback_query(F.data.in_(["churn:too_expensive", "churn:speed_issue", "churn:not_needed", "churn:other"]))
async def on_churn_reason(callback: CallbackQuery, state):
    reason = callback.data.replace("churn:", "", 1).strip() or "other"
    if reason not in ("too_expensive", "speed_issue", "not_needed", "other"):
        reason = "other"
    user = callback.from_user
    if not user:
        await callback.answer()
        return
    data = await state.get_data()
    locale = data.get("locale", "en")
    subscription_id = data.get("churn_subscription_id")
    await callback.answer()
    result = await churn_survey(user.id, reason=reason, subscription_id=subscription_id)
    if not result.success:
        await callback.message.answer(
            "Could not record. Try again later." if locale == "en" else "Не удалось сохранить. Попробуйте позже.",
            reply_markup=InlineKeyboardMarkup(inline_keyboard=[nav_row_buttons(back_callback="nav:home")]),
        )
        return
    d = result.data or {}
    if d.get("retention_discount_offered") and d.get("discount_percent"):
        view_plans = "View plans" if locale == "en" else "Тарифы"
        await callback.message.answer(
            t(locale, "churn_retention_offer").format(percent=d["discount_percent"]),
            reply_markup=InlineKeyboardMarkup(inline_keyboard=[
                [InlineKeyboardButton(text=view_plans, callback_data="show_tariffs")],
                nav_row_buttons(back_callback="nav:home"),
            ]),
        )
    elif d.get("pause_offered"):
        await callback.message.answer(
            t(locale, "churn_paused"),
            reply_markup=InlineKeyboardMarkup(inline_keyboard=[nav_row_buttons(back_callback="nav:home")]),
        )
    else:
        await callback.message.answer(
            "Thanks for your feedback." if locale == "en" else "Спасибо за отзыв.",
            reply_markup=InlineKeyboardMarkup(inline_keyboard=[nav_row_buttons(back_callback="nav:home")]),
        )


