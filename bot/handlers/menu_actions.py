"""High-level menu actions: act:* and pay:* callbacks."""

import time
from typing import Optional

import structlog
from aiogram import F, Router
from aiogram.fsm.context import FSMContext
from aiogram.types import CallbackQuery

from i18n import t
from keyboards.common import error_nav_markup, connect_nav_markup
from utils.messages import get_error_message

router = Router()
_log = structlog.get_logger(__name__)


async def _locale_from_state(state: FSMContext) -> str:
    data = await state.get_data()
    return data.get("locale", "en")


async def _post_action_event(
    name: str,
    ok: bool,
    user_id: Optional[int],
    extra: Optional[dict] = None,
) -> None:
    if not user_id:
        return
    try:
        from api_client import post_event

        payload = {"action": name}
        if extra:
            payload.update(extra)
        await post_event("action_ok" if ok else "action_err", user_id, payload)
    except Exception as e:  # pragma: no cover
        _log.debug("action_telemetry_failed", action=name, error=str(e))


@router.callback_query(F.data.startswith("act:"))
async def on_action(callback: CallbackQuery, state: FSMContext):
    started = time.monotonic()
    await callback.answer()
    raw = callback.data or ""
    action = raw.split(":", 1)[1] if ":" in raw else ""
    locale = await _locale_from_state(state)
    user = callback.from_user
    user_id = user.id if user else None

    ok = True
    try:
        if action == "get_config":
            await _handle_get_config(callback, state, locale)
        elif action == "reissue_config":
            await _handle_reissue_config(callback, state, locale)
        elif action == "add_device":
            await _handle_add_device(callback, state, locale)
        elif action in ("list_devices", "remove_device_pick", "download_config"):
            await _handle_list_devices(callback, state, locale)
        elif action in ("renew", "open_tariffs"):
            await _handle_show_tariffs(callback, state, locale)
        elif action == "my_plan":
            await _handle_my_plan(callback, state, locale)
        elif action == "receipts":
            await _handle_receipts(callback, state, locale)
        elif action == "service_status":
            await _handle_service_status(callback, state, locale)
        elif action == "usage":
            await _handle_usage(callback, state, locale)
        elif action == "faq":
            await _handle_faq(callback, state, locale)
        elif action == "talk_support":
            await _handle_talk_support(callback, state, locale)
        elif action == "promo":
            await _handle_promo(callback, state, locale)
        elif action.startswith("ts_") or action.startswith("send_report"):
            await _handle_troubleshooter_and_report(action, callback, state, locale)
        elif action in ("logout_sessions", "reset_configs"):
            await _handle_security_stub(action, callback, locale)
        else:
            ok = False
            _log.debug("unknown_action", action=action, cb_data=raw)
            await callback.message.answer(
                get_error_message("error_api", locale),
                reply_markup=error_nav_markup(),
            )
    except Exception as e:  # pragma: no cover
        ok = False
        _log.warning("action_handler_failed", action=action, error=str(e))
        await callback.message.answer(
            get_error_message("error_api", locale),
            reply_markup=error_nav_markup(),
        )
    finally:
        await _post_action_event(
            name=action or "unknown",
            ok=ok,
            user_id=user_id,
            extra={"latency_ms": int((time.monotonic() - started) * 1000.0)},
        )


async def _handle_get_config(callback: CallbackQuery, state: FSMContext, locale: str):
    """Fast path: if user has active sub, start add-device; else open tariffs."""
    from api_client import get_user_by_tg
    from utils.formatting import is_subscription_effectively_active
    from handlers.tariffs import add_device_flow, show_tariffs

    if not callback.from_user:
        await callback.message.answer(
            get_error_message("error_api", locale),
            reply_markup=error_nav_markup(),
        )
        return
    result = await get_user_by_tg(callback.from_user.id)
    if not result.success or not result.data:
        await show_tariffs(callback.message, locale)
        return
    user_data = result.data
    subs = [
        s for s in (user_data.get("subscriptions") or [])
        if is_subscription_effectively_active(s)
    ]
    if not subs:
        await show_tariffs(callback.message, locale)
        return
    await add_device_flow(callback.message, locale, state, user=callback.from_user)


async def _handle_reissue_config(callback: CallbackQuery, state: FSMContext, locale: str):
    from handlers.devices import show_devices_list

    await callback.message.answer(t(locale, "reissue_pick_device"), reply_markup=error_nav_markup())
    await show_devices_list(callback.message, state)


