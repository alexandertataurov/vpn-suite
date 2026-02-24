"""Canonical WireGuard / AmneziaWG config builder and validator.

Config Generation Contract: All .conf emission MUST go through this module.
Profiles:
- wireguard_universal: Pure WireGuard, no AWG keys.
- awg_legacy_or_basic: Docs-table AWG keys (I1–I5, S1/S2, Jc/Jmin/Jmax).
- awg_2_0_asc: AWG 2.0 ASC keys (J*, S1–S4, H1–H4, I1–I5).
- mobile_optimized: Same as awg_2_0_asc but tuned (lower Jc/Jmax, MTU 1280).
"""

import base64
import ipaddress
import re
from dataclasses import dataclass
from enum import Enum
from typing import Any

from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.primitives.asymmetric.x25519 import X25519PrivateKey

# Constants from AMNEZIAWG_RESEARCH_REPORT
WG_KEY_B64_MIN_LEN = 43
WG_KEY_B64_MAX_LEN = 44
AWG_LEGACY_KEYS = ("I1", "I2", "I3", "I4", "I5", "S1", "S2", "Jc", "Jmin", "Jmax")
AWG_ASC_KEYS = (
    "I1",
    "I2",
    "I3",
    "I4",
    "I5",
    "S1",
    "S2",
    "S3",
    "S4",
    "Jc",
    "Jmin",
    "Jmax",
    "H1",
    "H2",
    "H3",
    "H4",
)
AWG_EMIT_ORDER = (
    "Jc",
    "Jmin",
    "Jmax",
    "S1",
    "S2",
    "S3",
    "S4",
    "H1",
    "H2",
    "H3",
    "H4",
    "I1",
    "I2",
    "I3",
    "I4",
    "I5",
)
DEFAULT_ADDRESS = "10.8.1.2/32"
DEFAULT_MTU_MOBILE = 1280
DEFAULT_MTU_DESKTOP = 1420
DEFAULT_PERSISTENT_KEEPALIVE = 25
DEFAULT_DNS = "1.1.1.1"


class ConfigProfile(str, Enum):
    wireguard_universal = "wireguard_universal"
    awg_legacy_or_basic = "awg_legacy_or_basic"
    awg_2_0_asc = "awg_2_0_asc"
    mobile_optimized = "awg_2_0_asc_mobile"
    # Backward-compatible aliases
    universal_safe = "wireguard_universal"
    awg_safe = "awg_2_0_asc"


class ConfigValidationError(ValueError):
    def __init__(self, errors: list[str]):
        super().__init__("; ".join(errors))
        self.errors = errors


@dataclass
class InterfaceFields:
    private_key: str
    address: str
    dns: str | None = None
    mtu: int | None = None


@dataclass
class PeerFields:
    public_key: str
    endpoint: str
    allowed_ips: str = "0.0.0.0/0, ::/0"
    persistent_keepalive: int = DEFAULT_PERSISTENT_KEEPALIVE
    preshared_key: str | None = None


def _validate_key_b64(key_b64: str, name: str) -> str:
    if not key_b64 or not isinstance(key_b64, str):
        raise ValueError(f"{name} is empty or invalid")
    k = key_b64.strip()
    if not WG_KEY_B64_MIN_LEN <= len(k) <= WG_KEY_B64_MAX_LEN:
        raise ValueError(
            f"{name} length {len(k)} invalid (expected {WG_KEY_B64_MIN_LEN}-{WG_KEY_B64_MAX_LEN})"
        )
    if not re.match(r"^[A-Za-z0-9+/]+=*$", k):
        raise ValueError(f"{name} contains invalid base64 characters")
    padded = k + ("=" * ((4 - len(k) % 4) % 4))
    try:
        raw = base64.b64decode(padded.encode("ascii"), validate=True)
    except Exception:
        raise ValueError(f"{name} base64 decode failed")
    if len(raw) != 32:
        raise ValueError(f"{name} decoded length invalid (expected 32 bytes)")
    return k


