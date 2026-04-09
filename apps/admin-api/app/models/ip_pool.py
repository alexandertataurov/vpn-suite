"""IP pool model for per-server subnet and allocation visibility."""

from __future__ import annotations

from sqlalchemy import Boolean, ForeignKey, Integer, String
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin, uuid4_hex


class IpPool(Base, TimestampMixin):
    __tablename__ = "ip_pools"

    id: Mapped[str] = mapped_column(String(32), primary_key=True, default=uuid4_hex)
    server_id: Mapped[str] = mapped_column(
        String(32), ForeignKey("servers.id", ondelete="CASCADE"), nullable=False
    )
    cidr: Mapped[str] = mapped_column(String(64), nullable=False)
    gateway_ip: Mapped[str | None] = mapped_column(String(64), nullable=True)
    total_ips: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    used_ips: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    metadata_json: Mapped[dict | None] = mapped_column(JSONB, nullable=True)

    server: Mapped["Server"] = relationship("Server", back_populates="ip_pools")
