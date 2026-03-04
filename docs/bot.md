# Bot — Architecture, Logging, Keyboards, Release

## Architecture (aiogram 3.x)

**Handlers:** `start.py` (start, language, main menu), `status.py`, `devices.py`, `install.py`, `help.py`, `support.py`, `tariffs.py` (plans, payment, referral), `nav.py` (inline menus), `menu_actions.py` (act:*), `fallback.py`.

**API client:** `api_client.py` — single AsyncClient, 3× retry with backoff on 5xx/timeout; returns `Result(success, data, error)`.

**Keyboards:** `keyboards/common.py` — nav row (Back/Home). Callback format: `action:param1:param2` (e.g. `menu:main`, `device_select:123`).

**Flow:** User → Telegram → Handler → API client → Backend → format → user. Errors: timeout/5xx → retry 3× then user message; 4xx → no retry, specific message.

## Logging

Structured JSON (structlog). Events: `user_action`, `action_completed`, `action_failed`, `api_request`, `api_retry`, `startup`. No secrets (tokens, keys) in logs; text/callback_data truncated; token/key/secret redacted.

## Keyboards & navigation

- Every inline keyboard: navigation row at bottom via `keyboards.common.add_navigation_row()` or `nav_row_buttons()`.
- Back (optional), Home (`menu:main`) — no dead ends. Labels: ⬅️ Back, 🏠 Home, 📥 Download Config, 🔄 Reset Device.
- ReplyKeyboard = main menu; inline = choices (plans, servers, devices).

## Release checklist

**Pre:** BOT_TOKEN, BOT_USERNAME, SUPPORT_HANDLE, PANEL_URL, BOT_API_KEY in .env. Tests: `pytest bot/tests`. Lint: ruff. Commands in BotFather. /start, /status, /devices, add device, payment, referral tested. Back/Home on all keyboards. No secrets in logs.

**Deploy:** Staging first → smoke → production → monitor ~1h.

**Post:** Test /start, payment (Stars), metrics.

---

Detailed docs: [bot/release.md](bot/release.md), [bot/production-plan.md](bot/production-plan.md), [bot/bot-menu-architecture.md](bot/bot-menu-architecture.md).
