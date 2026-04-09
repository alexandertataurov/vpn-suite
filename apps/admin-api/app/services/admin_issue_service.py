"""Admin-issue peer on a chosen server: Device + IssuedConfig, one-time download token.

Two-phase: Phase A = DB commit (Device PENDING_APPLY + IssuedConfig); Phase B = apply peer on node, then APPLIED.
"""

import hashlib
import json
import logging
from datetime import datetime, timedelta, timezone
from typing import NamedTuple

from sqlalchemy import func, select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.amnezia_config import (
    _select_awg_profile,
    generate_wg_keypair,
    get_obfuscation_params,
)
from app.core.amnezia_vpn_key import encode_awg_conf_vpn_key, sanitize_awg_conf
from app.core.config import settings
from app.core.config_builder import (
    DEFAULT_DNS,
    ConfigProfile,
    ConfigValidationError,
    generate_preshared_key,
)
from app.core.exceptions import WireGuardCommandError
from app.core.redaction import redact_for_log
from app.models import Device, Plan, ProfileIssue, Server, ServerProfile, Subscription, User
from app.services.address_allocator import allocate_address_for_device
from app.services.issued_config_service import persist_issued_configs_with_tokens
from app.services.load_balancer import (
    KIND_LEGACY_WG_RELAY,
    select_node as load_balancer_select_node,
    select_relay_and_upstream,
)
from app.services.node_endpoint_utils import get_endpoint_from_runtime, is_endpoint_private
from app.services.node_runtime import NodeRuntimeAdapter, PeerConfigLike
from app.services.server_live_key_service import (
    _heartbeat_container_id,
    live_key_fetch,
)
from app.services.server_obfuscation import request_params_with_server_h
from app.services.subscription_state import entitled_active_where, is_entitled_active

# tg_id for system operator (standalone peers)
SYSTEM_TG_ID = 0
DOWNLOAD_TOKEN_TTL_DAYS = 1
DELIVERY_MODE_AWG_NATIVE = "awg_native"
DELIVERY_MODE_WIREGUARD_UNIVERSAL = "wireguard_universal"
DELIVERY_MODE_LEGACY_WG_VIA_RELAY = "legacy_wg_via_relay"
PLAIN_WG_DELIVERY_MODES = {
    DELIVERY_MODE_WIREGUARD_UNIVERSAL,
    DELIVERY_MODE_LEGACY_WG_VIA_RELAY,
}


class ConfigEntry(NamedTuple):
    download_url: str
    qr_payload: str
    amnezia_vpn_key: str | None = None


class AdminIssueResult(NamedTuple):
    device: Device
    config_awg: ConfigEntry
    config_wg_obf: ConfigEntry
    config_wg: ConfigEntry
    request_id: str
    peer_created: bool


_config_log = logging.getLogger("app.config")


async def _ensure_device_peer_on_node(
    adapter: NodeRuntimeAdapter,
    server_id: str,
    *,
    public_key: str,
    allowed_ips: str,
    preshared_key: str | None = None,
) -> None:
    """Ensure device peer is on the node (list_peers; if missing, add_peer). Then ensure reply routes."""
    peers = await adapter.list_peers(server_id)
    if any((p.get("public_key") or "").strip() == public_key.strip() for p in (peers or [])):
        if hasattr(adapter, "ensure_reply_routes") and callable(adapter.ensure_reply_routes):
            await adapter.ensure_reply_routes(server_id)
        return
    await adapter.add_peer(
        server_id,
        PeerConfigLike(
            public_key=public_key.strip(),
            allowed_ips=allowed_ips.strip(),
            persistent_keepalive=15,
            preshared_key=preshared_key,
        ),
    )
    if hasattr(adapter, "ensure_reply_routes") and callable(adapter.ensure_reply_routes):
        await adapter.ensure_reply_routes(server_id)


def _config_hash(public_key: str, private_key: str) -> str:
    return hashlib.sha256(f"{public_key}:{private_key}".encode()).hexdigest()[:64]


