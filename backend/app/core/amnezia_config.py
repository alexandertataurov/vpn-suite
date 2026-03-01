"""AmneziaWG client config: real WireGuard keypairs (X25519) and obfuscation params (Jc, Jmin, Jmax, S1, S2, H1–H4).

All config emission goes through config_builder. These functions are thin wrappers for backward compat.
H1–H4: CSPRNG-generated per server when not set (no constants, no sequential 1,2,3,4).
"""

import secrets
from typing import Any

from app.core.config_builder import (
    ConfigProfile,
    ConfigValidationError,
    InterfaceFields,
    PeerFields,
    build_config,
    derive_address_from_profile,
)
from app.core.config_builder import (
    generate_wg_keypair as _generate_wg_keypair,
)
from app.core.metrics import config_gen_failure_total, config_gen_success_total

__all__ = [
    "build_all_configs",
    "build_amnezia_client_config",
    "build_standard_wg_client_config",
    "build_wg_obfuscated_config",
    "derive_address_from_profile",
    "generate_h_params",
    "generate_wg_keypair",
    "get_obfuscation_params",
]

# Re-export for callers
WG_KEY_B64_MIN_LEN = 43
WG_KEY_B64_MAX_LEN = 44
# Jc/Jmin/Jmax/S1/S2 defaults; H1–H4 from profile/server or generate_h_params(); fallback for tests only
# For restrictive networks (e.g. Russia): profile request_params mtu=1200, persistent_keepalive=15, optionally amnezia_jc=5, amnezia_jmin=20, amnezia_jmax=100
DEFAULT_Jc = 3
DEFAULT_Jmin = 10
DEFAULT_Jmax = 50
DEFAULT_S1 = 213
DEFAULT_S2 = 237
_DEFAULT_H_FALLBACK = (10, 20, 30, 40)  # fallback when no profile/server H; must be >=5 for awg_2_0


def generate_h_params() -> tuple[int, int, int, int]:
    """Generate H1–H4 with CSPRNG. Each 1 ≤ Hn ≤ 2^32-1, distinct. Must match server AWG_H1..AWG_H4."""

    def gen_uint32() -> int:
        while True:
            val = secrets.randbits(32)
            if val != 0:
                return val

    seen: set[int] = set()
    result: list[int] = []
    while len(result) < 4:
        v = gen_uint32()
        if v not in seen:
            seen.add(v)
            result.append(v)
    return (result[0], result[1], result[2], result[3])


def generate_wg_keypair() -> tuple[str, str]:
    """Generate a real WireGuard keypair (X25519). Returns (private_key_b64, public_key_b64)."""
    return _generate_wg_keypair()


def _validate_s1_s2_constraint(s1: int, s2: int) -> None:
    """Kernel rejects S1+56=S2. Raises ValueError if violated."""
    if s1 + 56 == s2:
        raise ValueError(
            f"AmneziaWG kernel requires S1+56 ≠ S2; got S1={s1} S2={s2} (S1+56={s1 + 56})"
        )


