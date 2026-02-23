"""Admin-issue peer on a chosen server: Device + IssuedConfig, one-time download token."""

import hashlib
import logging
import secrets
from datetime import datetime, timedelta, timezone
from typing import NamedTuple

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.amnezia_config import (
    build_amnezia_client_config,
    build_standard_wg_client_config,
    build_wg_obfuscated_config,
    derive_address_from_profile,
    generate_wg_keypair,
    get_obfuscation_params,
)
from app.core.config import settings
from app.core.config_builder import ConfigValidationError
from app.core.exceptions import WireGuardCommandError
from app.core.redaction import redact_for_log
from app.core.security import encrypt_config
from app.models import (
    Device,
    IssuedConfig,
    Plan,
    ProfileIssue,
    Server,
    ServerProfile,
    Subscription,
    User,
)
from app.services.address_allocator import allocate_address_for_device
from app.services.node_endpoint_utils import get_endpoint_from_runtime
from app.services.node_runtime import NodeRuntimeAdapter, PeerConfigLike

# tg_id for system operator (standalone peers)
SYSTEM_TG_ID = 0

TOKEN_BYTES = 32
DOWNLOAD_TOKEN_TTL_DAYS = 1


class ConfigEntry(NamedTuple):
    download_url: str
    qr_payload: str


class AdminIssueResult(NamedTuple):
    device: Device
    config_awg: ConfigEntry
    config_wg_obf: ConfigEntry
    config_wg: ConfigEntry
    request_id: str
    peer_created: bool


_config_log = logging.getLogger("app.config")


def _config_hash(public_key: str, private_key: str) -> str:
    return hashlib.sha256(f"{public_key}:{private_key}".encode()).hexdigest()[:64]


async def _resolve_system_user_sub(session: AsyncSession) -> tuple[int, str]:
    """Return (user_id, subscription_id) for standalone peers. Raises if not seeded."""
    user_result = await session.execute(select(User).where(User.tg_id == SYSTEM_TG_ID))
    user = user_result.scalar_one_or_none()
    if not user:
        raise ValueError("system_operator_not_seeded")
    plan_result = await session.execute(select(Plan).where(Plan.name == "operator"))
    plan = plan_result.scalar_one_or_none()
    if not plan:
        raise ValueError("system_operator_not_seeded")
    sub_result = await session.execute(
        select(Subscription)
        .where(
            Subscription.user_id == user.id,
            Subscription.plan_id == plan.id,
            Subscription.status == "active",
            Subscription.valid_until > datetime.now(timezone.utc),
        )
        .limit(1)
    )
    sub = sub_result.scalar_one_or_none()
    if not sub:
        raise ValueError("system_operator_not_seeded")
    return user.id, sub.id


