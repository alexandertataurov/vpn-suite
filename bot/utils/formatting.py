"""Consistent formatting for subscription and device info."""

import structlog
from datetime import datetime, timezone

_log = structlog.get_logger(__name__)

# Optional: map device type to icon if API adds type later.
DEVICE_ICONS = {
    "ios": "🍎",
    "android": "🤖",
    "windows": "🪟",
    "macos": "🍎",
    "linux": "🐧",
}


def is_subscription_effectively_active(sub: dict) -> bool:
    """Return active status using effective_status if present, else status + valid_until."""
    if not isinstance(sub, dict):
        return False
    if sub.get("paused_at"):
        return False
    effective = str(sub.get("effective_status") or "").strip().lower()
    if effective:
        return effective in {"active", "cancel_at_period_end"}
    if str(sub.get("status") or "").strip().lower() != "active":
        return False
    until_raw = sub.get("valid_until")
    if not until_raw:
        return False
    try:
        until = datetime.fromisoformat(str(until_raw).replace("Z", "+00:00"))
        if until.tzinfo is None:
            until = until.replace(tzinfo=timezone.utc)
        return until > datetime.now(timezone.utc)
    except Exception as e:
        # If backend gives malformed datetime but marks active, fail-open for UX.
        _log.debug("malformed_valid_until", raw=str(until_raw)[:64], error=str(e))
        return True


def format_date(expires, lang: str = "en") -> str:
    """Format valid_until (ISO str or datetime) for display."""
    if not expires:
        return "N/A"
    try:
        if isinstance(expires, str) and "T" in expires:
            dt = datetime.fromisoformat(expires.replace("Z", "+00:00"))
        elif hasattr(expires, "strftime"):
            dt = expires
        else:
            return str(expires)
        return dt.strftime("%Y-%m-%d")
    except Exception as e:
        _log.debug("format_date_failed", raw=str(expires)[:64], error=str(e))
        return str(expires)


def format_subscription_status(sub: dict, lang: str = "en", devices_used: int = 0) -> str:
    """Format subscription info consistently. sub: status, valid_until, device_limit."""
    is_active = is_subscription_effectively_active(sub)
    status_emoji = "✅" if is_active else "❌"
    if lang == "ru":
        status_text = "Активна" if is_active else "Истекла"
    else:
        status_text = "Active" if is_active else "Expired"

    expires = sub.get("valid_until")
    expires_text = format_date(expires, lang) if expires else "N/A"
    limit = sub.get("device_limit", 0)

    if lang == "ru":
        return (
            "📊 Статус подписки\n\n"
            f"Статус: {status_emoji} {status_text}\n"
            f"До: {expires_text}\n"
            f"Устройств: {devices_used} / {limit}"
        )
    return (
        "📊 Subscription Status\n\n"
        f"Status: {status_emoji} {status_text}\n"
        f"Expires: {expires_text}\n"
        f"Devices: {devices_used} / {limit}"
    )


def format_device_info(device: dict, lang: str = "en") -> str:
    """Format device info card. device: device_name, server_id, revoked_at (no type in API)."""
    name = device.get("device_name") or device.get("id", "")[:8]
    device_type = device.get("type", "")
    type_icon = DEVICE_ICONS.get(device_type, "📱")
    is_active = not device.get("revoked_at")
    status_emoji = "✅" if is_active else "⚠️"
    server = device.get("server_name") or device.get("server_id", "N/A")
    if isinstance(server, str) and len(server) > 20:
        server = server[:17] + "..."

    if lang == "ru":
        status_text = "Активно" if is_active else "Неактивно"
    else:
        status_text = "Active" if is_active else "Inactive"

    if lang == "ru":
        return (
            f"{type_icon} {name}\n"
            f"Статус: {status_emoji} {status_text}\n"
            f"Сервер: {server}"
        )
    return (
        f"{type_icon} {name}\n"
        f"Status: {status_emoji} {status_text}\n"
        f"Server: {server}"
    )
