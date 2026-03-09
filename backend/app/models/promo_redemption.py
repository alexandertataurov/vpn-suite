"""PromoRedemption: promo_code_id, user_id, payment_id, discount_applied_xtr, redeemed_at."""

from datetime import datetime, timezone

from sqlalchemy import BigInteger, DateTime, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, TimestampMixin, uuid4_hex


class PromoRedemption(Base, TimestampMixin):
    __tablename__ = "promo_redemptions"

    id: Mapped[str] = mapped_column(String(32), primary_key=True, default=uuid4_hex)
    promo_code_id: Mapped[str] = mapped_column(
        String(32), ForeignKey("promo_codes.id", ondelete="CASCADE"), nullable=False
    )
    user_id: Mapped[int] = mapped_column(
        BigInteger, ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    payment_id: Mapped[str | None] = mapped_column(
        String(32), ForeignKey("payments.id", ondelete="SET NULL"), nullable=True
    )
    discount_applied_xtr: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    subscription_id: Mapped[str | None] = mapped_column(String(32), nullable=True)
    redeemed_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False
    )
