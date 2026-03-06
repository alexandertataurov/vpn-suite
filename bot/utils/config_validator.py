"""Validate bot config before startup. Fail fast on missing or invalid values."""

from config import BOT_TOKEN, BOT_USERNAME, SUPPORT_HANDLE, PANEL_URL, MINIAPP_URL


def validate_config() -> bool:
    """Validate all required config before bot starts. Raises ValueError on errors."""
    errors = []

    if not BOT_TOKEN:
        errors.append("BOT_TOKEN missing")
    if not BOT_USERNAME:
        errors.append("BOT_USERNAME missing")
    if not SUPPORT_HANDLE:
        errors.append("SUPPORT_HANDLE missing")

    if SUPPORT_HANDLE and not SUPPORT_HANDLE.strip().startswith("@"):
        errors.append("SUPPORT_HANDLE must start with @")

    if PANEL_URL and not PANEL_URL.startswith("http"):
        errors.append("PANEL_URL must be valid URL (http or https)")

    if not MINIAPP_URL or not MINIAPP_URL.startswith("http"):
        errors.append("MINIAPP_URL must be a valid URL (http or https)")

    if errors:
        raise ValueError("Config errors: " + ", ".join(errors))

    return True
