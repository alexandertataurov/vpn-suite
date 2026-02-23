"""User-facing error and success messages. EN/RU, emoji, clear next steps."""

# Keys match api_client error keys (error_*) and short names for get_error_message.
ERROR_MESSAGES = {
    "en": {
        "error_timeout": (
            "⏱ The service is responding slowly.\n"
            "Please try again in a moment."
        ),
        "error_server": (
            "❌ Something went wrong on our end.\n"
            "We've been notified. Please try again in a few minutes."
        ),
        "error_subscription_expired": (
            "⚠️ Your subscription has expired.\n"
            "Renew now to continue using the VPN."
        ),
        "error_device_limit": (
            "⚠️ Device limit reached ({limit} devices max).\n"
            "Remove a device or upgrade your plan."
        ),
        "error_config_exists": (
            "ℹ️ Configuration already exists for this device.\n"
            "Download it from the device list or add a new device."
        ),
        "error_device_not_found": (
            "❌ Not found.\n"
            "The device may have been removed already."
        ),
        "error_rate_limit": (
            "⏱ Too many requests.\n"
            "Please try again in a moment."
        ),
        "error_api": (
            "❌ Service temporarily unavailable.\n"
            "Please try again in a moment."
        ),
        # Short keys (optional)
        "timeout": (
            "⏱ The service is responding slowly.\n"
            "Please try again in a moment."
        ),
        "server_error": (
            "❌ Something went wrong on our end.\n"
            "We've been notified. Please try again in a few minutes."
        ),
        "subscription_expired": (
            "⚠️ Your subscription has expired.\n"
            "Renew now to continue using the VPN."
        ),
        "device_limit": (
            "⚠️ Device limit reached ({limit} devices max).\n"
            "Remove a device or upgrade your plan."
        ),
        "config_exists": (
            "ℹ️ Configuration already exists for this device.\n"
            "Download it from the device list or add a new device."
        ),
        "not_found": (
            "❌ Not found.\n"
            "The item may have been removed."
        ),
    },
    "ru": {
        "error_timeout": (
            "⏱ Сервис отвечает медленно.\n"
            "Попробуйте через минуту."
        ),
        "error_server": (
            "❌ Ошибка на нашей стороне.\n"
            "Мы уже в курсе. Попробуйте через несколько минут."
        ),
        "error_subscription_expired": (
            "⚠️ Подписка истекла.\n"
            "Продлите подписку, чтобы продолжать пользоваться VPN."
        ),
        "error_device_limit": (
            "⚠️ Достигнут лимит устройств (макс. {limit}).\n"
            "Удалите устройство или обновите тариф."
        ),
        "error_config_exists": (
            "ℹ️ Конфигурация для этого устройства уже есть.\n"
            "Скачайте её в списке устройств или добавьте новое."
        ),
        "error_device_not_found": (
            "❌ Не найдено.\n"
            "Устройство могло быть уже удалено."
        ),
        "error_rate_limit": (
            "⏱ Слишком много запросов.\n"
            "Попробуйте через минуту."
        ),
        "error_api": (
            "❌ Сервис временно недоступен.\n"
            "Попробуйте через минуту."
        ),
        "timeout": (
            "⏱ Сервис отвечает медленно.\n"
            "Попробуйте через минуту."
        ),
        "server_error": (
            "❌ Ошибка на нашей стороне.\n"
            "Мы уже в курсе. Попробуйте через несколько минут."
        ),
        "subscription_expired": (
            "⚠️ Подписка истекла.\n"
            "Продлите подписку, чтобы продолжать пользоваться VPN."
        ),
        "device_limit": (
            "⚠️ Достигнут лимит устройств (макс. {limit}).\n"
            "Удалите устройство или обновите тариф."
        ),
        "config_exists": (
            "ℹ️ Конфигурация для этого устройства уже есть.\n"
            "Скачайте её в списке устройств или добавьте новое."
        ),
        "not_found": (
            "❌ Не найдено.\n"
            "Элемент мог быть удалён."
        ),
    },
}

SUCCESS_MESSAGES = {
    "en": {
        "device_added": "✅ Device added successfully!\n📥 Download your configuration below.",
        "device_removed": "✅ Device removed.",
        "config_reissued": "✅ New configuration issued.",
        "payment_success": "✅ Payment successful! Your subscription is active.",
        "payment_pending_activation": "✅ Payment received. Subscription activation is in progress, please wait a moment.",
    },
    "ru": {
        "device_added": "✅ Устройство добавлено!\n📥 Скачайте конфигурацию ниже.",
        "device_removed": "✅ Устройство удалено.",
        "config_reissued": "✅ Новая конфигурация выдана.",
        "payment_success": "✅ Оплата прошла! Подписка активна.",
        "payment_pending_activation": "✅ Платёж получен. Активация подписки выполняется, подождите немного.",
    },
}

_DEFAULT_ERROR = "❌ Something went wrong. Please try again."


def get_error_message(error_key: str, lang: str = "en", **kwargs) -> str:
    """Get formatted error message. Supports error_* and short keys."""
    if not error_key:
        error_key = "error_api"
    catalog = ERROR_MESSAGES.get(lang, ERROR_MESSAGES["en"])
    msg = catalog.get(error_key) or catalog.get(
        error_key.replace("error_", "").replace("error", "server_error")
    ) or catalog.get("error_api") or _DEFAULT_ERROR
    if "limit" in msg and "limit" not in kwargs:
        kwargs.setdefault("limit", 0)
    try:
        return msg.format(**kwargs)
    except KeyError:
        return msg


def get_success_message(key: str, lang: str = "en") -> str:
    """Get success message by key."""
    return SUCCESS_MESSAGES.get(lang, SUCCESS_MESSAGES["en"]).get(
        key, SUCCESS_MESSAGES["en"].get(key, "✅ Done.")
    )