async def _handle_add_device(callback: CallbackQuery, state: FSMContext, locale: str):
    from handlers.tariffs import add_device_flow

    await add_device_flow(callback.message, locale, state, user=callback.from_user)


async def _handle_list_devices(callback: CallbackQuery, state: FSMContext, locale: str):
    from handlers.devices import show_devices_list

    await show_devices_list(callback.message, state)


async def _handle_show_tariffs(callback: CallbackQuery, state: FSMContext, locale: str):
    from handlers.tariffs import show_tariffs

    await show_tariffs(callback.message, locale)


async def _handle_my_plan(callback: CallbackQuery, state: FSMContext, locale: str):
    from handlers.tariffs import show_cabinet

    await show_cabinet(callback.message, locale, state)


async def _handle_receipts(callback: CallbackQuery, state: FSMContext, locale: str):
    await callback.message.answer(t(locale, "stub_receipts"), reply_markup=error_nav_markup())


async def _handle_service_status(callback: CallbackQuery, state: FSMContext, locale: str):
    from handlers.status import cmd_status

    # callback.message was sent by bot, so message.from_user=bot. Use callback.from_user.id.
    uid = callback.from_user.id if callback.from_user else None
    if not uid:
        await callback.message.answer(
            get_error_message("error_api", locale),
            reply_markup=error_nav_markup(),
        )
        return
    await cmd_status(callback.message, state, tg_id=uid)


async def _handle_usage(callback: CallbackQuery, state: FSMContext, locale: str):
    await callback.message.answer(t(locale, "stub_usage"), reply_markup=error_nav_markup())


async def _handle_faq(callback: CallbackQuery, state: FSMContext, locale: str):
    await callback.message.answer(t(locale, "stub_faq"), reply_markup=error_nav_markup())


async def _handle_talk_support(callback: CallbackQuery, state: FSMContext, locale: str):
    from handlers.support import _support_text

    await callback.message.answer(_support_text(locale), reply_markup=error_nav_markup())


async def _handle_promo(callback: CallbackQuery, state: FSMContext, locale: str):
    await state.update_data(waiting_promo_code=True)
    await callback.message.answer(
        t(locale, "promo_placeholder") + t(locale, "promo_send_hint"),
        reply_markup=error_nav_markup(),
    )


async def _handle_troubleshooter_and_report(
    action: str,
    callback: CallbackQuery,
    state: FSMContext,
    locale: str,
):
    from api_client import get_user_by_tg, post_event

    msg = callback.message
    if msg is None:
        return

    if action.startswith("ts_"):
        if action == "ts_no_connection":
            text = t(locale, "ts_no_connection")
            category = "no_connection"
        elif action == "ts_slow":
            text = t(locale, "ts_slow")
            category = "slow"
        elif action == "ts_app_error":
            text = t(locale, "ts_app_error")
            category = "app_error"
        else:
            text = t(locale, "ts_other")
            category = "other"

        await msg.answer(text)
        await msg.answer(
            "If this did not help, send a report from the menu."
            if locale == "en"
            else "Если это не помогло, отправьте отчёт из меню.",
            reply_markup=connect_nav_markup(locale),
        )
        user = callback.from_user
        if user:
            await post_event(
                "troubleshooter_branch",
                user.id,
                {"category": category},
            )
        return

    # act:send_report*
    category = "generic"
    user = callback.from_user
    user_id = user.id if user else None
    user_payload = {}
    if user_id:
        result = await get_user_by_tg(user_id)
        if result.success and result.data:
            u = result.data
            subs = (u.get("subscriptions") or [])
            active = subs[0] if subs else None
            user_payload = {
                "user_id": u.get("id"),
                "plan": active.get("plan_id") if active else None,
                "device_count": len(u.get("devices") or []),
            }
    payload = {
        "category": category,
        "tg_id": user_id,
        **user_payload,
    }
    try:
        await post_event("support_report_sent", user_id or 0, payload)
    except Exception as e:  # pragma: no cover
        _log.debug("support_report_event_failed", error=str(e))
    await msg.answer(
        t(locale, "stub_report_sent"),
        reply_markup=error_nav_markup(),
    )


async def _handle_security_stub(action: str, callback: CallbackQuery, locale: str):
    text = t(locale, "stub_logout") if action == "logout_sessions" else t(locale, "stub_reset_configs")
    await callback.message.answer(text, reply_markup=error_nav_markup())

