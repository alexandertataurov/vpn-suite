"""User-facing error messages for API errors. i18n-aware."""

import structlog
from i18n import t

_log = structlog.get_logger(__name__)

# Fallback messages (en) when key not in i18n. Keys match api_client error keys.
ERROR_MESSAGES: dict[str, dict[str, str]] = {
    "en": {
        "error_timeout": "Service is slow, please retry",
        "error_server": "Something went wrong, we're on it",
        "error_subscription_expired": "Subscription expired, renew to continue",
        "error_device_limit": "Device limit reached, remove one first",
        "error_config_exists": "Config already exists for this device",
        "error_device_not_found": "Device not found or already reset",
        "error_rate_limit": "Too many requests. Try again later.",
        "error_api": "Service temporarily unavailable. Try again later.",
    },
    "ru": {
        "error_timeout": "Сервис отвечает медленно, попробуйте позже",
        "error_server": "Временная ошибка, мы уже чиним",
        "error_subscription_expired": "Подписка истекла, продлите для продолжения",
        "error_device_limit": "Достигнут лимит устройств, удалите одно",
        "error_config_exists": "Конфиг для этого устройства уже есть",
        "error_device_not_found": "Устройство не найдено или уже сброшено",
        "error_rate_limit": "Слишком много запросов. Попробуйте позже.",
        "error_api": "Сервис временно недоступен. Попробуйте позже.",
    },
}


def get_error_message(error_key: str, lang: str = "en") -> str:
    """Return user-facing message for error_key. Prefer i18n, else ERROR_MESSAGES."""
    try:
        msg = t(lang, error_key)
        if msg != error_key:
            return msg
    except Exception as e:
        _log.debug("i18n_lookup_failed", key=error_key, lang=lang, error=str(e))
    return ERROR_MESSAGES.get(lang, ERROR_MESSAGES["en"]).get(
        error_key, ERROR_MESSAGES["en"].get("error_api", "Service temporarily unavailable.")
    )
