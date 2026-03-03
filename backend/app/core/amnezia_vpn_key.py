"""Helpers to build Amnezia-compatible vpn:// connection keys.

The payload format matches the observed AmneziaVPN client behavior as used in
community tooling (e.g. wg-easy fork):

- Input: JSON config (UTF-8 bytes)
- Compress with zlib (deflate)
- Prepend 12-byte header (big-endian uint32):
    MAGIC = 0x07C00100
    total_len = len(compressed) + 4
    plain_len = len(plain)
- Base64 URL-safe, without '=' padding
- Prefixed with 'vpn://'
"""

from __future__ import annotations

import base64
import json
import re
import struct
import zlib
from configparser import ConfigParser
from typing import Any, Mapping


_MAGIC = 0x07C00100
_IPV4_RE = re.compile(r"^\d{1,3}(?:\.\d{1,3}){3}$")


def _build_amnezia_qr_pack(data: bytes) -> bytes:
    """Pack JSON bytes into AmneziaVPN-compatible binary blob."""
    plain = data
    compressed = zlib.compress(plain, level=9)
    header = struct.pack(">III", _MAGIC, len(compressed) + 4, len(plain))
    return header + compressed


def encode_amnezia_vpn_key(config: Mapping[str, Any]) -> str:
    """Encode arbitrary JSON config into a vpn:// key."""
    payload = json.dumps(config, separators=(",", ":"), ensure_ascii=False).encode("utf-8")
    packed = _build_amnezia_qr_pack(payload)
    b64 = base64.urlsafe_b64encode(packed).decode("ascii").rstrip("=")
    return f"vpn://{b64}"


def encode_awg_conf_vpn_key(conf_text: str) -> str:
    """Build AmneziaVPN-compatible JSON config for an AWG client config and encode as vpn:// key."""
    parser = ConfigParser(interpolation=None)
    parser.optionxform = str  # preserve case
    parser.read_string(conf_text)

    if "Interface" not in parser or "Peer" not in parser:
        raise ValueError("AWG config must contain [Interface] and [Peer] sections")

    interface = parser["Interface"]
    peer = parser["Peer"]

    private_key = interface.get("PrivateKey", "").strip()
    address = interface.get("Address", "").strip()
    dns_line = interface.get("DNS", "").strip()
    mtu = interface.get("MTU", "").strip() or "0"

    # DNS: IPv4-only, first two entries
    dns_vals = [d.strip() for d in dns_line.split(",") if d.strip()]
    ipv4_dns = [d for d in dns_vals if _IPV4_RE.match(d)]
    dns1 = ipv4_dns[0] if len(ipv4_dns) >= 1 else ""
    dns2 = ipv4_dns[1] if len(ipv4_dns) >= 2 else ""

    # AWG extras from [Interface]
    awg_keys = [
        "Jc",
        "Jmin",
        "Jmax",
        "S1",
        "S2",
        "S3",
        "S4",
        "I1",
        "I2",
        "I3",
        "I4",
        "I5",
        "H1",
        "H2",
        "H3",
        "H4",
    ]
    awg_extras: dict[str, str] = {}
    for key in awg_keys:
        val = interface.get(key, "").strip()
        if val:
            awg_extras[key] = val

    public_key = peer.get("PublicKey", "").strip()
    preshared_key = peer.get("PresharedKey", "").strip()
    endpoint = peer.get("Endpoint", "").strip()
    allowed_ips_line = peer.get("AllowedIPs", "").strip()
    persistent_keepalive = peer.get("PersistentKeepalive", "").strip() or "0"

    host = ""
    port_str = "51820"
    if endpoint:
        if ":" in endpoint:
            host, port_str = endpoint.rsplit(":", 1)
            host = host.strip()
            port_str = port_str.strip() or "51820"
        else:
            host = endpoint.strip()
    try:
        port_int = int(port_str)
    except ValueError:
        port_int = 0

    allowed_ips = [ip.strip() for ip in re.split(r",\s*", allowed_ips_line) if ip.strip()]

    protocol_info: dict[str, str] = {}
    if "S3" in awg_extras and "S4" in awg_extras:
        protocol_info["protocol_version"] = "2"

    last_config_obj: dict[str, Any] = {
        **{k: str(v) for k, v in awg_extras.items()},
        "allowed_ips": allowed_ips,
        "client_ip": address,
        "client_priv_key": private_key,
        "config": conf_text,
        "hostName": host,
        "mtu": str(mtu),
        "persistent_keep_alive": str(persistent_keepalive),
        "port": port_int,
        "psk_key": preshared_key,
        "server_pub_key": public_key,
    }

    container_type = "awg"
    container_name = f"amnezia-{container_type}"

    amnezia_json: dict[str, Any] = {
        "containers": [
            {
                container_type: {
                    "isThirdPartyConfig": True,
                    "last_config": json.dumps(
                        last_config_obj, ensure_ascii=False, separators=(",", ":")
                    ),
                    "port": str(port_int or port_str),
                    **protocol_info,
                    "transport_proto": "udp",
                },
                "container": container_name,
            }
        ],
        "defaultContainer": container_name,
        "description": "vpn-suite",
        "dns1": dns1,
        "dns2": dns2,
        "hostName": host,
    }

    return encode_amnezia_vpn_key(amnezia_json)


