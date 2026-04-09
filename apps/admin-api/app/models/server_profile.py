"""Server profile — request template for peer creation (DNS, MTU, params)."""

from sqlalchemy import Boolean, ForeignKey, Integer, String
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin, uuid4_hex


class ServerProfile(Base, TimestampMixin):
    __tablename__ = "server_profiles"

    id: Mapped[str] = mapped_column(String(32), primary_key=True, default=uuid4_hex)
    server_id: Mapped[str] = mapped_column(
        String(32), ForeignKey("servers.id", ondelete="CASCADE"), nullable=False
    )
    name: Mapped[str] = mapped_column(String(128), nullable=False)
    dns: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    mtu: Mapped[int | None] = mapped_column(Integer, nullable=True)
    request_params: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    # IPv6 fail-safe: when True, Issue Config should emit IPv4-only full tunnel
    # (AllowedIPs = 0.0.0.0/0) for restrictive / unstable networks.
    disable_ipv6_on_unstable_route: Mapped[bool] = mapped_column(
        Boolean, nullable=False, default=False, server_default="false"
    )

    server: Mapped["Server"] = relationship(
        "Server", back_populates="profiles", foreign_keys=[server_id]
    )
