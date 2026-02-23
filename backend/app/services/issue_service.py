"""Issue profile: generate real WG keypairs (X25519), save device, emit AmneziaWG client config.

When NODE_MODE=mock: no runtime call is made; peer is not created on node.
When NODE_MODE=real: peer is added through NodeRuntimeAdapter (`wg set` via Docker runtime).
When NODE_MODE=agent: control-plane is DB-only; node-agent reconciles peers from desired-state.
"""

import hashlib
import logging
from datetime import datetime, timezone
from typing import NamedTuple

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.amnezia_config import (
    build_amnezia_client_config,
    build_standard_wg_client_config,
    build_wg_obfuscated_config,
    generate_wg_keypair,
    get_obfuscation_params,
)
from app.core.config import settings
from app.core.config_builder import ConfigValidationError
from app.core.exceptions import WireGuardCommandError
from app.core.redaction import redact_for_log
from app.models import Device, ProfileIssue, Server, ServerProfile, Subscription, User
from app.services.address_allocator import allocate_address_for_device
from app.services.load_balancer import select_node as load_balancer_select_node
from app.services.node_endpoint_utils import get_endpoint_from_runtime
from app.services.node_runtime import NodeRuntimeAdapter, PeerConfigLike


class IssueResult(NamedTuple):
    device: Device
    private_key: str
    config_awg: str
    config_wg_obf: str
    config_wg: str
    peer_created: bool  # True when NODE_MODE=real and create_peer succeeded


_config_log = logging.getLogger("app.config")


def _config_hash(public_key: str, private_key: str) -> str:
    return hashlib.sha256(f"{public_key}:{private_key}".encode()).hexdigest()[:64]


async def issue_device(
    session: AsyncSession,
    *,
    user_id: int,
    subscription_id: str,
    server_id: str | None = None,
    device_name: str | None = None,
    get_topology=None,
    runtime_adapter: NodeRuntimeAdapter | None = None,
) -> IssueResult:
    """Create device: check limits, generate real WG keypair, save, return AmneziaWG config.
    If server_id is None and get_topology is provided, use load balancer to select server.
    Node create_peer only when NODE_MODE=real."""
    user_result = await session.execute(select(User).where(User.id == user_id))
    user = user_result.scalar_one_or_none()
    if not user:
        raise ValueError("user_not_found")
    if user.is_banned:
        raise ValueError("user_banned")
    # Lock subscription row to prevent device_limit race when two requests run in parallel (P1).
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
    resolved_server_id = server_id
    if resolved_server_id is None and get_topology is not None:
        node = await load_balancer_select_node(
            get_topology, client_ip=None, required_capabilities=None
        )
        if node is None:
            raise ValueError("server_required")
        resolved_server_id = node.node_id
    if resolved_server_id is None:
        raise ValueError("server_required")
    server_result = await session.execute(
        select(Server).where(Server.id == resolved_server_id, Server.is_active.is_(True))
    )
    server = server_result.scalar_one_or_none()
    if not server:
        raise ValueError("server_not_available")
    if not server.public_key:
        raise ValueError("server_public_key_required")
    # Real WireGuard keypair (X25519, base64)
    private_key_b64, public_key_b64 = generate_wg_keypair()
    # Optional: first profile for obfuscation params and client_endpoint
    profile_result = await session.execute(
        select(ServerProfile)
        .where(ServerProfile.server_id == resolved_server_id)
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
                runtime_adapter, resolved_server_id, default_host=default_host
            )
            if derived:
                endpoint = derived
                server.vpn_endpoint = derived
        except Exception:
            pass
    obfuscation = get_obfuscation_params(request_params)
    if runtime_adapter and hasattr(runtime_adapter, "get_obfuscation_from_node"):
        try:
            runtime_obf = await runtime_adapter.get_obfuscation_from_node(resolved_server_id)
            if runtime_obf:
                obfuscation = {**obfuscation, **runtime_obf}
        except Exception:
            pass
    dns = None
    if request_params and request_params.get("dns"):
        dns = (
            request_params["dns"]
            if isinstance(request_params["dns"], str)
            else ",".join(request_params["dns"])
        )
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
    address, allowed_ips_val = await allocate_address_for_device(
        session, resolved_server_id, request_params
    )
    config_hash = _config_hash(public_key_b64, private_key_b64)
    now = datetime.now(timezone.utc)
    device = Device(
        user_id=user_id,
        subscription_id=subscription_id,
        server_id=resolved_server_id,
        device_name=device_name,
        public_key=public_key_b64,
        allowed_ips=allowed_ips_val,
        config_amnezia_hash=config_hash,
        issued_at=now,
        revoked_at=None,
    )
    session.add(device)
    await session.flush()
    session.add(ProfileIssue(device_id=device.id, config_version="1"))
    await session.flush()
    peer_created = False
    if settings.node_mode == "real":
        if runtime_adapter is None:
            raise WireGuardCommandError(
                "Runtime adapter is required for NODE_MODE=real",
                command="issue_device",
                output="missing runtime adapter",
            )
        try:
            await runtime_adapter.add_peer(
                resolved_server_id,
                PeerConfigLike(
                    public_key=public_key_b64,
                    allowed_ips=allowed_ips_val,
                    persistent_keepalive=25,
                ),
            )
        except Exception as exc:
            session.delete(device)  # type: ignore[unused-coroutine]
            await session.flush()
            raise WireGuardCommandError(
                "Node peer creation failed",
                command="wg set",
                output=redact_for_log(str(exc)),
            )
        peer_created = True
    elif settings.node_mode == "agent":
        # DB-only: node-agent will add peer on next reconcile cycle.
        peer_created = False
    try:
        config_awg = build_amnezia_client_config(
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
                "server_id": resolved_server_id,
                "user_id": str(user_id),
                "validation_errors": [],
                "emitted_bytes": len(config_awg.encode("utf-8")),
            },
        )
    except ConfigValidationError as e:
        _config_log.warning(
            "config generation failed",
            extra={
                "event": "config.gen",
                "profile_mode": "awg_safe",
                "server_id": resolved_server_id,
                "user_id": str(user_id),
                "validation_errors": e.errors,
                "emitted_bytes": 0,
            },
        )
        raise
    try:
        config_wg_obf = build_wg_obfuscated_config(
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
                "server_id": resolved_server_id,
                "user_id": str(user_id),
                "validation_errors": [],
                "emitted_bytes": len(config_wg_obf.encode("utf-8")),
            },
        )
    except ConfigValidationError as e:
        _config_log.warning(
            "config generation failed",
            extra={
                "event": "config.gen",
                "profile_mode": "wg_obf",
                "server_id": resolved_server_id,
                "user_id": str(user_id),
                "validation_errors": e.errors,
                "emitted_bytes": 0,
            },
        )
        raise
    try:
        config_wg = build_standard_wg_client_config(
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
                "server_id": resolved_server_id,
                "user_id": str(user_id),
                "validation_errors": [],
                "emitted_bytes": len(config_wg.encode("utf-8")),
            },
        )
    except ConfigValidationError as e:
        _config_log.warning(
            "config generation failed",
            extra={
                "event": "config.gen",
                "profile_mode": "universal_safe",
                "server_id": resolved_server_id,
                "user_id": str(user_id),
                "validation_errors": e.errors,
                "emitted_bytes": 0,
            },
        )
        raise
    return IssueResult(
        device=device,
        private_key=private_key_b64,
        config_awg=config_awg,
        config_wg_obf=config_wg_obf,
        config_wg=config_wg,
        peer_created=peer_created,
    )
