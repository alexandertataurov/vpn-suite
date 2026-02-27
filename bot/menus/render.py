from aiogram.types import InlineKeyboardButton, InlineKeyboardMarkup

from i18n import t

from .registry import Menu, MENUS


def _resolve_text(locale: str, text: str) -> str:
    """Best-effort i18n: TEXTS key or literal as fallback."""
    return t(locale, text)


def build_menu_text(menu: Menu, locale: str) -> str:
    """Format menu title/body for HTML parse mode."""
    title = _resolve_text(locale, menu.get("title", ""))
    body = _resolve_text(locale, menu.get("body", ""))
    if title and body:
        return f"<b>{title}</b>\n\n{body}"
    if title:
        return f"<b>{title}</b>"
    return body


def build_menu_keyboard(menu: Menu, locale: str) -> InlineKeyboardMarkup:
    rows: list[list[InlineKeyboardButton]] = []
    for row in menu.get("buttons", []):
        btn_row: list[InlineKeyboardButton] = []
        for btn in row:
            if "cb" in btn:
                btn_row.append(
                    InlineKeyboardButton(
                        text=_resolve_text(locale, btn["text"]),
                        callback_data=btn["cb"],
                    )
                )
            elif "url" in btn:
                btn_row.append(
                    InlineKeyboardButton(
                        text=_resolve_text(locale, btn["text"]),
                        url=btn["url"],
                    )
                )
            elif "webapp" in btn:
                from aiogram.types import WebAppInfo

                btn_row.append(
                    InlineKeyboardButton(
                        text=_resolve_text(locale, btn["text"]),
                        web_app=WebAppInfo(url=btn["webapp"]),
                    )
                )
        if btn_row:
            rows.append(btn_row)
    return InlineKeyboardMarkup(inline_keyboard=rows)


def render_menu(menu_id: str, locale: str) -> tuple[str, InlineKeyboardMarkup]:
    """Return (text, keyboard) for a given menu id, falling back to home."""
    menu = MENUS.get(menu_id) or MENUS["home"]
    return build_menu_text(menu, locale), build_menu_keyboard(menu, locale)

