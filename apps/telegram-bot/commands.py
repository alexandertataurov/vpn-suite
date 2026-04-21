"""Canonical command definitions. Single source of truth for BotFather menu."""

from aiogram.types import BotCommand


COMMANDS = [
    ("start", "Запуск и открытие приложения"),
    ("donate", "Донат (Platega / Stars)"),
]


async def register_commands(bot):
    """Register commands with Telegram. Call on bot startup."""
    await bot.set_my_commands(
        [BotCommand(command=cmd, description=desc) for cmd, desc in COMMANDS]
    )