def get_obfuscation_params(profile_request_params: dict[str, Any] | None) -> dict[str, int]:
    """Extract AmneziaWG obfuscation params from server profile request_params. Use defaults when missing."""
    if not profile_request_params:
        _validate_s1_s2_constraint(DEFAULT_S1, DEFAULT_S2)
        h1, h2, h3, h4 = _DEFAULT_H_FALLBACK
        return {
            "Jc": DEFAULT_Jc,
            "Jmin": DEFAULT_Jmin,
            "Jmax": DEFAULT_Jmax,
            "S1": DEFAULT_S1,
            "S2": DEFAULT_S2,
            "H1": h1,
            "H2": h2,
            "H3": h3,
            "H4": h4,
        }
    s1 = int(profile_request_params.get("amnezia_s1", DEFAULT_S1))
    s2 = int(profile_request_params.get("amnezia_s2", DEFAULT_S2))
    _validate_s1_s2_constraint(s1, s2)
    return {
        "Jc": int(profile_request_params.get("amnezia_jc", DEFAULT_Jc)),
        "Jmin": int(profile_request_params.get("amnezia_jmin", DEFAULT_Jmin)),
        "Jmax": int(profile_request_params.get("amnezia_jmax", DEFAULT_Jmax)),
        "S1": s1,
        "S2": s2,
        "H1": int(profile_request_params.get("amnezia_h1", _DEFAULT_H_FALLBACK[0])),
        "H2": int(profile_request_params.get("amnezia_h2", _DEFAULT_H_FALLBACK[1])),
        "H3": int(profile_request_params.get("amnezia_h3", _DEFAULT_H_FALLBACK[2])),
        "H4": int(profile_request_params.get("amnezia_h4", _DEFAULT_H_FALLBACK[3])),
        "S3": int(profile_request_params.get("amnezia_s3", 0))
        if "amnezia_s3" in profile_request_params
        else 0,
        "S4": int(profile_request_params.get("amnezia_s4", 0))
        if "amnezia_s4" in profile_request_params
        else 0,
        "I1": profile_request_params.get("amnezia_i1")
        if "amnezia_i1" in profile_request_params
        else None,
        "I2": profile_request_params.get("amnezia_i2")
        if "amnezia_i2" in profile_request_params
        else None,
        "I3": profile_request_params.get("amnezia_i3")
        if "amnezia_i3" in profile_request_params
        else None,
        "I4": profile_request_params.get("amnezia_i4")
        if "amnezia_i4" in profile_request_params
        else None,
        "I5": profile_request_params.get("amnezia_i5")
        if "amnezia_i5" in profile_request_params
        else None,
    }


def _select_awg_profile(obfuscation: dict[str, Any] | None) -> ConfigProfile:
    if not obfuscation:
        return ConfigProfile.awg_legacy_or_basic
    for key in ("H1", "H2", "H3", "H4", "S3", "S4", "I1", "I2", "I3", "I4", "I5"):
        val = obfuscation.get(key)
        if val is None:
            continue
        if isinstance(val, str) and not val.strip():
            continue
        try:
            if isinstance(val, int) and val <= 0:
                continue
        except Exception:
            pass
        return ConfigProfile.awg_2_0_asc
    return ConfigProfile.awg_legacy_or_basic


def build_all_configs(
    *,
    server_public_key: str,
    client_private_key_b64: str,
    endpoint: str | None,
    allowed_ips: str = "0.0.0.0/0, ::/0",
    dns: str | None = None,
    persistent_keepalive: int = 25,
    obfuscation: dict[str, int] | None = None,
    mtu: int | None = None,
    address: str | None = None,
    preshared_key: str | None = None,
) -> tuple[str, str, str]:
    """Returns (awg_config, wg_obf_config, wg_config) generated safely."""
    awg = build_amnezia_client_config(
        server_public_key=server_public_key,
        client_private_key_b64=client_private_key_b64,
        endpoint=endpoint,
        allowed_ips=allowed_ips,
        dns=dns,
        persistent_keepalive=persistent_keepalive,
        obfuscation=obfuscation,
        mtu=mtu,
        address=address,
        preshared_key=preshared_key,
    )
    wg_obf = build_wg_obfuscated_config(
        server_public_key=server_public_key,
        client_private_key_b64=client_private_key_b64,
        endpoint=endpoint,
        allowed_ips=allowed_ips,
        dns=dns,
        persistent_keepalive=persistent_keepalive,
        obfuscation=obfuscation,
        mtu=mtu,
        address=address,
        preshared_key=preshared_key,
    )
    wg = build_standard_wg_client_config(
        server_public_key=server_public_key,
        client_private_key_b64=client_private_key_b64,
        endpoint=endpoint,
        allowed_ips=allowed_ips,
        dns=dns,
        persistent_keepalive=persistent_keepalive,
        mtu=mtu,
        address=address,
        preshared_key=preshared_key,
    )
    return awg, wg_obf, wg


