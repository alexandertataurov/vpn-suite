"""Simple RU/EN i18n."""

TEXTS = {
    "ru": {
        "welcome": "Добро пожаловать! Подключите VPN за минуту.",
        "choose_lang": "Выберите язык / Choose language:",
        "connect_cta": "Подключить",
        "my_cabinet": "Мой кабинет",
        "profile": "Профиль",
        "tariffs": "Тарифы",
        "plans": "Планы",
        "select_plan": "Выберите тариф:",
        "support": "Поддержка",
        "no_subscription": "Нет активной подписки.",
        "subscription_until": "Подписка до {date}",
        "devices_count": "Устройств: {count}",
        "error_api": "Сервис временно недоступен. Попробуйте позже.",
        "ref_invited": "Вас пригласил друг.",
        "add_device": "Добавить устройство",
        "invite_friend": "Пригласить друга",
        "promo_code": "Промокод",
        "promo_placeholder": "Введите промокод",
        "reset_device": "Сброс устройства",
        "instruction": "Инструкция",
        "instruction_text": "AmneziaVPN: Windows https://amnezia.org\niOS https://apps.apple.com/app/amneziavpn\nAndroid https://play.google.com/store/apps/details?id=org.amnezia.vpn\nmacOS https://amnezia.org",
        "help_text": "Команды: /start — меню, /status — подписка и устройства, /devices — устройства, /configs — конфиги и сброс, /install — инструкция, /support — поддержка.",
        "error_device_not_found": "Устройство не найдено или уже сброшено.",
        "error_timeout": "Сервис не отвечает. Попробуйте позже.",
        "error_subscription_expired": "Подписка истекла. Продлите для продолжения.",
        "error_device_limit": "Достигнут лимит устройств.",
        "error_rate_limit": "Слишком много запросов. Попробуйте позже.",
        "error_config_exists": "Конфиг для этого устройства уже есть.",
        "error_server": "Временная ошибка сервера. Попробуйте позже.",
        "configs_intro": "Конфиг выдаётся при добавлении устройства. Ниже — ваши устройства (сброс = отзыв конфига).",
    },
    "en": {
        "welcome": "Welcome! Get VPN in under a minute.",
        "choose_lang": "Choose language:",
        "connect_cta": "Connect",
        "my_cabinet": "My cabinet",
        "profile": "Profile",
        "tariffs": "Tariffs",
        "plans": "Plans",
        "select_plan": "Select a plan:",
        "support": "Support",
        "no_subscription": "No active subscription.",
        "subscription_until": "Subscription until {date}",
        "devices_count": "Devices: {count}",
        "error_api": "Service temporarily unavailable. Try again later.",
        "ref_invited": "You were invited by a friend.",
        "add_device": "Add device",
        "invite_friend": "Invite friend",
        "promo_code": "Promo code",
        "promo_placeholder": "Enter promo code",
        "reset_device": "Reset device",
        "instruction": "Instruction",
        "instruction_text": "AmneziaVPN: Windows https://amnezia.org\niOS https://apps.apple.com/app/amneziavpn\nAndroid https://play.google.com/store/apps/details?id=org.amnezia.vpn\nmacOS https://amnezia.org",
        "help_text": "Commands: /start — main menu, /status — subscription and devices, /devices — devices, /configs — configs and reset, /install — installation guide, /support — contact support.",
        "error_device_not_found": "Device not found or already reset.",
        "error_timeout": "Service is slow. Please try again in a moment.",
        "error_subscription_expired": "Subscription expired. Renew to continue.",
        "error_device_limit": "Device limit reached.",
        "error_rate_limit": "Too many requests. Try again later.",
        "error_config_exists": "Config already exists for this device.",
        "error_server": "Temporary server error. Try again later.",
        "configs_intro": "Config is issued when you add a device. Below are your devices (reset = revoke config).",
    },
}


def t(locale: str, key: str, **kwargs) -> str:
    if key == "instruction_text":
        from config import INSTRUCTION_TEXT, INSTALL_GUIDE_URL
        if INSTRUCTION_TEXT:
            return INSTRUCTION_TEXT
        msg = TEXTS.get(locale, TEXTS["en"]).get(key, TEXTS["en"].get(key, key))
        return msg.replace("https://amnezia.org", INSTALL_GUIDE_URL)
    msg = TEXTS.get(locale, TEXTS["en"]).get(key, TEXTS["en"].get(key, key))
    if kwargs:
        msg = msg.format(**kwargs)
    return msg
