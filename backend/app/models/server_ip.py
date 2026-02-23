"""Per-server IP address with role and state (operator IP management)."""

from __future__ import annotations

from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, uuid4_hex


class ServerIp(Base):
    """Single IP address attached to a server with role and health state."""

    __tablename__ = "server_ips"

    id: Mapped[str] = mapped_column(String(32), primary_key=True, default=uuid4_hex)
    server_id: Mapped[str] = mapped_column(
        String(32), ForeignKey("servers.id", ondelete="CASCADE"), nullable=False
    )
    ip: Mapped[str] = mapped_column(String(45), nullable=False)  # IPv4 or IPv6
    role: Mapped[str] = mapped_column(
        String(16), nullable=False, default="secondary"
    )  # primary | secondary
    state: Mapped[str] = mapped_column(
        String(32), nullable=False, default="good"
    )  # good | bad | blocked | suspected_dpi
    last_checked_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    server: Mapped["Server"] = relationship(
        "Server", back_populates="server_ips", foreign_keys=[server_id]
    )
