"""One-time download tokens for link-based QR onboarding (e.g. AmneziaWG AWG configs)."""

from __future__ import annotations

from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin, uuid4_hex


class OneTimeDownloadToken(Base, TimestampMixin):
    __tablename__ = "one_time_download_tokens"

    id: Mapped[str] = mapped_column(String(32), primary_key=True, default=uuid4_hex)
    token_hash: Mapped[str] = mapped_column(String(64), unique=True, nullable=False, index=True)
    device_id: Mapped[str] = mapped_column(
        String(32), ForeignKey("devices.id", ondelete="CASCADE"), nullable=False, index=True
    )
    kind: Mapped[str] = mapped_column(String(32), nullable=False)  # e.g. "awg_conf"
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    consumed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    device: Mapped["Device"] = relationship("Device", back_populates="download_tokens")
