"""Bot config from env."""

import os


def get_env(key: str, default: str = "") -> str:
    return os.environ.get(key, default).strip()


PANEL_URL = get_env("PANEL_URL", "http://admin-api:8000")
BOT_API_KEY = get_env("BOT_API_KEY", "")
BOT_TOKEN = get_env("BOT_TOKEN", "")

# Required; no defaults — bot must not start without these.
BOT_USERNAME = get_env("BOT_USERNAME")
if not BOT_USERNAME:
    raise ValueError("BOT_USERNAME must be set in .env")

SUPPORT_LINK = get_env("SUPPORT_LINK", "")
SUPPORT_HANDLE = get_env("SUPPORT_HANDLE")
if not SUPPORT_HANDLE:
    raise ValueError("SUPPORT_HANDLE must be set in .env")

# Optional: override instruction/install text. If set, replaces i18n instruction_text.
INSTRUCTION_TEXT = get_env("INSTRUCTION_TEXT", "")
# Optional: install guide URL. Override if using custom install page. Default: Amnezia.
INSTALL_GUIDE_URL = get_env("INSTALL_GUIDE_URL", "https://amnezia.org")

PORT = int(get_env("PORT", "8090"))

# Optional: Redis URL for FSM persistence (FSM survives bot restarts). If unset, uses MemoryStorage.
REDIS_URL = get_env("REDIS_URL", "")

# Log level: DEBUG, INFO, WARN, ERROR. Empty = INFO.
LOG_LEVEL = get_env("LOG_LEVEL", "")
ENVIRONMENT = get_env("ENVIRONMENT", "development")

# Polling: longer timeout = fewer requests = lower CPU. Default 30s (aiogram default 10).
# Guardrail: min 10s, max 120s to avoid CPU thrash or excessive latency.
_raw = int(get_env("BOT_POLLING_TIMEOUT", "30") or "30")
BOT_POLLING_TIMEOUT = max(10, min(120, _raw))
# Limit concurrent update handlers to avoid CPU spikes. 0 or empty = no limit.
BOT_TASKS_CONCURRENCY_LIMIT = int(get_env("BOT_TASKS_CONCURRENCY_LIMIT", "5") or "0") or None
