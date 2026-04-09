"""Server model — external VPN node metadata only."""

from __future__ import annotations

from datetime import datetime

from sqlalchemy import BigInteger, Boolean, DateTime, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin, uuid4_hex


class Server(Base, TimestampMixin):
    __tablename__ = "servers"

    id: Mapped[str] = mapped_column(String(32), primary_key=True, default=uuid4_hex)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    region: Mapped[str] = mapped_column(String(64), nullable=False)
    api_endpoint: Mapped[str] = mapped_column(String(512), nullable=False)
    vpn_endpoint: Mapped[str | None] = mapped_column(
        String(256), nullable=True
    )  # VPN host:port e.g. vpn.example.com:47604
    public_key: Mapped[str | None] = mapped_column(Text, nullable=True)
    preshared_key: Mapped[str | None] = mapped_column(
        Text, nullable=True
    )  # optional WG preshared key for issued configs
    amnezia_h1: Mapped[int | None] = mapped_column(BigInteger, nullable=True)
    amnezia_h2: Mapped[int | None] = mapped_column(BigInteger, nullable=True)
    amnezia_h3: Mapped[int | None] = mapped_column(BigInteger, nullable=True)
    amnezia_h4: Mapped[int | None] = mapped_column(BigInteger, nullable=True)
    status: Mapped[str] = mapped_column(String(32), default="unknown", nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    traffic_limit_gb: Mapped[float | None] = mapped_column(Float, nullable=True)
    speed_limit_mbps: Mapped[float | None] = mapped_column(Float, nullable=True)
    max_connections: Mapped[int | None] = mapped_column(Integer, nullable=True)
    health_score: Mapped[float | None] = mapped_column(Float, nullable=True)
    is_draining: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    last_snapshot_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    public_key_synced_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    key_status: Mapped[str | None] = mapped_column(
        String(32), nullable=True
    )  # verified | unverified | not_found
    auto_sync_enabled: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    auto_sync_interval_sec: Mapped[int] = mapped_column(Integer, default=60, nullable=False)
    ops_notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    ops_notes_updated_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    ops_notes_updated_by: Mapped[str | None] = mapped_column(
        String(32), ForeignKey("admin_users.id", ondelete="SET NULL"), nullable=True
    )
    cert_fingerprint: Mapped[str | None] = mapped_column(String(64), nullable=True)
    cert_expires_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    profiles: Mapped[list["ServerProfile"]] = relationship(
        "ServerProfile", back_populates="server", cascade="all, delete-orphan"
    )
    devices: Mapped[list["Device"]] = relationship(
        "Device", back_populates="server", foreign_keys="Device.server_id"
    )
    health_logs: Mapped[list["ServerHealthLog"]] = relationship(
        "ServerHealthLog", back_populates="server"
    )
    ip_pools: Mapped[list["IpPool"]] = relationship(
        "IpPool", back_populates="server", cascade="all, delete-orphan"
    )
    port_allocations: Mapped[list["PortAllocation"]] = relationship(
        "PortAllocation", back_populates="server", cascade="all, delete-orphan"
    )
    issued_configs: Mapped[list["IssuedConfig"]] = relationship(
        "IssuedConfig", back_populates="server", cascade="all, delete-orphan"
    )
    snapshots: Mapped[list["ServerSnapshot"]] = relationship(
        "ServerSnapshot", back_populates="server", cascade="all, delete-orphan"
    )
    sync_jobs: Mapped[list["SyncJob"]] = relationship(
        "SyncJob", back_populates="server", cascade="all, delete-orphan"
    )
    server_ips: Mapped[list["ServerIp"]] = relationship(
        "ServerIp", back_populates="server", cascade="all, delete-orphan"
    )
    agent_actions: Mapped[list["AgentAction"]] = relationship(
        "AgentAction", back_populates="server", cascade="all, delete-orphan"
    )