def _validate_endpoint(endpoint: str | None) -> str:
    if not endpoint or not str(endpoint).strip():
        raise ValueError(
            "Endpoint (vpn_endpoint) required; set server.vpn_endpoint or client_endpoint"
        )
    s = str(endpoint).strip()
    host = ""
    port = ""
    if s.startswith("["):
        if "]" not in s:
            raise ValueError("Endpoint IPv6 must be in [addr]:port form")
        host, rest = s[1:].split("]", 1)
        if not rest.startswith(":"):
            raise ValueError("Endpoint must be host:port")
        port = rest[1:]
        try:
            ip = ipaddress.ip_address(host)
        except ValueError:
            raise ValueError("Endpoint IPv6 address invalid")
        if ip.version != 6:
            raise ValueError("Endpoint IPv6 address invalid")
    else:
        if ":" not in s:
            raise ValueError("Endpoint must be host:port")
        host, port = s.rsplit(":", 1)
        try:
            ip = ipaddress.ip_address(host)
            if ip.version != 4:
                raise ValueError("Endpoint host invalid")
        except ValueError:
            if not _is_valid_hostname(host):
                raise ValueError("Endpoint host invalid")
    if not host:
        raise ValueError("Endpoint host is empty")
    try:
        p = int(port)
        if not 1 <= p <= 65535:
            raise ValueError("Endpoint port must be 1-65535")
    except ValueError:
        raise ValueError("Endpoint port must be numeric")
    return s


def _validate_address(address: str | None) -> str:
    if not address or not str(address).strip():
        raise ValueError("Address (Interface) required; client tunnel IP/CIDR")
    s = str(address).strip()
    if "/" not in s:
        raise ValueError("Address must be CIDR (e.g. 10.8.1.2/32)")
    try:
        ipaddress.ip_interface(s)
    except ValueError:
        raise ValueError("Address must be valid CIDR (e.g. 10.8.1.2/32)")
    return s


def _validate_allowed_ips(allowed_ips: str) -> str:
    if not allowed_ips or not str(allowed_ips).strip():
        raise ValueError("AllowedIPs required")
    items = [item.strip() for item in str(allowed_ips).split(",")]
    if any(not item for item in items):
        raise ValueError("AllowedIPs contains empty item")
    for item in items:
        try:
            ipaddress.ip_network(item, strict=False)
        except ValueError:
            raise ValueError(f"AllowedIPs invalid CIDR: {item}")
    return ", ".join(items)


def _validate_s1_s2(s1: int, s2: int) -> None:
    if s1 + 56 == s2:
        raise ValueError(f"AmneziaWG kernel requires S1+56 ≠ S2; got S1={s1} S2={s2}")


def _validate_jmin_jmax(jmin: int, jmax: int) -> None:
    if jmin > jmax:
        raise ValueError(f"Jmin ({jmin}) must be <= Jmax ({jmax})")


def _parse_int(value: Any, name: str) -> int:
    if isinstance(value, bool):
        raise ValueError(f"{name} must be integer")
    if isinstance(value, str) and not value.strip().lstrip("-").isdigit():
        raise ValueError(f"{name} must be integer")
    try:
        return int(value)
    except Exception:
        raise ValueError(f"{name} must be integer")


def _parse_h_value(value: Any, name: str) -> tuple[int, int, str]:
    if isinstance(value, bool):
        raise ValueError(f"{name} must be integer or range")
    if isinstance(value, int):
        return value, value, str(value)
    if isinstance(value, str):
        s = value.strip()
        if s.lstrip("-").isdigit():
            v = int(s)
            return v, v, str(v)
        if "-" in s:
            left, _, right = s.partition("-")
            if left.strip().isdigit() and right.strip().isdigit():
                lo = int(left.strip())
                hi = int(right.strip())
                return lo, hi, f"{lo}-{hi}"
    raise ValueError(f"{name} must be integer or range")


def _normalize_obfuscation_legacy(obf: dict[str, Any]) -> dict[str, Any]:
    """Legacy AWG: I1–I5, S1/S2, Jc/Jmin/Jmax. Omit <=0 numeric values."""
    out: dict[str, Any] = {}
    for k, v in obf.items():
        if k in AWG_LEGACY_KEYS:
            continue
        if k in ("H1", "H2", "H3", "H4"):
            if v is None:
                continue
            if isinstance(v, int) and v <= 0:
                continue
            if isinstance(v, str) and v.strip() in ("", "0"):
                continue
        raise ValueError(f"unsupported_key:{k}")
    for k in ("Jc", "Jmin", "Jmax", "S1", "S2"):
        v = obf.get(k)
        if v is None:
            continue
        ival = _parse_int(v, k)
        if ival <= 0:
            continue
        if k == "Jc" and not (0 <= ival <= 10):
            raise ValueError("Jc out of range for legacy profile")
        if k in ("Jmin", "Jmax") and not (64 <= ival <= 1024):
            raise ValueError(f"{k} out of range for legacy profile")
        if k in ("S1", "S2") and not (0 <= ival <= 64):
            raise ValueError(f"{k} out of range for legacy profile")
        out[k] = ival
    for k in ("I1", "I2", "I3", "I4", "I5"):
        v = obf.get(k)
        if v is None:
            continue
        if not isinstance(v, str) or not v.strip():
            raise ValueError(f"{k} must be non-empty string")
        out[k] = v.strip()
    if "S1" in out and "S2" in out:
        _validate_s1_s2(out["S1"], out["S2"])
    if "Jmin" in out and "Jmax" in out:
        _validate_jmin_jmax(out["Jmin"], out["Jmax"])
    return out


