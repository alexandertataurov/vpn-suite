"""Issue profile: generate real WG keypairs (X25519), save device, emit AmneziaWG client config.

When NODE_MODE=mock: no runtime call is made; peer is not created on node.
When NODE_MODE=real: peer is added through NodeRuntimeAdapter (`wg set` via Docker runtime).
When NODE_MODE=agent: control-plane is DB-only; node-agent reconciles peers from desired-state.
"""

import hashlib
import logging
from datetime import datetime, timezone
from typing import NamedTuple

from sqlalchemy import func, select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.amnezia_config import (
    build_all_configs,
    generate_wg_keypair,
    get_obfuscation_params,
)
from app.core.config import settings
from app.core.config_builder import DEFAULT_DNS, ConfigValidationError, generate_preshared_key
from app.core.exceptions import WireGuardCommandError
from app.core.redaction import redact_for_log
from app.models import Device, Plan, ProfileIssue, Server, ServerProfile, Subscription, User
from app.services.address_allocator import allocate_address_for_device
from app.services.admin_issue_service import _ensure_device_peer_on_node
from app.services.load_balancer import select_node as load_balancer_select_node
from app.services.node_endpoint_utils import get_endpoint_from_runtime, is_endpoint_private
from app.services.node_runtime import NodeRuntimeAdapter, PeerConfigLike
from app.services.server_live_key_service import _heartbeat_container_id, live_key_fetch
from app.services.server_obfuscation import request_params_with_server_h
from app.services.subscription_state import entitled_active_where, is_entitled_active


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
        select(Subscription, Plan.device_limit)
        .join(Plan, Plan.id == Subscription.plan_id)
        .where(
            Subscription.id == subscription_id,
            Subscription.user_id == user_id,
            *entitled_active_where(now=datetime.now(timezone.utc)),
        )
        .with_for_update()
    )
    row = sub_result.first()
    if not row:
        raise ValueError("subscription_invalid")
    sub, plan_device_limit = row
    if not is_entitled_active(sub):
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
    effective_device_limit = int(
        (
            getattr(sub, "device_limit", None)
            if getattr(sub, "device_limit", None) is not None
            else plan_device_limit
        )
        or 1
    )
    if getattr(sub, "device_limit", None) != effective_device_limit:
        sub.device_limit = effective_device_limit
    if count >= effective_device_limit:
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
    fallback = _heartbeat_container_id(getattr(server, "api_endpoint", None), resolved_server_id)
    db_key = (getattr(server, "public_key", None) or "").strip() or None
    db_key_synced_at = getattr(server, "public_key_synced_at", None)
    # Block issuance/reissue if server key unknown/unverified (ServerNotSyncedError).
    # In NODE_MODE=mock, treat DB key as source of truth (no runtime adapter / heartbeats).
    if settings.node_mode == "mock" and runtime_adapter is None:
        server_public_key = (server.public_key or "").strip()
        if not server_public_key:
            raise ValueError("server_public_key_required")
    else:
        live = await live_key_fetch(
            resolved_server_id,
            runtime_adapter,
            heartbeat_fallback_ids=[fallback] if fallback else None,
            fallback_public_key=db_key,
            fallback_public_key_synced_at=db_key_synced_at,
        )
        server_public_key = live.public_key
    if server_public_key != (server.public_key or "").strip():
        server.public_key = server_public_key
        await session.flush()
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
                if not is_endpoint_private(derived):
                    server.vpn_endpoint = derived
        except Exception:
            pass
    params_no_h = await request_params_with_server_h(session, server, request_params)
    obfuscation = get_obfuscation_params(params_no_h)
    # Reverse sync: issued configs use H1–H4 from AmneziaWG server when available (docker exec or agent heartbeat).
    if runtime_adapter is not None and hasattr(runtime_adapter, "get_obfuscation_from_node"):
        try:
            runtime_obf = await runtime_adapter.get_obfuscation_from_node(resolved_server_id)
        except Exception:
            runtime_obf = None
        if runtime_obf and all(runtime_obf.get(k) is not None for k in ("H1", "H2", "H3", "H4")):
            h1 = int(runtime_obf.get("H1"))
            h2 = int(runtime_obf.get("H2"))
            h3 = int(runtime_obf.get("H3"))
            h4 = int(runtime_obf.get("H4"))
            changed = (
                getattr(server, "amnezia_h1", None) != h1
                or getattr(server, "amnezia_h2", None) != h2
                or getattr(server, "amnezia_h3", None) != h3
                or getattr(server, "amnezia_h4", None) != h4
            )
            if changed:
                server.amnezia_h1, server.amnezia_h2, server.amnezia_h3, server.amnezia_h4 = (
                    h1,
                    h2,
                    h3,
                    h4,
                )
                await session.flush()
                _config_log.info(
                    "Resynced H1–H4 from node",
                    extra={
                        "event": "resync_h_params",
                        "server_id": resolved_server_id,
                        "H1": h1,
                        "H2": h2,
                        "H3": h3,
                        "H4": h4,
                    },
                )
            obfuscation = {**obfuscation, **runtime_obf}
    dns = None
    if request_params and request_params.get("dns"):
        dns = (
            request_params["dns"]
            if isinstance(request_params["dns"], str)
            else ",".join(request_params["dns"])
        )
    if not dns:
        dns = DEFAULT_DNS
    else:
        _dns_norm = (dns if isinstance(dns, str) else ",".join(dns)).replace(" ", "").strip()
        if _dns_norm in ("1.1.1.1,1.0.0.1", "1.1.1.1, 1.0.0.1"):
            dns = DEFAULT_DNS
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
    if mtu is None:
        mtu = 1200
    # Anti-NAT: клиентский PersistentKeepalive делаем более частым, чем серверный.
    client_keepalive = 10
    if request_params:
        raw = request_params.get("persistent_keepalive") or request_params.get("amnezia_keepalive")
        if raw is not None:
            try:
                client_keepalive = max(10, min(60, int(raw)))
            except (TypeError, ValueError):
                pass
    server_keepalive = 15
    preshared_key = None
    if request_params:
        preshared_key = request_params.get("preshared_key") or request_params.get(
            "amnezia_preshared_key"
        )
    if not preshared_key and getattr(server, "preshared_key", None):
        preshared_key = server.preshared_key
    if preshared_key is not None and not isinstance(preshared_key, str):
        preshared_key = None
    elif preshared_key:
        preshared_key = (preshared_key or "").strip() or None
    if not preshared_key:
        preshared_key = generate_preshared_key()
    if endpoint and is_endpoint_private(endpoint):
        default_host = (settings.vpn_default_host or "").strip()
        if default_host:
            port = endpoint.split(":")[-1].strip() if ":" in endpoint else "45790"
            endpoint = f"{default_host}:{port}"
            _config_log.info(
                "Replaced private endpoint with VPN_DEFAULT_HOST for issued config",
                extra={
                    "event": "config.endpoint_override",
                    "server_id": resolved_server_id,
                    "endpoint": endpoint,
                },
            )
        else:
            _config_log.warning(
                "Issuing config with private endpoint; set server.vpn_endpoint or VPN_DEFAULT_HOST to public IP:port.",
                extra={"event": "config.private_endpoint", "server_id": resolved_server_id},
            )
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
        preshared_key=preshared_key,
        issued_at=now,
        revoked_at=None,
        apply_status="CREATED"
        if (settings.node_mode == "real" and settings.node_discovery != "agent")
        else "PENDING_APPLY",
        connection_profile="restrictive"
        if first_profile and getattr(first_profile, "disable_ipv6_on_unstable_route", False)
        else "default",
    )
    session.add(device)
    await session.flush()
    session.add(ProfileIssue(device_id=device.id, config_version="1"))
    await session.flush()
    peer_created = False
    if settings.node_mode == "real" and settings.node_discovery != "agent":
        if runtime_adapter is None:
            raise WireGuardCommandError(
                "Runtime adapter is required for NODE_MODE=real",
                command="issue_device",
                output="missing runtime adapter",
            )
        try:
            await session.execute(
                update(Device).where(Device.id == device.id).values(apply_status="APPLYING")
            )
            await session.flush()
            await runtime_adapter.add_peer(
                resolved_server_id,
                PeerConfigLike(
                    public_key=public_key_b64,
                    allowed_ips=allowed_ips_val,
                    persistent_keepalive=server_keepalive,
                    preshared_key=preshared_key,
                ),
            )
            peers_after = await runtime_adapter.list_peers(resolved_server_id)
            if not any(
                (p.get("public_key") or "").strip() == public_key_b64 for p in peers_after or []
            ):
                raise WireGuardCommandError(
                    "Node peer creation verification failed (peer missing after add)",
                    command="wg show",
                    output=public_key_b64[:64],
                )
            await _ensure_device_peer_on_node(
                runtime_adapter,
                resolved_server_id,
                public_key=public_key_b64,
                allowed_ips=allowed_ips_val,
                preshared_key=preshared_key,
            )
            now_applied = datetime.now(timezone.utc)
            await session.execute(
                update(Device)
                .where(Device.id == device.id)
                .values(apply_status="APPLIED", last_applied_at=now_applied, last_error=None)
            )
            await session.flush()
            await session.refresh(device)
        except Exception as exc:
            if settings.issue_fallback_on_peer_failure:
                _config_log.warning(
                    "Node peer creation failed; keeping device with PENDING_APPLY",
                    extra={
                        "event": "issue.fallback_on_peer_failure",
                        "server_id": resolved_server_id,
                        "device_id": device.id,
                        "error": redact_for_log(str(exc)),
                    },
                )
                await session.execute(
                    update(Device)
                    .where(Device.id == device.id)
                    .values(
                        apply_status="PENDING_APPLY",
                        last_error=redact_for_log(str(exc))[:500],
                    )
                )
                await session.flush()
                peer_created = False
                # Continue to config generation below
            else:
                session.delete(device)  # type: ignore[unused-coroutine]
                await session.flush()
                raise WireGuardCommandError(
                    "Node peer creation failed",
                    command="wg set",
                    output=redact_for_log(str(exc)),
                )
        else:
            peer_created = True
    elif settings.node_mode == "agent":
        # DB-only: node-agent will add peer on next reconcile cycle.
        peer_created = False
    # Client [Interface] Address: /32 to match peer AllowedIPs on server.
    # IPv6 fail-safe: for unstable routes / restrictive profiles we can emit IPv4-only
    # full-tunnel config to avoid broken IPv6 paths.
    allowed_ips_full_tunnel = "0.0.0.0/0, ::/0"
    if first_profile and getattr(first_profile, "disable_ipv6_on_unstable_route", False):
        allowed_ips_full_tunnel = "0.0.0.0/0"
    try:
        config_awg, config_wg_obf, config_wg = build_all_configs(
            server_public_key=server_public_key,
            client_private_key_b64=private_key_b64,
            endpoint=endpoint,
            allowed_ips=allowed_ips_full_tunnel,
            dns=dns,
            obfuscation=obfuscation,
            mtu=mtu,
            address=allowed_ips_val,
            preshared_key=preshared_key,
            persistent_keepalive=client_keepalive,
        )
        _config_log.info(
            "configs generated",
            extra={
                "event": "config.gen_all",
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
                "event": "config.gen_all",
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
