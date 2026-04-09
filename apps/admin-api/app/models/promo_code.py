"""PromoCode: code, type, value, constraints, status; discount_xtr, limits, applicability."""

from datetime import datetime, timezone
from decimal import Decimal

from sqlalchemy import BigInteger, Boolean, DateTime, Integer, Numeric, String, Text
from sqlalchemy.dialects.postgresql import ARRAY, JSONB
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, TimestampMixin, uuid4_hex


class PromoCode(Base, TimestampMixin):
    __tablename__ = "promo_codes"

    id: Mapped[str] = mapped_column(String(32), primary_key=True, default=uuid4_hex)
    code: Mapped[str] = mapped_column(String(64), unique=True, nullable=False)
    type: Mapped[str] = mapped_column(String(32), nullable=False)
    value: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    constraints: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    status: Mapped[str] = mapped_column(String(32), nullable=False, default="active")
    discount_xtr: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    max_uses_per_user: Mapped[int] = mapped_column(Integer, nullable=False, default=1)
    global_use_limit: Mapped[int | None] = mapped_column(Integer, nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    expires_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    applicable_plan_ids: Mapped[list[str] | None] = mapped_column(ARRAY(Text), nullable=True)
    created_by: Mapped[int | None] = mapped_column(BigInteger, nullable=True)
    updated_by: Mapped[int | None] = mapped_column(BigInteger, nullable=True)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False
    )