def _normalize_obfuscation_awg2(obf: dict[str, Any], mtu: int | None) -> dict[str, Any]:
    """AWG 2.0 ASC: J*, S1–S4, H1–H4, I1–I5. Omit <=0 numeric values."""
    out: dict[str, Any] = {}
    for k in obf:
        if k not in AWG_ASC_KEYS:
            raise ValueError(f"unsupported_key:{k}")
    for k in ("Jc", "Jmin", "Jmax", "S1", "S2", "S3", "S4"):
        v = obf.get(k)
        if v is None:
            continue
        ival = _parse_int(v, k)
        if ival <= 0:
            continue
        if k == "Jc" and not (1 <= ival <= 128):
            raise ValueError("Jc out of range for awg_2_0_asc profile")
        if k in ("Jmin", "Jmax") and not (1 <= ival <= 1280):
            raise ValueError(f"{k} out of range for awg_2_0_asc profile")
        if k in ("S1", "S2"):
            base_mtu = mtu or 1280
            max_s1 = max(0, base_mtu - 148)
            max_s2 = max(0, base_mtu - 92)
            if k == "S1" and ival > max_s1:
                raise ValueError("S1 exceeds MTU-derived maximum")
            if k == "S2" and ival > max_s2:
                raise ValueError("S2 exceeds MTU-derived maximum")
        out[k] = ival
    for k in ("I1", "I2", "I3", "I4", "I5"):
        v = obf.get(k)
        if v is None:
            continue
        if not isinstance(v, str) or not v.strip():
            raise ValueError(f"{k} must be non-empty string")
        out[k] = v.strip()
    h_ranges: list[tuple[str, int, int]] = []
    for k in ("H1", "H2", "H3", "H4"):
        v = obf.get(k)
        if v is None:
            continue
        lo, hi, rendered = _parse_h_value(v, k)
        if hi <= 0:
            continue
        if lo < 5 or hi > 2147483647:
            raise ValueError(f"{k} out of range for awg_2_0_asc profile")
        if lo > hi:
            raise ValueError(f"{k} range invalid")
        out[k] = rendered
        h_ranges.append((k, lo, hi))
    for i, (ka, la, ha) in enumerate(h_ranges):
        for kb, lb, hb in h_ranges[i + 1 :]:
            if max(la, lb) <= min(ha, hb):
                raise ValueError(f"{ka} and {kb} ranges overlap")
    if "S1" in out and "S2" in out:
        _validate_s1_s2(out["S1"], out["S2"])
    if "Jmin" in out and "Jmax" in out:
        _validate_jmin_jmax(out["Jmin"], out["Jmax"])
    return out


def generate_wg_keypair() -> tuple[str, str]:
    """Generate real WireGuard keypair (X25519). Returns (private_key_b64, public_key_b64)."""
    private_key = X25519PrivateKey.generate()
    private_bytes = private_key.private_bytes(
        encoding=serialization.Encoding.Raw,
        format=serialization.PrivateFormat.Raw,
        encryption_algorithm=serialization.NoEncryption(),
    )
    public_key = private_key.public_key()
    public_bytes = public_key.public_bytes(
        encoding=serialization.Encoding.Raw,
        format=serialization.PublicFormat.Raw,
    )
    private_b64 = base64.b64encode(private_bytes).decode("ascii").strip()
    public_b64 = base64.b64encode(public_bytes).decode("ascii").strip()
    return private_b64, public_b64


