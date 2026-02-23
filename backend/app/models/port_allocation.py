"""Port allocation model for node endpoint governance."""

from __future__ import annotations

from sqlalchemy import Boolean, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin, uuid4_hex


class PortAllocation(Base, TimestampMixin):
    __tablename__ = "port_allocations"

    id: Mapped[str] = mapped_column(String(32), primary_key=True, default=uuid4_hex)
    server_id: Mapped[str] = mapped_column(
        String(32), ForeignKey("servers.id", ondelete="CASCADE"), nullable=False
    )
    port: Mapped[int] = mapped_column(Integer, nullable=False)
    protocol: Mapped[str] = mapped_column(String(16), default="udp", nullable=False)
    purpose: Mapped[str] = mapped_column(String(64), default="peer", nullable=False)
    device_id: Mapped[str | None] = mapped_column(
        String(32), ForeignKey("devices.id", ondelete="SET NULL"), nullable=True
    )
    is_reserved: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    server: Mapped["Server"] = relationship("Server", back_populates="port_allocations")
    device: Mapped["Device | None"] = relationship("Device")
