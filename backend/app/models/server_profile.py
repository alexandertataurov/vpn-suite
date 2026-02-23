"""Server profile — request template for peer creation (DNS, MTU, params)."""

from sqlalchemy import ForeignKey, Integer, String
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

    server: Mapped["Server"] = relationship(
        "Server", back_populates="profiles", foreign_keys=[server_id]
    )
