"""Referral: referrer, referee, code, status, reward_applied_at."""

from datetime import datetime

from sqlalchemy import BigInteger, DateTime, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, TimestampMixin, uuid4_hex


class Referral(Base, TimestampMixin):
    __tablename__ = "referrals"

    id: Mapped[str] = mapped_column(String(32), primary_key=True, default=uuid4_hex)
    referrer_user_id: Mapped[int] = mapped_column(
        BigInteger, ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    referee_user_id: Mapped[int] = mapped_column(
        BigInteger, ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    referral_code: Mapped[str] = mapped_column(String(64), nullable=False)
    status: Mapped[str] = mapped_column(String(32), nullable=False, default="pending")
    reward_days: Mapped[int] = mapped_column(Integer, default=7, nullable=False)
    reward_applied_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
