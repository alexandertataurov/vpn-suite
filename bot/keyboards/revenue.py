"""Revenue-engine keyboards: entry, trial, paused, plans, referral."""

from aiogram.types import InlineKeyboardButton, InlineKeyboardMarkup

from i18n import t


def entry_keyboard(locale: str) -> InlineKeyboardMarkup:
    """Entry: Start Free Trial | View Plans | See Servers + Back."""
    return InlineKeyboardMarkup(inline_keyboard=[
        [InlineKeyboardButton(text=t(locale, "start_free_trial"), callback_data="revenue:start_trial")],
        [
            InlineKeyboardButton(text=t(locale, "view_plans"), callback_data="revenue:view_plans"),
            InlineKeyboardButton(text=t(locale, "see_servers"), callback_data="revenue:see_servers"),
        ],
        [InlineKeyboardButton(text=t(locale, "🏠 Home"), callback_data="nav:home")],
    ])


def trial_keep_active_keyboard(locale: str) -> InlineKeyboardMarkup:
    """After trial connected: Keep your tunnel active + Home."""
    return InlineKeyboardMarkup(inline_keyboard=[
        [InlineKeyboardButton(text=t(locale, "keep_tunnel_active"), callback_data="revenue:keep_tunnel")],
        [InlineKeyboardButton(text=t(locale, "🏠 Home"), callback_data="nav:home")],
    ])


def tunnel_paused_keyboard(locale: str) -> InlineKeyboardMarkup:
    """Tunnel paused: Resume Secure Access | Upgrade to Premium + Home."""
    return InlineKeyboardMarkup(inline_keyboard=[
        [InlineKeyboardButton(text=t(locale, "resume_secure_access"), callback_data="revenue:resume")],
        [InlineKeyboardButton(text=t(locale, "upgrade_premium"), callback_data="revenue:upgrade")],
        [InlineKeyboardButton(text=t(locale, "🏠 Home"), callback_data="nav:home")],
    ])
