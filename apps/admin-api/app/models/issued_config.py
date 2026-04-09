"""IssuedConfig model — one-time config/QR delivery token and metadata."""

from __future__ import annotations

from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin, uuid4_hex


class IssuedConfig(Base, TimestampMixin):
    __tablename__ = "issued_configs"

    id: Mapped[str] = mapped_column(String(32), primary_key=True, default=uuid4_hex)
    device_id: Mapped[str] = mapped_column(
        String(32), ForeignKey("devices.id", ondelete="CASCADE"), nullable=False
    )
    server_id: Mapped[str] = mapped_column(
        String(32), ForeignKey("servers.id", ondelete="CASCADE"), nullable=False
    )
    profile_type: Mapped[str] = mapped_column(String(16), nullable=False)  # "awg" | "wg_obf" | "wg"
    expires_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    download_token_hash: Mapped[str] = mapped_column(String(64), nullable=False, index=True)
    consumed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    issued_by_admin_id: Mapped[str | None] = mapped_column(
        String(32), ForeignKey("admin_users.id", ondelete="SET NULL"), nullable=True
    )
    # Encrypted config or private key for one-time download (decrypt on GET /configs/:token/download)
    config_encrypted: Mapped[str | None] = mapped_column(Text, nullable=True)

    device: Mapped["Device"] = relationship("Device", back_populates="issued_configs")
    server: Mapped["Server"] = relationship("Server", back_populates="issued_configs")
