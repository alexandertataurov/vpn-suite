"""
MTU auto_restrictive helper: probe a safe MTU for a given host.

Concept:
- Start from a conservative MTU (default 1200) and step down (e.g. 20 bytes) with DF
  (don't-fragment) pings until packets pass without fragmentation.
- The resulting MTU can be written into the server profile (mtu field) and used
  together with MtuPolicy.auto_restrictive in config generation.

Usage (from repo root):
    cd apps/admin-api
    python scripts/mtu_probe.py --host 1.1.1.1

Notes:
- Assumes IPv4 and uses MTU = payload_size + 28 (IP+ICMP).
- Requires system ping with -M do support (Linux).
"""

import argparse
import subprocess
import sys


def _ping_ok(host: str, mtu: int, count: int = 2, timeout: int = 2) -> bool:
    """Return True if ping with DF bit succeeds for given MTU."""
    # For IPv4: MTU = payload + 20 (IP) + 8 (ICMP) = payload + 28
    payload = mtu - 28
    if payload <= 0:
        return False
    cmd = [
        "ping",
        "-c",
        str(count),
        "-W",
        str(timeout),
        "-M",
        "do",
        "-s",
        str(payload),
        host,
    ]
    try:
        proc = subprocess.run(
            cmd,
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
            check=False,
        )
    except FileNotFoundError:
        print("ping binary not found; install iputils-ping inside environment", file=sys.stderr)
        return False
    return proc.returncode == 0


def probe_mtu(host: str, start_mtu: int, min_mtu: int, step: int) -> int | None:
    """Step down from start_mtu to min_mtu, return first MTU that passes DF ping."""
    mtu = start_mtu
    while mtu >= min_mtu:
        if _ping_ok(host, mtu):
            return mtu
        mtu -= step
    return None


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="Probe safe MTU for restrictive networks.")
    parser.add_argument(
        "--host",
        default="1.1.1.1",
        help="Target host/IP to probe against (default: 1.1.1.1).",
    )
    parser.add_argument(
        "--start-mtu",
        type=int,
        default=1200,
        help="Starting MTU to try (default: 1200).",
    )
    parser.add_argument(
        "--min-mtu",
        type=int,
        default=1080,
        help="Minimum MTU to consider (default: 1080).",
    )
    parser.add_argument(
        "--step",
        type=int,
        default=20,
        help="Step to decrease MTU by on failure (default: 20).",
    )
    args = parser.parse_args(argv)

    if args.min_mtu <= 0 or args.start_mtu <= 0 or args.step <= 0:
        print("start-mtu, min-mtu and step must be positive integers", file=sys.stderr)
        return 1
    if args.min_mtu > args.start_mtu:
        print("min-mtu must be <= start-mtu", file=sys.stderr)
        return 1

    mtu = probe_mtu(args.host, args.start_mtu, args.min_mtu, args.step)
    if mtu is None:
        print(
            f"No working MTU found in range [{args.min_mtu}, {args.start_mtu}] for host {args.host}",
            file=sys.stderr,
        )
        return 2

    # Plain integer output so it can be piped into other tooling.
    print(mtu)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
