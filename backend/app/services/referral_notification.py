"""Send Telegram notification to referrer when referral reward is granted."""

import logging

import httpx

from app.core.config import settings
from app.core.constants import REFERRAL_REWARD_DAYS

_log = logging.getLogger(__name__)

REFERRAL_REWARD_MSG_EN = f"Your friend joined — you've received {REFERRAL_REWARD_DAYS} free days."
REFERRAL_REWARD_MSG_RU = (
    f"Ваш друг присоединился — вы получили {REFERRAL_REWARD_DAYS} бесплатных дней."
)


async def notify_referrer_reward_granted(
    referrer_tg_id: int,
    *,
    locale: str = "en",
) -> bool:
    """
    Send a Telegram message to the referrer when they receive referral reward.
    Notification failure must NOT fail the reward transaction.
    Returns True if sent successfully, False otherwise.
    """
    token = (getattr(settings, "telegram_bot_token", None) or "").strip()
    if not token:
        _log.warning("referral_notification_skipped: no_bot_token")
        return False
    text = REFERRAL_REWARD_MSG_RU if locale == "ru" else REFERRAL_REWARD_MSG_EN
    url = f"https://api.telegram.org/bot{token}/sendMessage"
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            r = await client.post(
                url,
                json={"chat_id": referrer_tg_id, "text": text},
            )
            if r.status_code != 200:
                _log.warning(
                    "referral_notification_failed referrer_tg_id=%s status_code=%s",
                    referrer_tg_id,
                    r.status_code,
                )
                return False
            return True
    except Exception as e:
        _log.warning(
            "referral_notification_error referrer_tg_id=%s error=%s",
            referrer_tg_id,
            str(e),
            exc_info=True,
        )
        return False