def build_amnezia_client_config(
    *,
    server_public_key: str,
    client_private_key_b64: str,
    endpoint: str | None,
    allowed_ips: str = "0.0.0.0/0, ::/0",
    dns: str | None = None,
    persistent_keepalive: int = 15,
    obfuscation: dict[str, int] | None = None,
    mtu: int | None = None,
    address: str | None = None,
    preshared_key: str | None = None,
) -> str:
    """Build full AmneziaWG client config (INI). Uses canonical config_builder (awg_safe profile)."""
    try:
        awg_profile = _select_awg_profile(obfuscation)
        result = build_config(
            interface=InterfaceFields(
                private_key=client_private_key_b64,
                address=address or derive_address_from_profile(None),
                dns=dns or "1.1.1.1, 1.0.0.1, 8.8.8.8, 8.8.4.4",
                mtu=mtu,
            ),
            peer=PeerFields(
                public_key=server_public_key,
                endpoint=endpoint or "",
                allowed_ips=allowed_ips,
                persistent_keepalive=persistent_keepalive,
                preshared_key=preshared_key,
            ),
            profile=awg_profile,
            obfuscation=obfuscation,
        )
        config_gen_success_total.labels(profile=awg_profile.value).inc()
        return result
    except ConfigValidationError as e:
        reason = (
            "unsupported_key" if any("unsupported_key" in err for err in e.errors) else "validation"
        )
        config_gen_failure_total.labels(profile=awg_profile.value, reason=reason).inc()
        raise


def build_standard_wg_client_config(
    *,
    server_public_key: str,
    client_private_key_b64: str,
    endpoint: str | None,
    allowed_ips: str = "0.0.0.0/0, ::/0",
    dns: str | None = None,
    persistent_keepalive: int = 15,
    mtu: int | None = None,
    address: str | None = None,
    preshared_key: str | None = None,
) -> str:
    """Build standard WireGuard client config (INI, no obfuscation). Uses canonical config_builder."""
    try:
        result = build_config(
            interface=InterfaceFields(
                private_key=client_private_key_b64,
                address=address or derive_address_from_profile(None),
                dns=dns or "1.1.1.1, 1.0.0.1, 8.8.8.8, 8.8.4.4",
                mtu=mtu,
            ),
            peer=PeerFields(
                public_key=server_public_key,
                endpoint=endpoint or "",
                allowed_ips=allowed_ips,
                persistent_keepalive=persistent_keepalive,
                preshared_key=preshared_key,
            ),
            profile=ConfigProfile.wireguard_universal,
        )
        config_gen_success_total.labels(profile=ConfigProfile.wireguard_universal.value).inc()
        return result
    except ConfigValidationError as e:
        reason = (
            "unsupported_key" if any("unsupported_key" in err for err in e.errors) else "validation"
        )
        config_gen_failure_total.labels(
            profile=ConfigProfile.wireguard_universal.value, reason=reason
        ).inc()
        raise


def build_wg_obfuscated_config(
    *,
    server_public_key: str,
    client_private_key_b64: str,
    endpoint: str | None,
    allowed_ips: str = "0.0.0.0/0, ::/0",
    dns: str | None = None,
    persistent_keepalive: int = 25,
    obfuscation: dict[str, int] | None = None,
    mtu: int | None = None,
    address: str | None = None,
    preshared_key: str | None = None,
) -> str:
    """Build AWG-compatible config labeled for WG-with-obfuscation clients."""
    try:
        awg_profile = _select_awg_profile(obfuscation)
        result = build_config(
            interface=InterfaceFields(
                private_key=client_private_key_b64,
                address=address or derive_address_from_profile(None),
                dns=dns or "1.1.1.1, 1.0.0.1",
                mtu=mtu,
            ),
            peer=PeerFields(
                public_key=server_public_key,
                endpoint=endpoint or "",
                allowed_ips=allowed_ips,
                persistent_keepalive=persistent_keepalive,
                preshared_key=preshared_key,
            ),
            profile=awg_profile,
            obfuscation=obfuscation,
        )
        config_gen_success_total.labels(profile="wg_obf").inc()
        return result
    except ConfigValidationError as e:
        reason = (
            "unsupported_key" if any("unsupported_key" in err for err in e.errors) else "validation"
        )
        config_gen_failure_total.labels(profile="wg_obf", reason=reason).inc()
        raise
