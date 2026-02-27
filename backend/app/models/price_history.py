"""Price change history for audit and revenue impact."""

from __future__ import annotations

from decimal import Decimal

from sqlalchemy import ForeignKey, Integer, Numeric, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, TimestampMixin, uuid4_hex


class PriceHistory(Base, TimestampMixin):
    __tablename__ = "price_history"

    id: Mapped[str] = mapped_column(String(32), primary_key=True, default=uuid4_hex)
    plan_id: Mapped[str] = mapped_column(
        String(32), ForeignKey("plans.id", ondelete="CASCADE"), nullable=False
    )
    price_amount_old: Mapped[Decimal | None] = mapped_column(Numeric(12, 2), nullable=True)
    price_amount_new: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    promo_pct_old: Mapped[int | None] = mapped_column(Integer, nullable=True)
    promo_pct_new: Mapped[int | None] = mapped_column(Integer, nullable=True)
    changed_by_admin_id: Mapped[str | None] = mapped_column(
        String(32), ForeignKey("admin_users.id", ondelete="SET NULL"), nullable=True
    )
    reason: Mapped[str | None] = mapped_column(Text(), nullable=True)
    revenue_impact_estimate: Mapped[Decimal | None] = mapped_column(Numeric(12, 2), nullable=True)
