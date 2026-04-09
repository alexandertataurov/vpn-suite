#!/usr/bin/env python3
"""Validate AmneziaWG client .conf (obfuscation params). Compare with server wg show.

Usage:
  python scripts/validate_awg_client_config.py [path.conf]
  python scripts/validate_awg_client_config.py client.conf --compare server_wg_show.txt
  python scripts/validate_awg_client_config.py client.conf  # then paste server output when prompted

Checks: H1–H4 range (5–2147483647), S1+56≠S2, Jmin≤Jmax. With --compare, diffs client vs server.
"""

import configparser
import sys
from pathlib import Path

# AmneziaWG H params are uint32 on runtime side; 0 is invalid.
H_MIN, H_MAX = 5, 4294967295

OBF_KEYS = ("Jc", "Jmin", "Jmax", "S1", "S2", "H1", "H2", "H3", "H4")


def _get_int(cp: configparser.ConfigParser, section: str, opt: str) -> int | None:
    try:
        return cp.getint(section, opt.lower())
    except (configparser.NoOptionError, configparser.NoSectionError, ValueError):
        return None


def parse_client_config(content: str) -> dict | None:
    """Return dict with public_key (from Peer), and H1–H4, S1, S2, Jc, Jmin, Jmax from [Interface]."""
    cp = configparser.ConfigParser()
    try:
        cp.read_string(content)
    except configparser.Error:
        return None
    if "Interface" not in cp or "Peer" not in cp:
        return None
    out = {}
    try:
        out["public_key"] = cp.get("Peer", "publickey").strip()
    except (configparser.NoOptionError, configparser.NoSectionError):
        out["public_key"] = ""
    key_map = {
        "jc": "Jc",
        "jmin": "Jmin",
        "jmax": "Jmax",
        "s1": "S1",
        "s2": "S2",
        "h1": "H1",
        "h2": "H2",
        "h3": "H3",
        "h4": "H4",
    }
    for k, name in key_map.items():
        v = _get_int(cp, "Interface", k)
        if v is not None:
            out[name] = v
    return out


def parse_wg_show(output: str) -> dict:
    """Parse 'wg show <iface>' output. Returns public_key, Jc, Jmin, Jmax, S1, S2, H1–H4."""
    result = {}
    for line in output.strip().splitlines():
        line = line.strip()
        if ":" not in line:
            continue
        key, _, val = line.partition(":")
        key, val = key.strip().lower(), val.strip()
        if key == "public key":
            result["public_key"] = val
        elif key in ("jc", "jmin", "jmax", "s1", "s2", "s3", "s4"):
            try:
                k = (
                    "Jc"
                    if key == "jc"
                    else "Jmin"
                    if key == "jmin"
                    else "Jmax"
                    if key == "jmax"
                    else f"S{key[1]}"
                )
                result[k] = int(val)
            except ValueError:
                pass
        elif key in ("h1", "h2", "h3", "h4") and val.isdigit():
            result[key.upper()] = int(val)
    return result


def validate(content: str) -> list[str]:
    errors: list[str] = []
    cp = configparser.ConfigParser()
    try:
        cp.read_string(content)
    except configparser.Error as e:
        return [f"Parse error: {e}"]

    if "Interface" not in cp:
        errors.append("Missing [Interface]")
    if "Peer" not in cp:
        errors.append("Missing [Peer]")
    if errors:
        return errors

    s1 = _get_int(cp, "Interface", "s1")
    s2 = _get_int(cp, "Interface", "s2")
    if s1 is not None and s2 is not None and s1 + 56 == s2:
        errors.append(f"S1+56 must not equal S2 (got S1={s1} S2={s2})")

    jmin = _get_int(cp, "Interface", "jmin")
    jmax = _get_int(cp, "Interface", "jmax")
    if jmin is not None and jmax is not None and jmin > jmax:
        errors.append(f"Jmin ({jmin}) must be <= Jmax ({jmax})")

    for key in ("h1", "h2", "h3", "h4"):
        h = _get_int(cp, "Interface", key)
        if h is not None:
            k = key.upper()
            if h == 0:
                errors.append(f"{k}=0 is invalid (kernel rejects; use 5..{H_MAX})")
            elif not (H_MIN <= h <= H_MAX):
                errors.append(f"{k}={h} out of range ({H_MIN}..{H_MAX})")

    return errors


def compare(client: dict, server: dict) -> None:
    """Print side-by-side and report mismatches."""
    print("--- Client (your config) vs Server (wg show) ---\n")
    mismatches = []
    # PublicKey
    cpk = client.get("public_key", "")
    spk = server.get("public_key", "")
    match = "OK" if cpk and spk and cpk.strip() == spk.strip() else "MISMATCH"
    if cpk != spk:
        mismatches.append("PublicKey")
    print(
        f"  PublicKey (Peer):  client={cpk[:24]}...  server={spk[:24] if spk else '?'}...  [{match}]"
    )
    for key in OBF_KEYS:
        cv = client.get(key)
        sv = server.get(key)
        if cv is None and sv is None:
            continue
        match = "OK" if cv == sv else "MISMATCH"
        if cv != sv:
            mismatches.append(key)
        print(f"  {key:5}:  client={cv}  server={sv}  [{match}]")
    print()
    if mismatches:
        print("Mismatches:", ", ".join(mismatches))
        print(
            "Fix: reissue config from panel so it uses server H, or set server AWG_H* to match client."
        )
    else:
        print("All compared fields match.")


def main() -> int:
    args = [a for a in sys.argv[1:] if not a.startswith("-")]
    compare_mode = "--compare" in sys.argv
    server_path = None
    if "--compare" in sys.argv:
        i = sys.argv.index("--compare")
        if i + 1 < len(sys.argv):
            server_path = Path(sys.argv[i + 1])
    if not args:
        content = sys.stdin.read()
        client_path = None
    else:
        client_path = Path(args[0])
        if not client_path.exists():
            print(f"File not found: {client_path}", file=sys.stderr)
            return 1
        content = client_path.read_text()

    errors = validate(content)
    if errors:
        for e in errors:
            print(e, file=sys.stderr)
        return 1

    client_obf = parse_client_config(content)
    if not client_obf:
        print("Failed to parse client config", file=sys.stderr)
        return 1

    if compare_mode and server_path and server_path.exists():
        server_output = server_path.read_text()
        server_obf = parse_wg_show(server_output)
        compare(client_obf, server_obf)
        return 0

    print("Obfuscation params: ranges OK.")
    if compare_mode and not (server_path and server_path.exists()):
        print("--compare: server file missing or invalid.", file=sys.stderr)
    print("To compare with server, run on the VPN host:")
    print("  docker exec <amnezia-container> wg show awg0 > server_wg.txt")
    print("Then: python scripts/validate_awg_client_config.py client.conf --compare server_wg.txt")
    return 0


if __name__ == "__main__":
    sys.exit(main())
