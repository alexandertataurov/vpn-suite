"""Canonical command definitions. Single source of truth for BotFather menu."""

from aiogram.types import BotCommand


COMMANDS = [
    ("start", "Start bot and show main menu"),
    ("status", "View your subscription and device status"),
    ("devices", "Manage your devices"),
    ("configs", "View devices and get config"),
    ("install", "Get installation instructions"),
    ("help", "Get help and FAQ"),
    ("support", "Contact support team"),
]


async def register_commands(bot):
    """Register commands with Telegram. Call on bot startup."""
    await bot.set_my_commands(
        [BotCommand(command=cmd, description=desc) for cmd, desc in COMMANDS]
    )
