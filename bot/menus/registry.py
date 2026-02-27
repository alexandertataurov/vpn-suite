from typing import TypedDict, NotRequired, Literal


class CallbackBtn(TypedDict):
    text: str
    cb: str


class UrlBtn(TypedDict):
    text: str
    url: str


class WebAppBtn(TypedDict):
    text: str
    webapp: str


Btn = CallbackBtn | UrlBtn | WebAppBtn


class TelemetryConfig(TypedDict, total=False):
    open: str


class Menu(TypedDict, total=False):
    id: str
    title: str
    body: str
    buttons: list[list[Btn]]
    guards: NotRequired[list[str]]
    telemetry: NotRequired[TelemetryConfig]


MenuId = Literal[
    "home",
    "connect",
    "install",
    "subs",
    "buy_plan",
    "locations",
    "devices",
    "status",
    "settings",
    "security",
    "support",
    "report",
    "troubleshooter",
    "lang",
    "notif",
]


MENUS: dict[str, Menu] = {
    "home": {
        "id": "home",
        "title": "menu_home_title",
        "body": "menu_home_body",
        "buttons": [
            [{"text": "🚀 Connect VPN", "cb": "nav:connect"}],
            [
                {"text": "💳 Subscription", "cb": "nav:subs"},
                {"text": "📱 Devices", "cb": "nav:devices"},
            ],
            [
                {"text": "📊 Status", "cb": "nav:status"},
                {"text": "⚙️ Settings", "cb": "nav:settings"},
            ],
            [{"text": "🆘 Support", "cb": "nav:support"}],
        ],
        "telemetry": {"open": "menu_open_home"},
    },
    "connect": {
        "id": "connect",
        "title": "menu_connect_title",
        "body": "menu_connect_body",
        "buttons": [
            [{"text": "📲 Get config", "cb": "act:get_config"}],
            [{"text": "📎 Install instructions", "cb": "nav:install"}],
            [{"text": "🔁 Reissue config", "cb": "act:reissue_config"}],
            [{"text": "🌍 Choose location", "cb": "nav:locations"}],
            [{"text": "⬅ Back", "cb": "nav:home"}],
        ],
        "telemetry": {"open": "menu_open_connect"},
    },
    "install": {
        "id": "install",
        "title": "menu_install_title",
        "body": "menu_install_body",
        "buttons": [
            [{"text": "📲 Get config", "cb": "act:get_config"}],
            [{"text": "🧩 Fix connection", "cb": "nav:troubleshooter"}],
            [{"text": "⬅ Back", "cb": "nav:connect"}],
        ],
        "telemetry": {"open": "menu_open_install"},
    },
    "subs": {
        "id": "subs",
        "title": "menu_subs_title",
        "body": "menu_subs_body",
        "buttons": [
            [{"text": "🛒 Buy plan", "cb": "nav:buy_plan"}],
            [{"text": "🔄 Renew", "cb": "act:renew"}],
            [{"text": "📄 My plan", "cb": "act:my_plan"}],
            [{"text": "🎟 Promo code", "cb": "act:promo"}],
            [{"text": "🧾 Receipts", "cb": "act:receipts"}],
            [{"text": "⬅ Back", "cb": "nav:home"}],
        ],
        "telemetry": {"open": "menu_open_subs"},
    },
    "buy_plan": {
        "id": "buy_plan",
        "title": "menu_buy_plan_title",
        "body": "menu_buy_plan_body",
        "buttons": [
            [{"text": "1 month", "cb": "nav:pay_methods:plan_1m"}],
            [{"text": "3 months ⭐ Best value", "cb": "nav:pay_methods:plan_3m"}],
            [{"text": "12 months 💎 Max savings", "cb": "nav:pay_methods:plan_12m"}],
            [{"text": "⬅ Back", "cb": "nav:subs"}],
        ],
        "telemetry": {"open": "menu_open_buy_plan"},
    },
    "locations": {
        "id": "locations",
        "title": "menu_locations_title",
        "body": "menu_locations_body",
        "buttons": [
            [{"text": "📲 Get config", "cb": "act:get_config"}],
            [{"text": "⬅ Back", "cb": "nav:connect"}],
        ],
        "telemetry": {"open": "menu_open_locations"},
    },
    "devices": {
        "id": "devices",
        "title": "menu_devices_title",
        "body": "menu_devices_body",
        "buttons": [
            [{"text": "➕ Add device", "cb": "act:add_device"}],
            [{"text": "📋 My devices", "cb": "act:list_devices"}],
            [{"text": "🗑 Remove device", "cb": "act:remove_device_pick"}],
            [{"text": "📎 Re-download config", "cb": "act:download_config"}],
            [{"text": "⬅ Back", "cb": "nav:home"}],
        ],
        "telemetry": {"open": "menu_open_devices"},
    },
    "status": {
        "id": "status",
        "title": "menu_status_title",
        "body": "menu_status_body",
        "buttons": [
            [{"text": "🟢 Service status", "cb": "act:service_status"}],
            [{"text": "📈 Usage", "cb": "act:usage"}],
            [{"text": "🧠 Troubleshooter", "cb": "nav:troubleshooter"}],
            [{"text": "⬅ Back", "cb": "nav:home"}],
        ],
        "telemetry": {"open": "menu_open_status"},
    },
    "settings": {
        "id": "settings",
        "title": "menu_settings_title",
        "body": "menu_settings_body",
        "buttons": [
            [{"text": "🌐 Language", "cb": "nav:lang"}],
            [{"text": "🔔 Notifications", "cb": "nav:notif"}],
            [{"text": "🔐 Security", "cb": "nav:security"}],
            [{"text": "⬅ Back", "cb": "nav:home"}],
        ],
        "telemetry": {"open": "menu_open_settings"},
    },
    "security": {
        "id": "security",
        "title": "menu_security_title",
        "body": "menu_security_body",
        "buttons": [
            [{"text": "🚪 Logout all sessions", "cb": "act:logout_sessions"}],
            [{"text": "♻️ Reset configs", "cb": "act:reset_configs"}],
            [{"text": "⬅ Back", "cb": "nav:settings"}],
        ],
        "telemetry": {"open": "menu_open_security"},
    },
    "support": {
        "id": "support",
        "title": "menu_support_title",
        "body": "menu_support_body",
        "buttons": [
            [{"text": "📚 FAQ", "cb": "act:faq"}],
            [{"text": "🧩 Fix connection", "cb": "nav:troubleshooter"}],
            [{"text": "💬 Talk to support", "cb": "act:talk_support"}],
            [{"text": "📨 Report a problem", "cb": "nav:report"}],
            [{"text": "⬅ Back", "cb": "nav:home"}],
        ],
        "telemetry": {"open": "menu_open_support"},
    },
    "report": {
        "id": "report",
        "title": "menu_report_title",
        "body": "menu_report_body",
        "buttons": [
            [{"text": "📨 Send report", "cb": "act:send_report"}],
            [{"text": "⬅ Back", "cb": "nav:support"}],
        ],
        "telemetry": {"open": "menu_open_report"},
    },
    "troubleshooter": {
        "id": "troubleshooter",
        "title": "menu_troubleshooter_title",
        "body": "menu_troubleshooter_body",
        "buttons": [
            [{"text": "❌ No connection", "cb": "act:ts_no_connection"}],
            [{"text": "🐢 Slow", "cb": "act:ts_slow"}],
            [{"text": "⚠️ App error", "cb": "act:ts_app_error"}],
            [{"text": "❓ Other", "cb": "act:ts_other"}],
            [{"text": "⬅ Back", "cb": "nav:support"}],
        ],
        "telemetry": {"open": "menu_open_troubleshooter"},
    },
    "lang": {
        "id": "lang",
        "title": "menu_lang_title",
        "body": "menu_lang_body",
        "buttons": [
            [{"text": "🇬🇧 English", "cb": "lang_en"}],
            [{"text": "🇷🇺 Русский", "cb": "lang_ru"}],
            [{"text": "⬅ Back", "cb": "nav:settings"}],
        ],
        "telemetry": {"open": "menu_open_lang"},
    },
    "notif": {
        "id": "notif",
        "title": "menu_notif_title",
        "body": "menu_notif_body",
        "buttons": [
            [{"text": "⬅ Back", "cb": "nav:settings"}],
        ],
        "telemetry": {"open": "menu_open_notif"},
    },
}