_EMPTY_KEY_RE = re.compile(r"^\s*(?P<key>[A-Za-z0-9_]+)\s*=\s*$")


def sanitize_awg_conf(conf_text: str) -> str:
    """Normalize AWG/WireGuard .conf for AmneziaWG import.

    - Strip UTF-8 BOM if present.
    - Normalize CRLF to LF.
    - Drop empty AWG-only params like ``I2 =`` / ``S3 =`` which break AmneziaWG QR import.
    """
    if not conf_text:
        return conf_text
    # Remove BOM and normalize newlines
    text = conf_text.lstrip("\ufeff").replace("\r\n", "\n")
    raw_lines = text.split("\n")
    cleaned: list[str] = []
    for line in raw_lines:
        # Normalize trailing whitespace
        line = line.rstrip()
        # Strip comments starting with # or ; (inline as well)
        stripped = line.lstrip()
        comment_idx = -1
        for ch in ("#", ";"):
            idx = stripped.find(ch)
            if idx != -1:
                comment_idx = idx if comment_idx == -1 else min(comment_idx, idx)
        if comment_idx != -1:
            # Reconstruct: keep content before comment marker
            prefix = stripped[:comment_idx].rstrip()
            line = prefix
        # Drop completely empty lines early; we'll handle section spacing later
        if not line.strip():
            cleaned.append("")
            continue
        # Drop any empty KEY = lines (any key), which are known to break AmneziaWG QR import
        m = _EMPTY_KEY_RE.match(line)
        if m:
            continue
        # Normalize section headers: no leading whitespace
        if re.match(r"^\s*\[Interface\]\s*$", line):
            cleaned.append("[Interface]")
            continue
        if re.match(r"^\s*\[Peer\]\s*$", line):
            cleaned.append("[Peer]")
            continue
        cleaned.append(line)

    # Remove leading blank lines before [Interface]
    while cleaned and not cleaned[0].strip():
        cleaned.pop(0)

    # Ensure first non-empty line is [Interface] if present anywhere
    for i, line in enumerate(cleaned):
        if line.strip():
            if line.strip() != "[Interface]":
                # If [Interface] appears later, move it to the top
                try:
                    idx = cleaned.index("[Interface]")
                except ValueError:
                    # No [Interface]; leave as-is
                    break
                header = cleaned.pop(idx)
                cleaned.insert(0, header)
            break

    # Collapse multiple consecutive blank lines to at most one
    normalized: list[str] = []
    blank = False
    for line in cleaned:
        if not line.strip():
            if blank:
                continue
            blank = True
            normalized.append("")
        else:
            blank = False
            normalized.append(line)

    # Always end with a single trailing newline for POSIX-style configs
    return "\n".join(normalized).rstrip("\n") + "\n"