async def admin_issue_peer(
    session: AsyncSession,
    *,
    server_id: str,
    user_id: int | None = None,
    subscription_id: str | None = None,
    device_name: str | None = None,
    expires_in_days: int | None = None,
    client_endpoint: str | None = None,
    issued_by_admin_id: str | None = None,
    runtime_adapter: NodeRuntimeAdapter | None = None,
    base_config_url: str = "/api/v1/admin/configs",
) -> AdminIssueResult:
    """Create device on chosen server; issue both AmneziaWG and standard WG configs."""
    server_result = await session.execute(
        select(Server).where(Server.id == server_id, Server.is_active.is_(True))
    )
    server = server_result.scalar_one_or_none()
    if not server:
        raise ValueError("server_not_available")
    if getattr(server, "is_draining", False):
        raise ValueError("server_draining")
    if not server.public_key:
        raise ValueError("server_public_key_required")

    if user_id is not None and subscription_id is not None:
        sub_result = await session.execute(
            select(Subscription)
            .where(
                Subscription.id == subscription_id,
                Subscription.user_id == user_id,
                Subscription.status == "active",
                Subscription.valid_until > datetime.now(timezone.utc),
            )
            .with_for_update()
        )
        sub = sub_result.scalar_one_or_none()
        if not sub:
            raise ValueError("subscription_invalid")
    else:
        user_id, subscription_id = await _resolve_system_user_sub(session)
        sub_result = await session.execute(
            select(Subscription).where(Subscription.id == subscription_id).with_for_update()
        )
        sub = sub_result.scalar_one_or_none()
        if not sub:
            raise ValueError("system_operator_not_seeded")

    count = (
        await session.execute(
            select(func.count())
            .select_from(Device)
            .where(
                Device.subscription_id == subscription_id,
                Device.revoked_at.is_(None),
            )
        )
    ).scalar() or 0
    if count >= sub.device_limit:
        raise ValueError("device_limit_exceeded")

    profile_result = await session.execute(
        select(ServerProfile)
        .where(ServerProfile.server_id == server_id)
        .order_by(ServerProfile.created_at.asc())
        .limit(1)
    )
    first_profile = profile_result.scalar_one_or_none()
    request_params = first_profile.request_params if first_profile else None
    endpoint = (
        (client_endpoint and client_endpoint.strip())
        or server.vpn_endpoint
        or (request_params.get("client_endpoint") if request_params else None)
    )
    if not endpoint and runtime_adapter:
        try:
            default_host = (settings.vpn_default_host or "").strip() or None
            derived = await get_endpoint_from_runtime(
                runtime_adapter, server_id, default_host=default_host
            )
            if derived:
                endpoint = derived
                server.vpn_endpoint = derived
        except Exception:
            pass
    dns = None
    if request_params and request_params.get("dns"):
        dns = (
            request_params["dns"]
            if isinstance(request_params["dns"], str)
            else ",".join(request_params["dns"])
        )
    if not dns:
        dns = "1.1.1.1"
    mtu = None
    if first_profile and getattr(first_profile, "mtu", None) is not None:
        mtu = int(first_profile.mtu)
    elif request_params:
        raw = request_params.get("mtu") or request_params.get("amnezia_mtu")
        if raw is not None:
            try:
                mtu = int(raw)
            except (TypeError, ValueError):
                pass
    if mtu is not None and mtu <= 0:
        mtu = None

    private_key_b64, public_key_b64 = generate_wg_keypair()
    config_hash = _config_hash(public_key_b64, private_key_b64)
    now = datetime.now(timezone.utc)

    obfuscation = get_obfuscation_params(request_params)
    if runtime_adapter and hasattr(runtime_adapter, "get_obfuscation_from_node"):
        try:
            runtime_obf = await runtime_adapter.get_obfuscation_from_node(server_id)
            if runtime_obf:
                obfuscation = {**obfuscation, **runtime_obf}
        except Exception:
            pass
    address, allowed_ips_val = await allocate_address_for_device(session, server_id, request_params)
    try:
        config_awg_snippet = build_amnezia_client_config(
            server_public_key=server.public_key,
            client_private_key_b64=private_key_b64,
            endpoint=endpoint,
            dns=dns,
            obfuscation=obfuscation,
            mtu=mtu,
            address=address,
        )
        _config_log.info(
            "config generated",
            extra={
                "event": "config.gen",
                "profile_mode": "awg_safe",
                "server_id": server_id,
                "user_id": str(user_id),
                "validation_errors": [],
                "emitted_bytes": len(config_awg_snippet.encode("utf-8")),
            },
        )
    except ConfigValidationError as e:
        _config_log.warning(
            "config generation failed",
            extra={
                "event": "config.gen",
                "profile_mode": "awg_safe",
                "server_id": server_id,
                "user_id": str(user_id),
                "validation_errors": e.errors,
                "emitted_bytes": 0,
            },
        )
        raise
    try:
        config_wg_obf_snippet = build_wg_obfuscated_config(
            server_public_key=server.public_key,
            client_private_key_b64=private_key_b64,
            endpoint=endpoint,
            dns=dns,
            obfuscation=obfuscation,
            mtu=mtu,
            address=address,
        )
        _config_log.info(
            "config generated",
            extra={
                "event": "config.gen",
                "profile_mode": "wg_obf",
                "server_id": server_id,
                "user_id": str(user_id),
                "validation_errors": [],
                "emitted_bytes": len(config_wg_obf_snippet.encode("utf-8")),
            },
        )
    except ConfigValidationError as e:
        _config_log.warning(
            "config generation failed",
            extra={
                "event": "config.gen",
                "profile_mode": "wg_obf",
                "server_id": server_id,
                "user_id": str(user_id),
                "validation_errors": e.errors,
                "emitted_bytes": 0,
            },
        )
        raise
    try:
        config_wg_snippet = build_standard_wg_client_config(
            server_public_key=server.public_key,
            client_private_key_b64=private_key_b64,
            endpoint=endpoint,
            dns=dns,
            mtu=mtu,
            address=address,
        )
        _config_log.info(
            "config generated",
            extra={
                "event": "config.gen",
                "profile_mode": "universal_safe",
                "server_id": server_id,
                "user_id": str(user_id),
                "validation_errors": [],
                "emitted_bytes": len(config_wg_snippet.encode("utf-8")),
            },
        )
    except ConfigValidationError as e:
        _config_log.warning(
            "config generation failed",
            extra={
                "event": "config.gen",
                "profile_mode": "universal_safe",
                "server_id": server_id,
                "user_id": str(user_id),
                "validation_errors": e.errors,
                "emitted_bytes": 0,
            },
        )
        raise

    device = Device(
        user_id=user_id,
        subscription_id=subscription_id,
        server_id=server_id,
        device_name=device_name,
        public_key=public_key_b64,
        allowed_ips=allowed_ips_val,
        config_amnezia_hash=config_hash,
        issued_at=now,
        revoked_at=None,
        issued_by_admin_id=issued_by_admin_id,
    )
    session.add(device)
    await session.flush()
    session.add(ProfileIssue(device_id=device.id, config_version="1"))
    await session.flush()

    peer_created = False
    if settings.node_mode == "real" and runtime_adapter:
        try:
            # Server peer AllowedIPs must be client tunnel address (/32), not 0.0.0.0/0
            await runtime_adapter.add_peer(
                server_id,
                PeerConfigLike(
                    public_key=public_key_b64,
                    allowed_ips=allowed_ips_val,
                    persistent_keepalive=25,
                ),
            )
            peer_created = True
        except Exception as exc:
            await session.delete(device)
            await session.flush()
            raise WireGuardCommandError(
                "Node peer creation failed",
                command="wg set",
                output=redact_for_log(str(exc)),
            )
    elif settings.node_mode == "agent":
        peer_created = False

    expires_at = (
        (now + timedelta(days=expires_in_days or DOWNLOAD_TOKEN_TTL_DAYS))
        if (expires_in_days or DOWNLOAD_TOKEN_TTL_DAYS)
        else None
    )

    def _create_issued_config(profile_type: str, config_snippet: str) -> tuple[str, str]:
        token = secrets.token_hex(TOKEN_BYTES)
        token_hash = hashlib.sha256(token.encode()).hexdigest()
        config_encrypted = encrypt_config(config_snippet)
        session.add(
            IssuedConfig(
                device_id=device.id,
                server_id=server_id,
                profile_type=profile_type,
                expires_at=expires_at,
                download_token_hash=token_hash,
                issued_by_admin_id=issued_by_admin_id,
                config_encrypted=config_encrypted,
            )
        )
        return token, config_snippet

    token_awg, _ = _create_issued_config("awg", config_awg_snippet)
    token_wg_obf, _ = _create_issued_config("wg_obf", config_wg_obf_snippet)
    token_wg, _ = _create_issued_config("wg", config_wg_snippet)
    await session.flush()

    base = base_config_url.rstrip("/")
    return AdminIssueResult(
        device=device,
        config_awg=ConfigEntry(
            download_url=f"{base}/{token_awg}/download",
            qr_payload=config_awg_snippet,
        ),
        config_wg_obf=ConfigEntry(
            download_url=f"{base}/{token_wg_obf}/download",
            qr_payload=config_wg_obf_snippet,
        ),
        config_wg=ConfigEntry(
            download_url=f"{base}/{token_wg}/download",
            qr_payload=config_wg_snippet,
        ),
        request_id="",
        peer_created=peer_created,
    )