def build_config(
    *,
    interface: InterfaceFields,
    peer: PeerFields,
    profile: ConfigProfile = ConfigProfile.universal_safe,
    obfuscation: dict[str, Any] | None = None,
) -> str:
    """Build normalized .conf. Raises ValueError on validation failure."""
    errors: list[str] = []
    priv = ""
    addr = ""
    pub = ""
    ep = ""
    allowed = ""
    try:
        priv = _validate_key_b64(interface.private_key, "PrivateKey")
    except ValueError as e:
        errors.append(str(e))
    addr_val = interface.address
    if addr_val is None or not str(addr_val).strip():
        errors.append("Address (Interface) required; client tunnel IP/CIDR")
    else:
        try:
            addr = _validate_address(addr_val)
        except ValueError as e:
            errors.append(str(e))
    try:
        pub = _validate_key_b64(peer.public_key, "PublicKey")
    except ValueError as e:
        errors.append(str(e))
    try:
        ep = _validate_endpoint(peer.endpoint)
    except ValueError as e:
        errors.append(str(e))
    try:
        allowed = _validate_allowed_ips(peer.allowed_ips)
    except ValueError as e:
        errors.append(str(e))
    if profile in (ConfigProfile.wireguard_universal, ConfigProfile.universal_safe) and obfuscation:
        errors.append("obfuscation not allowed in wireguard_universal profile")
    if errors:
        raise ConfigValidationError(errors)

    lines: list[str] = []
    # [Interface] - deterministic order
    lines.append("[Interface]")
    lines.append(f"PrivateKey = {priv}")
    lines.append(f"Address = {addr}")
    dns = (interface.dns or DEFAULT_DNS).strip() if interface.dns else DEFAULT_DNS
    lines.append(f"DNS = {dns}")
    mtu = interface.mtu
    if profile == ConfigProfile.mobile_optimized and (mtu is None or mtu <= 0):
        mtu = DEFAULT_MTU_MOBILE
    if mtu is not None and mtu > 0:
        lines.append(f"MTU = {int(mtu)}")

    # AWG obfuscation (legacy or awg_2_0_asc)
    if obfuscation and profile not in (
        ConfigProfile.wireguard_universal,
        ConfigProfile.universal_safe,
    ):
        try:
            if profile == ConfigProfile.awg_legacy_or_basic:
                obf = _normalize_obfuscation_legacy(obfuscation)
            else:
                obf = _normalize_obfuscation_awg2(obfuscation, mtu)
        except ValueError as e:
            raise ConfigValidationError([str(e)])
        for k in AWG_EMIT_ORDER:
            if k not in obf:
                continue
            v = obf[k]
            lines.append(f"{k} = {v}")

    lines.append("")
    lines.append("[Peer]")
    lines.append(f"PublicKey = {pub}")
    lines.append(f"Endpoint = {ep}")
    lines.append(f"AllowedIPs = {allowed}")
    lines.append(f"PersistentKeepalive = {peer.persistent_keepalive}")
    if peer.preshared_key:
        try:
            pk = _validate_key_b64(peer.preshared_key, "PresharedKey")
        except ValueError as e:
            raise ConfigValidationError([str(e)])
        lines.append(f"PresharedKey = {pk}")

    # Normalize: LF, no BOM, deterministic, trailing newline (POSIX)
    return "\n".join(lines) + "\n"


def _is_valid_hostname(host: str) -> bool:
    if not host or len(host) > 253:
        return False
    if host.endswith("."):
        host = host[:-1]
    labels = host.split(".")
    label_re = re.compile(r"^[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?$")
    return all(label_re.match(label) for label in labels)


def derive_address_from_profile(
    request_params: dict | None, fallback: str = DEFAULT_ADDRESS
) -> str:
    """Derive client Address from profile subnet. Returns fallback if not configurable."""
    if not request_params:
        return fallback
    subnet = request_params.get("subnet_address") or request_params.get("amnezia_subnet")
    cidr = request_params.get("subnet_cidr") or request_params.get("amnezia_cidr") or 24
    if not subnet:
        return fallback
    try:
        parts = str(subnet).strip().split(".")
        if len(parts) != 4:
            return fallback
        parts[-1] = "2"
        return f"{'.'.join(parts)}/{cidr}"
    except Exception:
        return fallback


def allocate_next_address(
    subnet_base: str,
    used_last_octets: set[int],
    *,
    host_min: int = 2,
    host_max: int = 254,
) -> str:
    """Allocate next free host in subnet. subnet_base e.g. '10.8.0', returns '10.8.0.6/32'."""
    for h in range(host_min, host_max + 1):
        if h not in used_last_octets:
            return f"{subnet_base}.{h}/32"
    raise ValueError(f"No free address in {subnet_base}.x (hosts {host_min}-{host_max})")