async def _resolve_system_user_sub(session: AsyncSession) -> tuple[int, str]:
    """Return (user_id, subscription_id) for standalone peers. Raises if not seeded."""
    user_result = await session.execute(select(User).where(User.tg_id == SYSTEM_TG_ID))
    user = user_result.scalar_one_or_none()
    if not user:
        raise ValueError("system_operator_not_seeded")
    sub_result = await session.execute(
        select(Subscription)
        .where(
            Subscription.user_id == user.id,
            *entitled_active_where(now=datetime.now(timezone.utc)),
        )
        .limit(1)
    )
    sub = sub_result.scalar_one_or_none()
    if not sub or not is_entitled_active(sub):
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
    delivery_mode: str | None = None,
    issued_by_admin_id: str | None = None,
    runtime_adapter: NodeRuntimeAdapter | None = None,
    get_topology=None,
    base_config_url: str = "/api/v1/admin/configs",
) -> AdminIssueResult:
    """Create device on chosen server; issue both AmneziaWG and standard WG configs."""
    resolved_delivery_mode = delivery_mode or DELIVERY_MODE_AWG_NATIVE
    server_result = await session.execute(
        select(Server).where(Server.id == server_id, Server.is_active.is_(True))
    )
    server = server_result.scalar_one_or_none()
    if not server:
        raise ValueError("server_not_available")
    upstream_server_id: str | None = None
    if resolved_delivery_mode == DELIVERY_MODE_LEGACY_WG_VIA_RELAY:
        if getattr(server, "kind", None) != KIND_LEGACY_WG_RELAY:
            raise ValueError("legacy_relay_required")
        if get_topology is None:
            raise ValueError("topology_required")
        relay_node, upstream_node = await select_relay_and_upstream(get_topology)
        if relay_node.node_id != server_id:
            upstream_node = await load_balancer_select_node(
                get_topology, client_ip=None, required_capabilities=None
            )
        if upstream_node is None:
            raise ValueError("upstream_server_required")
        upstream_server_id = upstream_node.node_id
    if getattr(server, "is_draining", False):
        raise ValueError("server_draining")
    fallback = _heartbeat_container_id(getattr(server, "api_endpoint", None), server_id)
    db_key = (getattr(server, "public_key", None) or "").strip() or None
    db_key_synced_at = getattr(server, "public_key_synced_at", None)
    # Block issuance/reissue if server key unknown/unverified (ServerNotSyncedError).
    live = await live_key_fetch(
        server_id,
        runtime_adapter,
        heartbeat_fallback_ids=[fallback] if fallback else None,
        fallback_public_key=db_key,
        fallback_public_key_synced_at=db_key_synced_at,
    )
    server_public_key = live.public_key
    if server_public_key != (server.public_key or "").strip():
        from app.core.metrics import server_key_mismatch_total

        server_key_mismatch_total.labels(server_id=server_id).inc()
        server.public_key = server_public_key
        await session.flush()
    if settings.node_mode == "real" and settings.node_discovery != "agent" and not runtime_adapter:
        raise WireGuardCommandError(
            "Runtime adapter required for issue when NODE_MODE=real; peer would not be applied on node.",
            command="issue",
            output="node_runtime_adapter is None",
        )

    if user_id is not None and subscription_id is not None:
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
    else:
        user_id, subscription_id = await _resolve_system_user_sub(session)
        sub_result = await session.execute(
            select(Subscription, Plan.device_limit)
            .join(Plan, Plan.id == Subscription.plan_id)
            .where(Subscription.id == subscription_id)
            .with_for_update()
        )
        row = sub_result.first()
        if not row:
            raise ValueError("system_operator_not_seeded")
        sub, plan_device_limit = row

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
                if not is_endpoint_private(derived):
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
    # Default MTU 1200 for full-tunnel to reduce fragmentation (restrictive profile).
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
    private_key_b64, public_key_b64 = generate_wg_keypair()
    config_hash = _config_hash(public_key_b64, private_key_b64)
    now = datetime.now(timezone.utc)

    params_no_h = await request_params_with_server_h(session, server, request_params)
    obfuscation = (
        {} if resolved_delivery_mode in PLAIN_WG_DELIVERY_MODES else get_obfuscation_params(params_no_h)
    )
    if (
        resolved_delivery_mode not in PLAIN_WG_DELIVERY_MODES
        and runtime_adapter is not None
        and hasattr(runtime_adapter, "get_obfuscation_from_node")
    ):
        try:
            runtime_obf = await runtime_adapter.get_obfuscation_from_node(server_id)
        except Exception:
            runtime_obf = None
        if runtime_obf and all(runtime_obf.get(k) is not None for k in ("H1", "H2", "H3", "H4")):
            h1, h2, h3, h4 = (
                int(runtime_obf.get("H1")),
                int(runtime_obf.get("H2")),
                int(runtime_obf.get("H3")),
                int(runtime_obf.get("H4")),
            )
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
                        "server_id": server_id,
                        "H1": h1,
                        "H2": h2,
                        "H3": h3,
                        "H4": h4,
                    },
                )
            obfuscation = {**obfuscation, **runtime_obf}
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
                    "server_id": server_id,
                    "endpoint": endpoint,
                },
            )
        else:
            _config_log.warning(
                "Issuing config with private endpoint; set server.vpn_endpoint or VPN_DEFAULT_HOST to public IP:port.",
                extra={"event": "config.private_endpoint", "server_id": server_id},
            )
    address, allowed_ips_val = await allocate_address_for_device(session, server_id, request_params)
    _config_log.info(
        "reserve_ip",
        extra={"event": "reserve_ip", "server_id": server_id, "allowed_ips": allowed_ips_val},
    )
    from app.core.amnezia_config import build_all_configs

    # Client [Interface] Address: use /32 so config matches peer AllowedIPs on server.
    # IPv6 fail-safe: for unstable routes / restrictive profiles we can emit IPv4-only
    # full-tunnel config to avoid broken IPv6 paths.
    allowed_ips_full_tunnel = "0.0.0.0/0, ::/0"
    if first_profile and getattr(first_profile, "disable_ipv6_on_unstable_route", False):
        allowed_ips_full_tunnel = "0.0.0.0/0"
    try:
        config_awg_snippet, config_wg_obf_snippet, config_wg_snippet = build_all_configs(
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
        if resolved_delivery_mode in PLAIN_WG_DELIVERY_MODES:
            config_awg_snippet = config_wg_snippet
            config_wg_obf_snippet = config_wg_snippet
        _config_log.info(
            "configs generated",
            extra={
                "event": "config.gen_all",
                "server_id": server_id,
                "user_id": str(user_id),
                "validation_errors": [],
            },
        )
    except ConfigValidationError as e:
        _config_log.warning(
            "config generation failed",
            extra={
                "event": "config.gen_all",
                "server_id": server_id,
                "user_id": str(user_id),
                "validation_errors": e.errors,
            },
        )
        raise

    config_awg_snippet = sanitize_awg_conf(config_awg_snippet)

    config_awg_snippet = sanitize_awg_conf(config_awg_snippet)
    awg_profile = _select_awg_profile(obfuscation)
    protocol_version = (
        "wireguard_universal"
        if resolved_delivery_mode in PLAIN_WG_DELIVERY_MODES
        else ("awg_20" if awg_profile == ConfigProfile.awg_2_0_asc else "awg_legacy")
    )
    obfuscation_profile_json: str | None = None
    if obfuscation:
        obfuscation_profile_json = json.dumps(
            {k: v for k, v in obfuscation.items() if v is not None},
            sort_keys=True,
        )

    device = Device(
        user_id=user_id,
        subscription_id=subscription_id,
        server_id=server_id,
        delivery_mode=resolved_delivery_mode,
        client_facing_server_id=server_id,
        upstream_server_id=upstream_server_id,
        device_name=device_name,
        public_key=public_key_b64,
        allowed_ips=allowed_ips_val,
        config_amnezia_hash=config_hash,
        preshared_key=preshared_key,
        issued_at=now,
        revoked_at=None,
        issued_by_admin_id=issued_by_admin_id,
        apply_status="CREATED"
        if (settings.node_mode == "real" and settings.node_discovery != "agent")
        else "PENDING_APPLY",
        protocol_version=protocol_version,
        obfuscation_profile=obfuscation_profile_json,
        connection_profile="restrictive"
        if first_profile and getattr(first_profile, "disable_ipv6_on_unstable_route", False)
        else "default",
    )
    session.add(device)
    await session.flush()
    session.add(ProfileIssue(device_id=device.id, config_version="1"))
    await session.flush()
    _config_log.info(
        "create_peer_db",
        extra={
            "event": "create_peer_db",
            "device_id": device.id,
            "server_id": server_id,
            "apply_status": device.apply_status or "PENDING_APPLY",
        },
    )

    expires_at = (
        (now + timedelta(days=expires_in_days or DOWNLOAD_TOKEN_TTL_DAYS))
        if (expires_in_days or DOWNLOAD_TOKEN_TTL_DAYS)
        else None
    )

    tokens = await persist_issued_configs_with_tokens(
        session,
        device_id=device.id,
        server_id=server_id,
        config_awg=config_awg_snippet,
        config_wg_obf=config_wg_obf_snippet,
        config_wg=config_wg_snippet,
        issued_by_admin_id=issued_by_admin_id,
        expires_at=expires_at,
    )
    token_awg = tokens["awg"]
    token_wg_obf = tokens["wg_obf"]
    token_wg = tokens["wg"]
    await session.flush()

    # Phase A complete: persist Device + IssuedConfig so config URLs are valid even if apply fails
    await session.commit()

    peer_created = False
    if settings.node_mode == "real" and settings.node_discovery != "agent" and runtime_adapter:
        try:
            await session.execute(
                update(Device).where(Device.id == device.id).values(apply_status="APPLYING")
            )
            await session.commit()
            await _ensure_device_peer_on_node(
                runtime_adapter,
                server_id,
                public_key=public_key_b64,
                allowed_ips=allowed_ips_val,
                preshared_key=preshared_key,
            )
            peers_after = await runtime_adapter.list_peers(server_id)
            if not any(
                (p.get("public_key") or "").strip() == public_key_b64 for p in peers_after or []
            ):
                raise WireGuardCommandError(
                    "Node peer creation verification failed (peer missing after add)",
                    command="wg show",
                    output=public_key_b64[:64],
                )
            peer_created = True
            _config_log.info(
                "apply_peer",
                extra={
                    "event": "apply_peer",
                    "device_id": device.id,
                    "server_id": server_id,
                },
            )
            now_applied = datetime.now(timezone.utc)
            await session.execute(
                update(Device)
                .where(Device.id == device.id)
                .values(
                    apply_status="APPLIED",
                    last_applied_at=now_applied,
                    last_error=None,
                )
            )
            await session.commit()
        except Exception as exc:
            err_msg = redact_for_log(str(exc))
            await session.execute(
                update(Device)
                .where(Device.id == device.id)
                .values(
                    apply_status="ERROR",
                    last_error=err_msg[:1024] if len(err_msg) > 1024 else err_msg,
                )
            )
            await session.commit()
            raise WireGuardCommandError(
                "Node peer creation failed",
                command="wg set",
                output=err_msg,
            )
    elif settings.node_mode == "agent":
        pass  # node-agent applies from desired-state; apply_status stays PENDING_APPLY until sync

    base = base_config_url.rstrip("/")

    amnezia_vpn_key = encode_awg_conf_vpn_key(config_awg_snippet)

    return AdminIssueResult(
        device=device,
        config_awg=ConfigEntry(
            download_url=f"{base}/{token_awg}/download",
            qr_payload=config_awg_snippet,
            amnezia_vpn_key=amnezia_vpn_key,
        ),
        config_wg_obf=ConfigEntry(
            download_url=f"{base}/{token_wg_obf}/download",
            qr_payload=config_wg_obf_snippet,
            amnezia_vpn_key=None,
        ),
        config_wg=ConfigEntry(
            download_url=f"{base}/{token_wg}/download",
            qr_payload=config_wg_snippet,
            amnezia_vpn_key=None,
        ),
        request_id="",
        peer_created=peer_created,
    )


class AdminRotateResult(NamedTuple):
    config_awg: ConfigEntry
    config_wg_obf: ConfigEntry
    config_wg: ConfigEntry
    request_id: str


async def reissue_config_for_device(
    session: AsyncSession,
    *,
    device_id: str,
    expires_in_days: int | None = None,
    issued_by_admin_id: str | None = None,
    runtime_adapter: NodeRuntimeAdapter | None = None,
    base_config_url: str = "/api/v1/admin/configs",
) -> AdminRotateResult:
    """Reissue config for an existing device (rotate keys, update peer, return new config URLs)."""
    device_result = await session.execute(
        select(Device).where(Device.id == device_id, Device.revoked_at.is_(None))
    )
    device = device_result.scalar_one_or_none()
    if not device:
        raise ValueError("device_not_found")
    return await admin_rotate_peer(
        session,
        server_id=device.server_id,
        peer_id=device.id,
        expires_in_days=expires_in_days,
        issued_by_admin_id=issued_by_admin_id,
        runtime_adapter=runtime_adapter,
        base_config_url=base_config_url,
    )


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
    if not server:
        raise ValueError("server_not_available")
    fallback = _heartbeat_container_id(getattr(server, "api_endpoint", None), server_id)
    db_key = (getattr(server, "public_key", None) or "").strip() or None
    db_key_synced_at = getattr(server, "public_key_synced_at", None)
    # Block issuance/reissue if server key unknown/unverified (ServerNotSyncedError).
    live = await live_key_fetch(
        server_id,
        runtime_adapter,
        heartbeat_fallback_ids=[fallback] if fallback else None,
        fallback_public_key=db_key,
        fallback_public_key_synced_at=db_key_synced_at,
    )
    server_public_key = live.public_key
    if server_public_key != (server.public_key or "").strip():
        from app.core.metrics import server_key_mismatch_total

        server_key_mismatch_total.labels(server_id=server_id).inc()
        server.public_key = server_public_key
        await session.flush()
    if getattr(server, "is_draining", False):
        raise ValueError("server_draining")
    if settings.node_mode == "real" and settings.node_discovery != "agent" and not runtime_adapter:
        raise WireGuardCommandError(
            "Runtime adapter required for reissue when NODE_MODE=real; peer would not be applied on node.",
            command="reissue",
            output="node_runtime_adapter is None",
        )

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
                if not is_endpoint_private(derived):
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

    old_public_key = device.public_key
    old_preshared_key = getattr(device, "preshared_key", None)
    if settings.node_mode == "real" and settings.node_discovery != "agent" and runtime_adapter:
        try:
            await runtime_adapter.remove_peer(server_id, old_public_key)
        except Exception as exc:
            # Best-effort: peer may already be gone (restart/reconcile). Continue reissue; new peer will be added; reconcile will drop orphan.
            _config_log.warning(
                "Reissue: node peer removal failed (continuing), server_id=%s pubkey=%s error=%s",
                server_id,
                (old_public_key[:16] + "…")
                if len(old_public_key or "") > 16
                else (old_public_key or ""),
                redact_for_log(str(exc)),
            )

    private_key_b64, public_key_b64 = generate_wg_keypair()
    config_hash = _config_hash(public_key_b64, public_key_b64)
    params_no_h = await request_params_with_server_h(session, server, request_params)
    obfuscation = get_obfuscation_params(params_no_h)
    if runtime_adapter is not None and hasattr(runtime_adapter, "get_obfuscation_from_node"):
        try:
            runtime_obf = await runtime_adapter.get_obfuscation_from_node(server_id)
        except Exception:
            runtime_obf = None
        if runtime_obf and all(runtime_obf.get(k) is not None for k in ("H1", "H2", "H3", "H4")):
            h1, h2, h3, h4 = (
                int(runtime_obf.get("H1")),
                int(runtime_obf.get("H2")),
                int(runtime_obf.get("H3")),
                int(runtime_obf.get("H4")),
            )
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
                        "server_id": server_id,
                        "H1": h1,
                        "H2": h2,
                        "H3": h3,
                        "H4": h4,
                    },
                )
            obfuscation = {**obfuscation, **runtime_obf}
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
                "Replaced private endpoint with VPN_DEFAULT_HOST (rotate)",
                extra={
                    "event": "config.endpoint_override",
                    "server_id": server_id,
                    "endpoint": endpoint,
                },
            )
    # Rotate: keep existing tunnel IP; client [Interface] Address = /32 to match peer on server
    if device.allowed_ips:
        allowed_ips_val = device.allowed_ips
    else:
        _, allowed_ips_val = await allocate_address_for_device(session, server_id, request_params)
    if server_public_key != (server.public_key or "").strip():
        from app.core.metrics import server_key_mismatch_total

        server_key_mismatch_total.labels(server_id=server_id).inc()
        server.public_key = server_public_key
        await session.flush()
    from app.core.amnezia_config import build_all_configs

    try:
        config_awg_snippet, config_wg_obf_snippet, config_wg_snippet = build_all_configs(
            server_public_key=server_public_key,
            client_private_key_b64=private_key_b64,
            endpoint=endpoint,
            allowed_ips="0.0.0.0/0, ::/0",
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
                "server_id": server_id,
                "user_id": str(device.user_id),
                "validation_errors": [],
            },
        )
    except ConfigValidationError as e:
        _config_log.warning(
            "config generation failed",
            extra={
                "event": "config.gen_all",
                "server_id": server_id,
                "user_id": str(device.user_id),
                "validation_errors": e.errors,
            },
        )
        raise

    device.public_key = public_key_b64
    device.allowed_ips = allowed_ips_val
    device.config_amnezia_hash = config_hash
    device.preshared_key = preshared_key
    await session.flush()

    if settings.node_mode == "real" and settings.node_discovery != "agent" and runtime_adapter:
        try:
            await runtime_adapter.add_peer(
                server_id,
                PeerConfigLike(
                    public_key=public_key_b64,
                    allowed_ips=allowed_ips_val,
                    persistent_keepalive=server_keepalive,
                    preshared_key=preshared_key,
                ),
            )
            peers_after = await runtime_adapter.list_peers(server_id)
            if not any(
                (p.get("public_key") or "").strip() == public_key_b64 for p in peers_after or []
            ):
                raise WireGuardCommandError(
                    "Node peer creation verification failed after rotate (peer missing after add)",
                    command="wg show",
                    output=public_key_b64[:64],
                )
        except Exception as exc:
            device.public_key = old_public_key
            device.preshared_key = old_preshared_key
            device.config_amnezia_hash = hashlib.sha256(f"{old_public_key}:".encode()).hexdigest()[
                :64
            ]
            await session.flush()
            raise WireGuardCommandError(
                "Node peer add failed after rotate",
                command="wg set",
                output=redact_for_log(str(exc)),
            )
        await _ensure_device_peer_on_node(
            runtime_adapter,
            server_id,
            public_key=public_key_b64,
            allowed_ips=allowed_ips_val,
            preshared_key=preshared_key,
        )
        now_applied = datetime.now(timezone.utc)
        device.apply_status = "APPLIED"
        device.last_applied_at = now_applied
        device.last_error = None
        await session.flush()

    now = datetime.now(timezone.utc)
    expires_at = (
        (now + timedelta(days=expires_in_days or DOWNLOAD_TOKEN_TTL_DAYS))
        if (expires_in_days or DOWNLOAD_TOKEN_TTL_DAYS)
        else None
    )

    tokens = await persist_issued_configs_with_tokens(
        session,
        device_id=device.id,
        server_id=server_id,
        config_awg=config_awg_snippet,
        config_wg_obf=config_wg_obf_snippet,
        config_wg=config_wg_snippet,
        issued_by_admin_id=issued_by_admin_id,
        expires_at=expires_at,
        replace_existing=True,
    )
    token_awg = tokens["awg"]
    token_wg_obf = tokens["wg_obf"]
    token_wg = tokens["wg"]
    await session.flush()

    base = base_config_url.rstrip("/")

    amnezia_vpn_key = encode_awg_conf_vpn_key(config_awg_snippet)

    return AdminRotateResult(
        config_awg=ConfigEntry(
            download_url=f"{base}/{token_awg}/download",
            qr_payload=config_awg_snippet,
            amnezia_vpn_key=amnezia_vpn_key,
        ),
        config_wg_obf=ConfigEntry(
            download_url=f"{base}/{token_wg_obf}/download",
            qr_payload=config_wg_obf_snippet,
            amnezia_vpn_key=None,
        ),
        config_wg=ConfigEntry(
            download_url=f"{base}/{token_wg}/download",
            qr_payload=config_wg_snippet,
            amnezia_vpn_key=None,
        ),
        request_id="",
    )