class AdminRotateResult(NamedTuple):
    config_awg: ConfigEntry
    config_wg_obf: ConfigEntry
    config_wg: ConfigEntry
    request_id: str


async def admin_rotate_peer(
    session: AsyncSession,
    *,
    server_id: str,
    peer_id: str,
    expires_in_days: int | None = None,
    issued_by_admin_id: str | None = None,
    runtime_adapter: NodeRuntimeAdapter | None = None,
    base_config_url: str = "/api/v1/admin/configs",
) -> AdminRotateResult:
    """Rotate keys for device; remove old peer, add new, update Device and IssuedConfig."""
    device_result = await session.execute(
        select(Device).where(
            Device.id == peer_id, Device.server_id == server_id, Device.revoked_at.is_(None)
        )
    )
    device = device_result.scalar_one_or_none()
    if not device:
        raise ValueError("peer_not_found")
    server_result = await session.execute(select(Server).where(Server.id == server_id))
    server = server_result.scalar_one_or_none()
    if not server or not server.public_key:
        raise ValueError("server_not_available")
    if getattr(server, "is_draining", False):
        raise ValueError("server_draining")

    profile_result = await session.execute(
        select(ServerProfile)
        .where(ServerProfile.server_id == server_id)
        .order_by(ServerProfile.created_at.asc())
        .limit(1)
    )
    first_profile = profile_result.scalar_one_or_none()
    request_params = first_profile.request_params if first_profile else None
    endpoint = server.vpn_endpoint or (
        request_params.get("client_endpoint") if request_params else None
    )
    if not endpoint and runtime_adapter:
        try:
            default_host = (settings.vpn_default_host or "").strip() or None
            derived = await get_endpoint_from_runtime(
                runtime_adapter, server_id, default_host=default_host
            )
            if derived:
                endpoint = derived
                server.vpn_endpoint = derived
        except Exception:
            pass
    dns = None
    if request_params and request_params.get("dns"):
        dns = (
            request_params["dns"]
            if isinstance(request_params["dns"], str)
            else ",".join(request_params["dns"])
        )
    if not dns:
        dns = "1.1.1.1"
    mtu = None
    if first_profile and getattr(first_profile, "mtu", None) is not None:
        mtu = int(first_profile.mtu)
    elif request_params:
        raw = request_params.get("mtu") or request_params.get("amnezia_mtu")
        if raw is not None:
            try:
                mtu = int(raw)
            except (TypeError, ValueError):
                pass
    if mtu is not None and mtu <= 0:
        mtu = None

    old_public_key = device.public_key
    if settings.node_mode == "real" and runtime_adapter:
        try:
            await runtime_adapter.remove_peer(server_id, old_public_key)
        except Exception as exc:
            raise WireGuardCommandError(
                "Node peer removal failed",
                command="wg set peer remove",
                output=redact_for_log(str(exc)),
            )

    private_key_b64, public_key_b64 = generate_wg_keypair()
    config_hash = _config_hash(public_key_b64, private_key_b64)
    obfuscation = get_obfuscation_params(request_params)
    if runtime_adapter and hasattr(runtime_adapter, "get_obfuscation_from_node"):
        try:
            runtime_obf = await runtime_adapter.get_obfuscation_from_node(server_id)
            if runtime_obf:
                obfuscation = {**obfuscation, **runtime_obf}
        except Exception:
            pass
    # Rotate: keep existing tunnel IP (/32 for peer), widen to subnet CIDR for client Address
    if device.allowed_ips:
        allowed_ips_val = device.allowed_ips
        address = allowed_ips_val
        if "/32" in allowed_ips_val:
            cidr = request_params.get("subnet_cidr") or request_params.get("amnezia_cidr") or 32
            address = allowed_ips_val.replace("/32", f"/{cidr}")
    else:
        address, allowed_ips_val = await allocate_address_for_device(session, server_id, request_params)
    try:
        config_awg_snippet = build_amnezia_client_config(
            server_public_key=server.public_key,
            client_private_key_b64=private_key_b64,
            endpoint=endpoint,
            dns=dns,
            obfuscation=obfuscation,
            mtu=mtu,
            address=address,
        )
        _config_log.info(
            "config generated",
            extra={
                "event": "config.gen",
                "profile_mode": "awg_safe",
                "server_id": server_id,
                "user_id": str(device.user_id),
                "validation_errors": [],
                "emitted_bytes": len(config_awg_snippet.encode("utf-8")),
            },
        )
    except ConfigValidationError as e:
        _config_log.warning(
            "config generation failed",
            extra={
                "event": "config.gen",
                "profile_mode": "awg_safe",
                "server_id": server_id,
                "user_id": str(device.user_id),
                "validation_errors": e.errors,
                "emitted_bytes": 0,
            },
        )
        raise
    try:
        config_wg_obf_snippet = build_wg_obfuscated_config(
            server_public_key=server.public_key,
            client_private_key_b64=private_key_b64,
            endpoint=endpoint,
            dns=dns,
            obfuscation=obfuscation,
            mtu=mtu,
            address=address,
        )
        _config_log.info(
            "config generated",
            extra={
                "event": "config.gen",
                "profile_mode": "wg_obf",
                "server_id": server_id,
                "user_id": str(device.user_id),
                "validation_errors": [],
                "emitted_bytes": len(config_wg_obf_snippet.encode("utf-8")),
            },
        )
    except ConfigValidationError as e:
        _config_log.warning(
            "config generation failed",
            extra={
                "event": "config.gen",
                "profile_mode": "wg_obf",
                "server_id": server_id,
                "user_id": str(device.user_id),
                "validation_errors": e.errors,
                "emitted_bytes": 0,
            },
        )
        raise
    try:
        config_wg_snippet = build_standard_wg_client_config(
            server_public_key=server.public_key,
            client_private_key_b64=private_key_b64,
            endpoint=endpoint,
            dns=dns,
            mtu=mtu,
            address=address,
        )
        _config_log.info(
            "config generated",
            extra={
                "event": "config.gen",
                "profile_mode": "universal_safe",
                "server_id": server_id,
                "user_id": str(device.user_id),
                "validation_errors": [],
                "emitted_bytes": len(config_wg_snippet.encode("utf-8")),
            },
        )
    except ConfigValidationError as e:
        _config_log.warning(
            "config generation failed",
            extra={
                "event": "config.gen",
                "profile_mode": "universal_safe",
                "server_id": server_id,
                "user_id": str(device.user_id),
                "validation_errors": e.errors,
                "emitted_bytes": 0,
            },
        )
        raise

    device.public_key = public_key_b64
    device.allowed_ips = allowed_ips_val
    device.config_amnezia_hash = config_hash
    await session.flush()

    if settings.node_mode == "real" and runtime_adapter:
        try:
            await runtime_adapter.add_peer(
                server_id,
                PeerConfigLike(
                    public_key=public_key_b64,
                    allowed_ips=allowed_ips_val,
                    persistent_keepalive=25,
                ),
            )
        except Exception as exc:
            device.public_key = old_public_key
            device.config_amnezia_hash = hashlib.sha256(f"{old_public_key}:".encode()).hexdigest()[
                :64
            ]
            await session.flush()
            raise WireGuardCommandError(
                "Node peer add failed after rotate",
                command="wg set",
                output=redact_for_log(str(exc)),
            )

    now = datetime.now(timezone.utc)
    expires_at = (
        (now + timedelta(days=expires_in_days or DOWNLOAD_TOKEN_TTL_DAYS))
        if (expires_in_days or DOWNLOAD_TOKEN_TTL_DAYS)
        else None
    )

    def _create_issued_config(profile_type: str, config_snippet: str) -> tuple[str, str]:
        token = secrets.token_hex(TOKEN_BYTES)
        token_hash = hashlib.sha256(token.encode()).hexdigest()
        config_encrypted = encrypt_config(config_snippet)
        session.add(
            IssuedConfig(
                device_id=device.id,
                server_id=server_id,
                profile_type=profile_type,
                expires_at=expires_at,
                download_token_hash=token_hash,
                issued_by_admin_id=issued_by_admin_id,
                config_encrypted=config_encrypted,
            )
        )
        return token, config_snippet

    token_awg, _ = _create_issued_config("awg", config_awg_snippet)
    token_wg_obf, _ = _create_issued_config("wg_obf", config_wg_obf_snippet)
    token_wg, _ = _create_issued_config("wg", config_wg_snippet)
    await session.flush()

    base = base_config_url.rstrip("/")
    return AdminRotateResult(
        config_awg=ConfigEntry(
            download_url=f"{base}/{token_awg}/download",
            qr_payload=config_awg_snippet,
        ),
        config_wg_obf=ConfigEntry(
            download_url=f"{base}/{token_wg_obf}/download",
            qr_payload=config_wg_obf_snippet,
        ),
        config_wg=ConfigEntry(
            download_url=f"{base}/{token_wg}/download",
            qr_payload=config_wg_snippet,
        ),
        request_id="",
    )
