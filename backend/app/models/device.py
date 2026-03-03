"""Device model — issued profile; store only public/metadata, not private key."""

from __future__ import annotations

from datetime import datetime

from sqlalchemy import BigInteger, DateTime, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin, uuid4_hex


class Device(Base, TimestampMixin):
    __tablename__ = "devices"

    id: Mapped[str] = mapped_column(String(32), primary_key=True, default=uuid4_hex)
    user_id: Mapped[int] = mapped_column(
        BigInteger, ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    subscription_id: Mapped[str] = mapped_column(
        String(32), ForeignKey("subscriptions.id", ondelete="CASCADE"), nullable=False
    )
    server_id: Mapped[str] = mapped_column(
        String(32), ForeignKey("servers.id", ondelete="RESTRICT"), nullable=False
    )
    device_name: Mapped[str | None] = mapped_column(String(128), nullable=True)
    public_key: Mapped[str] = mapped_column(String(128), nullable=False)
    allowed_ips: Mapped[str | None] = mapped_column(
        String(64), nullable=True
    )  # client tunnel address e.g. 10.8.1.2/32
    config_amnezia_hash: Mapped[str | None] = mapped_column(String(64), nullable=True)
    preshared_key: Mapped[str | None] = mapped_column(Text(), nullable=True)
    issued_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    revoked_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    issued_by_admin_id: Mapped[str | None] = mapped_column(
        String(32), ForeignKey("admin_users.id", ondelete="SET NULL"), nullable=True
    )
    suspended_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    data_limit_bytes: Mapped[int | None] = mapped_column(BigInteger, nullable=True)
    expires_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    # State reconciliation: apply on node and handshake quality gate
    # CREATED | APPLYING | APPLIED | VERIFIED | ERROR | PENDING_APPLY | FAILED_APPLY | NO_HANDSHAKE
    apply_status: Mapped[str | None] = mapped_column(
        String(32), nullable=True, default="PENDING_APPLY"
    )
    last_applied_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    last_seen_handshake_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    last_error: Mapped[str | None] = mapped_column(Text(), nullable=True)
    protocol_version: Mapped[str | None] = mapped_column(
        String(16), nullable=True
    )  # awg_legacy | awg_15 | awg_20
    obfuscation_profile: Mapped[str | None] = mapped_column(
        Text(), nullable=True
    )  # JSON: H1–H4, S1–S4, I1–I5, Jc/Jmin/Jmax
    # Connection stability hints and restrictive profile tracking
    unstable_reason: Mapped[str | None] = mapped_column(
        String(64), nullable=True
    )  # e.g. no_handshake, mtu_suspect
    connection_profile: Mapped[str | None] = mapped_column(
        String(32), nullable=True
    )  # default | restrictive

    user: Mapped["User"] = relationship("User", back_populates="devices", foreign_keys=[user_id])
    subscription: Mapped["Subscription"] = relationship(
        "Subscription", back_populates="devices", foreign_keys=[subscription_id]
    )
    server: Mapped["Server"] = relationship(
        "Server", back_populates="devices", foreign_keys=[server_id]
    )
    profile_issues: Mapped[list["ProfileIssue"]] = relationship(
        "ProfileIssue", back_populates="device", cascade="all, delete-orphan"
    )
    issued_configs: Mapped[list["IssuedConfig"]] = relationship(
        "IssuedConfig", back_populates="device", cascade="all, delete-orphan"
    )
    download_tokens: Mapped[list["OneTimeDownloadToken"]] = relationship(
        "OneTimeDownloadToken", back_populates="device", cascade="all, delete-orphan"
    )
