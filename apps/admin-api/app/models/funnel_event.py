"""Funnel event for analytics: start, payment, issue, renewal."""

from __future__ import annotations

from sqlalchemy import BigInteger, ForeignKey, String
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, TimestampMixin, uuid4_hex


class FunnelEvent(Base, TimestampMixin):
    __tablename__ = "funnel_events"

    id: Mapped[str] = mapped_column(String(32), primary_key=True, default=uuid4_hex)
    user_id: Mapped[int | None] = mapped_column(
        BigInteger, ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    event_type: Mapped[str] = mapped_column(String(32), nullable=False)
    payload: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
